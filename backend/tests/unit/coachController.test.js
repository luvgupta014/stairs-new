/**
 * Unit Tests: Coach Controller
 * Tests for coach-specific operations and business logic
 */

const coachController = require('../../src/controllers/coachController');
const { PrismaClient } = require('@prisma/client');
const { generateUID } = require('../../src/utils/uidGenerator');

jest.mock('@prisma/client');
jest.mock('../../src/utils/uidGenerator');

describe('Coach Controller - Unit Tests', () => {
  let mockPrisma;
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeEach(() => {
    mockPrisma = {
      coach: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      },
      event: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      student: {
        findMany: jest.fn()
      }
    };
    
    PrismaClient.mockImplementation(() => mockPrisma);
    
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user123', role: 'COACH' },
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
  
  describe('Create Coach Profile', () => {
    
    test('should create coach profile successfully', async () => {
      const coachData = {
        userId: 'user123',
        specialization: 'FOOTBALL',
        experience: 5,
        certifications: ['Level 1', 'Level 2'],
        organizationName: 'Sports Academy',
        organizationType: 'ACADEMY'
      };
      
      mockReq.body = coachData;
      generateUID.mockReturnValue('C0001DL071125');
      
      const mockCreatedCoach = {
        id: 'coach123',
        ...coachData,
        uniqueId: 'C0001DL071125'
      };
      
      mockPrisma.coach.create.mockResolvedValue(mockCreatedCoach);
      
      await coachController.createProfile(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.coach.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user123',
          specialization: 'FOOTBALL',
          uniqueId: 'C0001DL071125'
        })
      });
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCreatedCoach
        })
      );
    });
    
    test('should validate specialization enum', async () => {
      mockReq.body = {
        userId: 'user123',
        specialization: 'INVALID_SPORT',
        experience: 5
      };
      
      await coachController.createProfile(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/specialization/i)
        })
      );
    });
    
    test('should validate experience years', async () => {
      mockReq.body = {
        userId: 'user123',
        specialization: 'FOOTBALL',
        experience: -1
      };
      
      await coachController.createProfile(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/experience/i)
        })
      );
    });
    
    test('should validate organization type', async () => {
      mockReq.body = {
        userId: 'user123',
        specialization: 'FOOTBALL',
        organizationType: 'INVALID_TYPE'
      };
      
      await coachController.createProfile(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/organization.*type/i)
        })
      );
    });
    
    test('should prevent duplicate coach profiles', async () => {
      mockReq.body = {
        userId: 'user123',
        specialization: 'FOOTBALL',
        experience: 5
      };
      
      mockPrisma.coach.findUnique.mockResolvedValue({
        id: 'existing123',
        userId: 'user123'
      });
      
      await coachController.createProfile(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/already exists/i)
        })
      );
    });
  });
  
  describe('Get Coach Profile', () => {
    
    test('should get coach profile by ID', async () => {
      mockReq.params.id = 'coach123';
      
      const mockCoach = {
        id: 'coach123',
        userId: 'user123',
        specialization: 'FOOTBALL',
        experience: 5,
        certifications: ['Level 1']
      };
      
      mockPrisma.coach.findUnique.mockResolvedValue(mockCoach);
      
      await coachController.getProfile(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.coach.findUnique).toHaveBeenCalledWith({
        where: { id: 'coach123' },
        include: expect.any(Object)
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCoach
        })
      );
    });
    
    test('should handle non-existent coach', async () => {
      mockReq.params.id = 'nonexistent';
      
      mockPrisma.coach.findUnique.mockResolvedValue(null);
      
      await coachController.getProfile(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/not found/i),
          statusCode: 404
        })
      );
    });
  });
  
  describe('Update Coach Profile', () => {
    
    test('should update coach profile successfully', async () => {
      mockReq.params.id = 'coach123';
      mockReq.body = {
        experience: 6,
        certifications: ['Level 1', 'Level 2', 'Level 3'],
        bio: 'Experienced football coach'
      };
      
      const mockUpdatedCoach = {
        id: 'coach123',
        userId: 'user123',
        experience: 6,
        certifications: ['Level 1', 'Level 2', 'Level 3'],
        bio: 'Experienced football coach'
      };
      
      mockPrisma.coach.update.mockResolvedValue(mockUpdatedCoach);
      
      await coachController.updateProfile(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.coach.update).toHaveBeenCalledWith({
        where: { id: 'coach123' },
        data: mockReq.body
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUpdatedCoach
        })
      );
    });
    
    test('should validate authorization for update', async () => {
      mockReq.params.id = 'coach123';
      mockReq.user = { id: 'different_user', role: 'COACH' };
      
      mockPrisma.coach.findUnique.mockResolvedValue({
        id: 'coach123',
        userId: 'user123'
      });
      
      await coachController.updateProfile(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/not authorized/i),
          statusCode: 403
        })
      );
    });
  });
  
  describe('Manage Events', () => {
    
    test('should create event as coach', async () => {
      mockReq.body = {
        name: 'Football Tournament',
        description: 'Inter-school tournament',
        sport: 'FOOTBALL',
        startDate: '2025-02-01',
        endDate: '2025-02-05',
        venue: 'Sports Complex'
      };
      mockReq.user = { id: 'user123', role: 'COACH' };
      
      mockPrisma.coach.findUnique.mockResolvedValue({
        id: 'coach123',
        userId: 'user123'
      });
      
      const mockEvent = {
        id: 'event123',
        ...mockReq.body,
        coachId: 'coach123'
      };
      
      mockPrisma.event.create.mockResolvedValue(mockEvent);
      
      await coachController.createEvent(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Football Tournament',
          coachId: 'coach123'
        })
      });
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
    
    test('should get coach-created events', async () => {
      mockReq.params.coachId = 'coach123';
      
      const mockEvents = [
        {
          id: 'event1',
          name: 'Tournament 1',
          sport: 'FOOTBALL',
          coachId: 'coach123'
        },
        {
          id: 'event2',
          name: 'Tournament 2',
          sport: 'BASKETBALL',
          coachId: 'coach123'
        }
      ];
      
      mockPrisma.event.findMany.mockResolvedValue(mockEvents);
      
      await coachController.getCoachEvents(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: { coachId: 'coach123' },
        orderBy: { startDate: 'desc' }
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockEvents
        })
      );
    });
    
    test('should update event as coach', async () => {
      mockReq.params.eventId = 'event123';
      mockReq.body = {
        name: 'Updated Tournament Name',
        venue: 'New Venue'
      };
      
      mockPrisma.event.findUnique = jest.fn().mockResolvedValue({
        id: 'event123',
        coachId: 'coach123'
      });
      
      mockPrisma.coach.findUnique.mockResolvedValue({
        id: 'coach123',
        userId: 'user123'
      });
      
      mockPrisma.event.update.mockResolvedValue({
        id: 'event123',
        name: 'Updated Tournament Name',
        venue: 'New Venue'
      });
      
      await coachController.updateEvent(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event123' },
        data: mockReq.body
      });
    });
    
    test('should not update other coach events', async () => {
      mockReq.params.eventId = 'event123';
      mockReq.user = { id: 'user123', role: 'COACH' };
      
      mockPrisma.event.findUnique = jest.fn().mockResolvedValue({
        id: 'event123',
        coachId: 'different_coach'
      });
      
      mockPrisma.coach.findUnique.mockResolvedValue({
        id: 'coach123',
        userId: 'user123'
      });
      
      await coachController.updateEvent(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/not authorized/i),
          statusCode: 403
        })
      );
    });
  });
  
  describe('Manage Students', () => {
    
    test('should view students registered for coach events', async () => {
      mockReq.params.coachId = 'coach123';
      mockReq.query.eventId = 'event456';
      
      const mockStudents = [
        { id: 'student1', user: { name: 'Student 1' } },
        { id: 'student2', user: { name: 'Student 2' } }
      ];
      
      mockPrisma.student.findMany.mockResolvedValue(mockStudents);
      
      await coachController.getEventStudents(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.student.findMany).toHaveBeenCalledWith({
        where: {
          eventRegistrations: {
            some: {
              eventId: 'event456'
            }
          }
        },
        include: { user: true }
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockStudents
        })
      );
    });
    
    test('should get coach statistics', async () => {
      mockReq.params.coachId = 'coach123';
      
      mockPrisma.event.count.mockResolvedValue(5);
      mockPrisma.student.count.mockResolvedValue(25);
      
      await coachController.getStatistics(mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            totalEvents: 5,
            totalStudents: 25
          }
        })
      );
    });
  });
  
  describe('Search and Filter', () => {
    
    test('should search coaches by specialization', async () => {
      mockReq.query = { specialization: 'FOOTBALL' };
      
      const mockCoaches = [
        { id: 'coach1', specialization: 'FOOTBALL' },
        { id: 'coach2', specialization: 'FOOTBALL' }
      ];
      
      mockPrisma.coach.findMany.mockResolvedValue(mockCoaches);
      
      await coachController.searchCoaches(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.coach.findMany).toHaveBeenCalledWith({
        where: {
          specialization: 'FOOTBALL'
        }
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCoaches
        })
      );
    });
    
    test('should filter by minimum experience', async () => {
      mockReq.query = { minExperience: '5' };
      
      await coachController.searchCoaches(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.coach.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            experience: {
              gte: 5
            }
          }
        })
      );
    });
    
    test('should support pagination', async () => {
      mockReq.query = {
        page: '2',
        limit: '10'
      };
      
      await coachController.searchCoaches(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.coach.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10
        })
      );
    });
  });
  
  describe('Certifications Management', () => {
    
    test('should add certification to coach profile', async () => {
      mockReq.params.coachId = 'coach123';
      mockReq.body = {
        certification: 'Level 3 Coaching License'
      };
      
      const mockCoach = {
        id: 'coach123',
        certifications: ['Level 1', 'Level 2']
      };
      
      mockPrisma.coach.findUnique.mockResolvedValue(mockCoach);
      mockPrisma.coach.update.mockResolvedValue({
        ...mockCoach,
        certifications: [...mockCoach.certifications, 'Level 3 Coaching License']
      });
      
      await coachController.addCertification(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.coach.update).toHaveBeenCalledWith({
        where: { id: 'coach123' },
        data: {
          certifications: expect.arrayContaining(['Level 3 Coaching License'])
        }
      });
    });
    
    test('should remove certification from coach profile', async () => {
      mockReq.params.coachId = 'coach123';
      mockReq.body = {
        certification: 'Level 1'
      };
      
      const mockCoach = {
        id: 'coach123',
        certifications: ['Level 1', 'Level 2', 'Level 3']
      };
      
      mockPrisma.coach.findUnique.mockResolvedValue(mockCoach);
      mockPrisma.coach.update.mockResolvedValue({
        ...mockCoach,
        certifications: ['Level 2', 'Level 3']
      });
      
      await coachController.removeCertification(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.coach.update).toHaveBeenCalledWith({
        where: { id: 'coach123' },
        data: {
          certifications: expect.not.arrayContaining(['Level 1'])
        }
      });
    });
  });
  
  describe('Error Handling', () => {
    
    test('should handle database errors', async () => {
      mockReq.params.id = 'coach123';
      
      mockPrisma.coach.findUnique.mockRejectedValue(
        new Error('Database error')
      );
      
      await coachController.getProfile(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/error/i)
        })
      );
    });
    
    test('should validate input sanitization', async () => {
      mockReq.body = {
        bio: '<script>alert("xss")</script>',
        organizationName: 'Valid Name'
      };
      
      await coachController.updateProfile(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.coach.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bio: expect.not.stringMatching(/<script>/i)
          })
        })
      );
    });
  });
});
