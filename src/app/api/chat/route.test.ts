import { beforeAll, describe, expect, it, vi, afterAll } from 'vitest';
import { POST } from './route';
import fs from 'fs';
import path from 'path';

const originalFetch = globalThis.fetch;

describe('Chat API Route with Under-the-hood Logging', () => {
  const logDir = path.join(process.cwd(), 'logs');
  const logFile = path.join(logDir, 'ai_assistant.log');

  beforeAll(() => {
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }
  });

  it('should successfully route, call specialist, log to file, and return response', async () => {
    let callIndex = 0;
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      callIndex++;
      const isBeta = url.includes('v1beta');
      if (callIndex === 1 || (callIndex === 2 && !isBeta)) {
        // Router mock
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: 'TASKS' }],
                },
              },
            ],
          }),
        } as unknown as Response;
      } else {
        // Specialist mock
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        thinking: 'User wants to add a task.',
                        intent: 'TASKS',
                        reply: 'I have added the task.',
                        actions: [
                          {
                            type: 'ADD_TASK',
                            payload: { title: 'Test Task' },
                          },
                        ],
                      }),
                    },
                  ],
                },
              },
            ],
            usageMetadata: {
              promptTokenCount: 120,
              candidatesTokenCount: 45,
              totalTokenCount: 165,
            },
          }),
        } as unknown as Response;
      }
    });

    const mockState = {
      date: '2026-06-12',
      goals: [{ id: '1', title: 'Learn Vitest' }],
      routines: [],
      tasks: [],
      subtasks: [],
      taskTimeLogs: [],
    };

    const mockRequestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Add a task to learn Vitest' }],
        },
      ],
      selectedModel: 'gemini-3.5-flash',
      apiKey: 'test-key-1234',
      state: mockState,
    };

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockRequestBody),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.content.intent).toBe('TASKS');
    expect(data.content.reply).toBe('I have added the task.');
    expect(data.modelName).toContain('gemini-3.5-flash (TASKS)');

    expect(fs.existsSync(logFile)).toBe(true);
    const logContents = fs.readFileSync(logFile, 'utf8');

    expect(logContents).toContain('CONVERSATION LOG:');
    expect(logContents).toContain('STATUS: SUCCESS');
    expect(logContents).toContain('Model: gemini-3.5-flash');
    expect(logContents).toContain('[STEP 1: ROUTER AGENT]');
    expect(logContents).toContain('Router Decided Category: TASKS');
    expect(logContents).toContain('[STEP 2: SPECIALIST AGENT]');
    expect(logContents).toContain('Specialist Clean JSON Response:');
    expect(logContents).toContain('"thinking": "User wants to add a task."');
    expect(logContents).toContain('Token Usage:');
    expect(logContents).toContain('Prompt Tokens: 120');
  });

  it('should log failures correctly to the log file', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          error: { message: 'Gemini rate limit exceeded' },
        }),
      } as unknown as Response;
    });

    const mockRequestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: 'This will fail' }],
        },
      ],
      selectedModel: 'gemini-3.5-flash',
      apiKey: 'test-key-1234',
      state: null,
    };

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockRequestBody),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    expect(fs.existsSync(logFile)).toBe(true);
    const logContents = fs.readFileSync(logFile, 'utf8');
    expect(logContents).toContain('STATUS: FAILED');
    expect(logContents).toContain('Gemini rate limit exceeded');
  });

  it('should fallback to local route classifier if router fetch fails but specialist succeeds', async () => {
    let callIndex = 0;
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      callIndex++;
      // Since v1beta is first, call 1 is Router v1beta, call 2 is Router v1, call 3 is Specialist v1beta
      const isBeta = url.includes('v1beta');
      if (callIndex === 1 || (callIndex === 2 && !isBeta)) {
        return {
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          json: async () => ({
            error: { message: 'Rate limit exceeded' },
          }),
        } as unknown as Response;
      } else {
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        thinking: 'User wants to create a routine.',
                        intent: 'ROUTINES',
                        reply: 'Routine created.',
                        actions: [],
                      }),
                    },
                  ],
                },
              },
            ],
            usageMetadata: {
              promptTokenCount: 150,
              candidatesTokenCount: 30,
              totalTokenCount: 180,
            },
          }),
        } as unknown as Response;
      }
    });

    const mockRequestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Create a new routine for running' }],
        },
      ],
      selectedModel: 'gemini-3.5-flash',
      apiKey: 'test-key-1234',
      state: null,
    };

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockRequestBody),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.content.reply).toBe('Routine created.');
    expect(data.modelName).toContain('gemini-3.5-flash (ROUTINES)');

    expect(fs.existsSync(logFile)).toBe(true);
    const logContents = fs.readFileSync(logFile, 'utf8');
    expect(logContents).toContain('Router Decided Category: ROUTINES');
  });
});
