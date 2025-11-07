/**
 * Unit Tests: Authentication Middleware
 * Tests for JWT authentication and user verification
 */

const authMiddleware = require('../../src/middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

jest.mock('jsonwebtoken');
jest.mock('@prisma/client');

describe('Authentication Middleware - Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let mockPrisma;
  
  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn()
      }
    };
    
    PrismaClient.mockImplementation(() => mockPrisma);
    
    mockReq = {
      headers: {},
      cookies: {},
      user: null
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });
  
  describe('Authenticate Request', () => {
    
    test('should authenticate valid token from Authorization header', async () => {
      const token = 'valid.jwt.token';
      const decoded = {
        id: 'user123',
        email: 'user@example.com',
        role: 'STUDENT'
      };
      
      mockReq.headers.authorization = `Bearer ${token}`;
      
      jwt.verify.mockReturnValue(decoded);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user123',
        email: 'user@example.com',
        role: 'STUDENT'
      });
      
      await authMiddleware.authenticate(mockReq, mockRes, mockNext);
      
      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(mockReq.user).toEqual(decoded);
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    test('should authenticate valid token from cookies', async () => {
      const token = 'valid.jwt.token';
      const decoded = {
        id: 'user123',
        email: 'user@example.com',
        role: 'STUDENT'
      };
      
      mockReq.cookies.token = token;
      
      jwt.verify.mockReturnValue(decoded);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user123',
        email: 'user@example.com'
      });
      
      await authMiddleware.authenticate(mockReq, mockRes, mockNext);
      
      expect(mockReq.user).toEqual(decoded);
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    test('should reject request without token', async () => {
      await authMiddleware.authenticate(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/token.*required|not authenticated/i)
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    test('should reject invalid token', async () => {
      mockReq.headers.authorization = 'Bearer invalid.token';
      
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      await authMiddleware.authenticate(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/invalid.*token/i)
        })
      );
    });
    
    test('should reject expired token', async () => {
      mockReq.headers.authorization = 'Bearer expired.token';
      
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });
      
      await authMiddleware.authenticate(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/expired/i)
        })
      );
    });
    
    test('should reject malformed authorization header', async () => {
      mockReq.headers.authorization = 'InvalidFormat token';
      
      await authMiddleware.authenticate(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/token.*format|invalid/i)
        })
      );
    });
    
    test('should verify user exists in database', async () => {
      const token = 'valid.jwt.token';
      const decoded = { id: 'user123', email: 'user@example.com' };
      
      mockReq.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decoded);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      await authMiddleware.authenticate(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/user.*not found/i)
        })
      );
    });
    
    test('should handle database errors gracefully', async () => {
      const token = 'valid.jwt.token';
      mockReq.headers.authorization = `Bearer ${token}`;
      
      jwt.verify.mockReturnValue({ id: 'user123' });
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));
      
      await authMiddleware.authenticate(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/error/i)
        })
      );
    });
  });
  
  describe('Optional Authentication', () => {
    
    test('should proceed without error if token is absent', async () => {
      await authMiddleware.optionalAuthenticate(mockReq, mockRes, mockNext);
      
      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
    
    test('should authenticate if valid token provided', async () => {
      const token = 'valid.jwt.token';
      const decoded = { id: 'user123', email: 'user@example.com' };
      
      mockReq.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decoded);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user123'
      });
      
      await authMiddleware.optionalAuthenticate(mockReq, mockRes, mockNext);
      
      expect(mockReq.user).toEqual(decoded);
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    test('should proceed even if token is invalid', async () => {
      mockReq.headers.authorization = 'Bearer invalid.token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      await authMiddleware.optionalAuthenticate(mockReq, mockRes, mockNext);
      
      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
  
  describe('Token Refresh', () => {
    
    test('should refresh valid token', async () => {
      const oldToken = 'old.jwt.token';
      const newToken = 'new.jwt.token';
      const decoded = { id: 'user123', email: 'user@example.com' };
      
      mockReq.headers.authorization = `Bearer ${oldToken}`;
      jwt.verify.mockReturnValue(decoded);
      jwt.sign.mockReturnValue(newToken);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user123'
      });
      
      await authMiddleware.refreshToken(mockReq, mockRes, mockNext);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user123',
          email: 'user@example.com'
        }),
        process.env.JWT_SECRET,
        expect.any(Object)
      );
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: newToken
        })
      );
    });
    
    test('should reject refresh without token', async () => {
      await authMiddleware.refreshToken(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });
  
  describe('Token Generation', () => {
    
    test('should generate token with user data', () => {
      const userData = {
        id: 'user123',
        email: 'user@example.com',
        role: 'STUDENT'
      };
      
      const token = 'generated.jwt.token';
      jwt.sign.mockReturnValue(token);
      
      const result = authMiddleware.generateToken(userData);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        userData,
        process.env.JWT_SECRET,
        expect.objectContaining({
          expiresIn: expect.any(String)
        })
      );
      
      expect(result).toBe(token);
    });
    
    test('should set appropriate token expiration', () => {
      const userData = { id: 'user123' };
      jwt.sign.mockReturnValue('token');
      
      authMiddleware.generateToken(userData);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          expiresIn: '7d' // or whatever your expiry is
        })
      );
    });
  });
  
  describe('Token Validation', () => {
    
    test('should validate token structure', () => {
      const validToken = 'header.payload.signature';
      
      expect(authMiddleware.isValidTokenFormat(validToken)).toBe(true);
    });
    
    test('should reject invalid token structure', () => {
      const invalidTokens = [
        'notavalidtoken',
        'only.two.parts',
        '',
        null,
        undefined
      ];
      
      invalidTokens.forEach(token => {
        expect(authMiddleware.isValidTokenFormat(token)).toBe(false);
      });
    });
  });
  
  describe('Logout', () => {
    
    test('should clear authentication token', async () => {
      mockReq.user = { id: 'user123' };
      
      await authMiddleware.logout(mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/logout|success/i)
        })
      );
    });
    
    test('should handle logout without authentication', async () => {
      await authMiddleware.logout(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });
  
  describe('Security Headers', () => {
    
    test('should extract token safely from various sources', () => {
      const scenarios = [
        {
          req: { headers: { authorization: 'Bearer token123' } },
          expected: 'token123'
        },
        {
          req: { cookies: { token: 'cookie_token' } },
          expected: 'cookie_token'
        },
        {
          req: { headers: {}, cookies: {} },
          expected: null
        }
      ];
      
      scenarios.forEach(({ req, expected }) => {
        const token = authMiddleware.extractToken(req);
        expect(token).toBe(expected);
      });
    });
    
    test('should prioritize Authorization header over cookie', () => {
      mockReq.headers.authorization = 'Bearer header_token';
      mockReq.cookies.token = 'cookie_token';
      
      const token = authMiddleware.extractToken(mockReq);
      
      expect(token).toBe('header_token');
    });
  });
  
  describe('Rate Limiting Integration', () => {
    
    test('should track authentication attempts per user', async () => {
      const token = 'valid.jwt.token';
      const decoded = { id: 'user123', email: 'user@example.com' };
      
      mockReq.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decoded);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user123' });
      
      await authMiddleware.authenticate(mockReq, mockRes, mockNext);
      
      // Verify user info is attached for rate limiting
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe('user123');
    });
  });
  
  describe('Error Messages', () => {
    
    test('should not leak sensitive information in error messages', async () => {
      mockReq.headers.authorization = 'Bearer invalid.token';
      
      jwt.verify.mockImplementation(() => {
        throw new Error('JWT secret mismatch: expected abc123...');
      });
      
      await authMiddleware.authenticate(mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.not.stringMatching(/secret|abc123/)
        })
      );
    });
  });
});
