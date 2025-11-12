# STAIRS Platform - Testing Guide# STAIRS Platform - Testing Guide



## Overview## Testing Strategy

This guide covers testing strategies, test execution, and quality assurance for the STAIRS platform.

The STAIRS platform uses a multi-layered testing approach:

---1. **Unit Tests** - Test individual functions and services

2. **Integration Tests** - Test API endpoints and database operations  

## Test Types3. **Manual Tests** - End-to-end user flows and complex scenarios



### 1. Unit Tests (`backend/tests/unit/`)---

- Test individual functions and services

- Mock external dependencies## Test Structure

- Fast execution

```

### 2. Integration Tests (`backend/tests/integration/`)backend/

- Test API endpoints├── tests/

- Database operations│   ├── unit/              # Unit tests

- Authentication flows│   ├── integration/       # Integration/API tests

│   ├── setup.js           # Test environment setup

### 3. Manual Tests (`backend/testing/`)│   ├── cleanup.js         # Test data cleanup

- End-to-end user flows│   └── run.js             # Test runner

- UI/UX validation└── testing/

- Payment flows    └── debug/             # Manual test scripts

- Certificate generation        ├── test-date-handling.js

        ├── test-event-dates-api.js

---        └── verify-date-fix.js

```

## Running Tests

---

### Backend Tests

```bash## Running Tests

cd backend

npm test                    # Run all tests### Unit Tests

npm test -- --coverage      # With coverage report```bash

npm test -- auth.test.js    # Specific filecd backend

```npm test



### Frontend Tests# Run specific test file

```bashnpm test -- tests/unit/services/eventService.test.js

cd frontend

npm test                    # Run component tests# Run with coverage

npx playwright test         # E2E tests (if configured)npm test -- --coverage

``````



### Manual Test Scripts### Integration Tests

```bash```bash

cd backend/testing/debugcd backend

node test-date-handling.js          # Test IST date handling

node test-event-dates-api.js        # Test event API# Run all integration tests

node verify-date-fix.js             # Verify date fixesnpm test tests/integration

```

# Run specific integration test

---npm test tests/integration/auth.test.js

```

## Test Coverage

### Manual Test Scripts

### Current Coverage```bash

- Backend Services: ~75%cd backend

- API Routes: ~60%

- Frontend Components: ~40%# Test date handling

node testing/debug/test-date-handling.js

### Target Coverage

- Critical paths: 90%+# Test event API dates

- Services & utilities: 80%+node testing/debug/test-event-dates-api.js

- UI components: 70%+

# Verify date fix

---node testing/debug/verify-date-fix.js

```

## Test Data Setup

---

### Seed Test Data

```bash## Test Environment Setup

cd backend

node tests/setup.js### 1. Create Test Database

``````bash

# Create separate test database

### Clean Test Datasudo -u postgres createdb stairs_test

```bash

node tests/cleanup.js# Update test environment

```# Create .env.test file

DATABASE_URL="postgresql://user:pass@localhost:5432/stairs_test"

---```



## Key Test Scenarios### 2. Setup Test Data

```bash

### 1. Authentication Flowcd backend

- ✅ Student registrationnode tests/setup.js

- ✅ Coach registration with payment```

- ✅ Login (all roles)

- ✅ OTP verificationThis will create:

- ✅ Password reset- Test users (student, coach, admin)

- ✅ JWT token validation- Sample events

- Sample registrations

### 2. Event Management

- ✅ Create event (IST date handling)### 3. Cleanup Test Data

- ✅ Update event```bash

- ✅ Admin approvalcd backend

- ✅ Student registrationnode tests/cleanup.js

- ✅ Result upload```

- ✅ Event status computation

---

### 3. Certificate Issuance

- ✅ Generate certificate PDF## Unit Tests

- ✅ Unique ID generation

- ✅ Certificate verification### Service Layer Tests

- ✅ Download certificate

#### Event Service Tests

### 4. Payment Integration```javascript

- ✅ Create Razorpay order// tests/unit/services/eventService.test.js

