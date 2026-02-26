import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { taskRouter } from './routes/task';
import { getDb, closeDb } from './services/database';
import { closeRedis } from './services/redis';

async function main() {
  const app = express();
  
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  
  // Routes
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'task-service' });
  });
  
  app.use('/tasks', taskRouter);
  
  const server = app.listen(config.port, () => {
    console.log(`Task service listening on port ${config.port}`);
  });
  
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down...');
    server.close();
    await closeDb();
    await closeRedis();
    process.exit(0);
  });
  
  // Test database
  try {
    const db = getDb();
    await db.raw('SELECT 1');
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

main().catch((error) => {
  console.error('Failed to start task service:', error);
  process.exit(1);
});
