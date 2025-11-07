/**
 * Unit Tests: Payment Service (Razorpay)
 * Tests for payment processing, verification, and refunds
 */

const paymentService = require('../../src/services/paymentService');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Mock Razorpay
jest.mock('razorpay');

describe('Payment Service - Unit Tests', () => {
  let mockRazorpayInstance;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRazorpayInstance = {
      orders: {
        create: jest.fn(),
        fetch: jest.fn(),
        fetchPayments: jest.fn()
      },
      payments: {
        fetch: jest.fn(),
        capture: jest.fn(),
        refund: jest.fn()
      }
    };
    
    Razorpay.mockImplementation(() => mockRazorpayInstance);
  });
  
  describe('Create Payment Order', () => {
    
    test('should create Razorpay order successfully', async () => {
      const orderData = {
        amount: 500,
        currency: 'INR',
        receipt: 'receipt_001',
        notes: {
          userId: 'user123',
          eventId: 'event456'
        }
      };
      
      const mockOrder = {
        id: 'order_123456',
        amount: 50000, // In paise
        currency: 'INR',
        receipt: 'receipt_001',
        status: 'created'
      };
      
      mockRazorpayInstance.orders.create.mockResolvedValue(mockOrder);
      
      const result = await paymentService.createOrder(orderData);
      
      expect(mockRazorpayInstance.orders.create).toHaveBeenCalledWith({
        amount: 50000, // Converted to paise
        currency: 'INR',
        receipt: 'receipt_001',
        notes: orderData.notes
      });
      expect(result.id).toBe('order_123456');
    });
    
    test('should convert amount to paise correctly', async () => {
      await paymentService.createOrder({
        amount: 100,
        currency: 'INR',
        receipt: 'receipt_001'
      });
      
      expect(mockRazorpayInstance.orders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 10000 // 100 * 100
        })
      );
    });
    
    test('should handle order creation errors', async () => {
      mockRazorpayInstance.orders.create.mockRejectedValue(
        new Error('Order creation failed')
      );
      
      await expect(paymentService.createOrder({
        amount: 500,
        currency: 'INR'
      })).rejects.toThrow('Order creation failed');
    });
    
    test('should validate minimum amount', async () => {
      await expect(paymentService.createOrder({
        amount: 0.5, // Less than ₹1
        currency: 'INR'
      })).rejects.toThrow(/minimum.*amount/i);
    });
    
    test('should validate maximum amount', async () => {
      await expect(paymentService.createOrder({
        amount: 1500000, // More than ₹15 lakhs (typical limit)
        currency: 'INR'
      })).rejects.toThrow(/maximum.*amount/i);
    });
    
    test('should include custom notes in order', async () => {
      const customNotes = {
        userId: 'user123',
        eventId: 'event456',
        eventName: 'Football Tournament'
      };
      
      await paymentService.createOrder({
        amount: 500,
        currency: 'INR',
        notes: customNotes
      });
      
      expect(mockRazorpayInstance.orders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: customNotes
        })
      );
    });
  });
  
  describe('Verify Payment Signature', () => {
    
    test('should verify valid payment signature', () => {
      const orderId = 'order_123456';
      const paymentId = 'pay_789012';
      const secret = 'test_secret_key';
      
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
      
      const isValid = paymentService.verifyPaymentSignature({
        orderId,
        paymentId,
        signature: generatedSignature,
        secret
      });
      
      expect(isValid).toBe(true);
    });
    
    test('should reject invalid payment signature', () => {
      const isValid = paymentService.verifyPaymentSignature({
        orderId: 'order_123456',
        paymentId: 'pay_789012',
        signature: 'invalid_signature',
        secret: 'test_secret_key'
      });
      
      expect(isValid).toBe(false);
    });
    
    test('should handle missing signature gracefully', () => {
      const isValid = paymentService.verifyPaymentSignature({
        orderId: 'order_123456',
        paymentId: 'pay_789012',
        signature: null,
        secret: 'test_secret_key'
      });
      
      expect(isValid).toBe(false);
    });
    
    test('should be case-sensitive for signature verification', () => {
      const orderId = 'order_123456';
      const paymentId = 'pay_789012';
      const secret = 'test_secret_key';
      
      const correctSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
      
      const uppercaseSignature = correctSignature.toUpperCase();
      
      const isValid = paymentService.verifyPaymentSignature({
        orderId,
        paymentId,
        signature: uppercaseSignature,
        secret
      });
      
      expect(isValid).toBe(false);
    });
  });
  
  describe('Fetch Payment Details', () => {
    
    test('should fetch payment details by ID', async () => {
      const mockPayment = {
        id: 'pay_123456',
        amount: 50000,
        currency: 'INR',
        status: 'captured',
        method: 'card',
        email: 'user@example.com'
      };
      
      mockRazorpayInstance.payments.fetch.mockResolvedValue(mockPayment);
      
      const result = await paymentService.getPaymentDetails('pay_123456');
      
      expect(mockRazorpayInstance.payments.fetch).toHaveBeenCalledWith('pay_123456');
      expect(result.id).toBe('pay_123456');
      expect(result.amount).toBe(500); // Converted from paise
    });
    
    test('should handle non-existent payment ID', async () => {
      mockRazorpayInstance.payments.fetch.mockRejectedValue(
        new Error('Payment not found')
      );
      
      await expect(paymentService.getPaymentDetails('pay_nonexistent'))
        .rejects.toThrow('Payment not found');
    });
    
    test('should convert amount from paise to rupees', async () => {
      mockRazorpayInstance.payments.fetch.mockResolvedValue({
        id: 'pay_123456',
        amount: 123456, // ₹1234.56 in paise
        currency: 'INR'
      });
      
      const result = await paymentService.getPaymentDetails('pay_123456');
      
      expect(result.amount).toBe(1234.56);
    });
  });
  
  describe('Fetch Order Details', () => {
    
    test('should fetch order details by ID', async () => {
      const mockOrder = {
        id: 'order_123456',
        amount: 50000,
        currency: 'INR',
        receipt: 'receipt_001',
        status: 'paid'
      };
      
      mockRazorpayInstance.orders.fetch.mockResolvedValue(mockOrder);
      
      const result = await paymentService.getOrderDetails('order_123456');
      
      expect(mockRazorpayInstance.orders.fetch).toHaveBeenCalledWith('order_123456');
      expect(result.id).toBe('order_123456');
    });
    
    test('should fetch payments for an order', async () => {
      const mockPayments = {
        items: [
          {
            id: 'pay_123',
            amount: 50000,
            status: 'captured'
          },
          {
            id: 'pay_456',
            amount: 50000,
            status: 'failed'
          }
        ]
      };
      
      mockRazorpayInstance.orders.fetchPayments.mockResolvedValue(mockPayments);
      
      const result = await paymentService.getOrderPayments('order_123456');
      
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('pay_123');
    });
  });
  
  describe('Capture Payment', () => {
    
    test('should capture authorized payment', async () => {
      const mockCapturedPayment = {
        id: 'pay_123456',
        amount: 50000,
        status: 'captured'
      };
      
      mockRazorpayInstance.payments.capture.mockResolvedValue(mockCapturedPayment);
      
      const result = await paymentService.capturePayment('pay_123456', 500);
      
      expect(mockRazorpayInstance.payments.capture).toHaveBeenCalledWith(
        'pay_123456',
        50000,
        'INR'
      );
      expect(result.status).toBe('captured');
    });
    
    test('should handle capture failures', async () => {
      mockRazorpayInstance.payments.capture.mockRejectedValue(
        new Error('Capture failed')
      );
      
      await expect(paymentService.capturePayment('pay_123456', 500))
        .rejects.toThrow('Capture failed');
    });
    
    test('should validate capture amount matches authorized amount', async () => {
      // Mock payment fetch to check authorized amount
      mockRazorpayInstance.payments.fetch.mockResolvedValue({
        id: 'pay_123456',
        amount: 50000,
        status: 'authorized'
      });
      
      await expect(paymentService.capturePayment('pay_123456', 600))
        .rejects.toThrow(/amount.*mismatch/i);
    });
  });
  
  describe('Refund Payment', () => {
    
    test('should create full refund', async () => {
      const mockRefund = {
        id: 'rfnd_123456',
        payment_id: 'pay_789012',
        amount: 50000,
        status: 'processed'
      };
      
      mockRazorpayInstance.payments.refund.mockResolvedValue(mockRefund);
      
      const result = await paymentService.refundPayment('pay_789012');
      
      expect(mockRazorpayInstance.payments.refund).toHaveBeenCalledWith(
        'pay_789012',
        {}
      );
      expect(result.id).toBe('rfnd_123456');
    });
    
    test('should create partial refund', async () => {
      const mockRefund = {
        id: 'rfnd_123456',
        payment_id: 'pay_789012',
        amount: 20000, // ₹200
        status: 'processed'
      };
      
      mockRazorpayInstance.payments.refund.mockResolvedValue(mockRefund);
      
      const result = await paymentService.refundPayment('pay_789012', {
        amount: 200
      });
      
      expect(mockRazorpayInstance.payments.refund).toHaveBeenCalledWith(
        'pay_789012',
        {
          amount: 20000
        }
      );
    });
    
    test('should handle refund failures', async () => {
      mockRazorpayInstance.payments.refund.mockRejectedValue(
        new Error('Refund failed')
      );
      
      await expect(paymentService.refundPayment('pay_789012'))
        .rejects.toThrow('Refund failed');
    });
    
    test('should validate refund amount does not exceed payment', async () => {
      mockRazorpayInstance.payments.fetch.mockResolvedValue({
        id: 'pay_789012',
        amount: 50000,
        status: 'captured'
      });
      
      await expect(paymentService.refundPayment('pay_789012', {
        amount: 600 // More than original ₹500
      })).rejects.toThrow(/refund.*exceeds.*payment/i);
    });
    
    test('should include refund notes', async () => {
      const refundNotes = {
        reason: 'Event cancelled',
        requestedBy: 'admin123'
      };
      
      await paymentService.refundPayment('pay_789012', {
        amount: 200,
        notes: refundNotes
      });
      
      expect(mockRazorpayInstance.payments.refund).toHaveBeenCalledWith(
        'pay_789012',
        expect.objectContaining({
          notes: refundNotes
        })
      );
    });
  });
  
  describe('Payment Status Check', () => {
    
    test('should determine payment is successful', async () => {
      mockRazorpayInstance.payments.fetch.mockResolvedValue({
        id: 'pay_123456',
        status: 'captured'
      });
      
      const isSuccessful = await paymentService.isPaymentSuccessful('pay_123456');
      
      expect(isSuccessful).toBe(true);
    });
    
    test('should determine payment is pending', async () => {
      mockRazorpayInstance.payments.fetch.mockResolvedValue({
        id: 'pay_123456',
        status: 'authorized'
      });
      
      const isSuccessful = await paymentService.isPaymentSuccessful('pay_123456');
      
      expect(isSuccessful).toBe(false);
    });
    
    test('should determine payment has failed', async () => {
      mockRazorpayInstance.payments.fetch.mockResolvedValue({
        id: 'pay_123456',
        status: 'failed'
      });
      
      const isSuccessful = await paymentService.isPaymentSuccessful('pay_123456');
      
      expect(isSuccessful).toBe(false);
    });
  });
  
  describe('Webhook Verification', () => {
    
    test('should verify valid webhook signature', () => {
      const webhookBody = JSON.stringify({
        event: 'payment.captured',
        payload: { payment: { id: 'pay_123456' } }
      });
      
      const webhookSecret = 'webhook_secret_key';
      
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(webhookBody)
        .digest('hex');
      
      const isValid = paymentService.verifyWebhookSignature({
        body: webhookBody,
        signature,
        secret: webhookSecret
      });
      
      expect(isValid).toBe(true);
    });
    
    test('should reject invalid webhook signature', () => {
      const webhookBody = JSON.stringify({
        event: 'payment.captured'
      });
      
      const isValid = paymentService.verifyWebhookSignature({
        body: webhookBody,
        signature: 'invalid_signature',
        secret: 'webhook_secret_key'
      });
      
      expect(isValid).toBe(false);
    });
    
    test('should handle webhook replay attacks', () => {
      const webhookBody = JSON.stringify({
        event: 'payment.captured',
        created_at: Date.now() - 10 * 60 * 1000 // 10 minutes ago
      });
      
      const signature = crypto
        .createHmac('sha256', 'webhook_secret_key')
        .update(webhookBody)
        .digest('hex');
      
      const isValid = paymentService.verifyWebhookSignature({
        body: webhookBody,
        signature,
        secret: 'webhook_secret_key',
        maxAge: 5 * 60 * 1000 // 5 minutes
      });
      
      expect(isValid).toBe(false);
    });
  });
  
  describe('Payment Methods', () => {
    
    test('should support card payments', async () => {
      const orderData = {
        amount: 500,
        currency: 'INR',
        method: 'card'
      };
      
      mockRazorpayInstance.orders.create.mockResolvedValue({
        id: 'order_123456',
        amount: 50000,
        method: 'card'
      });
      
      const result = await paymentService.createOrder(orderData);
      
      expect(result.method).toBe('card');
    });
    
    test('should support UPI payments', async () => {
      const orderData = {
        amount: 500,
        currency: 'INR',
        method: 'upi'
      };
      
      mockRazorpayInstance.orders.create.mockResolvedValue({
        id: 'order_123456',
        amount: 50000,
        method: 'upi'
      });
      
      const result = await paymentService.createOrder(orderData);
      
      expect(result.method).toBe('upi');
    });
    
    test('should support netbanking', async () => {
      const orderData = {
        amount: 500,
        currency: 'INR',
        method: 'netbanking'
      };
      
      mockRazorpayInstance.orders.create.mockResolvedValue({
        id: 'order_123456',
        amount: 50000,
        method: 'netbanking'
      });
      
      const result = await paymentService.createOrder(orderData);
      
      expect(result.method).toBe('netbanking');
    });
    
    test('should support wallet payments', async () => {
      const orderData = {
        amount: 500,
        currency: 'INR',
        method: 'wallet'
      };
      
      mockRazorpayInstance.orders.create.mockResolvedValue({
        id: 'order_123456',
        amount: 50000,
        method: 'wallet'
      });
      
      const result = await paymentService.createOrder(orderData);
      
      expect(result.method).toBe('wallet');
    });
  });
  
  describe('Currency Handling', () => {
    
    test('should default to INR currency', async () => {
      await paymentService.createOrder({
        amount: 500
      });
      
      expect(mockRazorpayInstance.orders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'INR'
        })
      );
    });
    
    test('should validate supported currencies', async () => {
      await expect(paymentService.createOrder({
        amount: 500,
        currency: 'INVALID'
      })).rejects.toThrow(/unsupported.*currency/i);
    });
    
    test('should handle currency conversion for reporting', async () => {
      const payment = {
        amount: 50000,
        currency: 'INR'
      };
      
      const converted = paymentService.convertCurrency(payment, 'USD');
      
      expect(converted.amount).toBeLessThan(payment.amount);
      expect(converted.currency).toBe('USD');
    });
  });
  
  describe('Error Handling', () => {
    
    test('should handle network timeouts', async () => {
      mockRazorpayInstance.orders.create.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );
      
      await expect(paymentService.createOrder({
        amount: 500,
        currency: 'INR'
      })).rejects.toThrow('Network timeout');
    });
    
    test('should handle API rate limiting', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.statusCode = 429;
      
      mockRazorpayInstance.orders.create.mockRejectedValue(rateLimitError);
      
      await expect(paymentService.createOrder({
        amount: 500,
        currency: 'INR'
      })).rejects.toThrow('Rate limit exceeded');
    });
    
    test('should handle invalid API credentials', async () => {
      const authError = new Error('Invalid key');
      authError.statusCode = 401;
      
      mockRazorpayInstance.orders.create.mockRejectedValue(authError);
      
      await expect(paymentService.createOrder({
        amount: 500,
        currency: 'INR'
      })).rejects.toThrow('Invalid key');
    });
  });
  
  describe('Logging and Audit', () => {
    
    test('should log payment creation', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockRazorpayInstance.orders.create.mockResolvedValue({
        id: 'order_123456',
        amount: 50000
      });
      
      await paymentService.createOrder({
        amount: 500,
        currency: 'INR'
      });
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(/order.*created/i)
      );
      
      logSpy.mockRestore();
    });
    
    test('should log refund operations', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockRazorpayInstance.payments.refund.mockResolvedValue({
        id: 'rfnd_123456',
        amount: 50000
      });
      
      await paymentService.refundPayment('pay_789012');
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(/refund.*initiated/i)
      );
      
      logSpy.mockRestore();
    });
    
    test('should maintain audit trail of payment operations', async () => {
      await paymentService.createOrder({ amount: 500, currency: 'INR' });
      await paymentService.createOrder({ amount: 300, currency: 'INR' });
      
      const auditLog = paymentService.getAuditLog();
      
      expect(auditLog).toHaveLength(2);
      expect(auditLog[0].operation).toBe('CREATE_ORDER');
      expect(auditLog[1].operation).toBe('CREATE_ORDER');
    });
  });
  
  describe('Configuration', () => {
    
    test('should initialize with API credentials', () => {
      const originalEnv = process.env;
      
      process.env.RAZORPAY_KEY_ID = 'test_key_id';
      process.env.RAZORPAY_KEY_SECRET = 'test_key_secret';
      
      paymentService.initialize();
      
      expect(Razorpay).toHaveBeenCalledWith({
        key_id: 'test_key_id',
        key_secret: 'test_key_secret'
      });
      
      process.env = originalEnv;
    });
    
    test('should throw error for missing credentials', () => {
      const originalEnv = process.env;
      
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;
      
      expect(() => paymentService.initialize())
        .toThrow(/razorpay.*credentials.*missing/i);
      
      process.env = originalEnv;
    });
  });
});
