const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { errorResponse } = require('./helpers');

const prisma = new PrismaClient();

// Basic authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.warn('[AUTH] No token provided');
      return res.status(401).json(errorResponse('Access denied. No token provided.', 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.warn('[AUTH] JWT verification failed:', err.message);
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json(errorResponse('Invalid token.', 401));
      }
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json(errorResponse('Token expired.', 401));
      }
      return res.status(500).json(errorResponse('Authentication error.', 500));
    }

    // Get user from database with correct profile field names as per schema
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        studentProfile: true,
        coachProfile: true,
        instituteProfile: true,
        clubProfile: true,
        adminProfile: true
      }
    });

    if (!user) {
      console.warn('[AUTH] User not found for decoded.userId:', decoded.userId);
      return res.status(401).json(errorResponse('Invalid token. User not found.', 401));
    }

    if (!user.isActive) {
      console.warn('[AUTH] User is not active:', user.id);
      return res.status(401).json(errorResponse('Account is not active.', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[AUTH] Unexpected authentication error:', error);
    return res.status(500).json(errorResponse('Authentication error.', 500));
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(errorResponse('Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(errorResponse('Access denied. Insufficient permissions.', 403));
    }

    next();
  };
};

// Student-specific middleware
const requireStudent = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'STUDENT') {
      return res.status(403).json(errorResponse('Access denied. Student role required.', 403));
    }

    if (!req.user.studentProfile) {
      return res.status(403).json(errorResponse('Student profile not found.', 403));
    }

    req.student = req.user.studentProfile;
    next();
  } catch (error) {
    return res.status(500).json(errorResponse('Authorization error.', 500));
  }
};

// Coach-specific middleware
const requireCoach = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'COACH') {
      return res.status(403).json(errorResponse('Access denied. Coach role required.', 403));
    }

    if (!req.user.coachProfile) {
      return res.status(403).json(errorResponse('Coach profile not found.', 403));
    }

    req.coach = req.user.coachProfile;
    next();
  } catch (error) {
    return res.status(500).json(errorResponse('Authorization error.', 500));
  }
};

// Institute-specific middleware
const requireInstitute = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'INSTITUTE') {
      return res.status(403).json(errorResponse('Access denied. Institute role required.', 403));
    }

    if (!req.user.instituteProfile) {
      return res.status(403).json(errorResponse('Institute profile not found.', 403));
    }

    req.institute = req.user.instituteProfile;
    next();
  } catch (error) {
    return res.status(500).json(errorResponse('Authorization error.', 500));
  }
};

// Club-specific middleware
const requireClub = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'CLUB') {
      return res.status(403).json(errorResponse('Access denied. Club role required.', 403));
    }

    if (!req.user.clubProfile) {
      return res.status(403).json(errorResponse('Club profile not found.', 403));
    }

    req.club = req.user.clubProfile;
    next();
  } catch (error) {
    return res.status(500).json(errorResponse('Authorization error.', 500));
  }
};

// Admin-specific middleware
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json(errorResponse('Access denied. Admin role required.', 403));
    }

    if (!req.user.adminProfile) {
      return res.status(403).json(errorResponse('Admin profile not found.', 403));
    }

    req.admin = req.user.adminProfile;
    next();
  } catch (error) {
    return res.status(500).json(errorResponse('Authorization error.', 500));
  }
};

// Approval status middleware (for coaches/institutes pending approval)
const requireApproved = (req, res, next) => {
  // If you add approvalStatus to Coach/Institute, check here
  if (req.user.role === 'COACH' && req.coach?.approvalStatus !== 'APPROVED') {
    return res.status(403).json(errorResponse('Coach account pending approval.', 403));
  }

  if (req.user.role === 'INSTITUTE' && req.institute?.approvalStatus !== 'APPROVED') {
    return res.status(403).json(errorResponse('Institute account pending approval.', 403));
  }

  next();
};

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          studentProfile: true,
          coachProfile: true,
          instituteProfile: true,
          clubProfile: true,
          adminProfile: true
        }
      });

      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

/**
 * Legacy JWT Authentication Middleware (for backward compatibility)
 * Verifies JWT tokens from Authorization header
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'No token provided'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid token',
        message: 'Token verification failed'
      });
    }

    req.user = user;
    next();
  });
};

/**
 * Generate JWT Token
 * @param {Object} payload - User data to encode in token
 * @param {string} expiresIn - Token expiration time (default: 24h)
 * @returns {string} JWT Token
 */
const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback_secret_key',
    { expiresIn }
  );
};

/**
 * Verify JWT Token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = {
  authenticate,
  authorize,
  requireStudent,
  requireCoach,
  requireInstitute,
  requireClub,
  requireAdmin,
  requireApproved,
  optionalAuth,
  authenticateToken,
  generateToken,
  verifyToken
};