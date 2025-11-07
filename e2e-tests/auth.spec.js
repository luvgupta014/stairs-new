/**
 * E2E Tests: Authentication Flows
 * Tests registration, login, and logout for all user roles
 */

const { test, expect, TEST_USERS, registerUser, logout } = require('../fixtures');

test.describe('Authentication - All Roles', () => {
  
  test.describe('Student Authentication', () => {
    
    test('should register a new student successfully', async ({ page }) => {
      const studentData = {
        name: 'Test Student',
        email: `student.test.${Date.now()}@example.com`,
        phone: '9876543210',
        password: 'Test@12345',
        aadhaar: '123456789012',
        gender: 'MALE',
        sport: 'Cricket',
      };

      await page.goto('/register/student');
      
      // Fill registration form
      await page.fill('input[name="name"]', studentData.name);
      await page.fill('input[name="email"]', studentData.email);
      await page.fill('input[name="phone"]', studentData.phone);
      await page.fill('input[name="password"]', studentData.password);
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Should redirect to OTP verification or dashboard
      await page.waitForURL(/\/(verify-otp|dashboard\/student)/, { timeout: 15000 });
      
      // Verify success
      expect(page.url()).toMatch(/verify-otp|dashboard/);
    });

    test('should login as student successfully', async ({ page }) => {
      await page.goto('/login/student');
      
      // Fill login form
      await page.fill('input[name="email"], input[type="email"]', TEST_USERS.student.email);
      await page.fill('input[name="password"], input[type="password"]', TEST_USERS.student.password);
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Wait for dashboard
      await page.waitForURL('**/dashboard/student**', { timeout: 30000 });
      
      // Verify dashboard loaded
      await expect(page).toHaveURL(/\/dashboard\/student/);
      await expect(page.locator('h1, h2')).toContainText(/Dashboard|Welcome/i);
    });

    test('should show error for invalid student credentials', async ({ page }) => {
      await page.goto('/login/student');
      
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'WrongPassword');
      
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('text=Invalid credentials, text=Login failed')).toBeVisible({ timeout: 5000 });
    });

    test('should logout student successfully', async ({ page }) => {
      // First login
      await page.goto('/login/student');
      await page.fill('input[name="email"]', TEST_USERS.student.email);
      await page.fill('input[name="password"]', TEST_USERS.student.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard/student**');
      
      // Then logout
      await page.click('button:has-text("Logout"), a:has-text("Logout")');
      
      // Should redirect to login or landing
      await page.waitForURL(/\/(login|$)/, { timeout: 10000 });
      expect(page.url()).toMatch(/login|^\/$/)

;
    });
  });

  test.describe('Coach Authentication', () => {
    
    test('should register a new coach successfully', async ({ page }) => {
      const coachData = {
        name: 'Test Coach',
        email: `coach.test.${Date.now()}@example.com`,
        phone: '9876543211',
        password: 'Test@12345',
        primarySport: 'Football',
        experience: 5,
      };

      await page.goto('/register/coach-premium');
      
      // Fill registration form
      await page.fill('input[name="name"]', coachData.name);
      await page.fill('input[name="email"]', coachData.email);
      await page.fill('input[name="phone"]', coachData.phone);
      await page.fill('input[name="password"]', coachData.password);
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Should redirect to payment or OTP
      await page.waitForURL(/\/(payment|verify-otp)/, { timeout: 15000 });
      
      expect(page.url()).toMatch(/payment|verify-otp/);
    });

    test('should login as coach successfully', async ({ page }) => {
      await page.goto('/login/coach');
      
      await page.fill('input[name="email"]', TEST_USERS.coach.email);
      await page.fill('input[name="password"]', TEST_USERS.coach.password);
      
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard/coach**', { timeout: 30000 });
      
      await expect(page).toHaveURL(/\/dashboard\/coach/);
      await expect(page.locator('h1, h2')).toContainText(/Dashboard|Welcome/i);
    });

    test('should show error for invalid coach credentials', async ({ page }) => {
      await page.goto('/login/coach');
      
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'WrongPassword');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Invalid credentials, text=Login failed')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Institute Authentication', () => {
    
    test('should login as institute successfully', async ({ page }) => {
      await page.goto('/login/institute');
      
      await page.fill('input[name="email"]', TEST_USERS.institute.email);
      await page.fill('input[name="password"]', TEST_USERS.institute.password);
      
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard/institute**', { timeout: 30000 });
      
      await expect(page).toHaveURL(/\/dashboard\/institute/);
    });

    test('should show error for invalid institute credentials', async ({ page }) => {
      await page.goto('/login/institute');
      
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'WrongPassword');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Invalid credentials, text=Login failed')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Club Authentication', () => {
    
    test('should login as club successfully', async ({ page }) => {
      await page.goto('/login/club');
      
      await page.fill('input[name="email"]', TEST_USERS.club.email);
      await page.fill('input[name="password"]', TEST_USERS.club.password);
      
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard/club**', { timeout: 30000 });
      
      await expect(page).toHaveURL(/\/dashboard\/club/);
    });
  });

  test.describe('Admin Authentication', () => {
    
    test('should login as admin successfully', async ({ page }) => {
      await page.goto('/login/admin');
      
      await page.fill('input[name="email"]', TEST_USERS.admin.email);
      await page.fill('input[name="password"]', TEST_USERS.admin.password);
      
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard/admin**', { timeout: 30000 });
      
      await expect(page).toHaveURL(/\/dashboard\/admin/);
      await expect(page.locator('h1, h2')).toContainText(/Admin|Dashboard/i);
    });

    test('should show error for invalid admin credentials', async ({ page }) => {
      await page.goto('/login/admin');
      
      await page.fill('input[name="email"]', 'invalid@admin.com');
      await page.fill('input[name="password"]', 'WrongPassword');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Invalid credentials, text=Login failed')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Role-Based Navigation', () => {
    
    test('should redirect student to student dashboard after login', async ({ page }) => {
      await page.goto('/login/student');
      await page.fill('input[name="email"]', TEST_USERS.student.email);
      await page.fill('input[name="password"]', TEST_USERS.student.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard/student**');
      expect(page.url()).toContain('/dashboard/student');
    });

    test('should redirect coach to coach dashboard after login', async ({ page }) => {
      await page.goto('/login/coach');
      await page.fill('input[name="email"]', TEST_USERS.coach.email);
      await page.fill('input[name="password"]', TEST_USERS.coach.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard/coach**');
      expect(page.url()).toContain('/dashboard/coach');
    });

    test('should redirect admin to admin dashboard after login', async ({ page }) => {
      await page.goto('/login/admin');
      await page.fill('input[name="email"]', TEST_USERS.admin.email);
      await page.fill('input[name="password"]', TEST_USERS.admin.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard/admin**');
      expect(page.url()).toContain('/dashboard/admin');
    });
  });

  test.describe('Protected Routes', () => {
    
    test('should prevent unauthenticated access to student dashboard', async ({ page }) => {
      await page.goto('/dashboard/student');
      
      // Should redirect to login
      await page.waitForURL('**/login/**', { timeout: 10000 });
      expect(page.url()).toMatch(/\/login/);
    });

    test('should prevent unauthenticated access to coach dashboard', async ({ page }) => {
      await page.goto('/dashboard/coach');
      
      await page.waitForURL('**/login/**', { timeout: 10000 });
      expect(page.url()).toMatch(/\/login/);
    });

    test('should prevent unauthenticated access to admin dashboard', async ({ page }) => {
      await page.goto('/dashboard/admin');
      
      await page.waitForURL('**/login/**', { timeout: 10000 });
      expect(page.url()).toMatch(/\/login/);
    });

    test('should prevent student from accessing coach dashboard', async ({ page }) => {
      // Login as student
      await page.goto('/login/student');
      await page.fill('input[name="email"]', TEST_USERS.student.email);
      await page.fill('input[name="password"]', TEST_USERS.student.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard/student**');
      
      // Try to access coach dashboard
      await page.goto('/dashboard/coach');
      
      // Should be redirected or show error
      await page.waitForTimeout(2000);
      expect(page.url()).not.toContain('/dashboard/coach');
    });
  });
});
