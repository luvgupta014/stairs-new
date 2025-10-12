const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../utils/authMiddleware');
const { 
  successResponse, 
  errorResponse, 
  getPaginationParams, 
  getPaginationMeta,
  hashPassword
} = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

// Admin login
router.post('/login/admin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json(errorResponse('Email and password are required.', 400));
    }

    // Find admin user
    const user = await prisma.user.findUnique({
      where: { 
        email,
        role: 'ADMIN',
        isActive: true
      },
      include: {
        adminProfile: true
      }
    });

    if (!user) {
      return res.status(401).json(errorResponse('Invalid credentials.', 401));
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json(errorResponse('Invalid credentials.', 401));
    }

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role,
        adminId: user.adminProfile.id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await prisma.admin.update({
      where: { userId: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Return success response
    res.json(successResponse({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified
      },
      admin: user.adminProfile,
      token
    }, 'Admin login successful.'));

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json(errorResponse('Login failed.', 500));
  }
});

// Get admin profile
router.get('/profile', authenticate, requireAdmin, async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            isActive: true,
            isVerified: true,
            createdAt: true
          }
        }
      }
    });

    if (!admin) {
      return res.status(404).json(errorResponse('Admin profile not found.', 404));
    }

    res.json(successResponse(admin, 'Admin profile retrieved successfully.'));

  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json(errorResponse('Failed to retrieve profile.', 500));
  }
});

// Get dashboard analytics
router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalCoaches,
      totalInstitutes,
      totalClubs,
      pendingCoachApprovals,
      pendingInstituteApprovals,
      totalEvents,
      totalConnections,
      recentRegistrations
    ] = await Promise.all([
      prisma.user.count(),
      prisma.student.count(),
      prisma.coach.count(),
      prisma.institute.count(),
      prisma.club.count(),
      prisma.coach.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.institute.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.event.count(),
      prisma.studentCoachConnection.count({ where: { status: 'ACTIVE' } }),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          studentProfile: {
            select: {
              name: true
            }
          },
          coachProfile: {
            select: {
              name: true
            }
          },
          instituteProfile: {
            select: {
              name: true
            }
          },
          clubProfile: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 15
      })
    ]);

    // Get user registrations by month for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRegistrations = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: sixMonthsAgo }
      },
      _count: { id: true }
    });

    res.json(successResponse({
      stats: {
        totalUsers,
        totalStudents,
        totalCoaches,
        totalInstitutes,
        totalClubs,
        pendingCoachApprovals,
        pendingInstituteApprovals,
        totalEvents,
        totalConnections
      },
      recentRegistrations,
      monthlyRegistrations
    }, 'Dashboard data retrieved successfully.'));

  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json(errorResponse('Failed to retrieve dashboard data.', 500));
  }
});

// Get all users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { 
      role, 
      status, 
      search, 
      page = 1, 
      limit = 10 
    } = req.query;

    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      ...(role && { role: role.toUpperCase() }),
      ...(status && { status: status.toUpperCase() }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { student: { 
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } }
            ]
          }},
          { coach: { 
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } }
            ]
          }},
          { institute: { name: { contains: search, mode: 'insensitive' } } },
          { club: { name: { contains: search, mode: 'insensitive' } } }
        ]
      })
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          studentProfile: {
            select: {
              id: true,
              name: true,
              sport: true,
              level: true
            }
          },
          coachProfile: {
            select: {
              id: true,
              name: true,
              specialization: true,
              rating: true
            }
          },
          instituteProfile: {
            select: {
              id: true,
              name: true
            }
          },
          clubProfile: {
            select: {
              id: true,
              name: true
            }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      users,
      pagination
    }, 'Users retrieved successfully.'));

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json(errorResponse('Failed to retrieve users.', 500));
  }
});

// Get pending coach approvals
router.get('/pending-coaches', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    const where = { approvalStatus: 'PENDING' };

    const [coaches, total] = await Promise.all([
      prisma.coach.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              createdAt: true
            }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'asc' } // Oldest first for approval queue
      }),
      prisma.coach.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      coaches,
      pagination
    }, 'Pending coach approvals retrieved successfully.'));

  } catch (error) {
    console.error('Get pending coaches error:', error);
    res.status(500).json(errorResponse('Failed to retrieve pending coaches.', 500));
  }
});

