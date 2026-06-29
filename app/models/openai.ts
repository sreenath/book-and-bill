import { BaseLlm, BaseLlmConnection, LlmRequest, LlmResponse } from '@google/adk';
import { Content } from '@google/genai';

function lowercaseSchemaTypes(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;
  const newSchema = { ...schema };
  if (typeof newSchema.type === 'string') {
    newSchema.type = newSchema.type.toLowerCase();
  }
  if (newSchema.properties && typeof newSchema.properties === 'object') {
    const newProps: any = {};
    for (const [k, v] of Object.entries(newSchema.properties)) {
      newProps[k] = lowercaseSchemaTypes(v);
    }
    newSchema.properties = newProps;
  }
  if (newSchema.items && typeof newSchema.items === 'object') {
    newSchema.items = lowercaseSchemaTypes(newSchema.items);
  }
  return newSchema;
}

export function mapGeminiContentsToOpenAi(contents: Content[]): any[] {
  const messages: any[] = [];
  const lastToolCallsByName = new Map<string, string>();
  let callIdCounter = 0;

  for (const content of contents) {
    const role = content.role;
    const parts = content.parts || [];
    
    // Check if this message is a tool response
    const hasFunctionResponse = parts.some(p => p.functionResponse);
    
    if (hasFunctionResponse) {
      for (const part of parts) {
        if (part.functionResponse) {
          const { name, response, id } = part.functionResponse;
          let toolCallId = id;
          if (!toolCallId && name) {
            toolCallId = lastToolCallsByName.get(name);
          }
          if (!toolCallId) {
            toolCallId = `call_${name || 'fn'}_${callIdCounter++}`;
          }
          if (name) {
            lastToolCallsByName.set(name, toolCallId);
          }
          messages.push({
            role: 'tool',
            tool_call_id: toolCallId,
            name: name,
            content: JSON.stringify(response),
          });
        }
      }
    } else {
      const mappedRole = role === 'model' ? 'assistant' : 'user';
      const textParts = parts.filter(p => p.text).map(p => p.text);
      const textContent = textParts.join('\n') || undefined;
      
      const functionCalls = parts.filter(p => p.functionCall).map(p => p.functionCall);
      
      const message: any = {
        role: mappedRole,
      };
      
      if (textContent !== undefined) {
        message.content = textContent;
      }
      
      if (functionCalls.length > 0) {
        message.tool_calls = functionCalls.map(fc => {
          const name = fc!.name;
          const toolCallId = fc!.id || `call_${name || 'fn'}_${callIdCounter++}`;
          if (name) {
            lastToolCallsByName.set(name, toolCallId);
          }
          return {
            id: toolCallId,
            type: 'function',
            function: {
              name: name,
              arguments: JSON.stringify(fc!.args || {}),
            },
          };
        });
        if (message.content === undefined) {
          message.content = null;
        }
      }
      
      messages.push(message);
    }
  }
  
  return messages;
}

export class OpenAiLlm extends BaseLlm {
  protected apiKey: string;
  protected apiUrl: string;

  constructor({ model, apiKey, apiUrl }: { model: string; apiKey: string; apiUrl?: string }) {
    super({ model });
    this.apiKey = apiKey;
    this.apiUrl = apiUrl || 'https://api.openai.com/v1/chat/completions';
  }

  static readonly supportedModels: Array<string | RegExp> = [/gpt-.*/];

  async *generateContentAsync(llmRequest: LlmRequest, stream = false): AsyncGenerator<LlmResponse, void> {
    const messages = mapGeminiContentsToOpenAi(llmRequest.contents);
    
    // Process systemInstruction
    const systemInstruction = llmRequest.config?.systemInstruction;
    if (systemInstruction) {
      let systemText = '';
      if (typeof systemInstruction === 'string') {
        systemText = systemInstruction;
      } else if (systemInstruction && typeof systemInstruction === 'object') {
        const instr = systemInstruction as any;
        const parts = instr.parts || (Array.isArray(instr) ? instr : [instr]);
        if (parts && parts[0] && parts[0].text) {
          systemText = parts[0].text;
        }
      }
      
      if (systemText) {
        messages.unshift({
          role: 'system',
          content: systemText,
        });
      }
    }

    const openAiTools: any[] = [];
    if (llmRequest.config?.tools) {
      for (const tool of llmRequest.config.tools) {
        const t = tool as any;
        if (t.functionDeclarations) {
          for (const decl of t.functionDeclarations) {
            openAiTools.push({
              type: 'function',
              function: {
                name: decl.name,
                description: decl.description,
                parameters: lowercaseSchemaTypes(decl.parameters),
              },
            });
          }
        }
      }
    }

    const payload: any = {
      model: this.model,
      messages,
    };

    if (openAiTools.length > 0) {
      payload.tools = openAiTools;
    }

    // Call API
    const res = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      yield {
        errorCode: `HTTP_${res.status}`,
        errorMessage: `API error: ${res.statusText}. Body: ${await res.text()}`,
      };
      return;
    }

    const json: any = await res.json();
    const choice = json.choices?.[0];
    const message = choice?.message;

    const parts: any[] = [];
    if (message?.content) {
      parts.push({ text: message.content });
    }

    if (message?.tool_calls) {
      for (const tc of message.tool_calls) {
        parts.push({
          functionCall: {
            name: tc.function.name,
            args: JSON.parse(tc.function.arguments || '{}'),
            id: tc.id,
          },
        });
      }
    }

    yield {
      content: parts.length > 0 ? { role: 'model', parts } : undefined,
      finishReason: (choice?.finish_reason === 'tool_calls' ? 'STOP' : 'STOP') as any,
      usageMetadata: json.usage ? {
        promptTokenCount: json.usage.prompt_tokens,
        candidatesTokenCount: json.usage.completion_tokens,
        totalTokenCount: json.usage.total_tokens,
      } : undefined,
    };
  }

  async connect(llmRequest: LlmRequest): Promise<BaseLlmConnection> {
    throw new Error('Live connection not supported for OpenAI.');
  }
}
