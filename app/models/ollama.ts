import { OpenAiLlm } from './openai.js';

export class OllamaLlm extends OpenAiLlm {
  constructor({ model, apiUrl }: { model: string; apiUrl?: string }) {
    super({
      model,
      apiKey: 'ollama',
      apiUrl: apiUrl || 'http://localhost:11434/v1/chat/completions',
    });
  }

  static override readonly supportedModels: Array<string | RegExp> = [/.*/];
}
