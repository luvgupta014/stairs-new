/**
 * Integration Tests: Student Routes
 * Tests for complete student-related API workflows
 */

const request = require('supertest');
const app = require('../../src/index');
const { cleanDatabase, createTestUser, createTestStudent, createTestEvent } = require('../helpers/dbHelpers');
const { generateUserData, generateStudentData } = require('../helpers/testData');
const { registerAndLogin, authHeaders } = require('../helpers/authHelpers');

describe('Student Routes - Integration Tests', () => {
  
  beforeEach(async () => {
    await cleanDatabase();
  });
  
  afterAll(async () => {
    await cleanDatabase();
  });
  
  describe('POST /api/students/profile', () => {
    
    test('should create student profile successfully', async () => {
      const { user, token } = await registerAndLogin('STUDENT');
      const studentData = generateStudentData({ userId: user.id });
      
      const response = await request(app)
        .post('/api/students/profile')
        .set(authHeaders(token))
        .send(studentData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('uniqueId');
      expect(response.body.data.userId).toBe(user.id);
      expect(response.body.data.uniqueId).toMatch(/^S\d{4}/);
    });
    
    test('should validate required fields', async () => {
      const { token } = await registerAndLogin('STUDENT');
      
      const response = await request(app)
        .post('/api/students/profile')
        .set(authHeaders(token))
        .send({
          // Missing required fields
          gender: 'MALE'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/required/i);
    });
    
    test('should prevent duplicate profile creation', async () => {
      const { user, token } = await registerAndLogin('STUDENT');
      const studentData = generateStudentData({ userId: user.id });
      
      // Create first profile
      await request(app)
        .post('/api/students/profile')
        .set(authHeaders(token))
        .send(studentData)
        .expect(201);
      
      // Attempt to create duplicate
      const response = await request(app)
        .post('/api/students/profile')
        .set(authHeaders(token))
        .send(studentData)
        .expect(400);
      
      expect(response.body.message).toMatch(/already exists/i);
    });
    
    test('should require authentication', async () => {
      const studentData = generateStudentData();
      
      await request(app)
        .post('/api/students/profile')
        .send(studentData)
        .expect(401);
    });
  });
  
  describe('GET /api/students/profile/:id', () => {
    
    test('should get student profile by ID', async () => {
      const { user, token } = await registerAndLogin('STUDENT');
      const student = await createTestStudent({ userId: user.id });
      
      const response = await request(app)
        .get(`/api/students/profile/${student.id}`)
        .set(authHeaders(token))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(student.id);
      expect(response.body.data.userId).toBe(user.id);
    });
    
    test('should return 404 for non-existent student', async () => {
      const { token } = await registerAndLogin('ADMIN');
      
      const response = await request(app)
        .get('/api/students/profile/nonexistent-id')
        .set(authHeaders(token))
        .expect(404);
      
      expect(response.body.success).toBe(false);
    });
    
    test('should allow student to view own profile', async () => {
      const { user, token } = await registerAndLogin('STUDENT');
      const student = await createTestStudent({ userId: user.id });
      
      await request(app)
        .get(`/api/students/profile/${student.id}`)
        .set(authHeaders(token))
        .expect(200);
    });
  });
  
  describe('GET /api/students/me', () => {
    
    test('should get own profile', async () => {
      const { user, token } = await registerAndLogin('STUDENT');
      const student = await createTestStudent({ userId: user.id });
      
      const response = await request(app)
        .get('/api/students/me')
        .set(authHeaders(token))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(user.id);
      expect(response.body.data.id).toBe(student.id);
    });
    
    test('should return 404 if profile not created', async () => {
      const { token } = await registerAndLogin('STUDENT');
      
      const response = await request(app)
        .get('/api/students/me')
        .set(authHeaders(token))
        .expect(404);
      
      expect(response.body.message).toMatch(/not found|not created/i);
    });
  });
  
  describe('PUT /api/students/profile/:id', () => {
    
    test('should update student profile', async () => {
      const { user, token } = await registerAndLogin('STUDENT');
      const student = await createTestStudent({ userId: user.id });
      
      const updates = {
        grade: '11',
        schoolName: 'Updated School Name',
        emergencyContact: '9999999999'
      };
      
      const response = await request(app)
        .put(`/api/students/profile/${student.id}`)
        .set(authHeaders(token))
        .send(updates)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.grade).toBe('11');
      expect(response.body.data.schoolName).toBe('Updated School Name');
    });
    
    test('should not allow updating another student profile', async () => {
      const { token } = await registerAndLogin('STUDENT');
      const otherStudent = await createTestStudent();
      
      const response = await request(app)
        .put(`/api/students/profile/${otherStudent.id}`)
        .set(authHeaders(token))
        .send({ grade: '12' })
        .expect(403);
      
      expect(response.body.message).toMatch(/not authorized/i);
    });
    
    test('should allow admin to update any profile', async () => {
      const { token } = await registerAndLogin('ADMIN');
      const student = await createTestStudent();
      
      const response = await request(app)
        .put(`/api/students/profile/${student.id}`)
        .set(authHeaders(token))
        .send({ grade: '12' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('POST /api/students/events/register', () => {
    
    test('should register for event successfully', async () => {
      const { user, token } = await registerAndLogin('STUDENT');
      const student = await createTestStudent({ userId: user.id });
      const event = await createTestEvent();
      
      const response = await request(app)
        .post('/api/students/events/register')
        .set(authHeaders(token))
        .send({
          studentId: student.id,
          eventId: event.id
        })
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.studentId).toBe(student.id);
      expect(response.body.data.eventId).toBe(event.id);
      expect(response.body.data.status).toBe('PENDING');
    });
    
    test('should prevent duplicate registration', async () => {
      const { user, token } = await registerAndLogin('STUDENT');
      const student = await createTestStudent({ userId: user.id });
      const event = await createTestEvent();
      
      // First registration
      await request(app)
        .post('/api/students/events/register')
        .set(authHeaders(token))
        .send({
          studentId: student.id,
          eventId: event.id
        })
        .expect(201);
      
      // Duplicate registration attempt
      const response = await request(app)
        .post('/api/students/events/register')
        .set(authHeaders(token))
        .send({
          studentId: student.id,
          eventId: event.id
        })
        .expect(400);
      
      expect(response.body.message).toMatch(/already registered/i);
    });
    
    test('should validate event exists', async () => {
      const { user, token } = await registerAndLogin('STUDENT');
      const student = await createTestStudent({ userId: user.id });
      
      const response = await request(app)
        .post('/api/students/events/register')
        .set(authHeaders(token))
        .send({
          studentId: student.id,
          eventId: 'nonexistent-event'
        })
        .expect(404);
      
      expect(response.body.message).toMatch(/event.*not found/i);
    });
  });
  
  describe('GET /api/students/:studentId/events', () => {
    
    test('should get student event registrations', async () => {
      const { user, token } = await registerAndLogin('STUDENT');
      const student = await createTestStudent({ userId: user.id });
      const event1 = await createTestEvent();
      const event2 = await createTestEvent();
      
      // Register for events
      await request(app)
        .post('/api/students/events/register')
        .set(authHeaders(token))
        .send({ studentId: student.id, eventId: event1.id });
      
      await request(app)
        .post('/api/students/events/register')
        .set(authHeaders(token))
        .send({ studentId: student.id, eventId: event2.id });
      
      const response = await request(app)
        .get(`/api/students/${student.id}/events`)
        .set(authHeaders(token))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('event');
    });
    
    test('should filter registrations by status', async () => {
      const { user, token } = await registerAndLogin('STUDENT');
      const student = await createTestStudent({ userId: user.id });
      
      const response = await request(app)
        .get(`/api/students/${student.id}/events?status=CONFIRMED`)
        .set(authHeaders(token))
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('GET /api/students/:studentId/certificates', () => {
    
    test('should get student certificates', async () => {
      const { user, token } = await registerAndLogin('STUDENT');
      const student = await createTestStudent({ userId: user.id });
      
      const response = await request(app)
        .get(`/api/students/${student.id}/certificates`)
        .set(authHeaders(token))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
    
    test('should allow student to view own certificates', async () => {
      const { user, token } = await registerAndLogin('STUDENT');
      const student = await createTestStudent({ userId: user.id });
      
      await request(app)
        .get(`/api/students/${student.id}/certificates`)
        .set(authHeaders(token))
        .expect(200);
    });
    
    test('should not allow viewing other students certificates', async () => {
      const { token } = await registerAndLogin('STUDENT');
      const otherStudent = await createTestStudent();
      
      const response = await request(app)
        .get(`/api/students/${otherStudent.id}/certificates`)
        .set(authHeaders(token))
        .expect(403);
      
      expect(response.body.message).toMatch(/not authorized/i);
    });
  });
  
  describe('GET /api/students', () => {
    
    test('should get all students (admin only)', async () => {
      const { token } = await registerAndLogin('ADMIN');
      
      // Create test students
      await createTestStudent();
      await createTestStudent();
      await createTestStudent();
      
      const response = await request(app)
        .get('/api/students')
        .set(authHeaders(token))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });
    
    test('should support pagination', async () => {
      const { token } = await registerAndLogin('ADMIN');
      
      const response = await request(app)
        .get('/api/students?page=1&limit=10')
        .set(authHeaders(token))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });
    
    test('should not allow students to list all students', async () => {
      const { token } = await registerAndLogin('STUDENT');
      
      const response = await request(app)
        .get('/api/students')
        .set(authHeaders(token))
        .expect(403);
      
      expect(response.body.message).toMatch(/not authorized/i);
    });
  });
  
  describe('GET /api/students/search', () => {
    
    test('should search students by name', async () => {
      const { token } = await registerAndLogin('ADMIN');
      
      const student1 = await createTestStudent({
        user: { name: 'John Doe' }
      });
      
      const student2 = await createTestStudent({
        user: { name: 'John Smith' }
      });
      
      const response = await request(app)
        .get('/api/students/search?name=John')
        .set(authHeaders(token))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
    
    test('should search by school name', async () => {
      const { token } = await registerAndLogin('ADMIN');
      
      await createTestStudent({ schoolName: 'Delhi Public School' });
      await createTestStudent({ schoolName: 'Delhi Public School' });
      
      const response = await request(app)
        .get('/api/students/search?school=Delhi')
        .set(authHeaders(token))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
    
    test('should filter by grade', async () => {
      const { token } = await registerAndLogin('ADMIN');
      
      await createTestStudent({ grade: '10' });
      await createTestStudent({ grade: '10' });
      await createTestStudent({ grade: '11' });
      
      const response = await request(app)
        .get('/api/students/search?grade=10')
        .set(authHeaders(token))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(s => s.grade === '10')).toBe(true);
    });
  });
  
  describe('DELETE /api/students/profile/:id', () => {
    
    test('should allow admin to delete student profile', async () => {
      const { token } = await registerAndLogin('ADMIN');
      const student = await createTestStudent();
      
      const response = await request(app)
        .delete(`/api/students/profile/${student.id}`)
        .set(authHeaders(token))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/deleted/i);
    });
    
    test('should not allow students to delete their own profile', async () => {
      const { user, token } = await registerAndLogin('STUDENT');
      const student = await createTestStudent({ userId: user.id });
      
      const response = await request(app)
        .delete(`/api/students/profile/${student.id}`)
        .set(authHeaders(token))
        .expect(403);
      
      expect(response.body.message).toMatch(/not authorized/i);
    });
  });
  
  describe('GET /api/students/:studentId/statistics', () => {
    
    test('should get student statistics', async () => {
      const { user, token } = await registerAndLogin('STUDENT');
      const student = await createTestStudent({ userId: user.id });
      
      const response = await request(app)
        .get(`/api/students/${student.id}/statistics`)
        .set(authHeaders(token))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalEvents');
      expect(response.body.data).toHaveProperty('totalCertificates');
    });
  });
  
  describe('Input Validation', () => {
    
    test('should sanitize HTML in inputs', async () => {
      const { user, token } = await registerAndLogin('STUDENT');
      
      const maliciousData = {
        userId: user.id,
        dateOfBirth: '2000-01-15',
        gender: 'MALE',
        schoolName: '<script>alert("xss")</script>School',
        grade: '10'
      };
      
      const response = await request(app)
        .post('/api/students/profile')
        .set(authHeaders(token))
        .send(maliciousData)
        .expect(201);
      
      expect(response.body.data.schoolName).not.toContain('<script>');
    });
    
    test('should validate date formats', async () => {
      const { user, token } = await registerAndLogin('STUDENT');
      
      const invalidData = {
        userId: user.id,
        dateOfBirth: 'invalid-date',
        gender: 'MALE'
      };
      
      const response = await request(app)
        .post('/api/students/profile')
        .set(authHeaders(token))
        .send(invalidData)
        .expect(400);
      
      expect(response.body.message).toMatch(/date|invalid/i);
    });
  });
  
  describe('Rate Limiting', () => {
    
    test('should enforce rate limits on registration', async () => {
      const { user, token } = await registerAndLogin('STUDENT');
      const event = await createTestEvent();
      
      // Make multiple rapid requests
      const requests = Array(20).fill(null).map((_, i) => 
        request(app)
          .post('/api/students/events/register')
          .set(authHeaders(token))
          .send({
            studentId: user.id,
            eventId: event.id
          })
      );
      
      const responses = await Promise.all(requests);
      
      // Some should be rate limited (429)
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });
});
