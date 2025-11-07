/**
 * Unit Tests: Certificate Controller
 * Tests for certificate generation and management
 */

const certificateController = require('../../src/controllers/certificateController');
const { PrismaClient } = require('@prisma/client');
const { generateCertificateUID } = require('../../src/utils/uidGenerator');
const fs = require('fs').promises;
const path = require('path');

jest.mock('@prisma/client');
jest.mock('../../src/utils/uidGenerator');
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    readFile: jest.fn(),
    unlink: jest.fn(),
    mkdir: jest.fn()
  }
}));

describe('Certificate Controller - Unit Tests', () => {
  let mockPrisma;
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeEach(() => {
    mockPrisma = {
      certificate: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      },
      student: {
        findUnique: jest.fn()
      },
      event: {
        findUnique: jest.fn()
      }
    };
    
    PrismaClient.mockImplementation(() => mockPrisma);
    
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: 'admin123', role: 'ADMIN' },
      file: null
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      sendFile: jest.fn()
    };
    
    mockNext = jest.fn();
    jest.clearAllMocks();
  });
  
  describe('Generate Certificate', () => {
    
    test('should generate certificate successfully', async () => {
      const certData = {
        studentId: 'student123',
        eventId: 'event456',
        eventName: 'Football Tournament',
        position: '1st Place',
        issuedDate: '2025-01-15'
      };
      
      mockReq.body = certData;
      generateCertificateUID.mockReturnValue('STAIRS-CERT-FB-2025-001');
      
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'student123',
        user: { name: 'John Doe' }
      });
      
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'event456',
        name: 'Football Tournament',
        sport: 'FOOTBALL'
      });
      
      const mockCertificate = {
        id: 'cert123',
        uniqueId: 'STAIRS-CERT-FB-2025-001',
        ...certData,
        issuedDate: new Date('2025-01-15'),
        fileUrl: '/uploads/certificates/STAIRS-CERT-FB-2025-001.pdf'
      };
      
      mockPrisma.certificate.create.mockResolvedValue(mockCertificate);
      
      await certificateController.generateCertificate(mockReq, mockRes, mockNext);
      
      expect(generateCertificateUID).toHaveBeenCalledWith(
        'FOOTBALL',
        2025,
        expect.any(Number)
      );
      
      expect(mockPrisma.certificate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          uniqueId: 'STAIRS-CERT-FB-2025-001',
          studentId: 'student123',
          eventId: 'event456'
        })
      });
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCertificate
        })
      );
    });
    
    test('should validate student exists', async () => {
      mockReq.body = {
        studentId: 'nonexistent',
        eventId: 'event456',
        eventName: 'Tournament'
      };
      
      mockPrisma.student.findUnique.mockResolvedValue(null);
      
      await certificateController.generateCertificate(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/student.*not found/i),
          statusCode: 404
        })
      );
    });
    
    test('should validate event exists', async () => {
      mockReq.body = {
        studentId: 'student123',
        eventId: 'nonexistent',
        eventName: 'Tournament'
      };
      
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'student123'
      });
      
      mockPrisma.event.findUnique.mockResolvedValue(null);
      
      await certificateController.generateCertificate(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/event.*not found/i),
          statusCode: 404
        })
      );
    });
    
    test('should prevent duplicate certificates', async () => {
      mockReq.body = {
        studentId: 'student123',
        eventId: 'event456',
        eventName: 'Tournament'
      };
      
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'student123'
      });
      
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'event456'
      });
      
      mockPrisma.certificate.findUnique = jest.fn().mockResolvedValue({
        id: 'existing_cert',
        studentId: 'student123',
        eventId: 'event456'
      });
      
      await certificateController.generateCertificate(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/already exists/i),
          statusCode: 400
        })
      );
    });
  });
  
  describe('Get Certificate', () => {
    
    test('should get certificate by ID', async () => {
      mockReq.params.id = 'cert123';
      
      const mockCertificate = {
        id: 'cert123',
        uniqueId: 'STAIRS-CERT-FB-2025-001',
        eventName: 'Football Tournament',
        student: { user: { name: 'John Doe' } }
      };
      
      mockPrisma.certificate.findUnique.mockResolvedValue(mockCertificate);
      
      await certificateController.getCertificate(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.certificate.findUnique).toHaveBeenCalledWith({
        where: { id: 'cert123' },
        include: expect.any(Object)
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCertificate
        })
      );
    });
    
    test('should get certificate by unique ID', async () => {
      mockReq.params.uniqueId = 'STAIRS-CERT-FB-2025-001';
      
      const mockCertificate = {
        id: 'cert123',
        uniqueId: 'STAIRS-CERT-FB-2025-001'
      };
      
      mockPrisma.certificate.findUnique.mockResolvedValue(mockCertificate);
      
      await certificateController.getCertificateByUniqueId(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.certificate.findUnique).toHaveBeenCalledWith({
        where: { uniqueId: 'STAIRS-CERT-FB-2025-001' }
      });
    });
    
    test('should handle non-existent certificate', async () => {
      mockReq.params.id = 'nonexistent';
      
      mockPrisma.certificate.findUnique.mockResolvedValue(null);
      
      await certificateController.getCertificate(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/not found/i),
          statusCode: 404
        })
      );
    });
  });
  
  describe('Get Certificates', () => {
    
    test('should get all certificates with pagination', async () => {
      mockReq.query = { page: '1', limit: '20' };
      
      const mockCertificates = [
        { id: 'cert1', uniqueId: 'STAIRS-CERT-FB-2025-001' },
        { id: 'cert2', uniqueId: 'STAIRS-CERT-FB-2025-002' }
      ];
      
      mockPrisma.certificate.findMany.mockResolvedValue(mockCertificates);
      mockPrisma.certificate.count.mockResolvedValue(50);
      
      await certificateController.getAllCertificates(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.certificate.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { issuedDate: 'desc' }
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCertificates,
          pagination: expect.objectContaining({
            total: 50,
            page: 1,
            limit: 20
          })
        })
      );
    });
    
    test('should get certificates by student ID', async () => {
      mockReq.params.studentId = 'student123';
      
      const mockCertificates = [
        { id: 'cert1', studentId: 'student123' },
        { id: 'cert2', studentId: 'student123' }
      ];
      
      mockPrisma.certificate.findMany.mockResolvedValue(mockCertificates);
      
      await certificateController.getStudentCertificates(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.certificate.findMany).toHaveBeenCalledWith({
        where: { studentId: 'student123' },
        orderBy: { issuedDate: 'desc' }
      });
    });
    
    test('should get certificates by event ID', async () => {
      mockReq.params.eventId = 'event456';
      
      const mockCertificates = [
        { id: 'cert1', eventId: 'event456' },
        { id: 'cert2', eventId: 'event456' }
      ];
      
      mockPrisma.certificate.findMany.mockResolvedValue(mockCertificates);
      
      await certificateController.getEventCertificates(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.certificate.findMany).toHaveBeenCalledWith({
        where: { eventId: 'event456' },
        orderBy: { issuedDate: 'desc' }
      });
    });
  });
  
  describe('Download Certificate', () => {
    
    test('should download certificate PDF', async () => {
      mockReq.params.id = 'cert123';
      
      const mockCertificate = {
        id: 'cert123',
        uniqueId: 'STAIRS-CERT-FB-2025-001',
        fileUrl: '/uploads/certificates/STAIRS-CERT-FB-2025-001.pdf'
      };
      
      mockPrisma.certificate.findUnique.mockResolvedValue(mockCertificate);
      
      await certificateController.downloadCertificate(mockReq, mockRes, mockNext);
      
      expect(mockRes.sendFile).toHaveBeenCalled();
    });
    
    test('should handle missing certificate file', async () => {
      mockReq.params.id = 'cert123';
      
      const mockCertificate = {
        id: 'cert123',
        fileUrl: null
      };
      
      mockPrisma.certificate.findUnique.mockResolvedValue(mockCertificate);
      
      await certificateController.downloadCertificate(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/file.*not found/i),
          statusCode: 404
        })
      );
    });
  });
  
  describe('Verify Certificate', () => {
    
    test('should verify valid certificate', async () => {
      mockReq.params.uniqueId = 'STAIRS-CERT-FB-2025-001';
      
      const mockCertificate = {
        id: 'cert123',
        uniqueId: 'STAIRS-CERT-FB-2025-001',
        student: { user: { name: 'John Doe' } },
        event: { name: 'Football Tournament' },
        issuedDate: new Date()
      };
      
      mockPrisma.certificate.findUnique.mockResolvedValue(mockCertificate);
      
      await certificateController.verifyCertificate(mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          valid: true,
          data: expect.objectContaining({
            certificateId: 'STAIRS-CERT-FB-2025-001',
            studentName: 'John Doe',
            eventName: 'Football Tournament'
          })
        })
      );
    });
    
    test('should indicate invalid certificate', async () => {
      mockReq.params.uniqueId = 'INVALID-CERT-ID';
      
      mockPrisma.certificate.findUnique.mockResolvedValue(null);
      
      await certificateController.verifyCertificate(mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          valid: false,
          message: expect.stringMatching(/invalid|not found/i)
        })
      );
    });
  });
  
  describe('Update Certificate', () => {
    
    test('should update certificate details', async () => {
      mockReq.params.id = 'cert123';
      mockReq.body = {
        position: 'Updated Position',
        remarks: 'Updated remarks'
      };
      
      const mockUpdatedCert = {
        id: 'cert123',
        position: 'Updated Position',
        remarks: 'Updated remarks'
      };
      
      mockPrisma.certificate.update.mockResolvedValue(mockUpdatedCert);
      
      await certificateController.updateCertificate(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.certificate.update).toHaveBeenCalledWith({
        where: { id: 'cert123' },
        data: mockReq.body
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUpdatedCert
        })
      );
    });
    
    test('should prevent updating immutable fields', async () => {
      mockReq.params.id = 'cert123';
      mockReq.body = {
        uniqueId: 'FAKE-ID',
        studentId: 'different_student',
        remarks: 'Valid update'
      };
      
      await certificateController.updateCertificate(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.certificate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            uniqueId: expect.anything(),
            studentId: expect.anything()
          })
        })
      );
    });
  });
  
  describe('Delete Certificate', () => {
    
    test('should delete certificate successfully', async () => {
      mockReq.params.id = 'cert123';
      mockReq.user = { id: 'admin123', role: 'ADMIN' };
      
      mockPrisma.certificate.findUnique.mockResolvedValue({
        id: 'cert123',
        fileUrl: '/uploads/certificates/cert123.pdf'
      });
      
      mockPrisma.certificate.delete.mockResolvedValue({ id: 'cert123' });
      
      await certificateController.deleteCertificate(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.certificate.delete).toHaveBeenCalledWith({
        where: { id: 'cert123' }
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/deleted/i)
        })
      );
    });
    
    test('should only allow admins to delete certificates', async () => {
      mockReq.params.id = 'cert123';
      mockReq.user = { id: 'user123', role: 'STUDENT' };
      
      await certificateController.deleteCertificate(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/not authorized/i),
          statusCode: 403
        })
      );
    });
  });
  
  describe('Bulk Certificate Generation', () => {
    
    test('should generate certificates in bulk', async () => {
      mockReq.body = {
        eventId: 'event456',
        certificates: [
          { studentId: 'student1', position: '1st Place' },
          { studentId: 'student2', position: '2nd Place' },
          { studentId: 'student3', position: '3rd Place' }
        ]
      };
      
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'event456',
        name: 'Tournament',
        sport: 'FOOTBALL'
      });
      
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'student1',
        user: { name: 'Student' }
      });
      
      generateCertificateUID.mockReturnValue('STAIRS-CERT-FB-2025-001');
      mockPrisma.certificate.create.mockResolvedValue({
        id: 'cert123',
        uniqueId: 'STAIRS-CERT-FB-2025-001'
      });
      
      await certificateController.generateBulkCertificates(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.certificate.create).toHaveBeenCalledTimes(3);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/3.*certificates/i),
          data: expect.any(Array)
        })
      );
    });
    
    test('should handle partial failures in bulk generation', async () => {
      mockReq.body = {
        eventId: 'event456',
        certificates: [
          { studentId: 'student1', position: '1st' },
          { studentId: 'nonexistent', position: '2nd' }
        ]
      };
      
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'event456',
        sport: 'FOOTBALL'
      });
      
      mockPrisma.student.findUnique
        .mockResolvedValueOnce({ id: 'student1', user: { name: 'Student1' } })
        .mockResolvedValueOnce(null);
      
      generateCertificateUID.mockReturnValue('STAIRS-CERT-FB-2025-001');
      mockPrisma.certificate.create.mockResolvedValue({
        id: 'cert123'
      });
      
      await certificateController.generateBulkCertificates(mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            successful: 1,
            failed: 1
          })
        })
      );
    });
  });
  
  describe('Search and Filter', () => {
    
    test('should search certificates by student name', async () => {
      mockReq.query = { studentName: 'John' };
      
      await certificateController.searchCertificates(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.certificate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            student: {
              user: {
                name: {
                  contains: 'John',
                  mode: 'insensitive'
                }
              }
            }
          }
        })
      );
    });
    
    test('should filter by date range', async () => {
      mockReq.query = {
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      };
      
      await certificateController.searchCertificates(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.certificate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            issuedDate: {
              gte: expect.any(Date),
              lte: expect.any(Date)
            }
          }
        })
      );
    });
    
    test('should filter by sport/event type', async () => {
      mockReq.query = { sport: 'FOOTBALL' };
      
      await certificateController.searchCertificates(mockReq, mockRes, mockNext);
      
      expect(mockPrisma.certificate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            event: {
              sport: 'FOOTBALL'
            }
          }
        })
      );
    });
  });
  
  describe('Statistics', () => {
    
    test('should get certificate statistics', async () => {
      mockPrisma.certificate.count.mockResolvedValue(150);
      mockPrisma.certificate.findMany.mockResolvedValue([
        { event: { sport: 'FOOTBALL' } },
        { event: { sport: 'FOOTBALL' } },
        { event: { sport: 'BASKETBALL' } }
      ]);
      
      await certificateController.getCertificateStatistics(mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            totalCertificates: 150,
            bySport: expect.any(Object)
          }
        })
      );
    });
  });
  
  describe('Error Handling', () => {
    
    test('should handle database errors', async () => {
      mockReq.params.id = 'cert123';
      
      mockPrisma.certificate.findUnique.mockRejectedValue(
        new Error('Database error')
      );
      
      await certificateController.getCertificate(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/error/i)
        })
      );
    });
    
    test('should handle file system errors', async () => {
      mockReq.params.id = 'cert123';
      
      mockPrisma.certificate.findUnique.mockResolvedValue({
        id: 'cert123',
        fileUrl: '/invalid/path.pdf'
      });
      
      mockRes.sendFile.mockImplementation(() => {
        throw new Error('File not found');
      });
      
      await certificateController.downloadCertificate(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/file|error/i)
        })
      );
    });
  });
});
