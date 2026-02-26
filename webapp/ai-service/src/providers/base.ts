export type ProviderName = 'anthropic' | 'openai' | 'google' | 'openrouter' | 'bedrock' | 'azure' | 'ollama';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stop?: string[];
  tools?: ToolDefinition[];
}

export interface ChatResponse {
  content: string;
  stopReason: string;
  toolUses?: Array<{
    name: string;
    input: Record<string, unknown>;
  }>;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: object;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: ProviderName;
  contextWindow: number;
  supportsVision: boolean;
  supportsTools: boolean;
  pricing?: {
    input: number;
    output: number;
  };
}

export interface Provider {
  name: ProviderName;
  
  // Chat completion
  chat(request: ChatRequest): Promise<ChatResponse>;
  
  // List available models
  listModels(): Promise<ModelInfo[]>;
  
  // Test connection
  test(): Promise<boolean>;
}

// Base class for providers
export abstract class BaseProvider implements Provider {
  abstract name: ProviderName;
  abstract chat(request: ChatRequest): Promise<ChatResponse>;
  abstract listModels(): Promise<ModelInfo[]>;
  abstract test(): Promise<boolean>;
  
  protected defaultHeaders: Record<string, string> = {};
  
  protected async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} - ${error}`);
    }
    
    return response.json();
  }
}
