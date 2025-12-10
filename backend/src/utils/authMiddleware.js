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

    // Handle demo tokens for development
    if (token.startsWith('demo-token-')) {
      console.log('[AUTH] Demo token detected:', token);
      const parts = token.split('-');
      if (parts.length >= 3) {
        const role = parts[2].toUpperCase();
        const demoUser = {
          id: `demo-${role.toLowerCase()}-${parts[3] || Date.now()}`,
          email: `demo@${role.toLowerCase()}.com`,
          role: role,
          name: `Demo ${role.charAt(0) + role.slice(1).toLowerCase()}`,
          isActive: true,
          studentProfile: role === 'STUDENT' ? {
            id: `demo-student-profile-${parts[3] || Date.now()}`,
            userId: `demo-${role.toLowerCase()}-${parts[3] || Date.now()}`,
            firstName: 'Demo',
            lastName: 'Student',
            phone: '+1234567890',
            dateOfBirth: new Date('1990-01-01'),
            parentContact: '+1234567891',
            schoolName: 'Demo School',
            grade: '10th',
            createdAt: new Date(),
            updatedAt: new Date()
          } : null,
          coachProfile: role === 'COACH' ? {
            id: `demo-coach-profile-${parts[3] || Date.now()}`,
            userId: `demo-${role.toLowerCase()}-${parts[3] || Date.now()}`,
            firstName: 'Demo',
            lastName: 'Coach',
            phone: '+1234567890',
            experience: '5 years',
            specialization: 'Football',
            createdAt: new Date(),
            updatedAt: new Date()
          } : null
        };
        req.user = demoUser;
        console.log('[AUTH] Demo user set:', demoUser.role);
        return next();
      }
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

    console.log('[AUTH] User loaded successfully:', {
      id: user.id,
      role: user.role,
      email: user.email,
      hasStudentProfile: !!user.studentProfile,
      studentProfileId: user.studentProfile?.id
    });

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
    console.log('[AUTH] Student middleware - student ID:', req.student.id);
    next();
  } catch (error) {
    console.error('[AUTH] Student middleware error:', error);
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

// Event Incharge-specific middleware (role-only, no separate profile)
const requireEventIncharge = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'EVENT_INCHARGE') {
      return res.status(403).json(errorResponse('Access denied. Event Incharge role required.', 403));
    }
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
 * Generic role requirement middleware
 * @param {Array} allowedRoles - Array of allowed roles
 * @returns {Function} Middleware function
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(errorResponse('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(errorResponse(
        `Access denied. Required roles: ${allowedRoles.join(', ')}`, 
        403
      ));
    }

    next();
  };
};

/**
 * Check per-event permission for assigned roles.
 * Grants access if:
 *  - Admin
 *  - Coach who owns the event
 *  - Assigned user (INCHARGE/COORDINATOR/TEAM) with permission flag
 */
const checkEventPermission = async ({ user, eventId, permissionKey }) => {
  if (!user || !eventId) {
    throw new Error('Missing user or eventId for permission check');
  }

  // Admin bypass
  if (user.role === 'ADMIN') return true;

  // Coach owning the event bypass
  if (user.role === 'COACH') {
    const owns = await prisma.event.findFirst({
      where: { id: eventId, coachId: user.coachProfile?.id },
      select: { id: true }
    });
    if (owns) return true;
  }

  // Assigned roles check
  const assignments = await prisma.eventAssignment.findMany({
    where: { eventId, userId: user.id },
    select: { role: true }
  });

  if (!assignments || assignments.length === 0) return false;

  const roles = assignments.map(a => a.role);
  const perms = await prisma.eventPermission.findMany({
    where: { eventId, role: { in: roles } },
    select: {
      role: true,
      resultUpload: true,
      studentManagement: true,
      certificateManagement: true,
      feeManagement: true
    }
  });

  if (!perms || perms.length === 0) return false;

  return perms.some(p => !!p[permissionKey]);
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
  requireEventIncharge,
  requireInstitute,
  requireClub,
  requireAdmin,
  requireApproved,
  requireRole,
  optionalAuth,
  authenticateToken,
  generateToken,
  verifyToken,
  checkEventPermission
};