- ✅ Payment verification

- ✅ Subscription managementdescribe('EventService', () => {

- ✅ Order payment  test('should create event with IST date', async () => {

    const eventData = {

### 5. Profile Management      name: 'Test Event',

- ✅ Update profile (all roles)      sport: 'Cricket',

- ✅ Profile completion tracking      startDate: '2025-11-20T10:00:00',

- ✅ Coach-student connections      endDate: '2025-11-20T18:00:00'

    };

---    

    const event = await eventService.createEvent(eventData, coachId, 'COACH');

## IST Date/Time Testing    

    expect(event).toBeDefined();

### Test Cases    expect(event.name).toBe('Test Event');

```javascript  });

// Test 1: Create event with IST time  

Input: "2025-12-15T10:00:00"  (10:00 AM IST)  test('should compute event status correctly', () => {

Expected DB: "2025-12-15T04:30:00.000Z"  (UTC)    const upcomingEvent = { startDate: futureDate, endDate: futureDate };

Expected Response: "2025-12-15T10:00:00"  (IST)    expect(eventService.getEventStatus(upcomingEvent)).toBe('upcoming');

    

// Test 2: Update event time    const ongoingEvent = { startDate: pastDate, endDate: futureDate };

Input: "2025-12-15T14:30:00"  (2:30 PM IST)    expect(eventService.getEventStatus(ongoingEvent)).toBe('ongoing');

Expected DB: "2025-12-15T09:00:00.000Z"  (UTC)  });

Expected Response: "2025-12-15T14:30:00"  (IST)});

```

// Test 3: Event status computation

Current IST: 2025-12-15T11:00:00#### Certificate Service Tests

Event Start: 2025-12-15T10:00:00```javascript

Expected Status: "ONGOING"// tests/unit/services/certificateService.test.js

```

describe('CertificateService', () => {

### Run Date Tests  test('should generate unique certificate UID', () => {

```bash    const uid = certificateService.generateUID(eventUID, studentUID);

cd backend/testing/debug    expect(uid).toMatch(/^STAIRS-CERT-/);

node test-date-handling.js  });

```  

  test('should verify valid certificate', async () => {

---    const result = await certificateService.verifyCertificate(validUID);

    expect(result.valid).toBe(true);

## API Testing  });

});

### Using Postman```

1. Import collection from `backend/docs/postman/`

2. Set environment variables### Utility Function Tests

3. Run collection tests

#### Date Helpers

### Using cURL```javascript

```bash// tests/unit/utils/dateHelpers.test.js

# Login

curl -X POST http://localhost:5000/api/auth/login \describe('Date Helpers', () => {

  -H "Content-Type: application/json" \  test('should parse IST date correctly', () => {

  -d '{"email":"test@example.com","password":"password123","role":"STUDENT"}'    const date = parseAsIST('2025-11-20T10:00:00');

    expect(date.toISOString()).toBe('2025-11-20T04:30:00.000Z');

# Create Event (with token)  });

curl -X POST http://localhost:5000/api/coach/events \  

  -H "Authorization: Bearer <token>" \  test('should format date as IST', () => {

  -H "Content-Type: application/json" \    const utcDate = new Date('2025-11-20T04:30:00.000Z');

  -d '{"name":"Test Event","sport":"Cricket",...}'    const istString = formatDateAsIST(utcDate);

```    expect(istString).toBe('2025-11-20T10:00:00');

  });

---});

```

## Debugging Tests

---

### Enable Debug Logs

```bash## Integration Tests

DEBUG=stairs:* npm test

```### Authentication Tests

```javascript

### Check Test Database// tests/integration/auth.test.js

```bash

# Connect to test databasedescribe('POST /api/auth/register', () => {

psql $TEST_DATABASE_URL  test('should register new student', async () => {

```    const response = await request(app)

      .post('/api/auth/register')

### View API Logs      .send({

```bash        email: 'test@example.com',

# Backend logs        password: 'Test123!',

tail -f backend/logs/error.log        role: 'STUDENT'

tail -f backend/logs/combined.log      });

```      

    expect(response.status).toBe(201);

---    expect(response.body.success).toBe(true);

    expect(response.body.data.token).toBeDefined();

## Continuous Integration  });

  

### GitHub Actions (if configured)  test('should reject duplicate email', async () => {

- Run tests on every push    // Register first user

- Check code coverage    await request(app).post('/api/auth/register').send(userData);

- Lint code    

- Build application    // Try to register again

    const response = await request(app)

---      .post('/api/auth/register')

      .send(userData);

## Troubleshooting      

    expect(response.status).toBe(409);

### Common Issues    expect(response.body.success).toBe(false);

  });

