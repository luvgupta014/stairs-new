/**
 * Async Route Wrapper - Catches all async errors automatically
 * 
 * Usage:
 *   router.get('/endpoint', asyncHandler(async (req, res) => {
 *     // Your code here - errors are caught automatically
 *   }));
 */

const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('🔴 Route Error:', error);
    console.error('Request:', {
      method: req.method,
      path: req.path,
      params: req.params,
      query: req.query,
    });
    console.error('Error Stack:', error.stack);

    // Return error response
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  });
};

module.exports = asyncHandler;
