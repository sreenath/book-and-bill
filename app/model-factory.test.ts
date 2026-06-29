import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDynamicModel } from './model-factory.js';
import { OpenAiLlm } from './models/openai.js';
import { GroqLlm } from './models/groq.js';
import { Gemini } from '@google/adk';

// Save original env
const originalEnv = { ...process.env };

describe('Model Factory and Adapters', () => {
  beforeEach(() => {
    vi.resetModules();
    // Clear all model API keys from env
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENAI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_MODEL;
    delete process.env.GROQ_MODEL;
    delete process.env.OPENAI_MODEL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('Dynamic Model Selection', () => {
    it('should select Gemini when GEMINI_API_KEY is present', () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      const model = getDynamicModel();
      expect(model).toBeInstanceOf(Gemini);
      expect(model.model).toBe('gemini-2.5-flash');
    });

    it('should select Groq when GROQ_API_KEY is present and Gemini keys are absent', () => {
      process.env.GROQ_API_KEY = 'test-groq-key';
      const model = getDynamicModel();
      expect(model).toBeInstanceOf(GroqLlm);
      expect(model.model).toBe('llama-3.3-70b-versatile');
    });

    it('should select OpenAI when OPENAI_API_KEY is present and Gemini/Groq are absent', () => {
      process.env.OPENAI_API_KEY = 'test-openai-key';
      const model = getDynamicModel();
      expect(model).toBeInstanceOf(OpenAiLlm);
      expect(model.model).toBe('gpt-4o-mini');
    });

    it('should honor Gemini > Groq > OpenAI precedence', () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.GROQ_API_KEY = 'test-groq-key';
      process.env.OPENAI_API_KEY = 'test-openai-key';
      
      const model = getDynamicModel();
      expect(model).toBeInstanceOf(Gemini);
    });

    it('should select Groq over OpenAI when Gemini is absent', () => {
      process.env.GROQ_API_KEY = 'test-groq-key';
      process.env.OPENAI_API_KEY = 'test-openai-key';
      
      const model = getDynamicModel();
      expect(model).toBeInstanceOf(GroqLlm);
    });

    it('should support custom model name environment overrides', () => {
      process.env.GROQ_API_KEY = 'test-groq-key';
      process.env.GROQ_MODEL = 'custom-groq-model';
      const model = getDynamicModel();
      expect(model.model).toBe('custom-groq-model');
    });
  });

  describe('OpenAI/Groq Request & Response Mapping', () => {
    it('should map Gemini contents to OpenAI request messages correctly', async () => {
      const openAiLlm = new OpenAiLlm({ model: 'gpt-4o-mini', apiKey: 'test-key' });
      
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              role: 'assistant',
              content: 'Hello, how can I help you?',
            },
            finish_reason: 'stop',
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 15,
            total_tokens: 25,
          }
        })
      });
      globalThis.fetch = fetchMock;

      const llmRequest = {
        contents: [
          { role: 'user', parts: [{ text: 'Hello' }] }
        ],
        config: {
          systemInstruction: 'You are a helper',
        },
        liveConnectConfig: {},
        toolsDict: {},
      };

      const generator = openAiLlm.generateContentAsync(llmRequest as any);
      const responses: any[] = [];
      for await (const chunk of generator) {
        responses.push(chunk);
      }

      expect(responses.length).toBe(1);
      expect(responses[0].content!.parts![0].text).toBe('Hello, how can I help you?');
      expect(responses[0].usageMetadata!.promptTokenCount).toBe(10);
      expect(responses[0].usageMetadata!.candidatesTokenCount).toBe(15);
      
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.openai.com/v1/chat/completions');
      const body = JSON.parse(options!.body as string);
      expect(body.model).toBe('gpt-4o-mini');
      expect(body.messages).toEqual([
        { role: 'system', content: 'You are a helper' },
        { role: 'user', content: 'Hello' }
      ]);
    });

    it('should convert tools and lowercase schema types correctly', async () => {
      const openAiLlm = new OpenAiLlm({ model: 'gpt-4o-mini', apiKey: 'test-key' });
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [{
                id: 'call_1',
                type: 'function',
                function: {
                  name: 'book_appointment',
                  arguments: '{"date":"2026-07-01"}',
                }
              }]
            },
            finish_reason: 'tool_calls',
          }]
        })
      });
      globalThis.fetch = fetchMock;

      const llmRequest = {
        contents: [{ role: 'user', parts: [{ text: 'Book Alice' }] }],
        config: {
          tools: [{
            functionDeclarations: [{
              name: 'book_appointment',
              description: 'Books it',
              parameters: {
                type: 'OBJECT',
                properties: {
                  date: { type: 'STRING' }
                },
                required: ['date']
              }
            }]
          }]
        },
        liveConnectConfig: {},
        toolsDict: {},
      };

      const generator = openAiLlm.generateContentAsync(llmRequest as any);
      const responses: any[] = [];
      for await (const chunk of generator) {
        responses.push(chunk);
      }

      expect(responses.length).toBe(1);
      const parts = responses[0].content!.parts!;
      expect(parts[0].functionCall).toBeDefined();
      expect(parts[0].functionCall!.name).toBe('book_appointment');
      expect(parts[0].functionCall!.args).toEqual({ date: '2026-07-01' });

      const [, options] = fetchMock.mock.calls[0];
      const body = JSON.parse(options!.body as string);
      expect(body.tools).toBeDefined();
      expect(body.tools[0].type).toBe('function');
      expect(body.tools[0].function.parameters.type).toBe('object');
      expect(body.tools[0].function.parameters.properties.date.type).toBe('string');
    });

    it('should map tool responses back using the correct tool_call_id', async () => {
      const openAiLlm = new OpenAiLlm({ model: 'gpt-4o-mini', apiKey: 'test-key' });
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              role: 'assistant',
              content: 'Confirmed!',
            }
          }]
        })
      });
      globalThis.fetch = fetchMock;

      const llmRequest = {
        contents: [
          { role: 'user', parts: [{ text: 'Book Alice' }] },
          { role: 'model', parts: [{ functionCall: { name: 'book_appointment', args: { date: '2026-07-01' }, id: 'call_abc_123' } }] },
          { role: 'user', parts: [{ functionResponse: { name: 'book_appointment', response: { status: 'success' }, id: 'call_abc_123' } }] }
        ],
        liveConnectConfig: {},
        toolsDict: {},
      };

      const generator = openAiLlm.generateContentAsync(llmRequest as any);
      for await (const _ of generator) {}

      const [, options] = fetchMock.mock.calls[0];
      const body = JSON.parse(options!.body as string);
      expect(body.messages[1].tool_calls[0].id).toBe('call_abc_123');
      expect(body.messages[2].role).toBe('tool');
      expect(body.messages[2].tool_call_id).toBe('call_abc_123');
    });
  });
});
