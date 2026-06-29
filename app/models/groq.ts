import { OpenAiLlm } from './openai.js';

export class GroqLlm extends OpenAiLlm {
  constructor({ model, apiKey }: { model: string; apiKey: string }) {
    super({
      model,
      apiKey,
      apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
    });
  }

  static override readonly supportedModels: Array<string | RegExp> = [/.*/];
}
