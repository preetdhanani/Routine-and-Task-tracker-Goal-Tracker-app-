import { NextResponse } from 'next/server';
import { Langfuse } from 'langfuse';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  const timestamp = new Date().toISOString();
  let contents: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  let selectedModel = '';
  let apiKey = '';
  let state: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  let geminiKey = '';
  let model = 'gemini-3.5-flash';
  let routerSystemInstruction = '';
  let routerUrlUsed = '';
  let routerReqBody: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  let routerResBody: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  let routerCategory = 'CHAT';
  let contextPrompt = '';
  let specialistUrlUsed = '';
  let specialistReqBody: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  let specialistResBody: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  let specialistCleanText = '';
  let responseData: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  const errors: string[] = [];

  try {
    const body = await req.json();
    contents = body.contents || [];
    selectedModel = body.selectedModel || '';
    apiKey = body.apiKey || '';
    state = body.state || null;

    // 1. Resolve Gemini API Key
    // Prioritize the server-side environment variable to keep it secure.
    // Fallback to client-provided key for guest mode local testing.
    geminiKey = process.env.GEMINI_API_KEY || apiKey;
    if (!geminiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key is missing. Please configure it in your environment (.env.local) or Settings panel.' },
        { status: 400 }
      );
    }

    model = selectedModel || 'gemini-3.5-flash';

    // 2. Initialize Langfuse if credentials are provided in env
    const langfusePublicKey = process.env.LANGFUSE_PUBLIC_KEY;
    const langfuseSecretKey = process.env.LANGFUSE_SECRET_KEY;
    const langfuseHost = process.env.LANGFUSE_HOST || process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com';

    let langfuse: Langfuse | null = null;
    let trace: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    let routerSpan: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    let generation: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (langfusePublicKey && langfuseSecretKey) {
      langfuse = new Langfuse({
        publicKey: langfusePublicKey,
        secretKey: langfuseSecretKey,
        baseUrl: langfuseHost,
      });

      // Start a trace for this multi-agent chat interaction
      trace = langfuse.trace({
        name: 'goal-tracker-multi-agent-chat',
        metadata: {
          model: model,
        },
      });
    }

    // Extract the user's last message to route
    const lastMessageText = contents[contents.length - 1]?.parts[0]?.text || '';

    // ==========================================
    // STEP 1: ROUTER AGENT INVOCATION
    // ==========================================
    const routerPromptPath = path.join(process.cwd(), 'prompts', 'router_agent.txt');
    routerSystemInstruction = fs.readFileSync(routerPromptPath, 'utf8');

    if (trace) {
      routerSpan = trace.span({
        name: 'router-agent',
        input: { message: lastMessageText },
      });
    }

    const routerUrls = [
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${geminiKey}`,
    ];

    let routerSuccess = false;

    for (const url of routerUrls) {
      try {
        const isBeta = url.includes('v1beta');
        const reqBody: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (isBeta) {
          reqBody.contents = contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: lastMessageText }] }];
          reqBody.systemInstruction = {
            parts: [{ text: routerSystemInstruction }],
          };
        } else {
          const baseContents = contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: lastMessageText }] }];
          reqBody.contents = [
            {
              role: 'user',
              parts: [{ text: `SYSTEM INSTRUCTION:\n${routerSystemInstruction}\n\nCONVERSATION HISTORY:` }],
            },
            ...baseContents,
          ];
        }

        routerReqBody = reqBody;
        routerUrlUsed = url;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody),
        });

        if (response.ok) {
          const data = await response.json();
          routerResBody = data;
          const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleanedText = resultText.trim().toUpperCase().replace(/[^A-Z]/g, '');
          
          if (['TASKS', 'ROUTINES', 'GOALS', 'CHAT'].includes(cleanedText)) {
            routerCategory = cleanedText;
          }
          routerSuccess = true;
          break;
        } else {
          try {
            routerResBody = await response.json();
          } catch {
            routerResBody = { status: response.status, statusText: response.statusText };
          }
        }
      } catch (err) {
        console.error('Router attempt failed:', err);
        routerResBody = { error: err instanceof Error ? err.message : String(err) };
      }
    }

    if (!routerSuccess) {
      routerCategory = fallbackRouteClassifier(lastMessageText);
    }

    if (routerSpan) {
      routerSpan.update({
        output: { category: routerCategory },
      });
      await routerSpan.end();
    }

    // ==========================================
    // STEP 2: SPECIALIST AGENT INVOCATION
    // ==========================================
    let promptFilename = 'chat_agent.txt';
    if (routerCategory === 'TASKS') promptFilename = 'tasks_agent.txt';
    else if (routerCategory === 'ROUTINES') promptFilename = 'routines_agent.txt';
    else if (routerCategory === 'GOALS') promptFilename = 'goals_agent.txt';

    const specialistPromptPath = path.join(process.cwd(), 'prompts', promptFilename);
    const template = fs.readFileSync(specialistPromptPath, 'utf8');

    // Populate template variables
    contextPrompt = template
      .replace('{{date}}', state?.date || '')
      .replace('{{goals}}', JSON.stringify(state?.goals || []))
      .replace('{{routines}}', JSON.stringify(state?.routines || []))
      .replace('{{tasks}}', JSON.stringify(state?.tasks || []))
      .replace('{{subtasks}}', JSON.stringify(state?.subtasks || []))
      .replace('{{taskTimeLogs}}', JSON.stringify(state?.taskTimeLogs || []));

    if (trace) {
      generation = trace.generation({
        name: `${routerCategory.toLowerCase()}-specialist`,
        model: model,
        input: contents,
        prompt: contextPrompt,
      });
    }

    let success = false;

    for (const url of routerUrls) {
      try {
        const isBeta = url.includes('v1beta');
        const reqBody: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (isBeta) {
          reqBody.contents = contents;
          reqBody.systemInstruction = {
            parts: [{ text: contextPrompt }],
          };
        } else {
          reqBody.contents = [
            {
              role: 'user',
              parts: [{ text: `SYSTEM INSTRUCTION:\n${contextPrompt}\n\nCONVERSATION HISTORY:` }],
            },
            ...contents,
          ];
        }

        specialistReqBody = reqBody;
        specialistUrlUsed = url;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody),
        });

        if (!response.ok) {
          let errData;
          try {
            errData = await response.json();
          } catch {
            errData = { status: response.status, statusText: response.statusText };
          }
          specialistResBody = errData;
          const errMsg = errData.error?.message || response.statusText || JSON.stringify(errData);
          const modelName = url.split('/models/')[1].split(':')[0];
          const apiVer = url.includes('v1beta') ? 'v1beta' : 'v1';
          errors.push(`${modelName} (${apiVer}): ${errMsg}`);
          continue;
        }

        const data = await response.json();
        specialistResBody = data;
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        let cleanText = resultText.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText
            .replace(/^```json/, '')
            .replace(/^```/, '')
            .replace(/```$/, '')
            .trim();
        }
        specialistCleanText = cleanText;

        const modelName = url.split('/models/')[1].split(':')[0];
        responseData = {
          content: JSON.parse(cleanText),
          usage: data.usageMetadata || null,
          modelName: modelName,
        };
        success = true;
        break;
      } catch (err) {
        const modelName = url.split('/models/')[1].split(':')[0];
        const errMsg = err instanceof Error ? err.message : String(err);
        errors.push(`${modelName}: ${errMsg}`);
        specialistResBody = { error: errMsg };
      }
    }

    if (!success) {
      const allErrors = `All endpoints failed:\n${errors.map((e) => `• ${e}`).join('\n')}`;
      
      if (generation) {
        generation.update({
          statusMessage: allErrors,
          level: 'ERROR',
        });
        await langfuse?.flush();
      }

      writeExecutionLog({
        timestamp,
        model,
        hasApiKey: !!geminiKey,
        state,
        contents,
        routerSystemInstruction,
        routerUrlUsed,
        routerReqBody,
        routerResBody,
        routerCategory,
        specialistSystemInstruction: contextPrompt,
        specialistUrlUsed,
        specialistReqBody,
        specialistResBody,
        specialistCleanText,
        responseData,
        errors,
        success: false,
      });

      return NextResponse.json({ error: allErrors }, { status: 500 });
    }

    // 4. Update Langfuse trace on success
    if (generation) {
      const promptTokens = responseData.usage?.promptTokenCount || 0;
      const completionTokens = responseData.usage?.candidatesTokenCount || 0;
      const totalTokens = responseData.usage?.totalTokenCount || 0;

      generation.update({
        output: responseData.content,
        usage: {
          promptTokens: promptTokens,
          completionTokens: completionTokens,
          totalTokens: totalTokens,
        },
      });
      
      await langfuse?.flush();
    }

    writeExecutionLog({
      timestamp,
      model,
      hasApiKey: !!geminiKey,
      state,
      contents,
      routerSystemInstruction,
      routerUrlUsed,
      routerReqBody,
      routerResBody,
      routerCategory,
      specialistSystemInstruction: contextPrompt,
      specialistUrlUsed,
      specialistReqBody,
      specialistResBody,
      specialistCleanText,
      responseData,
      errors,
      success: true,
    });

    return NextResponse.json({
      content: responseData.content,
      usage: responseData.usage,
      modelName: `${responseData.modelName} (${routerCategory})`,
    });

  } catch (error) {
    console.error('Error in chat API route:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal Server Error';

    try {
      writeExecutionLog({
        timestamp,
        model,
        hasApiKey: !!geminiKey,
        state,
        contents,
        routerSystemInstruction,
        routerUrlUsed,
        routerReqBody,
        routerResBody,
        routerCategory,
        specialistSystemInstruction: contextPrompt,
        specialistUrlUsed,
        specialistReqBody,
        specialistResBody,
        specialistCleanText,
        responseData,
        errors: [...errors, errMsg],
        success: false,
      });
    } catch (logErr) {
      console.error('Failed to write execution log in catch block:', logErr);
    }

    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

function writeExecutionLog({
  timestamp,
  model,
  hasApiKey,
  state,
  contents,
  routerSystemInstruction,
  routerUrlUsed,
  routerReqBody,
  routerResBody,
  routerCategory,
  specialistSystemInstruction,
  specialistUrlUsed,
  specialistReqBody,
  specialistResBody,
  specialistCleanText,
  responseData,
  errors,
  success,
}: {
  timestamp: string;
  model: string;
  hasApiKey: boolean;
  state: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  contents: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  routerSystemInstruction: string;
  routerUrlUsed: string;
  routerReqBody: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  routerResBody: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  routerCategory: string;
  specialistSystemInstruction: string;
  specialistUrlUsed: string;
  specialistReqBody: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  specialistResBody: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  specialistCleanText: string;
  responseData: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  errors: string[];
  success: boolean;
}) {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, 'ai_assistant.log');

    // Format chat history safely
    let historyStr = '';
    if (Array.isArray(contents)) {
      historyStr = contents
        .map((msg: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          const role = msg.role === 'user' ? 'User' : 'Assistant';
          const partsText = msg.parts?.map((p: any) => p.text).join('\n') || ''; // eslint-disable-line @typescript-eslint/no-explicit-any
          return `[${role}] ${partsText}`;
        })
        .join('\n');
    }

    // Safely summarize user state
    const stateSummary = state ? {
      date: state.date || 'N/A',
      goalsCount: Array.isArray(state.goals) ? state.goals.length : 0,
      routinesCount: Array.isArray(state.routines) ? state.routines.length : 0,
      tasksCount: Array.isArray(state.tasks) ? state.tasks.length : 0,
      subtasksCount: Array.isArray(state.subtasks) ? state.subtasks.length : 0,
      taskTimeLogsCount: Array.isArray(state.taskTimeLogs) ? state.taskTimeLogs.length : 0,
    } : null;

    const logSeparator = '='.repeat(80);
    const subSeparator = '-'.repeat(40);
    const maskKey = (str: string) => str ? str.replace(/key=[^&]+/g, 'key=[REDACTED]') : '';

    let logContent = `${logSeparator}\n`;
    logContent += `CONVERSATION LOG: ${timestamp}\n`;
    logContent += `STATUS: ${success ? 'SUCCESS' : 'FAILED'}\n`;
    logContent += `${logSeparator}\n\n`;

    logContent += `[REQUEST METADATA]\n`;
    logContent += `Model: ${model}\n`;
    logContent += `Has API Key: ${hasApiKey}\n`;
    if (stateSummary) {
      logContent += `State Summary:\n`;
      logContent += `  - Date: ${stateSummary.date}\n`;
      logContent += `  - Goals: ${stateSummary.goalsCount}\n`;
      logContent += `  - Routines: ${stateSummary.routinesCount}\n`;
      logContent += `  - Tasks: ${stateSummary.tasksCount}\n`;
      logContent += `  - Subtasks: ${stateSummary.subtasksCount}\n`;
      logContent += `  - Task Time Logs: ${stateSummary.taskTimeLogsCount}\n`;
    } else {
      logContent += `State Summary: No state provided\n`;
    }
    logContent += `\n`;

    logContent += `[CHAT HISTORY]\n`;
    logContent += `${historyStr || '(None)'}\n\n`;

    logContent += `[STEP 1: ROUTER AGENT]\n`;
    logContent += `Router URL: ${maskKey(routerUrlUsed) || 'N/A'}\n`;
    logContent += `Router System Instruction:\n`;
    logContent += `${subSeparator}\n`;
    logContent += `${routerSystemInstruction ? routerSystemInstruction.trim() : 'N/A'}\n`;
    logContent += `${subSeparator}\n`;
    logContent += `Router Request Body:\n`;
    logContent += `${JSON.stringify(routerReqBody, null, 2)}\n\n`;
    logContent += `Router Raw Response:\n`;
    logContent += `${JSON.stringify(routerResBody, null, 2)}\n\n`;
    logContent += `Router Decided Category: ${routerCategory}\n\n`;

    logContent += `[STEP 2: SPECIALIST AGENT]\n`;
    logContent += `Specialist URL: ${maskKey(specialistUrlUsed) || 'N/A'}\n`;
    logContent += `Specialist System Instruction:\n`;
    logContent += `${subSeparator}\n`;
    logContent += `${specialistSystemInstruction ? specialistSystemInstruction.trim() : 'N/A'}\n`;
    logContent += `${subSeparator}\n`;
    logContent += `Specialist Request Body:\n`;
    logContent += `${JSON.stringify(specialistReqBody, null, 2)}\n\n`;
    logContent += `Specialist Raw Response:\n`;
    logContent += `${JSON.stringify(specialistResBody, null, 2)}\n\n`;
    logContent += `Specialist Clean JSON Response:\n`;
    logContent += `${specialistCleanText || 'N/A'}\n\n`;
    logContent += `Parsed Specialist Response Content:\n`;
    logContent += `${JSON.stringify(responseData?.content, null, 2)}\n\n`;
    logContent += `Token Usage:\n`;
    logContent += `  - Prompt Tokens: ${responseData?.usage?.promptTokenCount || 0}\n`;
    logContent += `  - Completion Tokens: ${responseData?.usage?.candidatesTokenCount || 0}\n`;
    logContent += `  - Total Tokens: ${responseData?.usage?.totalTokenCount || 0}\n`;

    if (errors && errors.length > 0) {
      logContent += `\n[ERRORS ENCOUNTERED]\n`;
      errors.forEach((err, idx) => {
        logContent += `${idx + 1}. ${err}\n`;
      });
    }

    logContent += `\n${logSeparator}\n\n`;

    fs.appendFileSync(logFile, logContent, 'utf8');
  } catch (err) {
    console.error('Failed to write to local execution log:', err);
  }
}

function fallbackRouteClassifier(text: string): string {
  const clean = text.toLowerCase();
  
  if (
    clean.includes('routine') || 
    clean.includes('habit') || 
    clean.includes('streak') || 
    clean.includes('heatmap') || 
    clean.includes('daily check') ||
    clean.includes('routine log')
  ) {
    return 'ROUTINES';
  }
  
  if (
    clean.includes('goal') || 
    clean.includes('objective') || 
    clean.includes('motivate') || 
    clean.includes('motivation') || 
    clean.includes('shloka') || 
    clean.includes('quote')
  ) {
    return 'GOALS';
  }
  
  if (
    clean.includes('task') || 
    clean.includes('subtask') || 
    clean.includes('todo') || 
    clean.includes('to-do') || 
    clean.includes('create') || 
    clean.includes('add') || 
    clean.includes('complete') || 
    clean.includes('finish') || 
    clean.includes('stopwatch') || 
    clean.includes('timer') || 
    clean.includes('schedule')
  ) {
    return 'TASKS';
  }
  
  return 'CHAT';
}
