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
    console.log('🔍 Fetching admin dashboard data...');

    // Get basic stats with individual error handling
    const stats = {};

    try {
      stats.totalUsers = await prisma.user.count();
    } catch (error) {
      console.error('Error counting total users:', error);
      stats.totalUsers = 0;
    }

    try {
      stats.totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    } catch (error) {
      console.error('Error counting students:', error);
      stats.totalStudents = 0;
    }

    try {
      stats.totalCoaches = await prisma.user.count({ where: { role: 'COACH' } });
    } catch (error) {
      console.error('Error counting coaches:', error);
      stats.totalCoaches = 0;
    }

    try {
      stats.totalInstitutes = await prisma.user.count({ where: { role: 'INSTITUTE' } });
    } catch (error) {
      console.error('Error counting institutes:', error);
      stats.totalInstitutes = 0;
    }

    try {
      stats.totalClubs = await prisma.user.count({ where: { role: 'CLUB' } });
    } catch (error) {
      console.error('Error counting clubs:', error);
      stats.totalClubs = 0;
    }

    // Get pending approvals with error handling
    try {
      stats.pendingCoachApprovals = await prisma.user.count({
        where: { 
          role: 'COACH',
          isVerified: true,
          isActive: false
        }
      });
    } catch (error) {
      console.error('Error counting pending coach approvals:', error);
      stats.pendingCoachApprovals = 0;
    }

    try {
      stats.pendingInstituteApprovals = await prisma.user.count({
        where: { 
          role: 'INSTITUTE',
          isVerified: true,
          isActive: false
        }
      });
    } catch (error) {
      console.error('Error counting pending institute approvals:', error);
      stats.pendingInstituteApprovals = 0;
    }

    // Set default values for features not yet implemented
    stats.totalEvents = 0;
    stats.totalConnections = 0;

    // Get recent registrations with error handling
    let recentRegistrations = [];
    try {
      recentRegistrations = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          studentProfile: {
            select: { name: true }
          },
          coachProfile: {
            select: { name: true }
          },
          instituteProfile: {
            select: { name: true }
          },
          clubProfile: {
            select: { name: true }
          },
          adminProfile: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 15
      });
    } catch (error) {
      console.error('Error fetching recent registrations:', error);
      recentRegistrations = [];
    }

    // Calculate monthly growth with error handling
    let monthlyGrowth = 0;
    try {
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const lastMonth = new Date(thisMonth);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const thisMonthUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: thisMonth
          }
        }
      });

      const lastMonthUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: thisMonth
          }
        }
      });

      if (lastMonthUsers > 0) {
        monthlyGrowth = ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100;
      } else {
        monthlyGrowth = thisMonthUsers > 0 ? 100 : 0;
      }
      monthlyGrowth = Math.round(monthlyGrowth * 100) / 100;
    } catch (error) {
      console.error('Error calculating monthly growth:', error);
      monthlyGrowth = 0;
    }

    stats.monthlyGrowth = monthlyGrowth;

    // Format recent registrations
    const formattedRecentRegistrations = recentRegistrations.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      name: user.studentProfile?.name || 
            user.coachProfile?.name || 
            user.instituteProfile?.name || 
            user.clubProfile?.name || 
            user.adminProfile?.name || 
            'Unknown'
    }));

    const dashboardData = {
      stats,
      recentUsers: formattedRecentRegistrations,
      monthlyRegistrations: [] // Placeholder for now
    };

    console.log('✅ Admin dashboard data fetched successfully');
    res.json(successResponse(dashboardData, 'Dashboard data retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get admin dashboard error:', error);
    res.status(500).json(errorResponse('Failed to retrieve dashboard data.', 500));
  }
});

// Get admin stats endpoint
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching admin stats...');

    // Get basic user counts with error handling
    const stats = {};

    try {
      stats.totalUsers = await prisma.user.count();
    } catch (error) {
      console.error('Error counting total users:', error);
      stats.totalUsers = 0;
    }

    try {
      stats.totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    } catch (error) {
      console.error('Error counting students:', error);
      stats.totalStudents = 0;
    }

    try {
      stats.totalCoaches = await prisma.user.count({ where: { role: 'COACH' } });
    } catch (error) {
      console.error('Error counting coaches:', error);
      stats.totalCoaches = 0;
    }

    try {
      stats.totalInstitutes = await prisma.user.count({ where: { role: 'INSTITUTE' } });
    } catch (error) {
      console.error('Error counting institutes:', error);
      stats.totalInstitutes = 0;
    }

    try {
      stats.totalClubs = await prisma.user.count({ where: { role: 'CLUB' } });
    } catch (error) {
      console.error('Error counting clubs:', error);
      stats.totalClubs = 0;
    }

    try {
      stats.totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });
    } catch (error) {
      console.error('Error counting admins:', error);
      stats.totalAdmins = 0;
    }

    try {
      stats.activeUsers = await prisma.user.count({ where: { isActive: true } });
    } catch (error) {
      console.error('Error counting active users:', error);
      stats.activeUsers = 0;
    }

    try {
      stats.verifiedUsers = await prisma.user.count({ where: { isVerified: true } });
    } catch (error) {
      console.error('Error counting verified users:', error);
      stats.verifiedUsers = 0;
    }

    // Calculate pending approvals (users who are verified but not active)
    try {
      stats.pendingApprovals = await prisma.user.count({
        where: {
          isVerified: true,
          isActive: false,
          role: { in: ['COACH', 'INSTITUTE'] }
        }
      });
    } catch (error) {
      console.error('Error counting pending approvals:', error);
      stats.pendingApprovals = 0;
    }

    // Calculate monthly growth
    try {
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const lastMonth = new Date(thisMonth);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const thisMonthUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: thisMonth
          }
        }
      });

      const lastMonthUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: thisMonth
          }
        }
      });

      if (lastMonthUsers > 0) {
        stats.monthlyGrowth = ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100;
      } else {
        stats.monthlyGrowth = thisMonthUsers > 0 ? 100 : 0;
      }
      stats.monthlyGrowth = Math.round(stats.monthlyGrowth * 100) / 100;
    } catch (error) {
      console.error('Error calculating monthly growth:', error);
      stats.monthlyGrowth = 0;
    }

    console.log('✅ Admin stats fetched successfully:', stats);
    res.json(successResponse(stats, 'Stats retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get admin stats error:', error);
    res.status(500).json(errorResponse('Failed to retrieve stats.', 500));
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

// Update user status (activate/deactivate)
router.patch('/users/:userId/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json(errorResponse('isActive must be a boolean value.', 400));
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      include: {
        studentProfile: true,
        coachProfile: true,
        instituteProfile: true,
        clubProfile: true
      }
    });

    res.json(successResponse({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        name: updatedUser.studentProfile?.name || 
              updatedUser.coachProfile?.name || 
              updatedUser.instituteProfile?.name || 
              updatedUser.clubProfile?.name || 
              'Unknown'
      }
    }, `User ${isActive ? 'activated' : 'deactivated'} successfully.`));

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json(errorResponse('Failed to update user status.', 500));
  }
});

// Delete user (soft delete)
router.delete('/users/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Soft delete by deactivating the user
    const deletedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: false,
        // Note: Add deletedAt field to your schema if needed
      }
    });

    res.json(successResponse(null, 'User deleted successfully.'));

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json(errorResponse('Failed to delete user.', 500));
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