// Approve/Reject coach
router.put('/coaches/:coachId/approval', authenticate, requireAdmin, async (req, res) => {
  try {
    const { coachId } = req.params;
    const { action, remarks } = req.body; // action: 'APPROVE' or 'REJECT'

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json(errorResponse('Action must be APPROVE or REJECT.', 400));
    }

    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
      include: {
        user: {
          select: {
            email: true,
            phone: true
          }
        }
      }
    });

    if (!coach) {
      return res.status(404).json(errorResponse('Coach not found.', 404));
    }

    if (coach.approvalStatus !== 'PENDING') {
      return res.status(400).json(errorResponse('Coach approval is not pending.', 400));
    }

    const updatedCoach = await prisma.coach.update({
      where: { id: coachId },
      data: {
        approvalStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        approvalRemarks: remarks,
        approvedBy: req.admin.id,
        approvedAt: new Date()
      },
      include: {
        user: {
          select: {
            email: true,
            phone: true
          }
        }
      }
    });

    // TODO: Send notification to coach about approval/rejection

    res.json(successResponse(updatedCoach, `Coach ${action.toLowerCase()}d successfully.`));

  } catch (error) {
    console.error('Coach approval error:', error);
    res.status(500).json(errorResponse('Failed to process coach approval.', 500));
  }
});

// Get pending institute approvals
router.get('/pending-institutes', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    const where = { approvalStatus: 'PENDING' };

    const [institutes, total] = await Promise.all([
      prisma.institute.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              students: true,
              coaches: true
            }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'asc' }
      }),
      prisma.institute.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      institutes,
      pagination
    }, 'Pending institute approvals retrieved successfully.'));

  } catch (error) {
    console.error('Get pending institutes error:', error);
    res.status(500).json(errorResponse('Failed to retrieve pending institutes.', 500));
  }
});

// Approve/Reject institute
router.put('/institutes/:instituteId/approval', authenticate, requireAdmin, async (req, res) => {
  try {
    const { instituteId } = req.params;
    const { action, remarks } = req.body;

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json(errorResponse('Action must be APPROVE or REJECT.', 400));
    }

    const institute = await prisma.institute.findUnique({
      where: { id: instituteId },
      include: {
        user: {
          select: {
            email: true,
            phone: true
          }
        }
      }
    });

    if (!institute) {
      return res.status(404).json(errorResponse('Institute not found.', 404));
    }

    if (institute.approvalStatus !== 'PENDING') {
      return res.status(400).json(errorResponse('Institute approval is not pending.', 400));
    }

    const updatedInstitute = await prisma.institute.update({
      where: { id: instituteId },
      data: {
        approvalStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        approvalRemarks: remarks,
        approvedBy: req.admin.id,
        approvedAt: new Date()
      },
      include: {
        user: {
          select: {
            email: true,
            phone: true
          }
        }
      }
    });

    // TODO: Send notification to institute about approval/rejection

    res.json(successResponse(updatedInstitute, `Institute ${action.toLowerCase()}d successfully.`));

  } catch (error) {
    console.error('Institute approval error:', error);
    res.status(500).json(errorResponse('Failed to process institute approval.', 500));
  }
});

// Get all events for moderation
router.get('/events', authenticate, requireAdmin, async (req, res) => {
  try {
    const { 
      status, 
      sport, 
      search, 
      page = 1, 
      limit = 10 
    } = req.query;

    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      ...(status && { status: status.toUpperCase() }),
      ...(sport && { sport: { contains: sport, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              user: {
                select: {
                  email: true,
                  phone: true
                }
              }
            }
          },
          _count: {
            select: {
              registrations: true
            }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.event.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      events,
      pagination
    }, 'Events retrieved successfully.'));

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json(errorResponse('Failed to retrieve events.', 500));
  }
});

