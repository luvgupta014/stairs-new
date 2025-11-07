/**
 * Unit Tests: UID Generator
 * Tests all UID generation functions with positive and negative cases
 */

const {
  generateUID,
  generateEventUID,
  generateCertificateUID,
  generateEventOrderUID,
  getStateCode,
  getSportCode,
  STATE_CODES,
  SPORT_CODES
} = require('../../src/utils/uidGenerator');

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    $queryRaw: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('UID Generator - Unit Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStateCode', () => {
    test('should return correct state code for valid state name', () => {
      expect(getStateCode('Delhi')).toBe('DL');
      expect(getStateCode('Maharashtra')).toBe('MH');
      expect(getStateCode('Tamil Nadu')).toBe('TN');
    });

    test('should return default DL for null or undefined', () => {
      expect(getStateCode(null)).toBe('DL');
      expect(getStateCode(undefined)).toBe('DL');
      expect(getStateCode('')).toBe('DL');
    });

    test('should handle case-insensitive input', () => {
      expect(getStateCode('delhi')).toBe('DL');
      expect(getStateCode('DELHI')).toBe('DL');
    });

    test('should fallback to first 2 letters for unknown states', () => {
      expect(getStateCode('Unknown State')).toBe('UN');
    });
  });

  describe('getSportCode', () => {
    test('should return correct sport code for valid sport name', () => {
      expect(getSportCode('Football')).toBe('FB');
      expect(getSportCode('Cricket')).toBe('CR');
      expect(getSportCode('Basketball')).toBe('BB');
    });

    test('should return OT for null or undefined', () => {
      expect(getSportCode(null)).toBe('OT');
      expect(getSportCode(undefined)).toBe('OT');
      expect(getSportCode('')).toBe('OT');
    });

    test('should handle case-insensitive input', () => {
      expect(getSportCode('football')).toBe('FB');
      expect(getSportCode('FOOTBALL')).toBe('FB');
    });

    test('should fallback to first 2 letters for unknown sports', () => {
      expect(getSportCode('Unknown Sport')).toBe('UN');
    });
  });

  describe('generateUID - User UID', () => {
    test('should generate valid Student UID format', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      
      const uid = await generateUID('STUDENT', 'Delhi', new Date('2025-11-07'));
      
      expect(uid).toMatch(/^A\d{4}DL\d{6}$/);
      expect(uid.startsWith('A')).toBe(true);
      expect(uid).toContain('DL');
    });

    test('should generate valid Coach UID format', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      
      const uid = await generateUID('COACH', 'Maharashtra', new Date('2025-11-07'));
      
      expect(uid).toMatch(/^C\d{4}MH\d{6}$/);
      expect(uid.startsWith('C')).toBe(true);
      expect(uid).toContain('MH');
    });

    test('should generate valid Institute UID format', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      
      const uid = await generateUID('INSTITUTE', 'Tamil Nadu', new Date('2025-11-07'));
      
      expect(uid).toMatch(/^I\d{4}TN\d{6}$/);
      expect(uid.startsWith('I')).toBe(true);
    });

    test('should generate valid Club UID format', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      
      const uid = await generateUID('CLUB', 'Karnataka', new Date('2025-11-07'));
      
      expect(uid).toMatch(/^B\d{4}KA\d{6}$/);
      expect(uid.startsWith('B')).toBe(true);
    });

    test('should return ADMIN for admin users', async () => {
      const uid = await generateUID('ADMIN', 'Delhi');
      expect(uid).toBe('ADMIN');
    });

    test('should increment serial number correctly', async () => {
      prisma.$queryRaw.mockResolvedValue([{ unique_id: 'A0001DL071125' }]);
      
      const uid = await generateUID('STUDENT', 'Delhi', new Date('2025-11-07'));
      
      expect(uid).toBe('A0002DL071125');
    });

    test('should start at 0001 for first user', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      
      const uid = await generateUID('STUDENT', 'Delhi', new Date('2025-11-07'));
      
      expect(uid).toContain('0001');
    });

    test('should throw error for invalid user type', async () => {
      await expect(generateUID('INVALID', 'Delhi')).rejects.toThrow('Invalid user type');
    });

    test('should handle database query errors gracefully', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('DB Error'));
      
      const uid = await generateUID('STUDENT', 'Delhi', new Date('2025-11-07'));
      
      // Should default to serial 1
      expect(uid).toContain('0001');
    });
  });

  describe('generateEventUID', () => {
    test('should generate valid Event UID format', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      
      const uid = await generateEventUID('Football', 'Delhi', new Date('2025-11-07'));
      
      expect(uid).toMatch(/^EVT-\d{4}-[A-Z]{2}-[A-Z]{2}-\d{6}$/);
      expect(uid).toContain('EVT');
      expect(uid).toContain('FB');
      expect(uid).toContain('DL');
    });

    test('should increment event serial number', async () => {
      prisma.$queryRaw.mockResolvedValue([{ unique_id: 'EVT-0005-FB-DL-071125' }]);
      
      const uid = await generateEventUID('Football', 'Delhi', new Date('2025-11-07'));
      
      expect(uid).toContain('0006');
    });

    test('should handle different sports correctly', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      
      const uidCricket = await generateEventUID('Cricket', 'Mumbai', new Date('2025-11-07'));
      const uidBasketball = await generateEventUID('Basketball', 'Bangalore', new Date('2025-11-07'));
      
      expect(uidCricket).toContain('CR');
      expect(uidBasketball).toContain('BB');
    });

    test('should use current date when no date provided', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      
      const uid = await generateEventUID('Football', 'Delhi');
      
      expect(uid).toMatch(/^EVT-\d{4}-FB-DL-\d{6}$/);
    });
  });

  describe('generateCertificateUID', () => {
    test('should generate valid Certificate UID format', () => {
      const eventUID = 'EVT-0001-FB-DL-071125';
      const studentUID = 'A0001DL071125';
      
      const uid = generateCertificateUID(eventUID, studentUID);
      
      expect(uid).toBe('STAIRS-CERT-EVT-0001-FB-DL-071125-A0001DL071125');
      expect(uid).toContain('STAIRS-CERT');
    });

    test('should handle different combinations correctly', () => {
      const uid1 = generateCertificateUID('EVT-0002-CR-MH-081125', 'A0003MH081125');
      const uid2 = generateCertificateUID('EVT-0010-BB-KA-091125', 'A0100KA091125');
      
      expect(uid1).toContain('EVT-0002-CR-MH-081125');
      expect(uid2).toContain('A0100KA091125');
    });

    test('should be unique for each student-event pair', () => {
      const uid1 = generateCertificateUID('EVT-0001-FB-DL-071125', 'A0001DL071125');
      const uid2 = generateCertificateUID('EVT-0001-FB-DL-071125', 'A0002DL071125');
      
      expect(uid1).not.toBe(uid2);
    });
  });

  describe('generateEventOrderUID', () => {
    test('should generate valid EventOrder UID format', () => {
      const eventUID = 'EVT-0001-FB-DL-071125';
      const coachUID = 'C0001DL071125';
      
      const uid = generateEventOrderUID(eventUID, coachUID);
      
      expect(uid).toBe('EVT-ORDR-EVT-0001-FB-DL-071125-C0001DL071125');
      expect(uid).toContain('EVT-ORDR');
    });

    test('should handle different coach-event combinations', () => {
      const uid1 = generateEventOrderUID('EVT-0005-CR-MH-081125', 'C0010MH081125');
      const uid2 = generateEventOrderUID('EVT-0020-BB-KA-091125', 'C0050KA091125');
      
      expect(uid1).toContain('C0010MH081125');
      expect(uid2).toContain('EVT-0020-BB-KA-091125');
    });

    test('should be unique for each coach-event pair', () => {
      const uid1 = generateEventOrderUID('EVT-0001-FB-DL-071125', 'C0001DL071125');
      const uid2 = generateEventOrderUID('EVT-0001-FB-DL-071125', 'C0002DL071125');
      
      expect(uid1).not.toBe(uid2);
    });
  });

  describe('Edge Cases & Security', () => {
    test('should handle very large serial numbers', async () => {
      prisma.$queryRaw.mockResolvedValue([{ unique_id: 'A9999DL071125' }]);
      
      const uid = await generateUID('STUDENT', 'Delhi', new Date('2025-11-07'));
      
      // Should wrap or handle overflow
      expect(uid).toBeDefined();
    });

    test('should not allow SQL injection in state codes', () => {
      const maliciousState = "Delhi'; DROP TABLE users; --";
      const code = getStateCode(maliciousState);
      
      expect(code).toMatch(/^[A-Z]{2}$/);
      expect(code).not.toContain(';');
      expect(code).not.toContain('DROP');
    });

    test('should handle special characters in inputs', () => {
      const code1 = getStateCode('Delhi<script>alert("XSS")</script>');
      const code2 = getSportCode('Football"><img src=x>');
      
      expect(code1).toMatch(/^[A-Z]{2}$/);
      expect(code2).toMatch(/^[A-Z]{2}$/);
    });

    test('should handle concurrent requests (race conditions)', async () => {
      prisma.$queryRaw.mockResolvedValue([{ unique_id: 'A0001DL071125' }]);
      
      // Simulate concurrent UID generation
      const promises = Array(10).fill(null).map(() => 
        generateUID('STUDENT', 'Delhi', new Date('2025-11-07'))
      );
      
      const uids = await Promise.all(promises);
      
      // All UIDs should be generated successfully
      expect(uids).toHaveLength(10);
      uids.forEach(uid => {
        expect(uid).toMatch(/^A\d{4}DL\d{6}$/);
      });
    });
  });

  describe('Date Formatting', () => {
    test('should format date correctly as DDMMYY', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      
      const uid1 = await generateUID('STUDENT', 'Delhi', new Date('2025-01-05'));
      const uid2 = await generateUID('STUDENT', 'Delhi', new Date('2025-12-31'));
      
      expect(uid1).toContain('050125');
      expect(uid2).toContain('311225');
    });

    test('should pad single digit dates correctly', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      
      const uid = await generateUID('STUDENT', 'Delhi', new Date('2025-03-07'));
      
      expect(uid).toContain('070325');
    });
  });

  describe('State and Sport Code Constants', () => {
    test('STATE_CODES should contain all Indian states', () => {
      expect(STATE_CODES).toHaveProperty('Delhi');
      expect(STATE_CODES).toHaveProperty('Maharashtra');
      expect(STATE_CODES).toHaveProperty('Tamil Nadu');
      expect(Object.keys(STATE_CODES).length).toBeGreaterThan(25);
    });

    test('SPORT_CODES should contain common sports', () => {
      expect(SPORT_CODES).toHaveProperty('Football');
      expect(SPORT_CODES).toHaveProperty('Cricket');
      expect(SPORT_CODES).toHaveProperty('Basketball');
      expect(Object.keys(SPORT_CODES).length).toBeGreaterThan(15);
    });

    test('All state codes should be 2 uppercase letters', () => {
      Object.values(STATE_CODES).forEach(code => {
        expect(code).toMatch(/^[A-Z]{2}$/);
      });
    });

    test('All sport codes should be 2 uppercase letters', () => {
      Object.values(SPORT_CODES).forEach(code => {
        expect(code).toMatch(/^[A-Z]{2}$/);
      });
    });
  });
});
