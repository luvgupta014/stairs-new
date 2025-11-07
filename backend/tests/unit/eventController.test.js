/**
 * Unit Tests: Event Controller
 * Tests for event management operations
 */

const eventController = require('../../src/controllers/eventController');
const { PrismaClient } = require('@prisma/client');
const { generateEventUID } = require('../../src/utils/uidGenerator');

jest.mock('@prisma/client');
jest.mock('../../src/utils/uidGenerator');

describe('Event Controller - Unit Tests', () => {
  let mockPrisma;
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeEach(() => {
    mockPrisma = {
      event: {
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
        count: jest.fn(),
        update: jest.fn()
      },
      eventOrder: {
        create: jest.fn(),
        findMany: jest.fn()
      }
    };
    
    PrismaClient.mockImplementation(() => mockPrisma);
    
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user123', role: 'ADMIN' },
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
  
  describe('Create Event', () => {
    
    test('should create event successfully', async () => {
      const eventData = {
        name: 'Football Tournament',
        description: 'Inter-school tournament',
        sport: 'FOOTBALL',
        category: 'TOURNAMENT',
        startDate: '2025-02-01',
        endDate: '2025-02-05',
        venue: 'Sports Complex',
        city: 'Delhi',
        state: 'DL',
        registrationFee: 500,
        maxParticipants: 100
      };
      
      mockReq.body = eventData;
      generateEventUID.mockReturnValue('EVT-0001-FB-DL-010225');
      
      const mockEvent = {
        id: 'event123',
        ...eventData,
        uniqueId: 'EVT-0001-FB-DL-010225',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-02-05')
      };
      
      mockPrisma.event.create.mockResolvedValue(mockEvent);
      
      await eventController.createEvent(mockReq, mockRes, mockNext);
      
      expect(generateEventUID).toHaveBeenCalledWith(
        expect.any(Number),
        'FOOTBALL',
        'DL',
        expect.any(Date)
      );
      
      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Football Tournament',
          uniqueId: 'EVT-0001-FB-DL-010225'
        })
      });
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockEvent
        })
      );
    });
    
    test('should validate required fields', async () => {
      mockReq.body = {
        name: 'Tournament'
        // Missing required fields
      };
      
      await eventController.createEvent(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/required/i)
        })
      );
    });
    
    test('should validate date range', async () => {
      mockReq.body = {
        name: 'Tournament',
        sport: 'FOOTBALL',
        startDate: '2025-02-05',
        endDate: '2025-02-01' // End before start
      };
      
      await eventController.createEvent(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/date|range/i)
        })
      );
    });
    
    test('should validate registration fee', async () => {
      mockReq.body = {
        name: 'Tournament',
        sport: 'FOOTBALL',
        registrationFee: -100 // Negative fee
      };
      
      await eventController.createEvent(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/fee/i)
        })
      );
    });
    
    test('should validate max participants', async () => {
      mockReq.body = {
        name: 'Tournament',
        sport: 'FOOTBALL',
        maxParticipants: 0 // Invalid
      };
      
      await eventController.createEvent(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/participants/i)
        })
      );
    });
  });
  
  describe('Get Events', () => {
    
    test('should get all events with pagination', async () => {
      mockReq.query = { page: '1', limit: '10' };
      
      const mockEvents = [
        { id: 'event1', name: 'Tournament 1' },
        { id: 'event2', name: 'Tournament 2' }
      ];
      
      mockPrisma.event.findMany.mockResolvedValue(mockEvents);
      mockPrisma.event.count.mockResolvedValue(25);
      
      await eventController.getAllEvents(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { startDate: 'desc' }
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockEvents,
          pagination: expect.objectContaining({
            total: 25,
            page: 1,
            limit: 10
          })
        })
      );
    });
    
    test('should get event by ID', async () => {
      mockReq.params.id = 'event123';
      
      const mockEvent = {
        id: 'event123',
        name: 'Football Tournament',
        sport: 'FOOTBALL'
      };
      
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      
      await eventController.getEventById(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
        where: { id: 'event123' },
        include: expect.any(Object)
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockEvent
        })
      );
    });
    
    test('should handle non-existent event', async () => {
      mockReq.params.id = 'nonexistent';
      
      mockPrisma.event.findUnique.mockResolvedValue(null);
      
      await eventController.getEventById(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/not found/i),
          statusCode: 404
        })
      );
    });
  });
  
  describe('Search and Filter Events', () => {
    
    test('should filter events by sport', async () => {
      mockReq.query = { sport: 'FOOTBALL' };
      
      await eventController.searchEvents(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            sport: 'FOOTBALL'
          }
        })
      );
    });
    
    test('should filter events by date range', async () => {
      mockReq.query = {
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      };
      
      await eventController.searchEvents(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            startDate: {
              gte: expect.any(Date)
            },
            endDate: {
              lte: expect.any(Date)
            }
          }
        })
      );
    });
    
    test('should filter events by city and state', async () => {
      mockReq.query = {
        city: 'Delhi',
        state: 'DL'
      };
      
      await eventController.searchEvents(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            city: 'Delhi',
            state: 'DL'
          }
        })
      );
    });
    
    test('should filter by registration status', async () => {
      mockReq.query = { status: 'OPEN' };
      
      await eventController.searchEvents(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            registrationOpen: true
          }
        })
      );
    });
    
    test('should search events by name', async () => {
      mockReq.query = { search: 'Football' };
      
      await eventController.searchEvents(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'Football', mode: 'insensitive' } },
              { description: { contains: 'Football', mode: 'insensitive' } }
            ]
          }
        })
      );
    });
  });
  
  describe('Update Event', () => {
    
    test('should update event successfully', async () => {
      mockReq.params.id = 'event123';
      mockReq.body = {
        name: 'Updated Tournament Name',
        venue: 'New Venue'
      };
      
      const mockUpdatedEvent = {
        id: 'event123',
        name: 'Updated Tournament Name',
        venue: 'New Venue'
      };
      
      mockPrisma.event.update.mockResolvedValue(mockUpdatedEvent);
      
      await eventController.updateEvent(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event123' },
        data: mockReq.body
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUpdatedEvent
        })
      );
    });
    
    test('should prevent updating immutable fields', async () => {
      mockReq.params.id = 'event123';
      mockReq.body = {
        uniqueId: 'FAKE-UID',
        name: 'Updated Name'
      };
      
      await eventController.updateEvent(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.event.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            uniqueId: expect.anything()
          })
        })
      );
    });
  });
  
  describe('Delete Event', () => {
    
    test('should delete event successfully', async () => {
      mockReq.params.id = 'event123';
      mockReq.user = { id: 'admin123', role: 'ADMIN' };
      
      mockPrisma.event.delete.mockResolvedValue({ id: 'event123' });
      
      await eventController.deleteEvent(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.event.delete).toHaveBeenCalledWith({
        where: { id: 'event123' }
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/deleted/i)
        })
      );
    });
    
    test('should only allow admins to delete events', async () => {
      mockReq.params.id = 'event123';
      mockReq.user = { id: 'user123', role: 'STUDENT' };
      
      await eventController.deleteEvent(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/not authorized/i),
          statusCode: 403
        })
      );
    });
    
    test('should prevent deleting event with registrations', async () => {
      mockReq.params.id = 'event123';
      mockReq.user = { id: 'admin123', role: 'ADMIN' };
      
      mockPrisma.eventRegistration.count.mockResolvedValue(10);
      
      await eventController.deleteEvent(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/has registrations/i),
          statusCode: 400
        })
      );
    });
  });
  
  describe('Event Registrations', () => {
    
    test('should get event participants', async () => {
      mockReq.params.eventId = 'event123';
      
      const mockRegistrations = [
        { id: 'reg1', student: { user: { name: 'Student 1' } }, status: 'CONFIRMED' },
        { id: 'reg2', student: { user: { name: 'Student 2' } }, status: 'CONFIRMED' }
      ];
      
      mockPrisma.eventRegistration.findMany.mockResolvedValue(mockRegistrations);
      
      await eventController.getEventParticipants(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.eventRegistration.findMany).toHaveBeenCalledWith({
        where: { eventId: 'event123' },
        include: { student: { include: { user: true } } }
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockRegistrations
        })
      );
    });
    
    test('should check event capacity', async () => {
      mockReq.params.eventId = 'event123';
      
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'event123',
        maxParticipants: 100
      });
      
      mockPrisma.eventRegistration.count.mockResolvedValue(75);
      
      await eventController.checkEventCapacity(mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            maxParticipants: 100,
            currentParticipants: 75,
            availableSlots: 25,
            isFull: false
          }
        })
      );
    });
    
    test('should indicate when event is full', async () => {
      mockReq.params.eventId = 'event123';
      
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'event123',
        maxParticipants: 50
      });
      
      mockPrisma.eventRegistration.count.mockResolvedValue(50);
      
      await eventController.checkEventCapacity(mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isFull: true,
            availableSlots: 0
          })
        })
      );
    });
  });
  
  describe('Event Orders and Payments', () => {
    
    test('should create event order', async () => {
      mockReq.body = {
        eventId: 'event123',
        userId: 'user123',
        amount: 500
      };
      
      const mockOrder = {
        id: 'order123',
        eventId: 'event123',
        userId: 'user123',
        amount: 500,
        status: 'PENDING'
      };
      
      mockPrisma.eventOrder.create.mockResolvedValue(mockOrder);
      
      await eventController.createEventOrder(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.eventOrder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventId: 'event123',
          userId: 'user123',
          amount: 500
        })
      });
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
    
    test('should get event orders', async () => {
      mockReq.params.eventId = 'event123';
      
      const mockOrders = [
        { id: 'order1', amount: 500, status: 'PAID' },
        { id: 'order2', amount: 500, status: 'PENDING' }
      ];
      
      mockPrisma.eventOrder.findMany.mockResolvedValue(mockOrders);
      
      await eventController.getEventOrders(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.eventOrder.findMany).toHaveBeenCalledWith({
        where: { eventId: 'event123' }
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockOrders
        })
      );
    });
  });
  
  describe('Event Statistics', () => {
    
    test('should get event statistics', async () => {
      mockReq.params.eventId = 'event123';
      
      mockPrisma.eventRegistration.count.mockResolvedValue(50);
      mockPrisma.eventOrder.findMany.mockResolvedValue([
        { amount: 500, status: 'PAID' },
        { amount: 500, status: 'PAID' },
        { amount: 500, status: 'PENDING' }
      ]);
      
      await eventController.getEventStatistics(mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            totalRegistrations: 50,
            totalOrders: 3,
            totalRevenue: expect.any(Number)
          }
        })
      );
    });
  });
  
  describe('Upload Event Results', () => {
    
    test('should upload event results file', async () => {
      mockReq.params.eventId = 'event123';
      mockReq.file = {
        filename: 'results.csv',
        path: '/uploads/event-results/results.csv'
      };
      
      mockPrisma.event.update.mockResolvedValue({
        id: 'event123',
        resultFileUrl: '/uploads/event-results/results.csv'
      });
      
      await eventController.uploadResults(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event123' },
        data: {
          resultFileUrl: expect.stringContaining('results.csv')
        }
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/uploaded/i)
        })
      );
    });
    
    test('should validate file type for results upload', async () => {
      mockReq.params.eventId = 'event123';
      mockReq.file = {
        filename: 'results.exe',
        mimetype: 'application/x-msdownload'
      };
      
      await eventController.uploadResults(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/file type/i)
        })
      );
    });
  });
  
  describe('Error Handling', () => {
    
    test('should handle database errors', async () => {
      mockReq.params.id = 'event123';
      
      mockPrisma.event.findUnique.mockRejectedValue(
        new Error('Database error')
      );
      
      await eventController.getEventById(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/error/i)
        })
      );
    });
  });
});
