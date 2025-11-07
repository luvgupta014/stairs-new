/**
 * Test Database Helper
 * Manages test database lifecycle and provides utilities
 */

const { PrismaClient } = require('@prisma/client');

let prisma;

/**
 * Initialize test database connection
 */
const initTestDB = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
        }
      }
    });
  }
  return prisma;
};

/**
 * Clean all tables in correct order (respecting foreign keys)
 */
const cleanDatabase = async () => {
  const prisma = initTestDB();
  
  try {
    await prisma.$transaction([
      prisma.notification.deleteMany({}),
      prisma.eventOrder.deleteMany({}),
      prisma.certificate.deleteMany({}),
      prisma.eventResultFile.deleteMany({}),
      prisma.eventPayment.deleteMany({}),
      prisma.payment.deleteMany({}),
      prisma.eventRegistration.deleteMany({}),
      prisma.event.deleteMany({}),
      prisma.clubMember.deleteMany({}),
      prisma.instituteCoach.deleteMany({}),
      prisma.instituteStudent.deleteMany({}),
      prisma.studentCoachConnection.deleteMany({}),
      prisma.admin.deleteMany({}),
      prisma.club.deleteMany({}),
      prisma.institute.deleteMany({}),
      prisma.coach.deleteMany({}),
      prisma.student.deleteMany({}),
      prisma.oTPRecord.deleteMany({}),
      prisma.user.deleteMany({})
    ]);
  } catch (error) {
    console.error('Error cleaning database:', error);
    throw error;
  }
};

/**
 * Disconnect from test database
 */
const disconnectDB = async () => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
};

/**
 * Create test user helper
 */
const createTestUser = async (data) => {
  const prisma = initTestDB();
  const bcrypt = require('bcryptjs');
  
  const defaultData = {
    email: `test${Date.now()}@test.com`,
    phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
    password: await bcrypt.hash('Test@1234', 10),
    role: 'STUDENT',
    isActive: true,
    isVerified: true,
    uniqueId: `A${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}DL${new Date().getDate().toString().padStart(2, '0')}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getFullYear().toString().slice(-2)}`
  };

  return await prisma.user.create({
    data: { ...defaultData, ...data }
  });
};

/**
 * Create test student profile
 */
const createTestStudent = async (userId, data = {}) => {
  const prisma = initTestDB();
  
  const defaultData = {
    userId,
    name: 'Test Student',
    state: 'Delhi',
    profileCompletion: 50
  };

  return await prisma.student.create({
    data: { ...defaultData, ...data }
  });
};

/**
 * Create test coach profile
 */
const createTestCoach = async (userId, data = {}) => {
  const prisma = initTestDB();
  
  const defaultData = {
    userId,
    name: 'Test Coach',
    state: 'Delhi',
    paymentStatus: 'PENDING',
    isActive: false
  };

  return await prisma.coach.create({
    data: { ...defaultData, ...data }
  });
};

/**
 * Create test event
 */
const createTestEvent = async (coachId, data = {}) => {
  const prisma = initTestDB();
  
  const defaultData = {
    coachId,
    name: 'Test Event',
    sport: 'Football',
    venue: 'Test Stadium',
    city: 'Delhi',
    state: 'Delhi',
    startDate: new Date(Date.now() + 86400000), // Tomorrow
    status: 'PENDING',
    uniqueId: `EVT-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}-FB-DL-${new Date().getDate().toString().padStart(2, '0')}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getFullYear().toString().slice(-2)}`
  };

  return await prisma.event.create({
    data: { ...defaultData, ...data }
  });
};

/**
 * Create test admin
 */
const createTestAdmin = async (userId, data = {}) => {
  const prisma = initTestDB();
  
  const defaultData = {
    userId,
    name: 'Test Admin',
    role: 'ADMIN'
  };

  return await prisma.admin.create({
    data: { ...defaultData, ...data }
  });
};

/**
 * Generate JWT token for testing
 */
const generateTestToken = (userId, role = 'STUDENT') => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '24h' }
  );
};

/**
 * Create full test user with profile
 */
const createFullTestUser = async (role = 'STUDENT', data = {}) => {
  const user = await createTestUser({ role, ...data.user });
  let profile = null;
  
  switch (role) {
    case 'STUDENT':
      profile = await createTestStudent(user.id, data.profile);
      break;
    case 'COACH':
      profile = await createTestCoach(user.id, data.profile);
      break;
    case 'ADMIN':
      profile = await createTestAdmin(user.id, data.profile);
      break;
  }
  
  const token = generateTestToken(user.id, role);
  
  return { user, profile, token };
};

module.exports = {
  initTestDB,
  cleanDatabase,
  disconnectDB,
  createTestUser,
  createTestStudent,
  createTestCoach,
  createTestEvent,
  createTestAdmin,
  generateTestToken,
  createFullTestUser,
  getPrisma: () => prisma
};
