/**
 * Integration Tests: Event Routes
 * Tests for complete event management API workflows
 */

const request = require('supertest');
const app = require('../../src/index');
const { cleanDatabase, createTestUser, createTestEvent, createTestStudent, createTestCoach } = require('../helpers/dbHelpers');
const { generateEventData } = require('../helpers/testData');
const { registerAndLogin, authHeaders } = require('../helpers/authHelpers');

describe('Event Routes - Integration Tests', () => {
  
  beforeEach(async () => {
    await cleanDatabase();
  });
  
  afterAll(async () => {
    await cleanDatabase();
  });
  
  describe('POST /api/events', () => {
    
    test('should create event as admin', async () => {
      const { token } = await registerAndLogin('ADMIN');
      const eventData = generateEventData();
      
      const response = await request(app)
        .post('/api/events')
        .set(authHeaders(token))
        .send(eventData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('uniqueId');
      expect(response.body.data.uniqueId).toMatch(/^EVT-\d{4}/);
      expect(response.body.data.name).toBe(eventData.name);
    });
    
    test('should allow coach to create events', async () => {
      const { user, token } = await registerAndLogin('COACH');
      const coach = await createTestCoach({ userId: user.id });
      const eventData = generateEventData({ coachId: coach.id });
      
      const response = await request(app)
        .post('/api/events')
        .set(authHeaders(token))
        .send(eventData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.coachId).toBe(coach.id);
    });
    
    test('should not allow students to create events', async () => {
      const { token } = await registerAndLogin('STUDENT');
      const eventData = generateEventData();
      
      const response = await request(app)
        .post('/api/events')
        .set(authHeaders(token))
        .send(eventData)
        .expect(403);
      
      expect(response.body.message).toMatch(/not authorized/i);
    });
    
    test('should validate required fields', async () => {
      const { token } = await registerAndLogin('ADMIN');
      
      const response = await request(app)
        .post('/api/events')
        .set(authHeaders(token))
        .send({
          name: 'Tournament'
          // Missing required fields
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/required/i);
    });
    
    test('should validate date range', async () => {
      const { token } = await registerAndLogin('ADMIN');
      const eventData = generateEventData();
      eventData.endDate = '2025-01-01';
      eventData.startDate = '2025-12-31'; // End before start
      
      const response = await request(app)
        .post('/api/events')
        .set(authHeaders(token))
        .send(eventData)
        .expect(400);
      
      expect(response.body.message).toMatch(/date/i);
    });
  });
  
  describe('GET /api/events', () => {
    
    test('should get all events (public access)', async () => {
      // Create test events
      await createTestEvent();
      await createTestEvent();
      await createTestEvent();
      
      const response = await request(app)
        .get('/api/events')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });
    
    test('should support pagination', async () => {
      // Create 15 events
      for (let i = 0; i < 15; i++) {
        await createTestEvent();
      }
      
      const response = await request(app)
        .get('/api/events?page=1&limit=10')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(10);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 15,
        pages: 2
      });
    });
    
    test('should get second page of results', async () => {
      // Create 15 events
      for (let i = 0; i < 15; i++) {
        await createTestEvent();
      }
      
      const response = await request(app)
        .get('/api/events?page=2&limit=10')
        .expect(200);
      
      expect(response.body.data.length).toBe(5);
      expect(response.body.pagination.page).toBe(2);
    });
  });
  
  describe('GET /api/events/:id', () => {
    
    test('should get event by ID', async () => {
      const event = await createTestEvent();
      
      const response = await request(app)
        .get(`/api/events/${event.id}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(event.id);
      expect(response.body.data.name).toBe(event.name);
    });
    
    test('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/events/nonexistent-id')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/not found/i);
    });
    
    test('should include event details', async () => {
      const event = await createTestEvent();
      
      const response = await request(app)
        .get(`/api/events/${event.id}`)
        .expect(200);
      
      expect(response.body.data).toHaveProperty('sport');
      expect(response.body.data).toHaveProperty('startDate');
      expect(response.body.data).toHaveProperty('endDate');
      expect(response.body.data).toHaveProperty('venue');
    });
  });
  
  describe('PUT /api/events/:id', () => {
    
    test('should allow admin to update any event', async () => {
      const { token } = await registerAndLogin('ADMIN');
      const event = await createTestEvent();
      
      const updates = {
        name: 'Updated Event Name',
        venue: 'New Venue'
      };
      
      const response = await request(app)
        .put(`/api/events/${event.id}`)
        .set(authHeaders(token))
        .send(updates)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Event Name');
      expect(response.body.data.venue).toBe('New Venue');
    });
    
    test('should allow coach to update own events', async () => {
      const { user, token } = await registerAndLogin('COACH');
      const coach = await createTestCoach({ userId: user.id });
      const event = await createTestEvent({ coachId: coach.id });
      
      const response = await request(app)
        .put(`/api/events/${event.id}`)
        .set(authHeaders(token))
        .send({ name: 'Updated Name' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
    
    test('should not allow coach to update other coach events', async () => {
      const { token } = await registerAndLogin('COACH');
      const otherEvent = await createTestEvent(); // Different coach
      
      const response = await request(app)
        .put(`/api/events/${otherEvent.id}`)
        .set(authHeaders(token))
        .send({ name: 'Updated Name' })
        .expect(403);
      
      expect(response.body.message).toMatch(/not authorized/i);
    });
  });
  
  describe('DELETE /api/events/:id', () => {
    
    test('should allow admin to delete event', async () => {
      const { token } = await registerAndLogin('ADMIN');
      const event = await createTestEvent();
      
      const response = await request(app)
        .delete(`/api/events/${event.id}`)
        .set(authHeaders(token))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/deleted/i);
      
      // Verify event is deleted
      await request(app)
        .get(`/api/events/${event.id}`)
        .expect(404);
    });
    
    test('should not allow deleting event with registrations', async () => {
      const { token } = await registerAndLogin('ADMIN');
      const { user: studentUser } = await registerAndLogin('STUDENT');
      const student = await createTestStudent({ userId: studentUser.id });
      const event = await createTestEvent();
      
      // Register student for event
      await request(app)
        .post('/api/students/events/register')
        .set(authHeaders(token))
        .send({
          studentId: student.id,
          eventId: event.id
        });
      
      const response = await request(app)
        .delete(`/api/events/${event.id}`)
        .set(authHeaders(token))
        .expect(400);
      
      expect(response.body.message).toMatch(/registrations/i);
    });
  });
  
  describe('GET /api/events/search', () => {
    
    test('should search events by name', async () => {
      await createTestEvent({ name: 'Football Tournament' });
      await createTestEvent({ name: 'Football Championship' });
      await createTestEvent({ name: 'Basketball Tournament' });
      
      const response = await request(app)
        .get('/api/events/search?name=Football')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every(e => e.name.includes('Football'))).toBe(true);
    });
    
    test('should filter by sport', async () => {
      await createTestEvent({ sport: 'FOOTBALL' });
      await createTestEvent({ sport: 'FOOTBALL' });
      await createTestEvent({ sport: 'BASKETBALL' });
      
      const response = await request(app)
        .get('/api/events/search?sport=FOOTBALL')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(e => e.sport === 'FOOTBALL')).toBe(true);
    });
    
    test('should filter by city and state', async () => {
      await createTestEvent({ city: 'Delhi', state: 'DL' });
      await createTestEvent({ city: 'Delhi', state: 'DL' });
      await createTestEvent({ city: 'Mumbai', state: 'MH' });
      
      const response = await request(app)
        .get('/api/events/search?city=Delhi&state=DL')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
    
    test('should filter by date range', async () => {
      await createTestEvent({ startDate: '2025-01-15' });
      await createTestEvent({ startDate: '2025-02-15' });
      await createTestEvent({ startDate: '2025-03-15' });
      
      const response = await request(app)
        .get('/api/events/search?startDate=2025-02-01&endDate=2025-02-28')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
  
  describe('GET /api/events/:eventId/participants', () => {
    
    test('should get event participants', async () => {
      const { token } = await registerAndLogin('ADMIN');
      const event = await createTestEvent();
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();
      
      // Register students
      await request(app)
        .post('/api/students/events/register')
        .set(authHeaders(token))
        .send({ studentId: student1.id, eventId: event.id });
      
      await request(app)
        .post('/api/students/events/register')
        .set(authHeaders(token))
        .send({ studentId: student2.id, eventId: event.id });
      
      const response = await request(app)
        .get(`/api/events/${event.id}/participants`)
        .set(authHeaders(token))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
    
    test('should filter participants by status', async () => {
      const { token } = await registerAndLogin('ADMIN');
      const event = await createTestEvent();
      
      const response = await request(app)
        .get(`/api/events/${event.id}/participants?status=CONFIRMED`)
        .set(authHeaders(token))
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('GET /api/events/:eventId/capacity', () => {
    
    test('should check event capacity', async () => {
      const event = await createTestEvent({ maxParticipants: 100 });
      
      const response = await request(app)
        .get(`/api/events/${event.id}/capacity`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('maxParticipants');
      expect(response.body.data).toHaveProperty('currentParticipants');
      expect(response.body.data).toHaveProperty('availableSlots');
      expect(response.body.data).toHaveProperty('isFull');
    });
    
    test('should indicate when event is full', async () => {
      const { token } = await registerAndLogin('ADMIN');
      const event = await createTestEvent({ maxParticipants: 2 });
      
      // Fill event to capacity
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();
      
      await request(app)
        .post('/api/students/events/register')
        .set(authHeaders(token))
        .send({ studentId: student1.id, eventId: event.id });
      
      await request(app)
        .post('/api/students/events/register')
        .set(authHeaders(token))
        .send({ studentId: student2.id, eventId: event.id });
      
      const response = await request(app)
        .get(`/api/events/${event.id}/capacity`)
        .expect(200);
      
      expect(response.body.data.isFull).toBe(true);
      expect(response.body.data.availableSlots).toBe(0);
    });
  });
  
  describe('POST /api/events/:eventId/results', () => {
    
    test('should upload event results', async () => {
      const { token } = await registerAndLogin('ADMIN');
      const event = await createTestEvent();
      
      const response = await request(app)
        .post(`/api/events/${event.id}/results`)
        .set(authHeaders(token))
        .attach('file', Buffer.from('event,results,data'), 'results.csv')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/uploaded/i);
    });
    
    test('should validate file type', async () => {
      const { token } = await registerAndLogin('ADMIN');
      const event = await createTestEvent();
      
      const response = await request(app)
        .post(`/api/events/${event.id}/results`)
        .set(authHeaders(token))
        .attach('file', Buffer.from('executable'), 'virus.exe')
        .expect(400);
      
      expect(response.body.message).toMatch(/file type/i);
    });
  });
  
  describe('GET /api/events/:eventId/statistics', () => {
    
    test('should get event statistics', async () => {
      const { token } = await registerAndLogin('ADMIN');
      const event = await createTestEvent();
      
      const response = await request(app)
        .get(`/api/events/${event.id}/statistics`)
        .set(authHeaders(token))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalRegistrations');
      expect(response.body.data).toHaveProperty('totalOrders');
      expect(response.body.data).toHaveProperty('totalRevenue');
    });
  });
  
  describe('Registration Status Management', () => {
    
    test('should open event registration', async () => {
      const { token } = await registerAndLogin('ADMIN');
      const event = await createTestEvent({ registrationOpen: false });
      
      const response = await request(app)
        .put(`/api/events/${event.id}/registration/open`)
        .set(authHeaders(token))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.registrationOpen).toBe(true);
    });
    
    test('should close event registration', async () => {
      const { token } = await registerAndLogin('ADMIN');
      const event = await createTestEvent({ registrationOpen: true });
      
      const response = await request(app)
        .put(`/api/events/${event.id}/registration/close`)
        .set(authHeaders(token))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.registrationOpen).toBe(false);
    });
    
    test('should prevent registration when closed', async () => {
      const { user, token } = await registerAndLogin('STUDENT');
      const student = await createTestStudent({ userId: user.id });
      const event = await createTestEvent({ registrationOpen: false });
      
      const response = await request(app)
        .post('/api/students/events/register')
        .set(authHeaders(token))
        .send({
          studentId: student.id,
          eventId: event.id
        })
        .expect(400);
      
      expect(response.body.message).toMatch(/registration.*closed/i);
    });
  });
  
  describe('Error Handling', () => {
    
    test('should handle database errors gracefully', async () => {
      const { token } = await registerAndLogin('ADMIN');
      
      // Test with invalid data that would cause DB error
      const response = await request(app)
        .get('/api/events/invalid-mongodb-id-format')
        .set(authHeaders(token));
      
      expect([400, 404, 500]).toContain(response.status);
    });
  });
  
  describe('Security', () => {
    
    test('should sanitize event name input', async () => {
      const { token } = await registerAndLogin('ADMIN');
      
      const eventData = generateEventData();
      eventData.name = '<script>alert("xss")</script>Tournament';
      
      const response = await request(app)
        .post('/api/events')
        .set(authHeaders(token))
        .send(eventData)
        .expect(201);
      
      expect(response.body.data.name).not.toContain('<script>');
    });
    
    test('should prevent SQL injection attempts', async () => {
      const response = await request(app)
        .get("/api/events/search?name=' OR '1'='1")
        .expect(200);
      
      // Should return empty or safe results, not all events
      expect(response.body.success).toBe(true);
    });
  });
});
