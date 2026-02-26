import { Request, Response, NextFunction } from 'express';
import { httpRequestsTotal, httpRequestDuration } from '../services/metrics';
import { logger } from '../utils/logger';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const path = req.route?.path || req.path;
    
    httpRequestsTotal.inc({
      method: req.method,
      path,
      status: res.statusCode,
    });
    
    httpRequestDuration.observe({
      method: req.method,
      path,
      status: res.statusCode,
    }, duration);
    
    logger.debug(`${req.method} ${path} ${res.statusCode} ${duration}s`);
  });
  
  next();
}
