import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '8080', 10),
  env: process.env.NODE_ENV || 'development',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-in-production',
  jwtExpiry: process.env.JWT_EXPIRY || '24h',
  
  // Service URLs
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:8081',
    task: process.env.TASK_SERVICE_URL || 'http://localhost:8082',
    ai: process.env.AI_SERVICE_URL || 'http://localhost:8083',
    browser: process.env.BROWSER_SERVICE_URL || 'http://localhost:8084',
    storage: process.env.STORAGE_SERVICE_URL || 'http://localhost:8085',
    mcp: process.env.MCP_SERVICE_URL || 'http://localhost:8086',
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  
  // WebSocket
  ws: {
    pingInterval: parseInt(process.env.WS_PING_INTERVAL || '30000', 10),
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '10000', 10),
  },
  
  // OpenTelemetry
  otel: {
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
    serviceName: 'api-gateway',
  },
};
