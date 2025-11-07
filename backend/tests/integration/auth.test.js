/**
 * Integration Tests: Auth Routes
 * Tests authentication and authorization flows
 */

const request = require('supertest');
const app = require('../../src/index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Auth API Integration Tests', () => {
  
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'test@' } }
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.user.deleteMany({
      where: { email: { contains: 'test@' } }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register - User Registration', () => {
    
    test('should register a new student successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@student.com',
          phone: '9876543210',
          password: 'Test@1234',
          role: 'STUDENT',
          name: 'Test Student',
          state: 'Delhi'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@student.com');
      expect(response.body.user.role).toBe('STUDENT');
      expect(response.body.user).toHaveProperty('uniqueId');
      expect(response.body.user.uniqueId).toMatch(/^A\d{4}DL\d{6}$/);
    });

    test('should register a new coach successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@coach.com',
          phone: '9876543211',
          password: 'Test@1234',
          role: 'COACH',
          name: 'Test Coach',
          state: 'Maharashtra'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.uniqueId).toMatch(/^C\d{4}MH\d{6}$/);
    });

    test('should fail with duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@student.com',
          phone: '9876543212',
          password: 'Test@1234',
          role: 'STUDENT',
          name: 'Duplicate Student'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should fail with duplicate phone', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@student.com',
          phone: '9876543210',
          password: 'Test@1234',
          role: 'STUDENT',
          name: 'Another Student'
        });

      expect(response.status).toBe(400);
    });

    test('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          phone: '9876543213',
          password: 'Test@1234',
          role: 'STUDENT',
          name: 'Test'
        });

      expect(response.status).toBe(400);
    });

    test('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test3@student.com',
          phone: '9876543214',
          password: '123',
          role: 'STUDENT',
          name: 'Test'
        });

      expect(response.status).toBe(400);
    });

    test('should fail with invalid phone format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test4@student.com',
          phone: 'invalid',
          password: 'Test@1234',
          role: 'STUDENT',
          name: 'Test'
        });

      expect(response.status).toBe(400);
    });

    test('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test5@student.com'
        });

      expect(response.status).toBe(400);
    });

    test('should sanitize XSS attempts in name field', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test6@student.com',
          phone: '9876543215',
          password: 'Test@1234',
          role: 'STUDENT',
          name: '<script>alert("XSS")</script>'
        });

      if (response.status === 201) {
        expect(response.body.user.name).not.toContain('<script>');
      }
    });

    test('should reject SQL injection attempts', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: "test7@student.com'; DROP TABLE users; --",
          phone: '9876543216',
          password: 'Test@1234',
          role: 'STUDENT',
          name: 'Test'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login - User Login', () => {
    
    test('should login with valid credentials (email)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@student.com',
          password: 'Test@1234'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      
      authToken = response.body.token;
      testUser = response.body.user;
    });

    test('should login with valid credentials (phone)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '9876543210',
          password: 'Test@1234'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    test('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@student.com',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
    });

    test('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Test@1234'
        });

      expect(response.status).toBe(401);
    });

    test('should fail without credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
    });

    test('should fail with empty password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@student.com',
          password: ''
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/me - Get Current User', () => {
    
    test('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@student.com');
    });

    test('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    test('should fail with malformed token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout - User Logout', () => {
    
    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('should fail without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    
    test('should enforce rate limiting on login attempts', async () => {
      const requests = Array(20).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@student.com',
            password: 'WrongPassword'
          })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      expect(rateLimited).toBe(true);
    }, 30000);
  });

  describe('Security Headers', () => {
    
    test('should include security headers in response', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });
});
