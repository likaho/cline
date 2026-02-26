import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { authRouter } from './routes/auth';
import { getDb, closeDb } from './services/database';
import { closeRedis } from './services/redis';

async function main() {
  const app = express();
  
  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'auth-service' });
  });
  
  // Routes
  app.use('/auth', authRouter);
  
  // Start server
  const server = app.listen(config.port, () => {
    console.log(`Auth service listening on port ${config.port}`);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down...');
    server.close();
    await closeDb();
    await closeRedis();
    process.exit(0);
  });
  
  // Test database connection
  try {
    const db = getDb();
    await db.raw('SELECT 1');
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

main().catch((error) => {
  console.error('Failed to start auth service:', error);
  process.exit(1);
});
