import { AnthropicProvider } from './anthropic';
import { BaseProvider, Provider, ProviderName, ModelInfo, ChatRequest, ChatResponse } from './base';

// Provider registry
const providers: Map<ProviderName, Provider> = new Map();

// Initialize default providers
export function initializeProviders(): void {
  // Anthropic (default)
  providers.set('anthropic', new AnthropicProvider());
  
  // Add other providers as needed
  // providers.set('openai', new OpenAIProvider());
  // providers.set('google', new GoogleProvider());
}

// Get provider by name
export function getProvider(name: ProviderName): Provider | undefined {
  return providers.get(name);
}

// Get default provider
export function getDefaultProvider(): Provider {
  return providers.get('anthropic')!;
}

// Register a custom provider
export function registerProvider(name: ProviderName, provider: Provider): void {
  providers.set(name, provider);
}

// Get all available models
export async function getAllModels(): Promise<ModelInfo[]> {
  const allModels: ModelInfo[] = [];
  
  for (const provider of providers.values()) {
    const models = await provider.listModels();
    allModels.push(...models);
  }
  
  return allModels;
}

// Get models by provider
export async function getModelsByProvider(providerName: ProviderName): Promise<ModelInfo[]> {
  const provider = providers.get(providerName);
  if (!provider) {
    return [];
  }
  
  return provider.listModels();
}

// Chat completion with auto-routing
export async function chat(request: ChatRequest): Promise<ChatResponse> {
  // Determine which provider to use based on model name
  let provider: Provider;
  
  if (request.model) {
    const providerName = getProviderForModel(request.model);
    provider = providers.get(providerName) || getDefaultProvider();
  } else {
    provider = getDefaultProvider();
  }
  
  return provider.chat(request);
}

// Determine provider from model name
function getProviderForModel(model: string): ProviderName {
  const modelToProvider: Record<string, ProviderName> = {
    'claude': 'anthropic',
    'gpt': 'openai',
    'gemini': 'google',
  };
  
  for (const [prefix, provider] of Object.entries(modelToProvider)) {
    if (model.toLowerCase().includes(prefix)) {
      return provider;
    }
  }
  
  return 'anthropic'; // default
}

// Track token usage
export interface UsageStats {
  userId: string;
  provider: ProviderName;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: Date;
}

const usageRecords: UsageStats[] = [];

export function recordUsage(stats: UsageStats): void {
  usageRecords.push(stats);
}

export function getUsage(userId?: string, startDate?: Date, endDate?: Date): UsageStats[] {
  return usageRecords.filter((record) => {
    if (userId && record.userId !== userId) return false;
    if (startDate && record.timestamp < startDate) return false;
    if (endDate && record.timestamp > endDate) return false;
    return true;
  });
}
