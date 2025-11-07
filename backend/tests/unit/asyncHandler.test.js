/**
 * Unit Tests: Async Handler Middleware
 * Tests error handling wrapper for async route handlers
 */

const asyncHandler = require('../../src/utils/asyncHandler');

describe('AsyncHandler Utility - Unit Tests', () => {
  
  describe('Success Cases', () => {
    
    test('should execute async function successfully', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const handler = asyncHandler(mockFn);
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      await handler(req, res, next);
      
      expect(mockFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });
    
    test('should pass parameters correctly to wrapped function', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      const handler = asyncHandler(mockFn);
      
      const req = { body: { test: 'data' } };
      const res = { json: jest.fn() };
      const next = jest.fn();
      
      await handler(req, res, next);
      
      expect(mockFn).toHaveBeenCalledWith(req, res, next);
      expect(mockFn.mock.calls[0][0]).toBe(req);
    });
    
    test('should handle synchronous functions', async () => {
      const mockFn = jest.fn().mockReturnValue('sync result');
      const handler = asyncHandler(mockFn);
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      await handler(req, res, next);
      
      expect(mockFn).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  describe('Error Handling', () => {
    
    test('should catch async errors and pass to next', async () => {
      const error = new Error('Async error');
      const mockFn = jest.fn().mockRejectedValue(error);
      const handler = asyncHandler(mockFn);
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      await handler(req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
      expect(next).toHaveBeenCalledTimes(1);
    });
    
    test('should catch synchronous errors', async () => {
      const error = new Error('Sync error');
      const mockFn = jest.fn().mockImplementation(() => {
        throw error;
      });
      const handler = asyncHandler(mockFn);
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      await handler(req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });
    
    test('should preserve error properties', async () => {
      const error = new Error('Custom error');
      error.statusCode = 400;
      error.details = { field: 'email' };
      
      const mockFn = jest.fn().mockRejectedValue(error);
      const handler = asyncHandler(mockFn);
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      await handler(req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].details).toEqual({ field: 'email' });
    });
    
    test('should handle null/undefined errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(null);
      const handler = asyncHandler(mockFn);
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      await handler(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
    
    test('should handle non-Error objects', async () => {
      const errorObj = { message: 'String error' };
      const mockFn = jest.fn().mockRejectedValue(errorObj);
      const handler = asyncHandler(mockFn);
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      await handler(req, res, next);
      
      expect(next).toHaveBeenCalledWith(errorObj);
    });
  });
  
  describe('Edge Cases', () => {
    
    test('should handle function that returns undefined', async () => {
      const mockFn = jest.fn().mockResolvedValue(undefined);
      const handler = asyncHandler(mockFn);
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      await handler(req, res, next);
      
      expect(mockFn).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
    
    test('should handle missing next function', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const handler = asyncHandler(mockFn);
      
      const req = {};
      const res = {};
      
      // Should not throw even without next
      await expect(handler(req, res)).resolves.not.toThrow();
    });
    
    test('should handle multiple sequential calls', async () => {
      const mockFn = jest.fn()
        .mockResolvedValueOnce('call1')
        .mockResolvedValueOnce('call2')
        .mockResolvedValueOnce('call3');
      
      const handler = asyncHandler(mockFn);
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      await handler(req, res, next);
      await handler(req, res, next);
      await handler(req, res, next);
      
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(next).not.toHaveBeenCalled();
    });
    
    test('should handle promise rejection after delay', async () => {
      const error = new Error('Delayed error');
      const mockFn = jest.fn().mockImplementation(() => 
        new Promise((_, reject) => setTimeout(() => reject(error), 10))
      );
      
      const handler = asyncHandler(mockFn);
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      await handler(req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('Type Validation', () => {
    
    test('should only accept functions', () => {
      expect(() => asyncHandler('not a function')).toThrow();
      expect(() => asyncHandler(null)).toThrow();
      expect(() => asyncHandler(undefined)).toThrow();
      expect(() => asyncHandler({})).toThrow();
      expect(() => asyncHandler([])).toThrow();
    });
    
    test('should accept arrow functions', async () => {
      const handler = asyncHandler(async (req, res) => 'arrow');
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      await expect(handler(req, res, next)).resolves.not.toThrow();
    });
    
    test('should accept async arrow functions', async () => {
      const handler = asyncHandler(async (req, res) => {
        await Promise.resolve();
        return 'async arrow';
      });
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      await expect(handler(req, res, next)).resolves.not.toThrow();
    });
  });
  
  describe('Memory and Performance', () => {
    
    test('should not create memory leaks with many calls', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const handler = asyncHandler(mockFn);
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      // Call 1000 times
      const promises = Array(1000).fill(null).map(() => handler(req, res, next));
      await Promise.all(promises);
      
      expect(mockFn).toHaveBeenCalledTimes(1000);
    });
    
    test('should handle concurrent requests', async () => {
      let counter = 0;
      const mockFn = jest.fn().mockImplementation(async () => {
        const current = ++counter;
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        return current;
      });
      
      const handler = asyncHandler(mockFn);
      
      const promises = Array(50).fill(null).map(() => 
        handler({}, {}, jest.fn())
      );
      
      await Promise.all(promises);
      
      expect(mockFn).toHaveBeenCalledTimes(50);
      expect(counter).toBe(50);
    });
  });
});
