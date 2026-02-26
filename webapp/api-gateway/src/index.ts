import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { metricsServer } from './services/metrics';

async function main() {
  const app = await createApp();
  
  // Start metrics server for Prometheus
  metricsServer.start();
  
  const server = app.listen(config.port, () => {
    logger.info(`API Gateway listening on port ${config.port}`);
    logger.info(`Health check: http://localhost:${config.port}/health`);
    logger.info(`Metrics: http://localhost:${config.port}/metrics`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

main().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
