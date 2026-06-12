import { NextResponse } from 'next/server';
import { Langfuse } from 'langfuse';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { contents, selectedModel, apiKey, state } = await req.json();

    // 1. Resolve Gemini API Key
    // Prioritize the server-side environment variable to keep it secure.
    // Fallback to client-provided key for guest mode local testing.
    const geminiKey = process.env.GEMINI_API_KEY || apiKey;
    if (!geminiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key is missing. Please configure it in your environment (.env.local) or Settings panel.' },
        { status: 400 }
      );
    }

    const model = selectedModel || 'gemini-3.5-flash';

    // 2. Read and populate the system instruction template from the prompt registry
    const promptTemplatePath = path.join(process.cwd(), 'prompts', 'system_prompt.txt');
    const template = fs.readFileSync(promptTemplatePath, 'utf8');

    const contextPrompt = template
      .replace('{{date}}', state?.date || '')
      .replace('{{goals}}', JSON.stringify(state?.goals || []))
      .replace('{{routines}}', JSON.stringify(state?.routines || []))
      .replace('{{routineLogs}}', JSON.stringify(state?.routineLogs || []))
      .replace('{{tasks}}', JSON.stringify(state?.tasks || []))
      .replace('{{subtasks}}', JSON.stringify(state?.subtasks || []))
      .replace('{{taskTimeLogs}}', JSON.stringify(state?.taskTimeLogs || []));

    // 2. Initialize Langfuse if credentials are provided in env
    const langfusePublicKey = process.env.LANGFUSE_PUBLIC_KEY;
    const langfuseSecretKey = process.env.LANGFUSE_SECRET_KEY;
    const langfuseHost = process.env.LANGFUSE_HOST || process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com';

    let langfuse: Langfuse | null = null;
    let trace: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    let generation: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (langfusePublicKey && langfuseSecretKey) {
      langfuse = new Langfuse({
        publicKey: langfusePublicKey,
        secretKey: langfuseSecretKey,
        baseUrl: langfuseHost,
      });

      // Start a trace for this specific chat interaction
      trace = langfuse.trace({
        name: 'goal-tracker-chat',
        metadata: {
          model: model,
        },
      });

      // Create a generation record linked to the trace
      generation = trace.generation({
        name: 'gemini-generation',
        model: model,
        input: contents,
        prompt: contextPrompt,
      });
    }

    // 3. Query the Gemini API using endpoints
    const urls = [
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${geminiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
    ];

    const errors: string[] = [];
    let success = false;
    let responseData: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: contextPrompt }],
            },
          }),
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
      
      // Update Langfuse on error
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
      
      // Force Langfuse to flush the tracking payload immediately
      await langfuse?.flush();
    }

    return NextResponse.json({
      content: responseData.content,
      usage: responseData.usage,
      modelName: responseData.modelName,
    });

  } catch (error) {
    console.error('Error in chat API route:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