// Moderate event (approve/reject/suspend)
router.put('/events/:eventId/moderate', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { action, remarks } = req.body; // action: 'APPROVE', 'REJECT', 'SUSPEND'

    if (!['APPROVE', 'REJECT', 'SUSPEND'].includes(action)) {
      return res.status(400).json(errorResponse('Action must be APPROVE, REJECT, or SUSPEND.', 400));
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    let newStatus;
    switch (action) {
      case 'APPROVE':
        newStatus = 'PUBLISHED';
        break;
      case 'REJECT':
        newStatus = 'REJECTED';
        break;
      case 'SUSPEND':
        newStatus = 'SUSPENDED';
        break;
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: newStatus,
        moderationRemarks: remarks,
        moderatedBy: req.admin.id,
        moderatedAt: new Date()
      },
      include: {
        organizer: {
          select: {
            firstName: true,
            lastName: true,
            user: {
              select: {
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    // TODO: Send notification to organizer about moderation decision

    res.json(successResponse(updatedEvent, `Event ${action.toLowerCase()}d successfully.`));

  } catch (error) {
    console.error('Event moderation error:', error);
    res.status(500).json(errorResponse('Failed to moderate event.', 500));
  }
});

// Create admin user
router.post('/create-admin', authenticate, requireAdmin, async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      password,
      role = 'MODERATOR' // SUPER_ADMIN, MODERATOR
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json(errorResponse('All fields are required.', 400));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json(errorResponse('User with this email or phone already exists.', 409));
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        phoneVerified: true,
        admin: {
          create: {
            firstName,
            lastName,
            role: role.toUpperCase()
          }
        }
      },
      include: {
        admin: true
      }
    });

    res.status(201).json(successResponse({
      id: user.id,
      email: user.email,
      phone: user.phone,
      admin: user.admin
    }, 'Admin user created successfully.', 201));

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json(errorResponse('Failed to create admin user.', 500));
  }
});

// Get user activity logs
router.get('/users/:userId/activity', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json(errorResponse('User not found.', 404));
    }

    // Get activity based on user role
    let activities = [];

    if (user.role === 'STUDENT') {
      const studentActivities = await prisma.studentCoachConnection.findMany({
        where: { 
          student: { userId: userId }
        },
        include: {
          coach: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit)
      });

      const eventRegistrations = await prisma.eventRegistration.findMany({
        where: {
          student: { userId: userId }
        },
        include: {
          event: {
            select: {
              title: true,
              startDate: true
            }
          }
        },
        orderBy: { registrationDate: 'desc' },
        take: parseInt(limit)
      });

      activities = [
        ...studentActivities.map(conn => ({
          type: 'CONNECTION',
          action: `Connected with coach ${conn.coach.firstName} ${conn.coach.lastName}`,
          date: conn.createdAt,
          status: conn.status
        })),
        ...eventRegistrations.map(reg => ({
          type: 'EVENT_REGISTRATION',
          action: `Registered for event ${reg.event.title}`,
          date: reg.registrationDate,
          status: reg.status
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Similar logic for other user types...

    res.json(successResponse({
      user,
      activities: activities.slice(0, parseInt(limit))
    }, 'User activity retrieved successfully.'));

  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json(errorResponse('Failed to retrieve user activity.', 500));
  }
});

// Block/Unblock user
router.put('/users/:userId/block', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, reason } = req.body; // action: 'BLOCK' or 'UNBLOCK'

    if (!['BLOCK', 'UNBLOCK'].includes(action)) {
      return res.status(400).json(errorResponse('Action must be BLOCK or UNBLOCK.', 400));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json(errorResponse('User not found.', 404));
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json(errorResponse('Cannot block admin users.', 400));
    }

    const newStatus = action === 'BLOCK' ? 'BLOCKED' : 'ACTIVE';

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: newStatus,
        blockedReason: action === 'BLOCK' ? reason : null,
        blockedBy: action === 'BLOCK' ? req.admin.id : null,
        blockedAt: action === 'BLOCK' ? new Date() : null
      }
    });

    res.json(successResponse(updatedUser, `User ${action.toLowerCase()}ed successfully.`));

  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json(errorResponse('Failed to block/unblock user.', 500));
  }
});

module.exports = router;