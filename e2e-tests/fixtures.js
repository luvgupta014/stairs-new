/**
 * Test Fixtures for STAIRS E2E Tests
 * Provides authenticated contexts for all user roles
 */

const { test as base, expect } = require('@playwright/test');
const { faker } = require('@faker-js/faker');

// Test user credentials for each role
const TEST_USERS = {
  student: {
    email: `test.student.${Date.now()}@stairs.com`,
    phone: faker.phone.number('##########'),
    password: 'Test@12345',
    role: 'STUDENT',
    name: faker.person.fullName(),
  },
  coach: {
    email: `test.coach.${Date.now()}@stairs.com`,
    phone: faker.phone.number('##########'),
    password: 'Test@12345',
    role: 'COACH',
    name: faker.person.fullName(),
  },
  institute: {
    email: `test.institute.${Date.now()}@stairs.com`,
    phone: faker.phone.number('##########'),
    password: 'Test@12345',
    role: 'INSTITUTE',
    name: `${faker.company.name()} Institute`,
  },
  club: {
    email: `test.club.${Date.now()}@stairs.com`,
    phone: faker.phone.number('##########'),
    password: 'Test@12345',
    role: 'CLUB',
    name: `${faker.company.name()} Sports Club`,
  },
  admin: {
    email: 'admin@stairs.com',
    password: 'Admin@12345',
    role: 'ADMIN',
  },
};

// Extend base test with custom fixtures
const test = base.extend({
  // Authenticated student context
  studentContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login as student
    await loginAsRole(page, 'student', TEST_USERS.student);
    
    await use({ context, page, user: TEST_USERS.student });
    await context.close();
  },

  // Authenticated coach context
  coachContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login as coach
    await loginAsRole(page, 'coach', TEST_USERS.coach);
    
    await use({ context, page, user: TEST_USERS.coach });
    await context.close();
  },

  // Authenticated institute context
  instituteContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login as institute
    await loginAsRole(page, 'institute', TEST_USERS.institute);
    
    await use({ context, page, user: TEST_USERS.institute });
    await context.close();
  },

  // Authenticated club context
  clubContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login as club
    await loginAsRole(page, 'club', TEST_USERS.club);
    
    await use({ context, page, user: TEST_USERS.club });
    await context.close();
  },

  // Authenticated admin context
  adminContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login as admin
    await loginAsRole(page, 'admin', TEST_USERS.admin);
    
    await use({ context, page, user: TEST_USERS.admin });
    await context.close();
  },
});

/**
 * Helper function to login as a specific role
 */
async function loginAsRole(page, role, credentials) {
  const baseURL = process.env.BASE_URL || 'http://localhost:5173';
  
  // Navigate to login page
  await page.goto(`${baseURL}/login/${role}`);
  
  // Fill login form
  if (role === 'admin') {
    await page.fill('input[name="email"], input[type="email"]', credentials.email);
  } else {
    // Most roles can use email or phone
    await page.fill('input[name="email"], input[type="email"]', credentials.email);
  }
  
  await page.fill('input[name="password"], input[type="password"]', credentials.password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL(`**/dashboard/${role}**`, { timeout: 30000 });
  
  // Verify we're logged in
  await expect(page).toHaveURL(new RegExp(`/dashboard/${role}`));
}

/**
 * Helper function to register a new user
 */
async function registerUser(page, role, userData) {
  const baseURL = process.env.BASE_URL || 'http://localhost:5173';
  
  // Navigate to registration page
  await page.goto(`${baseURL}/register/${role}`);
  
  // Fill registration form (varies by role)
  await page.fill('input[name="name"]', userData.name);
  await page.fill('input[name="email"]', userData.email);
  await page.fill('input[name="phone"]', userData.phone);
  await page.fill('input[name="password"]', userData.password);
  
  if (role === 'student') {
    // Additional student fields
    await page.fill('input[name="aadhaar"]', faker.string.numeric(12));
    await page.selectOption('select[name="gender"]', faker.helpers.arrayElement(['MALE', 'FEMALE']));
    await page.selectOption('select[name="sport"]', faker.helpers.arrayElement(['Cricket', 'Football', 'Basketball']));
  }
  
  // Submit registration
  await page.click('button[type="submit"]');
  
  // Handle OTP verification if needed
  const url = page.url();
  if (url.includes('/verify-otp')) {
    // In test environment, might need to skip OTP or use mock
    console.log('OTP verification required - handling in test mode');
  }
}

/**
 * Helper function to logout
 */
async function logout(page) {
  // Click logout button (usually in header or dropdown)
  await page.click('button:has-text("Logout"), a:has-text("Logout")');
  
  // Wait for redirect to landing or login page
  await page.waitForURL('**/login/**');
}

/**
 * Helper function to navigate to dashboard
 */
async function goToDashboard(page, role) {
  const baseURL = process.env.BASE_URL || 'http://localhost:5173';
  await page.goto(`${baseURL}/dashboard/${role}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Helper function to wait for API response
 */
async function waitForAPIResponse(page, urlPattern) {
  return await page.waitForResponse(
    response => response.url().includes(urlPattern) && response.status() === 200,
    { timeout: 30000 }
  );
}

/**
 * Helper function to create test data
 */
function generateTestData() {
  return {
    event: {
      name: `Test Event ${faker.word.adjective()} ${faker.word.noun()}`,
      description: faker.lorem.paragraph(),
      sport: faker.helpers.arrayElement(['Cricket', 'Football', 'Basketball', 'Tennis', 'Hockey']),
      venue: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.helpers.arrayElement(['Delhi', 'Mumbai', 'Bangalore', 'Kolkata']),
      startDate: faker.date.future().toISOString().split('T')[0],
      maxParticipants: faker.number.int({ min: 20, max: 100 }),
      eventFee: faker.number.int({ min: 100, max: 1000 }),
    },
    student: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number('##########'),
      aadhaar: faker.string.numeric(12),
      gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
      dateOfBirth: faker.date.past({ years: 20 }).toISOString().split('T')[0],
      sport: faker.helpers.arrayElement(['Cricket', 'Football', 'Basketball']),
      state: faker.helpers.arrayElement(['Delhi', 'Mumbai', 'Bangalore']),
      district: faker.location.city(),
      school: faker.company.name() + ' School',
    },
    coach: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number('##########'),
      primarySport: faker.helpers.arrayElement(['Cricket', 'Football', 'Basketball']),
      specialization: faker.lorem.words(3),
      experience: faker.number.int({ min: 1, max: 20 }),
      certifications: faker.lorem.words(5),
      city: faker.location.city(),
      state: faker.helpers.arrayElement(['Delhi', 'Mumbai', 'Bangalore']),
    },
  };
}

module.exports = {
  test,
  expect,
  TEST_USERS,
  loginAsRole,
  registerUser,
  logout,
  goToDashboard,
  waitForAPIResponse,
  generateTestData,
};
