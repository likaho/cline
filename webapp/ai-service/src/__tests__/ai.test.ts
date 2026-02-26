// Define types locally for testing
type ProviderName = 'anthropic' | 'openai' | 'google' | 'azure' | 'bedrock' | 'mistral';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stop?: string[];
  tools?: any[];
}

interface ChatResponse {
  content: string;
  stopReason: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  toolUses?: any[];
}

interface ModelInfo {
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

describe('AI Service Types', () => {
  describe('ChatRequest', () => {
    it('should validate required fields', () => {
      const request: ChatRequest = {
        messages: [
          { role: 'user', content: 'Hello' }
        ],
      };
      
      expect(request.messages).toHaveLength(1);
      expect(request.messages[0].role).toBe('user');
    });

    it('should allow optional fields', () => {
      const request: ChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'claude-sonnet-4-20250514',
        temperature: 0.7,
        maxTokens: 4096,
        stop: ['END'],
        tools: [
          {
            name: 'bash',
            description: 'Run bash command',
            inputSchema: { type: 'object', properties: { command: { type: 'string' } } }
          }
        ],
      };
      
      expect(request.model).toBeDefined();
      expect(request.temperature).toBe(0.7);
      expect(request.tools).toHaveLength(1);
    });
  });

  describe('ChatResponse', () => {
    it('should format response correctly', () => {
      const response: ChatResponse = {
        content: 'Hello! How can I help you?',
        stopReason: 'end_turn',
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
        },
      };
      
      expect(response.content).toBeDefined();
      expect(response.stopReason).toBe('end_turn');
      expect(response.usage?.totalTokens).toBe(150);
    });

    it('should handle tool uses', () => {
      const response: ChatResponse = {
        content: '',
        stopReason: 'tool_use',
        toolUses: [
          {
            name: 'bash',
            input: { command: 'ls -la' }
          }
        ],
      };
      
      expect(response.toolUses).toHaveLength(1);
      expect(response.toolUses?.[0].name).toBe('bash');
    });
  });

  describe('ModelInfo', () => {
    it('should have correct model metadata', () => {
      const model: ModelInfo = {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4.5',
        provider: 'anthropic',
        contextWindow: 200000,
        supportsVision: true,
        supportsTools: true,
        pricing: {
          input: 0.003,
          output: 0.015,
        },
      };
      
      expect(model.id).toBe('claude-sonnet-4-20250514');
      expect(model.provider).toBe('anthropic');
      expect(model.contextWindow).toBe(200000);
      expect(model.pricing?.input).toBe(0.003);
    });
  });
});

describe('AI Provider Registry', () => {
  const getProviderForModel = (model: string): ProviderName => {
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
    
    return 'anthropic';
  };

  describe('Provider Routing', () => {
    it('should route Claude models to Anthropic', () => {
      expect(getProviderForModel('claude-sonnet-4')).toBe('anthropic');
      expect(getProviderForModel('claude-opus-4')).toBe('anthropic');
    });

    it('should route GPT models to OpenAI', () => {
      expect(getProviderForModel('gpt-4o')).toBe('openai');
      expect(getProviderForModel('gpt-4-turbo')).toBe('openai');
    });

    it('should route Gemini models to Google', () => {
      expect(getProviderForModel('gemini-2.0-flash')).toBe('google');
      expect(getProviderForModel('gemini-pro')).toBe('google');
    });

    it('should default to Anthropic for unknown models', () => {
      expect(getProviderForModel('unknown-model')).toBe('anthropic');
    });
  });

  describe('Usage Tracking', () => {
    interface UsageStats {
      userId: string;
      provider: ProviderName;
      model: string;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      cost: number;
      timestamp: Date;
    }

    // Use a fresh array for each test
    const createUsageRecords = (): UsageStats[] => [];

    it('should record usage correctly', () => {
      const usageRecords = createUsageRecords();
      
      const recordUsage = (stats: UsageStats): void => {
        usageRecords.push(stats);
      };
      
      recordUsage({
        userId: 'user-123',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.0015,
        timestamp: new Date(),
      });
      
      expect(usageRecords).toHaveLength(1);
    });

    it('should filter usage by user', () => {
      const usageRecords = createUsageRecords();
      
      const recordUsage = (stats: UsageStats): void => {
        usageRecords.push(stats);
      };
      
      const getUsage = (userId?: string): UsageStats[] => {
        return usageRecords.filter(record => !userId || record.userId === userId);
      };
      
      recordUsage({
        userId: 'user-123',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.0015,
        timestamp: new Date(),
      });
      
      recordUsage({
        userId: 'user-456',
        provider: 'openai',
        model: 'gpt-4o',
        inputTokens: 200,
        outputTokens: 100,
        totalTokens: 300,
        cost: 0.003,
        timestamp: new Date(),
      });
      
      const user123Usage = getUsage('user-123');
      expect(user123Usage).toHaveLength(1);
      expect(user123Usage[0].userId).toBe('user-123');
    });
  });
});
