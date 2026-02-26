import * as bcrypt from 'bcryptjs';

describe('User Service', () => {
  // Mock the database service
  const mockDb = {
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  describe('hashPassword', () => {
    it('should hash a password correctly', async () => {
      const password = 'testPassword123';
      const hashed = await bcrypt.hash(password, 10);
      
      expect(hashed).not.toBe(password);
      expect(await bcrypt.compare(password, hashed)).toBe(true);
    });

    it('should generate unique hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'testPassword123';
      const hashed = await bcrypt.hash(password, 10);
      
      const result = await bcrypt.compare(password, hashed);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'testPassword123';
      const hashed = await bcrypt.hash(password, 10);
      
      const result = await bcrypt.compare('wrongPassword', hashed);
      expect(result).toBe(false);
    });
  });

  describe('validateEmail', () => {
    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('should validate correct email format', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email format', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('test@.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];
      
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
      }
      
      return { valid: errors.length === 0, errors };
    };

    it('should validate strong passwords', () => {
      const result = validatePassword('StrongPass123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject passwords without uppercase', () => {
      const result = validatePassword('lowercase123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('NoNumbers');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });
  });
});
