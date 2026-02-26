import { signJwt, verifyJwt, extractTokenFromHeader } from '../jwt';

describe('JWT Utilities', () => {
  const testSecret = 'test-secret-key-for-jwt-utilities';
  const testPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    roles: ['user'],
  };

  describe('signJwt', () => {
    it('should sign a JWT token', () => {
      const token = signJwt(testPayload, testSecret, { expiresIn: '1h' });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should sign with default expiration', () => {
      const token = signJwt(testPayload, testSecret);
      expect(token).toBeDefined();
    });
  });

  describe('verifyJwt', () => {
    it('should verify a valid JWT token', () => {
      const token = signJwt(testPayload, testSecret, { expiresIn: '1h' });
      const decoded = verifyJwt(token, testSecret);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
    });

    it('should return null for invalid token', () => {
      const result = verifyJwt('invalid-token', testSecret);
      expect(result).toBeNull();
    });

    it('should return null for token with wrong secret', () => {
      const token = signJwt(testPayload, testSecret, { expiresIn: '1h' });
      const result = verifyJwt(token, 'wrong-secret');
      expect(result).toBeNull();
    });

    it('should return null for expired token', () => {
      const token = signJwt(testPayload, testSecret, { expiresIn: '-1s' });
      const result = verifyJwt(token, testSecret);
      expect(result).toBeNull();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const result = extractTokenFromHeader('Bearer test-token-123');
      expect(result).toBe('test-token-123');
    });

    it('should return null for invalid format', () => {
      const result = extractTokenFromHeader('test-token-123');
      expect(result).toBeNull();
    });

    it('should return null for empty Authorization header', () => {
      const result = extractTokenFromHeader('');
      expect(result).toBeNull();
    });

    it('should return null for non-Bearer scheme', () => {
      const result = extractTokenFromHeader('Basic test-token');
      expect(result).toBeNull();
    });
  });
});
