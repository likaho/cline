import { Request, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../auth';
import { signJwt } from '../utils/jwt';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  const testSecret = 'test-secret';

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
    it('should return 401 if no authorization header', () => {
      authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'No token provided',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token format', () => {
      mockRequest.headers = { authorization: 'InvalidFormat token' };

      authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };

      authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next() for valid token and attach user to request', () => {
      const token = signJwt({ userId: '123', email: 'test@example.com' }, testSecret, { expiresIn: '1h' });
      mockRequest.headers = { authorization: `Bearer ${token}` };

      authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as any).user).toBeDefined();
      expect((mockRequest as any).user.userId).toBe('123');
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should call next() without token', () => {
      optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should attach user for valid token', () => {
      const token = signJwt({ userId: '123', email: 'test@example.com' }, testSecret, { expiresIn: '1h' });
      mockRequest.headers = { authorization: `Bearer ${token}` };

      optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as any).user).toBeDefined();
    });

    it('should call next() for invalid token (not fail)', () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };

      optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as any).user).toBeUndefined();
    });
  });
});
