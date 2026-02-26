import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  // Set environment before importing
  const originalEnv = process.env;
  
  beforeAll(() => {
    process.env = { ...originalEnv, JWT_SECRET: 'test-secret-key-for-jwt-utilities' };
  });
  
  afterAll(() => {
    process.env = originalEnv;
  });

  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;
  const testSecret = 'test-secret-key-for-jwt-utilities';

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  describe('authMiddleware', () => {
    it('should return 401 if no authorization header', async () => {
      // Re-import with fresh module to pick up env
      const { authMiddleware } = require('../middleware/auth');
      
      await authMiddleware(mockRequest as any, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'No token provided',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
