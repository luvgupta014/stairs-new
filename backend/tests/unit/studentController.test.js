/**
 * Unit Tests: Student Controller
 * Tests for student-specific operations and business logic
 */

const studentController = require('../../src/controllers/studentController');
const { PrismaClient } = require('@prisma/client');
const { generateUID } = require('../../src/utils/uidGenerator');

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../../src/utils/uidGenerator');

describe('Student Controller - Unit Tests', () => {
  let mockPrisma;
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeEach(() => {
    // Mock Prisma client
    mockPrisma = {
      student: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      },
      eventRegistration: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn()
      },
      certificate: {
        findMany: jest.fn()
      }
    };
    
    PrismaClient.mockImplementation(() => mockPrisma);
    
    // Mock request, response, next
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user123', role: 'STUDENT' },
      file: null
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });
  
  describe('Create Student Profile', () => {
    
    test('should create student profile successfully', async () => {
      const studentData = {
        userId: 'user123',
        dateOfBirth: '2000-01-15',
        gender: 'MALE',
        schoolName: 'Test School',
        grade: '10',
        emergencyContact: '9876543210',
        medicalInfo: 'None'
      };
      
      mockReq.body = studentData;
      mockReq.user = { id: 'user123', role: 'STUDENT' };
      
      generateUID.mockReturnValue('S0001DL071125');
      
      const mockCreatedStudent = {
        id: 'student123',
        ...studentData,
        uniqueId: 'S0001DL071125'
      };
      
      mockPrisma.student.create.mockResolvedValue(mockCreatedStudent);
      
      await studentController.createProfile(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.student.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user123',
          dateOfBirth: expect.any(Date),
          uniqueId: 'S0001DL071125'
        })
      });
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCreatedStudent
        })
      );
    });
    
    test('should validate required fields', async () => {
      mockReq.body = {
        userId: 'user123'
        // Missing required fields
      };
      
      await studentController.createProfile(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/required/i)
        })
      );
    });
    
    test('should validate date of birth format', async () => {
      mockReq.body = {
        userId: 'user123',
        dateOfBirth: 'invalid-date',
        gender: 'MALE'
      };
      
      await studentController.createProfile(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/date/i)
        })
      );
    });
    
    test('should validate student age (minimum)', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      mockReq.body = {
        userId: 'user123',
        dateOfBirth: futureDate.toISOString(),
        gender: 'MALE'
      };
      
      await studentController.createProfile(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/age/i)
        })
      );
    });
    
    test('should validate student age (maximum)', async () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 50);
      
      mockReq.body = {
        userId: 'user123',
        dateOfBirth: oldDate.toISOString(),
        gender: 'MALE'
      };
      
      await studentController.createProfile(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/age/i)
        })
      );
    });
    
    test('should validate gender enum', async () => {
      mockReq.body = {
        userId: 'user123',
        dateOfBirth: '2000-01-15',
        gender: 'INVALID_GENDER'
      };
      
      await studentController.createProfile(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/gender/i)
        })
      );
    });
    
    test('should prevent duplicate student profiles', async () => {
      mockReq.body = {
        userId: 'user123',
        dateOfBirth: '2000-01-15',
        gender: 'MALE'
      };
      
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'existing123',
        userId: 'user123'
      });
      
      await studentController.createProfile(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/already exists/i)
        })
      );
    });
  });
  
  describe('Get Student Profile', () => {
    
    test('should get student profile by ID', async () => {
      mockReq.params.id = 'student123';
      
      const mockStudent = {
        id: 'student123',
        userId: 'user123',
        dateOfBirth: new Date('2000-01-15'),
        gender: 'MALE',
        schoolName: 'Test School'
      };
      
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      
      await studentController.getProfile(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.student.findUnique).toHaveBeenCalledWith({
        where: { id: 'student123' },
        include: expect.any(Object)
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockStudent
        })
      );
    });
    
    test('should handle non-existent student', async () => {
      mockReq.params.id = 'nonexistent';
      
      mockPrisma.student.findUnique.mockResolvedValue(null);
      
      await studentController.getProfile(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/not found/i),
          statusCode: 404
        })
      );
    });
    
    test('should get own profile for authenticated student', async () => {
      mockReq.user = { id: 'user123', role: 'STUDENT' };
      
      const mockStudent = {
        id: 'student123',
        userId: 'user123',
        dateOfBirth: new Date('2000-01-15')
      };
      
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      
      await studentController.getOwnProfile(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.student.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        include: expect.any(Object)
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockStudent
        })
      );
    });
  });
  
  describe('Update Student Profile', () => {
    
    test('should update student profile successfully', async () => {
      mockReq.params.id = 'student123';
      mockReq.body = {
        schoolName: 'New School',
        grade: '11',
        emergencyContact: '9999999999'
      };
      
      const mockUpdatedStudent = {
        id: 'student123',
        userId: 'user123',
        schoolName: 'New School',
        grade: '11',
        emergencyContact: '9999999999'
      };
      
      mockPrisma.student.update.mockResolvedValue(mockUpdatedStudent);
      
      await studentController.updateProfile(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.student.update).toHaveBeenCalledWith({
        where: { id: 'student123' },
        data: mockReq.body
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUpdatedStudent
        })
      );
    });
    
    test('should prevent updating immutable fields', async () => {
      mockReq.params.id = 'student123';
      mockReq.body = {
        userId: 'different_user', // Immutable
        uniqueId: 'S9999DL071125', // Immutable
        schoolName: 'New School'
      };
      
      await studentController.updateProfile(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.student.update).toHaveBeenCalledWith({
        where: { id: 'student123' },
        data: expect.not.objectContaining({
          userId: expect.anything(),
          uniqueId: expect.anything()
        })
      });
    });
    
    test('should validate authorization for update', async () => {
      mockReq.params.id = 'student123';
      mockReq.user = { id: 'different_user', role: 'STUDENT' };
      
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'student123',
        userId: 'user123' // Different from requester
      });
      
      await studentController.updateProfile(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/not authorized/i),
          statusCode: 403
        })
      );
    });
  });
  
  describe('Delete Student Profile', () => {
    
    test('should delete student profile successfully', async () => {
      mockReq.params.id = 'student123';
      mockReq.user = { id: 'admin123', role: 'ADMIN' };
      
      mockPrisma.student.delete.mockResolvedValue({
        id: 'student123'
      });
      
      await studentController.deleteProfile(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.student.delete).toHaveBeenCalledWith({
        where: { id: 'student123' }
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/deleted/i)
        })
      );
    });
    
    test('should only allow admins to delete profiles', async () => {
      mockReq.params.id = 'student123';
      mockReq.user = { id: 'user123', role: 'STUDENT' };
      
      await studentController.deleteProfile(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/not authorized/i),
          statusCode: 403
        })
      );
    });
  });
  
  describe('Event Registration', () => {
    
    test('should register student for event', async () => {
      mockReq.body = {
        studentId: 'student123',
        eventId: 'event456'
      };
      
      mockPrisma.eventRegistration.findUnique.mockResolvedValue(null);
      
      const mockRegistration = {
        id: 'reg123',
        studentId: 'student123',
        eventId: 'event456',
        registrationDate: new Date(),
        status: 'PENDING'
      };
      
      mockPrisma.eventRegistration.create.mockResolvedValue(mockRegistration);
      
      await studentController.registerForEvent(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.eventRegistration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          studentId: 'student123',
          eventId: 'event456',
          status: 'PENDING'
        })
      });
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockRegistration
        })
      );
    });
    
    test('should prevent duplicate event registrations', async () => {
      mockReq.body = {
        studentId: 'student123',
        eventId: 'event456'
      };
      
      mockPrisma.eventRegistration.findUnique.mockResolvedValue({
        id: 'existing_reg',
        studentId: 'student123',
        eventId: 'event456'
      });
      
      await studentController.registerForEvent(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/already registered/i),
          statusCode: 400
        })
      );
    });
    
    test('should check event capacity before registration', async () => {
      mockReq.body = {
        studentId: 'student123',
        eventId: 'event456'
      };
      
      mockPrisma.eventRegistration.findUnique.mockResolvedValue(null);
      mockPrisma.eventRegistration.count.mockResolvedValue(100);
      
      // Mock event with max capacity
      mockPrisma.event = {
        findUnique: jest.fn().mockResolvedValue({
          id: 'event456',
          maxParticipants: 100
        })
      };
      
      await studentController.registerForEvent(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/full|capacity/i),
          statusCode: 400
        })
      );
    });
    
    test('should get student event registrations', async () => {
      mockReq.params.studentId = 'student123';
      
      const mockRegistrations = [
        {
          id: 'reg1',
          eventId: 'event1',
          status: 'CONFIRMED',
          event: { name: 'Event 1' }
        },
        {
          id: 'reg2',
          eventId: 'event2',
          status: 'PENDING',
          event: { name: 'Event 2' }
        }
      ];
      
      mockPrisma.eventRegistration.findMany.mockResolvedValue(mockRegistrations);
      
      await studentController.getEventRegistrations(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.eventRegistration.findMany).toHaveBeenCalledWith({
        where: { studentId: 'student123' },
        include: { event: true }
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockRegistrations
        })
      );
    });
    
    test('should cancel event registration', async () => {
      mockReq.params.registrationId = 'reg123';
      
      mockPrisma.eventRegistration.update.mockResolvedValue({
        id: 'reg123',
        status: 'CANCELLED'
      });
      
      await studentController.cancelEventRegistration(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.eventRegistration.update).toHaveBeenCalledWith({
        where: { id: 'reg123' },
        data: { status: 'CANCELLED' }
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/cancelled/i)
        })
      );
    });
  });
  
  describe('Certificates', () => {
    
    test('should get student certificates', async () => {
      mockReq.params.studentId = 'student123';
      
      const mockCertificates = [
        {
          id: 'cert1',
          uniqueId: 'STAIRS-CERT-001',
          eventName: 'Tournament 1',
          issuedDate: new Date()
        },
        {
          id: 'cert2',
          uniqueId: 'STAIRS-CERT-002',
          eventName: 'Tournament 2',
          issuedDate: new Date()
        }
      ];
      
      mockPrisma.certificate.findMany.mockResolvedValue(mockCertificates);
      
      await studentController.getCertificates(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.certificate.findMany).toHaveBeenCalledWith({
        where: { studentId: 'student123' },
        orderBy: { issuedDate: 'desc' }
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCertificates
        })
      );
    });
    
    test('should filter certificates by date range', async () => {
      mockReq.params.studentId = 'student123';
      mockReq.query = {
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };
      
      await studentController.getCertificates(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.certificate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            studentId: 'student123',
            issuedDate: {
              gte: expect.any(Date),
              lte: expect.any(Date)
            }
          }
        })
      );
    });
  });
  
  describe('Search and Filter', () => {
    
    test('should search students by name', async () => {
      mockReq.query = { search: 'John' };
      
      const mockStudents = [
        { id: 'student1', user: { name: 'John Doe' } },
        { id: 'student2', user: { name: 'Johnny Smith' } }
      ];
      
      mockPrisma.student.findMany.mockResolvedValue(mockStudents);
      
      await studentController.searchStudents(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user: {
              name: {
                contains: 'John',
                mode: 'insensitive'
              }
            }
          }
        })
      );
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockStudents
        })
      );
    });
    
    test('should filter students by school', async () => {
      mockReq.query = { school: 'Test School' };
      
      await studentController.searchStudents(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            schoolName: {
              contains: 'Test School',
              mode: 'insensitive'
            }
          }
        })
      );
    });
    
    test('should filter students by grade', async () => {
      mockReq.query = { grade: '10' };
      
      await studentController.searchStudents(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            grade: '10'
          }
        })
      );
    });
    
    test('should support pagination', async () => {
      mockReq.query = {
        page: '2',
        limit: '20'
      };
      
      await studentController.searchStudents(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20
        })
      );
    });
  });
  
  describe('Statistics', () => {
    
    test('should get student statistics', async () => {
      mockReq.params.studentId = 'student123';
      
      mockPrisma.eventRegistration.count.mockResolvedValue(5);
      mockPrisma.certificate.count.mockResolvedValue(3);
      
      await studentController.getStatistics(mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            totalEvents: 5,
            totalCertificates: 3
          }
        })
      );
    });
  });
  
  describe('Error Handling', () => {
    
    test('should handle database errors gracefully', async () => {
      mockReq.params.id = 'student123';
      
      mockPrisma.student.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );
      
      await studentController.getProfile(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/database|error/i)
        })
      );
    });
    
    test('should validate input sanitization', async () => {
      mockReq.body = {
        schoolName: '<script>alert("xss")</script>',
        grade: '10'
      };
      
      await studentController.updateProfile(mockReq, mockRes, mockNext);
      
      // Should sanitize HTML tags
      expect(mockPrisma.student.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolName: expect.not.stringMatching(/<script>/i)
          })
        })
      );
    });
  });
});
