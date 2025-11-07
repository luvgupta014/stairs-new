/**
 * Unit Tests: Role-Based Authorization Middleware
 * Tests for access control and permission checking
 */

const roleMiddleware = require('../../src/middleware/roleMiddleware');

describe('Role-Based Authorization Middleware - Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeEach(() => {
    mockReq = {
      user: null,
      params: {},
      body: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });
  
  describe('Require Role', () => {
    
    test('should allow user with correct role', () => {
      mockReq.user = {
        id: 'user123',
        role: 'ADMIN'
      };
      
      const middleware = roleMiddleware.requireRole('ADMIN');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
    
    test('should reject user with incorrect role', () => {
      mockReq.user = {
        id: 'user123',
        role: 'STUDENT'
      };
      
      const middleware = roleMiddleware.requireRole('ADMIN');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/not authorized|permission denied/i)
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    test('should reject unauthenticated users', () => {
      mockReq.user = null;
      
      const middleware = roleMiddleware.requireRole('ADMIN');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/not authenticated/i)
        })
      );
    });
    
    test('should handle role case-insensitivity', () => {
      mockReq.user = {
        id: 'user123',
        role: 'admin' // lowercase
      };
      
      const middleware = roleMiddleware.requireRole('ADMIN');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
  
  describe('Require Any Role', () => {
    
    test('should allow user with any of the specified roles', () => {
      mockReq.user = {
        id: 'user123',
        role: 'COACH'
      };
      
      const middleware = roleMiddleware.requireAnyRole(['ADMIN', 'COACH', 'INSTITUTE']);
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    test('should reject user without any of the specified roles', () => {
      mockReq.user = {
        id: 'user123',
        role: 'STUDENT'
      };
      
      const middleware = roleMiddleware.requireAnyRole(['ADMIN', 'COACH']);
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    test('should accept empty roles array as public access', () => {
      mockReq.user = {
        id: 'user123',
        role: 'STUDENT'
      };
      
      const middleware = roleMiddleware.requireAnyRole([]);
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
  
  describe('Role Hierarchy', () => {
    
    test('should respect role hierarchy - admin can access all', () => {
      mockReq.user = {
        id: 'admin123',
        role: 'ADMIN'
      };
      
      const studentMiddleware = roleMiddleware.requireRole('STUDENT');
      const coachMiddleware = roleMiddleware.requireRole('COACH');
      
      studentMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      
      mockNext.mockClear();
      coachMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
    
    test('should enforce hierarchy - student cannot access coach resources', () => {
      mockReq.user = {
        id: 'student123',
        role: 'STUDENT'
      };
      
      const middleware = roleMiddleware.requireMinimumRole('COACH');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
  
  describe('Resource Ownership', () => {
    
    test('should allow user to access own resources', () => {
      mockReq.user = {
        id: 'user123',
        role: 'STUDENT'
      };
      mockReq.params.userId = 'user123';
      
      const middleware = roleMiddleware.requireOwnershipOrRole(['ADMIN']);
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    test('should allow admin to access any resources', () => {
      mockReq.user = {
        id: 'admin123',
        role: 'ADMIN'
      };
      mockReq.params.userId = 'different_user';
      
      const middleware = roleMiddleware.requireOwnershipOrRole(['ADMIN']);
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    test('should reject non-owner without required role', () => {
      mockReq.user = {
        id: 'user123',
        role: 'STUDENT'
      };
      mockReq.params.userId = 'different_user';
      
      const middleware = roleMiddleware.requireOwnershipOrRole(['ADMIN']);
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    test('should check ownership in body fields', () => {
      mockReq.user = {
        id: 'user123',
        role: 'STUDENT'
      };
      mockReq.body.userId = 'user123';
      
      const middleware = roleMiddleware.requireOwnershipOrRole(['ADMIN'], 'body');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
  
  describe('Permission Checks', () => {
    
    test('should check specific permissions', () => {
      mockReq.user = {
        id: 'user123',
        role: 'COACH',
        permissions: ['CREATE_EVENT', 'EDIT_EVENT', 'VIEW_STUDENTS']
      };
      
      const middleware = roleMiddleware.requirePermission('CREATE_EVENT');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    test('should reject users without specific permission', () => {
      mockReq.user = {
        id: 'user123',
        role: 'COACH',
        permissions: ['VIEW_EVENTS']
      };
      
      const middleware = roleMiddleware.requirePermission('DELETE_EVENT');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/permission/i)
        })
      );
    });
    
    test('should handle missing permissions array', () => {
      mockReq.user = {
        id: 'user123',
        role: 'STUDENT'
        // No permissions array
      };
      
      const middleware = roleMiddleware.requirePermission('VIEW_PROFILE');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });
  
  describe('Special Access Patterns', () => {
    
    test('should allow coach to access their own events', () => {
      mockReq.user = {
        id: 'user123',
        role: 'COACH',
        coachId: 'coach123'
      };
      mockReq.params.coachId = 'coach123';
      
      const middleware = roleMiddleware.requireCoachOwnership();
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    test('should allow institute to manage their students', () => {
      mockReq.user = {
        id: 'user123',
        role: 'INSTITUTE',
        instituteId: 'inst123'
      };
      mockReq.params.instituteId = 'inst123';
      
      const middleware = roleMiddleware.requireInstituteOwnership();
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    test('should allow club to manage their members', () => {
      mockReq.user = {
        id: 'user123',
        role: 'CLUB',
        clubId: 'club123'
      };
      mockReq.params.clubId = 'club123';
      
      const middleware = roleMiddleware.requireClubOwnership();
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
  
  describe('Combined Authorization', () => {
    
    test('should support multiple authorization conditions (AND)', () => {
      mockReq.user = {
        id: 'user123',
        role: 'ADMIN',
        permissions: ['MANAGE_USERS']
      };
      
      const middleware = roleMiddleware.requireAll([
        roleMiddleware.requireRole('ADMIN'),
        roleMiddleware.requirePermission('MANAGE_USERS')
      ]);
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    test('should support multiple authorization conditions (OR)', () => {
      mockReq.user = {
        id: 'user123',
        role: 'COACH'
      };
      
      const middleware = roleMiddleware.requireAny([
        roleMiddleware.requireRole('ADMIN'),
        roleMiddleware.requireRole('COACH')
      ]);
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
  
  describe('Role Validation', () => {
    
    test('should validate role exists in system', () => {
      mockReq.user = {
        id: 'user123',
        role: 'INVALID_ROLE'
      };
      
      const middleware = roleMiddleware.requireRole('ADMIN');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
    
    test('should accept all valid system roles', () => {
      const validRoles = ['ADMIN', 'STUDENT', 'COACH', 'INSTITUTE', 'CLUB'];
      
      validRoles.forEach(role => {
        mockReq.user = { id: 'user123', role };
        mockNext.mockClear();
        mockRes.status.mockClear();
        
        const middleware = roleMiddleware.requireRole(role);
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalledWith();
      });
    });
  });
  
  describe('Access Logging', () => {
    
    test('should log unauthorized access attempts', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockReq.user = {
        id: 'user123',
        role: 'STUDENT'
      };
      
      const middleware = roleMiddleware.requireRole('ADMIN');
      middleware(mockReq, mockRes, mockNext);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/unauthorized.*access/i)
      );
      
      consoleSpy.mockRestore();
    });
    
    test('should log successful admin access', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockReq.user = {
        id: 'admin123',
        role: 'ADMIN'
      };
      
      const middleware = roleMiddleware.requireRole('ADMIN');
      middleware(mockReq, mockRes, mockNext);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/admin.*access/i)
      );
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('Dynamic Role Assignment', () => {
    
    test('should handle users with multiple roles', () => {
      mockReq.user = {
        id: 'user123',
        roles: ['STUDENT', 'COACH'] // Multiple roles
      };
      
      const middleware = roleMiddleware.requireAnyRole(['COACH', 'INSTITUTE']);
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    test('should prioritize primary role', () => {
      mockReq.user = {
        id: 'user123',
        role: 'ADMIN', // Primary role
        roles: ['STUDENT', 'COACH'] // Secondary roles
      };
      
      const middleware = roleMiddleware.requireRole('ADMIN');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
  
  describe('Temporary Role Elevation', () => {
    
    test('should allow temporary elevated permissions', () => {
      mockReq.user = {
        id: 'user123',
        role: 'STUDENT',
        temporaryRole: 'COACH',
        temporaryRoleExpiry: Date.now() + 3600000 // 1 hour from now
      };
      
      const middleware = roleMiddleware.requireRole('COACH', { allowTemporary: true });
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    test('should reject expired temporary roles', () => {
      mockReq.user = {
        id: 'user123',
        role: 'STUDENT',
        temporaryRole: 'COACH',
        temporaryRoleExpiry: Date.now() - 1000 // Expired
      };
      
      const middleware = roleMiddleware.requireRole('COACH', { allowTemporary: true });
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });
  
  describe('Error Handling', () => {
    
    test('should handle missing role field gracefully', () => {
      mockReq.user = {
        id: 'user123'
        // Missing role field
      };
      
      const middleware = roleMiddleware.requireRole('ADMIN');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String)
        })
      );
    });
    
    test('should handle null user object', () => {
      mockReq.user = null;
      
      const middleware = roleMiddleware.requireRole('ADMIN');
      
      expect(() => middleware(mockReq, mockRes, mockNext)).not.toThrow();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });
  
  describe('Custom Error Messages', () => {
    
    test('should use custom error message when provided', () => {
      mockReq.user = {
        id: 'user123',
        role: 'STUDENT'
      };
      
      const customMessage = 'Only administrators can perform this action';
      const middleware = roleMiddleware.requireRole('ADMIN', { message: customMessage });
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: customMessage
        })
      );
    });
  });
});
