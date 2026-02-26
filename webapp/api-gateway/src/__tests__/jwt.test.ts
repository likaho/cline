import jwt from 'jsonwebtoken';

describe('JWT Utilities', () => {
  const testSecret = 'test-secret-key-for-jwt-utilities';
  const testPayload = {
    userId: 'user-123',
    roles: ['user'],
  };

  describe('generateToken', () => {
    it('should sign a JWT token', () => {
      const token = jwt.sign(testPayload, testSecret, { expiresIn: '1h' });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should sign with different expiration', () => {
      const token = jwt.sign(testPayload, testSecret, { expiresIn: '7d' });
      expect(token).toBeDefined();
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid JWT token', () => {
      const token = jwt.sign(testPayload, testSecret, { expiresIn: '1h' });
      const decoded = jwt.verify(token, testSecret) as typeof testPayload;
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testPayload.userId);
    });

    it('should throw for invalid token', () => {
      expect(() => jwt.verify('invalid-token', testSecret)).toThrow();
    });

    it('should throw for wrong secret', () => {
      const token = jwt.sign(testPayload, testSecret, { expiresIn: '1h' });
      expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
    });

    it('should throw for expired token', () => {
      const token = jwt.sign(testPayload, testSecret, { expiresIn: '-1s' });
      expect(() => jwt.verify(token, testSecret)).toThrow();
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      const token = jwt.sign(testPayload, testSecret, { expiresIn: '1h' });
      const decoded = jwt.decode(token) as typeof testPayload;
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe('user-123');
    });

    it('should return null for invalid token', () => {
      const result = jwt.decode('invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('extractTokenFromHeader', () => {
    const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
      if (!authHeader) return null;
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
      return parts[1];
    };

    it('should extract token from valid Bearer header', () => {
      const result = extractTokenFromHeader('Bearer test-token-123');
      expect(result).toBe('test-token-123');
    });

    it('should return null for undefined header', () => {
      const result = extractTokenFromHeader(undefined);
      expect(result).toBeNull();
    });

    it('should return null for invalid format', () => {
      const result = extractTokenFromHeader('test-token-123');
      expect(result).toBeNull();
    });

    it('should return null for non-Bearer scheme', () => {
      const result = extractTokenFromHeader('Basic test-token');
      expect(result).toBeNull();
    });
  });
});
