import { signJwt, verifyJwt } from '../utils/jwt';

describe('Auth Service JWT Utilities', () => {
  const testSecret = 'auth-service-test-secret';

  describe('signJwt', () => {
    it('should sign a JWT token with user data', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = signJwt(payload, testSecret, { expiresIn: '1h' });
      
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });

    it('should sign with custom expiration', () => {
      const payload = { userId: '123' };
      const token = signJwt(payload, testSecret, { expiresIn: '7d' });
      
      expect(token).toBeDefined();
    });
  });

  describe('verifyJwt', () => {
    it('should verify a valid token', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = signJwt(payload, testSecret, { expiresIn: '1h' });
      const decoded = verifyJwt(token, testSecret);
      
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe('123');
      expect(decoded?.email).toBe('test@example.com');
    });

    it('should return null for invalid token', () => {
      const result = verifyJwt('invalid.token.here', testSecret);
      expect(result).toBeNull();
    });

    it('should return null for wrong secret', () => {
      const payload = { userId: '123' };
      const token = signJwt(payload, testSecret, { expiresIn: '1h' });
      const result = verifyJwt(token, 'wrong-secret');
      expect(result).toBeNull();
    });

    it('should return null for expired token', () => {
      const payload = { userId: '123' };
      const token = signJwt(payload, testSecret, { expiresIn: '-1s' });
      const result = verifyJwt(token, testSecret);
      expect(result).toBeNull();
    });
  });
});
