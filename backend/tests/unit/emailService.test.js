/**
 * Unit Tests: Email Service
 * Tests for email sending functionality
 */

const emailService = require('../../src/services/emailService');
const nodemailer = require('nodemailer');

// Mock nodemailer
jest.mock('nodemailer');

describe('Email Service - Unit Tests', () => {
  let mockTransporter;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock transporter
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({
        messageId: 'mock-message-id',
        response: '250 OK'
      }),
      verify: jest.fn().mockResolvedValue(true)
    };
    
    nodemailer.createTransport.mockReturnValue(mockTransporter);
  });
  
  describe('Send Registration Email', () => {
    
    test('should send registration email successfully', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        uniqueId: 'A0001DL071125'
      };
      
      await emailService.sendRegistrationEmail(userData);
      
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: userData.email,
          subject: expect.stringContaining('Welcome'),
          html: expect.stringContaining(userData.name)
        })
      );
    });
    
    test('should include unique ID in registration email', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        uniqueId: 'A0001DL071125'
      };
      
      await emailService.sendRegistrationEmail(userData);
      
      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain(userData.uniqueId);
    });
    
    test('should handle registration email errors', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));
      
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        uniqueId: 'A0001DL071125'
      };
      
      await expect(emailService.sendRegistrationEmail(userData))
        .rejects.toThrow('SMTP error');
    });
    
    test('should validate required fields for registration email', async () => {
      await expect(emailService.sendRegistrationEmail({}))
        .rejects.toThrow();
      
      await expect(emailService.sendRegistrationEmail({ email: 'test@example.com' }))
        .rejects.toThrow();
    });
  });
  
  describe('Send Password Reset Email', () => {
    
    test('should send password reset email with token', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        resetToken: 'reset-token-123'
      };
      
      await emailService.sendPasswordResetEmail(userData);
      
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: userData.email,
          subject: expect.stringContaining('Password Reset'),
          html: expect.stringContaining(userData.resetToken)
        })
      );
    });
    
    test('should include reset link in email', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        resetToken: 'reset-token-123'
      };
      
      await emailService.sendPasswordResetEmail(userData);
      
      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.html).toMatch(/reset.*password/i);
    });
    
    test('should handle password reset email errors', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Network error'));
      
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        resetToken: 'reset-token-123'
      };
      
      await expect(emailService.sendPasswordResetEmail(userData))
        .rejects.toThrow('Network error');
    });
  });
  
  describe('Send Event Registration Confirmation', () => {
    
    test('should send event registration confirmation', async () => {
      const data = {
        email: 'student@example.com',
        name: 'Student Name',
        eventName: 'Football Tournament',
        eventDate: '2025-01-15',
        registrationId: 'REG-001'
      };
      
      await emailService.sendEventRegistrationEmail(data);
      
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: data.email,
          subject: expect.stringContaining('Event Registration'),
          html: expect.stringContaining(data.eventName)
        })
      );
    });
    
    test('should include event details in confirmation', async () => {
      const data = {
        email: 'student@example.com',
        name: 'Student Name',
        eventName: 'Football Tournament',
        eventDate: '2025-01-15',
        registrationId: 'REG-001'
      };
      
      await emailService.sendEventRegistrationEmail(data);
      
      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain(data.eventName);
      expect(mailOptions.html).toContain(data.eventDate);
      expect(mailOptions.html).toContain(data.registrationId);
    });
  });
  
  describe('Send Certificate Email', () => {
    
    test('should send certificate email with attachment', async () => {
      const data = {
        email: 'student@example.com',
        name: 'Student Name',
        certificatePath: '/path/to/certificate.pdf',
        certificateId: 'STAIRS-CERT-001'
      };
      
      await emailService.sendCertificateEmail(data);
      
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: data.email,
          subject: expect.stringContaining('Certificate'),
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: expect.stringContaining('.pdf'),
              path: data.certificatePath
            })
          ])
        })
      );
    });
    
    test('should handle certificate email without attachment', async () => {
      const data = {
        email: 'student@example.com',
        name: 'Student Name',
        certificateId: 'STAIRS-CERT-001',
        certificateUrl: 'https://example.com/cert.pdf'
      };
      
      await emailService.sendCertificateEmail(data);
      
      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain(data.certificateUrl);
    });
  });
  
  describe('Send Payment Confirmation', () => {
    
    test('should send payment confirmation email', async () => {
      const data = {
        email: 'user@example.com',
        name: 'User Name',
        amount: 500,
        orderId: 'order_123',
        paymentId: 'pay_456'
      };
      
      await emailService.sendPaymentConfirmationEmail(data);
      
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: data.email,
          subject: expect.stringContaining('Payment'),
          html: expect.stringContaining(data.orderId)
        })
      );
    });
    
    test('should include payment details', async () => {
      const data = {
        email: 'user@example.com',
        name: 'User Name',
        amount: 500,
        orderId: 'order_123',
        paymentId: 'pay_456'
      };
      
      await emailService.sendPaymentConfirmationEmail(data);
      
      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain(data.amount.toString());
      expect(mailOptions.html).toContain(data.paymentId);
    });
  });
  
  describe('Bulk Email Sending', () => {
    
    test('should send bulk emails to multiple recipients', async () => {
      const recipients = [
        { email: 'user1@example.com', name: 'User 1' },
        { email: 'user2@example.com', name: 'User 2' },
        { email: 'user3@example.com', name: 'User 3' }
      ];
      
      const emailData = {
        subject: 'Bulk Email',
        template: 'notification'
      };
      
      await emailService.sendBulkEmails(recipients, emailData);
      
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(3);
    });
    
    test('should handle partial failures in bulk sending', async () => {
      mockTransporter.sendMail
        .mockResolvedValueOnce({ messageId: '1' })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ messageId: '3' });
      
      const recipients = [
        { email: 'user1@example.com', name: 'User 1' },
        { email: 'user2@example.com', name: 'User 2' },
        { email: 'user3@example.com', name: 'User 3' }
      ];
      
      const result = await emailService.sendBulkEmails(recipients, {
        subject: 'Test',
        template: 'notification'
      });
      
      expect(result.success).toBe(2);
      expect(result.failed).toBe(1);
    });
    
    test('should respect rate limiting in bulk sending', async () => {
      const recipients = Array(100).fill(null).map((_, i) => ({
        email: `user${i}@example.com`,
        name: `User ${i}`
      }));
      
      const startTime = Date.now();
      await emailService.sendBulkEmails(recipients, {
        subject: 'Test',
        template: 'notification',
        rateLimit: 10 // 10 emails per second
      });
      const endTime = Date.now();
      
      // Should take at least 10 seconds for 100 emails at 10/sec
      expect(endTime - startTime).toBeGreaterThanOrEqual(9000);
    });
  });
  
  describe('Email Templates', () => {
    
    test('should render template with variables', async () => {
      const data = {
        email: 'user@example.com',
        name: 'Test User',
        variables: {
          eventName: 'Tournament',
          date: '2025-01-15'
        }
      };
      
      await emailService.sendTemplatedEmail('event-reminder', data);
      
      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain(data.variables.eventName);
      expect(mailOptions.html).toContain(data.variables.date);
    });
    
    test('should handle missing template gracefully', async () => {
      const data = {
        email: 'user@example.com',
        name: 'Test User'
      };
      
      await expect(emailService.sendTemplatedEmail('non-existent', data))
        .rejects.toThrow(/template.*not found/i);
    });
    
    test('should apply custom styling to templates', async () => {
      const data = {
        email: 'user@example.com',
        name: 'Test User',
        styling: {
          primaryColor: '#007bff',
          fontFamily: 'Arial'
        }
      };
      
      await emailService.sendTemplatedEmail('generic', data);
      
      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain(data.styling.primaryColor);
    });
  });
  
  describe('Email Validation', () => {
    
    test('should validate email addresses', () => {
      expect(emailService.validateEmail('valid@example.com')).toBe(true);
      expect(emailService.validateEmail('invalid.email')).toBe(false);
      expect(emailService.validateEmail('missing@domain')).toBe(false);
      expect(emailService.validateEmail('@nodomain.com')).toBe(false);
    });
    
    test('should reject disposable email domains', () => {
      const disposableEmails = [
        'test@tempmail.com',
        'user@10minutemail.com',
        'temp@guerrillamail.com'
      ];
      
      disposableEmails.forEach(email => {
        expect(emailService.isDisposableEmail(email)).toBe(true);
      });
    });
    
    test('should accept legitimate email providers', () => {
      const legitimateEmails = [
        'user@gmail.com',
        'user@outlook.com',
        'user@yahoo.com',
        'user@company.com'
      ];
      
      legitimateEmails.forEach(email => {
        expect(emailService.isDisposableEmail(email)).toBe(false);
      });
    });
  });
  
  describe('Error Handling', () => {
    
    test('should retry failed email sends', async () => {
      mockTransporter.sendMail
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ messageId: 'success' });
      
      const data = {
        email: 'user@example.com',
        name: 'Test User'
      };
      
      const result = await emailService.sendWithRetry('registration', data, { maxRetries: 3 });
      
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(3);
      expect(result.messageId).toBe('success');
    });
    
    test('should give up after max retries', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Persistent failure'));
      
      const data = {
        email: 'user@example.com',
        name: 'Test User'
      };
      
      await expect(emailService.sendWithRetry('registration', data, { maxRetries: 3 }))
        .rejects.toThrow('Persistent failure');
      
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(3);
    });
    
    test('should handle connection timeouts', async () => {
      mockTransporter.sendMail.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 100)
        )
      );
      
      const data = {
        email: 'user@example.com',
        name: 'Test User'
      };
      
      await expect(emailService.sendRegistrationEmail(data))
        .rejects.toThrow('Connection timeout');
    });
  });
  
  describe('Configuration', () => {
    
    test('should verify transporter connection', async () => {
      await emailService.verifyConnection();
      
      expect(mockTransporter.verify).toHaveBeenCalled();
    });
    
    test('should handle verification failures', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));
      
      await expect(emailService.verifyConnection())
        .rejects.toThrow('Connection failed');
    });
    
    test('should use environment variables for SMTP config', () => {
      const originalEnv = process.env;
      
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'test@example.com';
      
      emailService.initialize();
      
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.test.com',
          port: 587,
          auth: expect.objectContaining({
            user: 'test@example.com'
          })
        })
      );
      
      process.env = originalEnv;
    });
  });
  
  describe('Attachments', () => {
    
    test('should send email with single attachment', async () => {
      const data = {
        email: 'user@example.com',
        name: 'Test User',
        attachments: [{
          filename: 'document.pdf',
          path: '/path/to/document.pdf'
        }]
      };
      
      await emailService.sendWithAttachments(data);
      
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: 'document.pdf'
            })
          ])
        })
      );
    });
    
    test('should send email with multiple attachments', async () => {
      const data = {
        email: 'user@example.com',
        name: 'Test User',
        attachments: [
          { filename: 'doc1.pdf', path: '/path/to/doc1.pdf' },
          { filename: 'doc2.pdf', path: '/path/to/doc2.pdf' },
          { filename: 'image.jpg', path: '/path/to/image.jpg' }
        ]
      };
      
      await emailService.sendWithAttachments(data);
      
      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions.attachments).toHaveLength(3);
    });
    
    test('should validate attachment size limits', async () => {
      const data = {
        email: 'user@example.com',
        name: 'Test User',
        attachments: [{
          filename: 'large-file.pdf',
          path: '/path/to/large-file.pdf',
          size: 26 * 1024 * 1024 // 26MB (exceeds typical 25MB limit)
        }]
      };
      
      await expect(emailService.sendWithAttachments(data))
        .rejects.toThrow(/attachment.*too large/i);
    });
  });
  
  describe('Scheduling', () => {
    
    test('should queue emails for later sending', async () => {
      const data = {
        email: 'user@example.com',
        name: 'Test User',
        sendAt: new Date(Date.now() + 3600000) // 1 hour from now
      };
      
      const result = await emailService.scheduleEmail('notification', data);
      
      expect(result.scheduled).toBe(true);
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });
    
    test('should process scheduled emails queue', async () => {
      // Schedule 3 emails
      await emailService.scheduleEmail('notification', {
        email: 'user1@example.com',
        name: 'User 1',
        sendAt: new Date(Date.now() - 1000) // Past time
      });
      
      await emailService.processScheduledEmails();
      
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });
  
  describe('Logging and Monitoring', () => {
    
    test('should log successful email sends', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const data = {
        email: 'user@example.com',
        name: 'Test User'
      };
      
      await emailService.sendRegistrationEmail(data);
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(/email.*sent.*successfully/i)
      );
      
      logSpy.mockRestore();
    });
    
    test('should log email send failures', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockTransporter.sendMail.mockRejectedValue(new Error('Send failed'));
      
      const data = {
        email: 'user@example.com',
        name: 'Test User'
      };
      
      try {
        await emailService.sendRegistrationEmail(data);
      } catch (error) {
        // Expected to throw
      }
      
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/email.*failed/i),
        expect.any(Error)
      );
      
      errorSpy.mockRestore();
    });
    
    test('should track email delivery statistics', async () => {
      await emailService.sendRegistrationEmail({
        email: 'user1@example.com',
        name: 'User 1',
        uniqueId: 'A0001DL071125'
      });
      
      await emailService.sendRegistrationEmail({
        email: 'user2@example.com',
        name: 'User 2',
        uniqueId: 'A0002DL071125'
      });
      
      const stats = emailService.getStatistics();
      
      expect(stats.totalSent).toBe(2);
      expect(stats.successRate).toBeGreaterThan(0);
    });
  });
});
