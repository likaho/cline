import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { healthCheck } from './middleware/healthCheck';
import { metricsMiddleware } from './middleware/metrics';
import { authMiddleware } from './middleware/auth';
import { authRouter } from './routes/auth';
import { taskRouter } from './routes/task';
import { aiRouter } from './routes/ai';
import { browserRouter } from './routes/browser';
import { storageRouter } from './routes/storage';
import { mcpRouter } from './routes/mcp';
import { websocketHandler } from './websocket/handler';

export async function createApp(): Promise<Express> {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors(config.cors));
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });
  app.use(limiter);

  // Metrics middleware
  app.use(metricsMiddleware);

  // OpenTelemetry
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || crypto.randomUUID();
    next();
  });

  // Health check (no auth required)
  app.get('/health', healthCheck);
  app.get('/ready', healthCheck);

  // API Routes
  app.use('/api/v1/auth', authRouter);
  
  // Protected routes
  app.use('/api/v1/tasks', authMiddleware, taskRouter);
  app.use('/api/v1/ai', authMiddleware, aiRouter);
  app.use('/api/v1/browser', authMiddleware, browserRouter);
  app.use('/api/v1/storage', authMiddleware, storageRouter);
  app.use('/api/v1/mcp', authMiddleware, mcpRouter);

  // WebSocket endpoint for real-time communication
  app.use('/ws', authMiddleware, websocketHandler);

  // Error handling
  app.use(errorHandler);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  logger.info('Express app configured');

  return app;
}
