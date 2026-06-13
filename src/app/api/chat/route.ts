import { NextResponse } from 'next/server';
import { Langfuse } from 'langfuse';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  let contents: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  let selectedModel = '';
  let apiKey = '';
  let state: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  let geminiKey = '';
  let model = 'gemini-3.5-flash';
  let routerSystemInstruction = '';
  let routerCategory = 'CHAT';
  let contextPrompt = '';
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

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody),
        });

        if (response.ok) {
          const data = await response.json();
          const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleanedText = resultText.trim().toUpperCase().replace(/[^A-Z]/g, '');
          
          if (['TASKS', 'ROUTINES', 'GOALS', 'CHAT'].includes(cleanedText)) {
            routerCategory = cleanedText;
          }
          routerSuccess = true;
          break;
        }
      } catch (err) {
        console.error('Router attempt failed:', err);
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

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody),
        });

        if (!response.ok) {
          const errData = await response.json();
          const errMsg = errData.error?.message || response.statusText;
          const modelName = url.split('/models/')[1].split(':')[0];
          const apiVer = url.includes('v1beta') ? 'v1beta' : 'v1';
          errors.push(`${modelName} (${apiVer}): ${errMsg}`);
          continue;
        }

        const data = await response.json();
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        let cleanText = resultText.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText
            .replace(/^```json/, '')
            .replace(/^```/, '')
            .replace(/```$/, '')
            .trim();
        }

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

    return NextResponse.json({
      content: responseData.content,
      usage: responseData.usage,
      modelName: `${responseData.modelName} (${routerCategory})`,
    });

  } catch (error) {
    console.error('Error in chat API route:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
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
