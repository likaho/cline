import express from 'express';
import { registry } from '../services/metrics';
import { config } from '../config';

class MetricsServer {
  private app: express.Application;
  private server: ReturnType<typeof express.listen> | null = null;

  constructor() {
    this.app = express();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.get('/metrics', async (req, res) => {
      try {
        res.set('Content-Type', registry.contentType);
        res.end(await registry.metrics());
      } catch (error) {
        res.status(500).end('Error collecting metrics');
      }
    });

    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy' });
    });
  }

  start(): void {
    const port = parseInt(process.env.METRICS_PORT || '9090', 10);
    this.server = this.app.listen(port, () => {
      console.log(`Metrics server listening on port ${port}`);
    });
  }

  stop(): void {
    if (this.server) {
      this.server.close();
    }
  }
}

export const metricsServer = new MetricsServer();
