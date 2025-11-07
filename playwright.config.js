const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration for STAIRS Multi-Role Event Management Platform
 * 
 * This configuration supports:
 * - Multi-browser testing (Chrome, Firefox, Safari)
 * - Multiple user roles (Student, Coach, Institute, Club, Admin)
 * - Parallel test execution
 * - HTML report generation
 * - Screenshots and videos on failure
 */

module.exports = defineConfig({
  testDir: './e2e-tests',
  
  // Maximum time one test can run
  timeout: 60 * 1000,
  
  // Test expect timeout
  expect: {
    timeout: 10000,
  },
  
  // Run tests in files in parallel
  fullyParallel: false, // Sequential for role-based tests
  
  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'e2e-test-results/html-report', open: 'never' }],
    ['json', { outputFile: 'e2e-test-results/test-results.json' }],
    ['junit', { outputFile: 'e2e-test-results/junit.xml' }],
    ['list']
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    
    // Backend API URL
    apiURL: process.env.API_URL || 'http://localhost:5000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Maximum time each action can take
    actionTimeout: 15000,
    
    // Navigation timeout
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: [
    {
      command: 'cd frontend && npm run dev',
      url: 'http://localhost:5173',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'cd backend && npm start',
      url: 'http://localhost:5000/api/health',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
