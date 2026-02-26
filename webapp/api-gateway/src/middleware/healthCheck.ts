import { Request, Response } from 'express';
import { registry } from '../services/metrics';

export async function healthCheck(req: Request, res: Response): Promise<void> {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'api-gateway',
  };
  
  res.json(health);
}
