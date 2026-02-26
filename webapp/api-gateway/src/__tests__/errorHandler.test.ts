import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      path: '/test',
      method: 'GET',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  it('should handle Error and return 500', () => {
    const error = new Error('Test error');

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      message: 'Test error',
    });
  });

  it('should handle custom error with status code', () => {
    const error = new Error('Not Found') as Error & { statusCode: number };
    error.statusCode = 404;

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Not Found',
      message: 'Not Found',
    });
  });

  it('should handle Zod validation error', () => {
    const error = new Error('Validation failed') as Error & { statusCode: number };
    error.statusCode = 400;
    error.name = 'ZodError';

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
  });

  it('should not expose stack trace in production', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Test error');

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
    });
    process.env.NODE_ENV = 'development';
  });
});
