import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider, ChatRequest, ChatResponse, ModelInfo, ProviderName } from './base';
import { config } from '../config';

export class AnthropicProvider extends BaseProvider {
  name: ProviderName = 'anthropic';
  private client: Anthropic;
  
  constructor(apiKey?: string) {
    super();
    this.client = new Anthropic({
      apiKey: apiKey || config.providers.anthropic.apiKey,
    });
  }
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.client.messages.create({
      model: request.model || config.providers.anthropic.defaultModel,
      messages: request.messages as Anthropic.MessageParam[],
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature,
      stop_sequences: request.stop,
      tools: request.tools as Anthropic.Tool[] | undefined,
    });
    
    const content = response.content[0];
    const textContent = content.type === 'text' ? content.text : '';
    
    const toolUses = content.type === 'tool_use' 
      ? [{ name: content.name, input: content.input as Record<string, unknown> }]
      : response.content
          .filter((c): c is Anthropic.ToolUseBlock => c.type === 'tool_use')
          .map((c) => ({ name: c.name, input: c.input as Record<string, unknown> }));
    
    return {
      content: textContent,
      stopReason: response.stop_reason || 'end_turn',
      toolUses: toolUses.length > 0 ? toolUses : undefined,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }
  
  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        id: 'claude-opus-4-5-20250514',
        name: 'Claude Opus 4.5',
        provider: 'anthropic',
        contextWindow: 200000,
        supportsVision: true,
        supportsTools: true,
        pricing: { input: 0.015, output: 0.075 },
      },
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4.5',
        provider: 'anthropic',
        contextWindow: 200000,
        supportsVision: true,
        supportsTools: true,
        pricing: { input: 0.003, output: 0.015 },
      },
      {
        id: 'claude-haiku-3-5-20250514',
        name: 'Claude Haiku 3.5',
        provider: 'anthropic',
        contextWindow: 200000,
        supportsVision: true,
        supportsTools: true,
        pricing: { input: 0.0008, output: 0.004 },
      },
    ];
  }
  
  async test(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: config.providers.anthropic.defaultModel,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1,
      });
      return true;
    } catch {
      return false;
    }
  }
}
