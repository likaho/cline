import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8083', 10),
  env: process.env.NODE_ENV || 'development',
  
  // Default providers
  providers: {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultModel: process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-sonnet-4-20250514',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o',
    },
    google: {
      apiKey: process.env.GOOGLE_API_KEY,
      defaultModel: process.env.GOOGLE_DEFAULT_MODEL || 'gemini-2.0-flash',
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-sonnet-4',
    },
    bedrock: {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    azure: {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-01',
    },
  },
  
  // Redis for caching
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  // Rate limiting
  rateLimit: {
    maxRequestsPerMinute: parseInt(process.env.RATE_LIMIT || '60', 10),
  },
  
  otel: {
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
    serviceName: 'ai-service',
  },
};
