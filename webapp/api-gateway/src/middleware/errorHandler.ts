import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  logger.error(`Error: ${message}`, {
    statusCode,
    path: req.path,
    method: req.method,
    error: err.stack,
  });

  res.status(statusCode).json({
    error: message,
    code: err.code,
    requestId: req.headers['x-request-id'],
  });
}
