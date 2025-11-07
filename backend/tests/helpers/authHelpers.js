/**
 * Authentication Helper for Tests
 * Provides utilities for login, token generation, and auth testing
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const request = require('supertest');

/**
 * Generate JWT token
 */
const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn }
  );
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key');
  } catch (error) {
    return null;
  }
};

/**
 * Hash password
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

/**
 * Compare password
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate expired token
 */
const generateExpiredToken = (payload) => {
  return generateToken(payload, '-1h'); // Expired 1 hour ago
};

/**
 * Generate invalid token
 */
const generateInvalidToken = () => {
  return 'invalid.token.string';
};

/**
 * Login as user and get token
 */
const loginAs = async (app, credentials) => {
  const response = await request(app)
    .post('/api/auth/login')
    .send(credentials);
  
  if (response.status === 200) {
    return {
      token: response.body.token,
      user: response.body.user
    };
  }
  
  throw new Error(`Login failed: ${response.body.error || 'Unknown error'}`);
};

/**
 * Register and login new user
 */
const registerAndLogin = async (app, userData) => {
  // Register
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send(userData);
  
  if (registerResponse.status !== 201) {
    throw new Error(`Registration failed: ${registerResponse.body.error || 'Unknown error'}`);
  }
  
  // Login
  return await loginAs(app, {
    email: userData.email,
    password: userData.password
  });
};

/**
 * Create authenticated request headers
 */
const authHeaders = (token) => {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Test role-based access
 */
const testRoleAccess = async (app, endpoint, method, requiredRole, token) => {
  const methodMap = {
    'GET': request(app).get(endpoint),
    'POST': request(app).post(endpoint),
    'PUT': request(app).put(endpoint),
    'PATCH': request(app).patch(endpoint),
    'DELETE': request(app).delete(endpoint)
  };
  
  const req = methodMap[method.toUpperCase()];
  
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }
  
  const response = await req.send();
  
  return {
    status: response.status,
    hasAccess: response.status !== 401 && response.status !== 403,
    body: response.body
  };
};

/**
 * Mock authentication middleware
 */
const mockAuthMiddleware = (userId, role) => {
  return (req, res, next) => {
    req.user = { id: userId, role };
    next();
  };
};

/**
 * Create test auth context
 */
const createAuthContext = async (app, role = 'STUDENT') => {
  const { generateUserData } = require('./testData');
  const userData = generateUserData(role);
  
  try {
    const { token, user } = await registerAndLogin(app, userData);
    return { token, user, credentials: userData };
  } catch (error) {
    throw new Error(`Failed to create auth context: ${error.message}`);
  }
};

/**
 * Test authentication scenarios
 */
const authScenarios = {
  noToken: {
    headers: {},
    expectedStatus: 401,
    description: 'No token provided'
  },
  invalidToken: {
    headers: { 'Authorization': 'Bearer invalid-token' },
    expectedStatus: 401,
    description: 'Invalid token format'
  },
  expiredToken: (userId) => ({
    headers: { 'Authorization': `Bearer ${generateExpiredToken({ userId, role: 'STUDENT' })}` },
    expectedStatus: 401,
    description: 'Expired token'
  }),
  malformedHeader: {
    headers: { 'Authorization': 'InvalidFormat token' },
    expectedStatus: 401,
    description: 'Malformed authorization header'
  },
  missingBearer: {
    headers: { 'Authorization': 'sometoken' },
    expectedStatus: 401,
    description: 'Missing Bearer prefix'
  }
};

/**
 * Test all auth scenarios for an endpoint
 */
const testAuthProtection = async (app, endpoint, method = 'GET') => {
  const results = {};
  
  for (const [scenario, config] of Object.entries(authScenarios)) {
    if (typeof config === 'function') continue; // Skip functions
    
    const req = request(app)[method.toLowerCase()](endpoint);
    
    if (config.headers && config.headers.Authorization) {
      req.set('Authorization', config.headers.Authorization);
    }
    
    const response = await req;
    results[scenario] = {
      passed: response.status === config.expectedStatus,
      actualStatus: response.status,
      expectedStatus: config.expectedStatus,
      description: config.description
    };
  }
  
  return results;
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateExpiredToken,
  generateInvalidToken,
  loginAs,
  registerAndLogin,
  authHeaders,
  testRoleAccess,
  mockAuthMiddleware,
  createAuthContext,
  authScenarios,
  testAuthProtection
};
