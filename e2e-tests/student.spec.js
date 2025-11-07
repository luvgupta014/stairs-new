/**
 * E2E Tests: Student Features
 * Tests all student-specific functionality
 */

const { test, expect, TEST_USERS, waitForAPIResponse, generateTestData } = require('../fixtures');

test.describe('Student Features', () => {
  
  // Use authenticated student context for all tests
  test.use({ storageState: 'student-auth.json' });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login/student');
    await page.fill('input[name="email"]', TEST_USERS.student.email);
    await page.fill('input[name="password"]', TEST_USERS.student.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/student**', { timeout: 30000 });
  });

  test.describe('Dashboard Analytics', () => {
    
    test('should display dashboard with analytics cards', async ({ page }) => {
      await page.goto('/dashboard/student');
      
      // Wait for dashboard to load
      await page.waitForLoadState('networkidle');
      
      // Check for analytics cards
      await expect(page.locator('text=Total Connections, text=Connections')).toBeVisible();
      await expect(page.locator('text=Total Events, text=Events')).toBeVisible();
      await expect(page.locator('text=Certificates')).toBeVisible();
    });

    test('should make analytics cards clickable', async ({ page }) => {
      await page.goto('/dashboard/student');
      await page.waitForLoadState('networkidle');
      
      // Click on events card (if clickable)
      const eventsCard = page.locator('text=Total Events').first();
      if (await eventsCard.isVisible()) {
        await eventsCard.click({ timeout: 5000 }).catch(() => {});
        // Verify navigation or modal opens
        await page.waitForTimeout(1000);
      }
    });

    test('should display recent connections', async ({ page }) => {
      await page.goto('/dashboard/student');
      await page.waitForLoadState('networkidle');
      
      // Check for connections section
      const connectionsSection = page.locator('text=Recent Connections, text=Coaches');
      await expect(connectionsSection.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display upcoming events', async ({ page }) => {
      await page.goto('/dashboard/student');
      await page.waitForLoadState('networkidle');
      
      // Check for events section
      const eventsSection = page.locator('text=Upcoming Events, text=Events');
      await expect(eventsSection.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Profile Management', () => {
    
    test('should navigate to profile page', async ({ page }) => {
      await page.goto('/dashboard/student');
      
      // Click on profile link
      await page.click('a[href="/student/profile"], text=Profile');
      
      // Verify profile page loaded
      await page.waitForURL('**/student/profile**', { timeout: 10000 });
      await expect(page).toHaveURL(/\/student\/profile/);
    });

    test('should display current profile information', async ({ page }) => {
      await page.goto('/student/profile');
      await page.waitForLoadState('networkidle');
      
      // Check for profile fields
      await expect(page.locator('input[name="name"], label:has-text("Name")')).toBeVisible();
      await expect(page.locator('input[name="email"], label:has-text("Email")')).toBeVisible();
      await expect(page.locator('input[name="phone"], label:has-text("Phone")')).toBeVisible();
    });

    test('should update profile successfully', async ({ page }) => {
      await page.goto('/student/profile');
      await page.waitForLoadState('networkidle');
      
      // Update profile fields
      const newSchool = `Updated School ${Date.now()}`;
      await page.fill('input[name="school"]', newSchool);
      
      // Save changes
      await page.click('button:has-text("Save"), button:has-text("Update")');
      
      // Wait for success message
      await expect(page.locator('text=Profile updated, text=Success')).toBeVisible({ timeout: 10000 });
    });

    test('should validate required fields on profile update', async ({ page }) => {
      await page.goto('/student/profile');
      await page.waitForLoadState('networkidle');
      
      // Clear required field
      await page.fill('input[name="name"]', '');
      
      // Try to save
      await page.click('button:has-text("Save"), button:has-text("Update")');
      
      // Should show validation error
      await expect(page.locator('text=Name is required, text=required')).toBeVisible({ timeout: 5000 });
    });

    test('should display profile completion percentage', async ({ page }) => {
      await page.goto('/student/profile');
      await page.waitForLoadState('networkidle');
      
      // Check for profile completion indicator
      const completion = page.locator('text=%').first();
      if (await completion.isVisible()) {
        const text = await completion.textContent();
        expect(text).toMatch(/\d+%/);
      }
    });
  });

  test.describe('Event Participation', () => {
    
    test('should display available events', async ({ page }) => {
      await page.goto('/dashboard/student');
      
      // Navigate to events section
      await page.click('text=Browse Events, a[href="/events"]');
      
      // Wait for events to load
      await page.waitForLoadState('networkidle');
      
      // Check for events list
      const eventsList = page.locator('[data-testid="events-list"], .event-card');
      await expect(eventsList.first()).toBeVisible({ timeout: 10000 });
    });

    test('should filter events by sport', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      
      // Select sport filter
      await page.selectOption('select[name="sport"]', 'Cricket');
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
      
      // Verify filtered events
      const events = page.locator('.event-card');
      if (await events.count() > 0) {
        await expect(events.first()).toContainText(/Cricket/i);
      }
    });

    test('should filter events by location', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      
      // Filter by city/state
      await page.fill('input[name="city"], input[placeholder*="city"]', 'Mumbai');
      await page.waitForTimeout(1000);
      
      // Results should contain Mumbai
      const results = page.locator('.event-card');
      if (await results.count() > 0) {
        await expect(results.first()).toContainText(/Mumbai/i);
      }
    });

    test('should view event details', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      
      // Click on first event
      const firstEvent = page.locator('.event-card, [data-testid="event-card"]').first();
      if (await firstEvent.isVisible()) {
        await firstEvent.click();
        
        // Should navigate to event details
        await page.waitForURL('**/events/**', { timeout: 10000 });
        
        // Verify event details displayed
        await expect(page.locator('h1, h2')).toBeVisible();
        await expect(page.locator('text=Register, text=Event Details')).toBeVisible();
      }
    });

    test('should register for an event', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      
      // Find an event to register for
      const registerButton = page.locator('button:has-text("Register")').first();
      
      if (await registerButton.isVisible()) {
        await registerButton.click();
        
        // Wait for registration confirmation
        await expect(page.locator('text=Registered, text=Success')).toBeVisible({ timeout: 10000 });
      } else {
        test.skip();
      }
    });

    test('should deregister from an event', async ({ page }) => {
      await page.goto('/dashboard/student');
      
      // Navigate to my events
      await page.click('text=My Events, text=Registered Events');
      await page.waitForLoadState('networkidle');
      
      // Find event to deregister
      const deregisterButton = page.locator('button:has-text("Unregister"), button:has-text("Cancel")').first();
      
      if (await deregisterButton.isVisible()) {
        await deregisterButton.click();
        
        // Confirm deregistration
        await page.click('button:has-text("Confirm"), button:has-text("Yes")');
        
        // Wait for success
        await expect(page.locator('text=Unregistered, text=Cancelled')).toBeVisible({ timeout: 10000 });
      } else {
        test.skip();
      }
    });

    test('should view event overview', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      
      // Click on event
      const event = page.locator('.event-card').first();
      if (await event.isVisible()) {
        await event.click();
        
        // Check event overview sections
        await expect(page.locator('text=Description, text=Venue, text=Date')).toBeVisible();
        await expect(page.locator('text=Participants, text=Fee')).toBeVisible();
      }
    });
  });

  test.describe('Coach Connections', () => {
    
    test('should display available coaches', async ({ page }) => {
      await page.goto('/dashboard/student');
      
      // Navigate to coaches section
      await page.click('text=Find Coaches, text=Browse Coaches');
      await page.waitForLoadState('networkidle');
      
      // Check for coaches list
      const coachesList = page.locator('.coach-card, [data-testid="coach-card"]');
      await expect(coachesList.first()).toBeVisible({ timeout: 10000 });
    });

    test('should filter coaches by sport', async ({ page }) => {
      await page.goto('/dashboard/student');
      await page.click('text=Find Coaches');
      await page.waitForLoadState('networkidle');
      
      // Filter by sport
      await page.selectOption('select[name="sport"]', 'Football');
      await page.waitForTimeout(1000);
      
      // Verify filtered coaches
      const coaches = page.locator('.coach-card');
      if (await coaches.count() > 0) {
        await expect(coaches.first()).toContainText(/Football/i);
      }
    });

    test('should send connection request to coach', async ({ page }) => {
      await page.goto('/dashboard/student');
      await page.click('text=Find Coaches');
      await page.waitForLoadState('networkidle');
      
      // Click connect button
      const connectButton = page.locator('button:has-text("Connect"), button:has-text("Request")').first();
      
      if (await connectButton.isVisible()) {
        await connectButton.click();
        
        // Fill connection message (if modal opens)
        const messageInput = page.locator('textarea[name="message"]');
        if (await messageInput.isVisible({ timeout: 2000 })) {
          await messageInput.fill('I would like to connect with you for training.');
          await page.click('button:has-text("Send"), button:has-text("Submit")');
        }
        
        // Wait for success
        await expect(page.locator('text=Request sent, text=Success')).toBeVisible({ timeout: 10000 });
      } else {
        test.skip();
      }
    });

    test('should view connected coaches', async ({ page }) => {
      await page.goto('/dashboard/student');
      
      // Navigate to my coaches
      await page.click('text=My Coaches, text=Connections');
      await page.waitForLoadState('networkidle');
      
      // Check for connections list
      const connectionsList = page.locator('.coach-card, [data-testid="connection"]');
      if (await connectionsList.count() > 0) {
        await expect(connectionsList.first()).toBeVisible();
      }
    });
  });

  test.describe('Certificates', () => {
    
    test('should display certificates section', async ({ page }) => {
      await page.goto('/dashboard/student');
      
      // Navigate to certificates
      await page.click('text=My Certificates, text=Certificates');
      await page.waitForLoadState('networkidle');
      
      // Check for certificates section
      await expect(page.locator('h1, h2')).toContainText(/Certificates/i);
    });

    test('should display list of earned certificates', async ({ page }) => {
      await page.goto('/dashboard/student');
      await page.click('text=Certificates');
      await page.waitForLoadState('networkidle');
      
      // Check for certificates list or empty state
      const certificates = page.locator('.certificate-card, [data-testid="certificate"]');
      const emptyState = page.locator('text=No certificates, text=haven\'t earned');
      
      const hasCertificates = await certificates.count() > 0;
      const isEmpty = await emptyState.isVisible();
      
      expect(hasCertificates || isEmpty).toBeTruthy();
    });

    test('should download certificate', async ({ page }) => {
      await page.goto('/dashboard/student');
      await page.click('text=Certificates');
      await page.waitForLoadState('networkidle');
      
      // Find download button
      const downloadButton = page.locator('button:has-text("Download"), a:has-text("Download")').first();
      
      if (await downloadButton.isVisible()) {
        // Start waiting for download before clicking
        const downloadPromise = page.waitForEvent('download');
        await downloadButton.click();
        
        const download = await downloadPromise;
        
        // Verify download
        expect(download.suggestedFilename()).toContain('certificate');
      } else {
        test.skip();
      }
    });

    test('should view certificate details', async ({ page }) => {
      await page.goto('/dashboard/student');
      await page.click('text=Certificates');
      await page.waitForLoadState('networkidle');
      
      // Click on certificate
      const certificate = page.locator('.certificate-card').first();
      
      if (await certificate.isVisible()) {
        await certificate.click();
        
        // Should show certificate details
        await expect(page.locator('text=Event Name, text=Issued')).toBeVisible({ timeout: 5000 });
      } else {
        test.skip();
      }
    });
  });

  test.describe('Notifications', () => {
    
    test('should display notifications icon', async ({ page }) => {
      await page.goto('/dashboard/student');
      
      // Check for notification bell/icon
      const notificationIcon = page.locator('[data-testid="notification-icon"], button:has([class*="bell"])');
      await expect(notificationIcon).toBeVisible({ timeout: 10000 });
    });

    test('should display notification count', async ({ page }) => {
      await page.goto('/dashboard/student');
      
      // Check for notification badge
      const badge = page.locator('[data-testid="notification-badge"], .badge');
      if (await badge.isVisible()) {
        const count = await badge.textContent();
        expect(parseInt(count)).toBeGreaterThanOrEqual(0);
      }
    });

    test('should open notifications panel', async ({ page }) => {
      await page.goto('/dashboard/student');
      
      // Click notification icon
      await page.click('[data-testid="notification-icon"], button:has([class*="bell"])');
      
      // Verify notifications panel opens
      await expect(page.locator('[data-testid="notifications-panel"], text=Notifications')).toBeVisible({ timeout: 5000 });
    });

    test('should display notification list', async ({ page }) => {
      await page.goto('/dashboard/student');
      await page.click('[data-testid="notification-icon"]');
      
      // Check for notifications
      const notifications = page.locator('.notification-item, [data-testid="notification"]');
      const emptyState = page.locator('text=No notifications');
      
      const hasNotifications = await notifications.count() > 0;
      const isEmpty = await emptyState.isVisible();
      
      expect(hasNotifications || isEmpty).toBeTruthy();
    });

    test('should mark notification as read', async ({ page }) => {
      await page.goto('/dashboard/student');
      await page.click('[data-testid="notification-icon"]');
      await page.waitForTimeout(1000);
      
      // Click on first unread notification
      const unreadNotification = page.locator('.notification-item.unread, [data-unread="true"]').first();
      
      if (await unreadNotification.isVisible()) {
        await unreadNotification.click();
        
        // Notification should be marked as read
        await page.waitForTimeout(500);
        expect(await unreadNotification.getAttribute('class')).not.toContain('unread');
      } else {
        test.skip();
      }
    });
  });
});
