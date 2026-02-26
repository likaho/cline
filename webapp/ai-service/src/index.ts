import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { aiRouter } from './routes/ai';
import { initializeProviders } from './providers/registry';

async function main() {
  const app = express();
  
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  
  // Initialize providers
  initializeProviders();
  
  // Routes
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'ai-service' });
  });
  
  app.use('/ai', aiRouter);
  
  const server = app.listen(config.port, () => {
    console.log(`AI service listening on port ${config.port}`);
  });
  
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Failed to start AI service:', error);
  process.exit(1);
});
