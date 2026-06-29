import { Gemini } from '@google/adk';
import { OpenAiLlm } from './models/openai.js';
import { GroqLlm } from './models/groq.js';
import { BaseLlm } from '@google/adk';

export function getDynamicModel(): BaseLlm {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (geminiApiKey) {
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    return new Gemini({
      model: modelName,
      apiKey: geminiApiKey,
    });
  }

  if (groqApiKey) {
    const modelName = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    return new GroqLlm({
      model: modelName,
      apiKey: groqApiKey,
    });
  }

  if (openAiApiKey) {
    const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    return new OpenAiLlm({
      model: modelName,
      apiKey: openAiApiKey,
    });
  }

  // Fallback to Gemini (let ADK raise the missing key error at runtime)
  const defaultModelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  return new Gemini({
    model: defaultModelName,
  });
}
