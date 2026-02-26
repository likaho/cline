import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { browserRouter } from './routes/browser';
import { browserPool } from './services/pool';

async function main() {
  const app = express();
  
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '50mb' })); // Large limit for screenshots
  
  // Routes
  app.get('/health', (req, res) => {
    const stats = browserPool.getStats();
    res.json({
      status: 'healthy',
      service: 'browser-service',
      pool: stats,
    });
  });
  
  app.use('/browser', browserRouter);
  
  const server = app.listen(config.port, () => {
    console.log(`Browser service listening on port ${config.port}`);
  });
  
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down...');
    server.close();
    await browserPool.cleanup();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down...');
    server.close();
    await browserPool.cleanup();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Failed to start browser service:', error);
  process.exit(1);
});
