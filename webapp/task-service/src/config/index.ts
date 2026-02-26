import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '8082', 10),
  env: process.env.NODE_ENV || 'development',
  
  // Service URLs
  services: {
    ai: process.env.AI_SERVICE_URL || 'http://localhost:8083',
    browser: process.env.BROWSER_SERVICE_URL || 'http://localhost:8084',
    storage: process.env.STORAGE_SERVICE_URL || 'http://localhost:8085',
    mcp: process.env.MCP_SERVICE_URL || 'http://localhost:8086',
  },
  
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'cline_tasks',
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  // Task settings
  task: {
    maxSteps: parseInt(process.env.MAX_TASK_STEPS || '100', 10),
    timeout: parseInt(process.env.TASK_TIMEOUT || '3600000', 10), // 1 hour
    checkpointInterval: parseInt(process.env.CHECKPOINT_INTERVAL || '10', 10),
  },
  
  // OpenTelemetry
  otel: {
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
    serviceName: 'task-service',
  },
};