**Issue**: Tests fail with "Cannot connect to database"});

**Solution**: Check DATABASE_URL in .env.test

describe('POST /api/auth/login', () => {

**Issue**: Date tests fail  test('should login with valid credentials', async () => {

**Solution**: Ensure IST timezone handling is correct    const response = await request(app)

      .post('/api/auth/login')

**Issue**: Payment tests fail      .send({

**Solution**: Use Razorpay test keys, not production keys        emailOrPhone: 'test@example.com',

        password: 'Test123!'

**Issue**: Certificate generation fails      });

**Solution**: Ensure Puppeteer is installed with Chrome      

    expect(response.status).toBe(200);

---    expect(response.body.data.token).toBeDefined();

  });

## Best Practices});

```

1. **Isolate Tests**: Each test should be independent

2. **Clean Up**: Remove test data after tests### Event Tests

3. **Mock External Services**: Don't call real payment gateways in tests```javascript

4. **Test Edge Cases**: Invalid inputs, boundary conditions// tests/integration/events.test.js

5. **Meaningful Assertions**: Clear expected vs actual comparisons

6. **Fast Tests**: Keep unit tests under 1 second eachdescribe('POST /api/coach/events', () => {

  test('should create event with coach token', async () => {

---    const response = await request(app)

      .post('/api/coach/events')

**Last Updated**: November 2025      .set('Authorization', `Bearer ${coachToken}`)

      .send({
        name: 'Test Tournament',
        sport: 'Cricket',
        startDate: '2025-11-20T10:00:00',
        endDate: '2025-11-20T18:00:00',
        venue: 'Test Stadium',
        participantLimit: 100
      });
      
    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('PENDING');
  });
  
  test('should reject event creation without payment', async () => {
    const response = await request(app)
      .post('/api/coach/events')
      .set('Authorization', `Bearer ${unpaidCoachToken}`)
      .send(eventData);
      
    expect(response.status).toBe(403);
  });
});

describe('PUT /api/admin/events/:id/moderate', () => {
  test('should approve event as admin', async () => {
    const response = await request(app)
      .put(`/api/admin/events/${eventId}/moderate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'APPROVE' });
      
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('APPROVED');
  });
});
```

### Registration Tests
```javascript
// tests/integration/registrations.test.js

describe('POST /api/events/:id/register', () => {
  test('should register student for event', async () => {
    const response = await request(app)
      .post(`/api/events/${approvedEventId}/register`)
      .set('Authorization', `Bearer ${studentToken}`);
      
    expect(response.status).toBe(200);
    expect(response.body.message).toContain('registered');
  });
  
  test('should prevent duplicate registration', async () => {
    // Register first time
    await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    // Try to register again
    const response = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${studentToken}`);
      
    expect(response.status).toBe(409);
  });
  
  test('should prevent registration for past events', async () => {
    const response = await request(app)
      .post(`/api/events/${pastEventId}/register`)
      .set('Authorization', `Bearer ${studentToken}`);
      
    expect(response.status).toBe(400);
  });
});
```

---

## Manual Testing

### Test Scenarios

#### 1. Complete Event Lifecycle
```bash
# Run the test script
node testing/debug/test-event-lifecycle.js
```

**Manual Steps:**
1. Coach creates event
2. Admin approves event
3. Student registers for event
4. Coach uploads results
5. Admin issues certificates
6. Student downloads certificate

**Expected Outcomes:**
- Event created with PENDING status
- Event approved and visible to students
- Registration successful
- Results uploaded
- Certificate generated with unique UID
- Certificate downloadable

#### 2. Date/Time Handling
```bash
# Run date handling test
node testing/debug/test-date-handling.js
```

**Verification:**
- Input: 2025-11-20T10:00:00 (IST)
- Stored: 2025-11-20T04:30:00.000Z (UTC)
- Retrieved: 2025-11-20T10:00:00 (IST)

#### 3. Payment Flow
**Manual Steps:**
1. Coach subscribes (monthly/annual)
2. Payment initiated with Razorpay
3. Payment completed
4. Subscription activated

**Expected Outcomes:**
- Razorpay order created
- Payment verified
- paymentStatus = SUCCESS
- subscriptionExpiry set correctly

#### 4. Certificate Generation
**Manual Steps:**
1. Upload event results
2. Issue certificates to students
3. Verify certificate generation
4. Download and verify PDF

**Expected Outcomes:**
- PDF generated successfully
- Unique UID assigned
- Student details populated
- QR code included

---

## Test Coverage

### Coverage Goals
- **Unit Tests**: > 80% coverage for services and utilities
- **Integration Tests**: All critical API endpoints covered
- **Manual Tests**: All user flows tested

### Checking Coverage
```bash
npm test -- --coverage

# Generate HTML report
npm test -- --coverage --coverageReporters=html

# Open coverage report
# Open coverage/index.html in browser
```

---

## Common Test Issues

### Database Connection Errors
**Problem**: Tests fail with database connection errors

**Solution:**
```bash
# Ensure test database exists
createdb stairs_test

# Update DATABASE_URL in .env.test
# Restart PostgreSQL if needed
```

### JWT Token Expiration
**Problem**: Integration tests fail with 401 Unauthorized

**Solution:**
```javascript
// Generate fresh tokens before each test
beforeEach(async () => {
  studentToken = await generateTestToken('STUDENT');
  coachToken = await generateTestToken('COACH');
  adminToken = await generateTestToken('ADMIN');
});
```

### Date Timezone Issues
**Problem**: Date tests fail due to timezone differences

**Solution:**
```javascript
// Mock system timezone
process.env.TZ = 'Asia/Kolkata';

// Or use specific UTC dates in tests
const testDate = new Date('2025-11-20T04:30:00.000Z');
```

---

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm install
      
      - name: Run tests
        run: |
          cd backend
          npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          JWT_SECRET: test-secret
```

---

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Clean Up**: Always clean up test data after tests
3. **Use Factories**: Create test data using factory functions
4. **Mock External Services**: Mock Razorpay, email, etc. in tests
5. **Test Edge Cases**: Test boundary conditions and error scenarios
6. **Keep Tests Fast**: Optimize slow tests
7. **Descriptive Names**: Use clear, descriptive test names
8. **Test Documentation**: Comment complex test scenarios

---

## Test Data Management

### Test Users
```javascript
const testUsers = {
  student: {
    email: 'student@test.com',
    password: 'Test123!',
    role: 'STUDENT'
  },
  coach: {
    email: 'coach@test.com',
    password: 'Test123!',
    role: 'COACH',
    paymentStatus: 'SUCCESS'
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test123!',
    role: 'ADMIN'
  }
};
```

### Test Events
```javascript
const testEvents = {
  upcoming: {
    name: 'Future Tournament',
    startDate: futureDate,
    endDate: futureDate,
    status: 'APPROVED'
  },
  ongoing: {
    name: 'Current Tournament',
    startDate: pastDate,
    endDate: futureDate,
    status: 'APPROVED'
  },
  completed: {
    name: 'Past Tournament',
    startDate: pastDate,
    endDate: pastDate,
    status: 'COMPLETED'
  }
};
```

---

For more information:
- See `SETUP_DEPLOYMENT_GUIDE.md` for environment setup
- See `API_REFERENCE.md` for endpoint specifications
- See `DATABASE_SCHEMA.md` for data structures
