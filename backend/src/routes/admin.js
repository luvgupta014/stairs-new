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

    // ADDED: Get event statistics
    try {
      stats.totalEvents = await prisma.event.count();
      console.log(`📊 Total events: ${stats.totalEvents}`);
    } catch (error) {
      console.error('Error counting total events:', error);
      stats.totalEvents = 0;
    }

    try {
      stats.pendingEvents = await prisma.event.count({
        where: { status: 'PENDING' }
      });
      console.log(`⏳ Pending events: ${stats.pendingEvents}`);
    } catch (error) {
      console.error('Error counting pending events:', error);
      stats.pendingEvents = 0;
    }

    try {
      stats.approvedEvents = await prisma.event.count({
        where: { status: 'APPROVED' }
      });
    } catch (error) {
      console.error('Error counting approved events:', error);
      stats.approvedEvents = 0;
    }

    try {
      stats.activeEvents = await prisma.event.count({
        where: { status: 'ACTIVE' }
      });
    } catch (error) {
      console.error('Error counting active events:', error);
      stats.activeEvents = 0;
    }

    // Set default values for features not yet implemented
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
        take: 10
      });
    } catch (error) {
      console.error('Error fetching recent registrations:', error);
      recentRegistrations = [];
    }

    // ADDED: Get recent events for approval
    let recentEvents = [];
    try {
      recentEvents = await prisma.event.findMany({
        where: {
          status: 'PENDING'
        },
        include: {
          coach: {
            include: {
              user: {
                select: {
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      console.log(`📋 Recent pending events found: ${recentEvents.length}`);
    } catch (error) {
      console.error('Error fetching recent events:', error);
      recentEvents = [];
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

    // ADDED: Format recent events
    const formattedRecentEvents = recentEvents.map(event => ({
      id: event.id,
      name: event.name,
      sport: event.sport,
      venue: event.venue,
      city: event.city,
      startDate: event.startDate,
      endDate: event.endDate,
      maxParticipants: event.maxParticipants,
      eventFee: event.eventFee,
      status: event.status,
      createdAt: event.createdAt,
      coach: {
        id: event.coach?.id,
        name: event.coach?.name,
        email: event.coach?.user?.email
      }
    }));

    const dashboardData = {
      stats,
      recentUsers: formattedRecentRegistrations,
      recentEvents: formattedRecentEvents,          // ADDED: Include recent events
      pendingEvents: formattedRecentEvents,         // ADDED: Include pending events
      monthlyRegistrations: [] // Placeholder for now
    };

    console.log('✅ Admin dashboard data fetched successfully');
    console.log(`📊 Dashboard summary: ${stats.totalUsers} users, ${stats.totalEvents} events, ${stats.pendingEvents} pending`);
    
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

    console.log('🔍 Fetching events for admin approval...');

    const { skip, take } = getPaginationParams(page, limit);

    const where = {};
    
    // Add filters if provided
    if (status) where.status = status.toUpperCase();
    if (sport) where.sport = { contains: sport, mode: 'insensitive' };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },        // FIXED: name instead of title
        { description: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },       // FIXED: venue instead of location
        { city: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          coach: {                                                   // FIXED: coach instead of createdBy
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true
                }
              }
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

    // Format events for admin view with correct field names
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.name,                                            // FIXED: Map name to title for frontend
      name: event.name,
      description: event.description,
      sport: event.sport,
      location: event.venue,                                        // FIXED: Map venue to location for frontend
      venue: event.venue,
      address: event.address,
      city: event.city,
      state: event.state,
      startDate: event.startDate,
      endDate: event.endDate,
      maxParticipants: event.maxParticipants,
      currentParticipants: event.currentParticipants,
      registrationFee: event.eventFee,                              // FIXED: Map eventFee to registrationFee for frontend
      eventFee: event.eventFee,
      status: event.status,
      adminNotes: event.adminNotes,
      createdAt: event.createdAt,
      organizer: {
        id: event.coach?.user?.id,
        email: event.coach?.user?.email,
        role: event.coach?.user?.role,
        name: event.coach?.name || 'Unknown Coach'
      },
      coach: {
        id: event.coach?.id,
        name: event.coach?.name,
        primarySport: event.coach?.primarySport,
        city: event.coach?.city
      }
    }));

    res.json(successResponse({
      events: formattedEvents,
      pagination
    }, 'Events retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get events error:', error);
    res.status(500).json(errorResponse('Failed to retrieve events.', 500));
  }
});

// Moderate event (approve/reject/suspend) - CORRECTED for your schema
router.put('/events/:eventId/moderate', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { action, adminNotes, remarks } = req.body; // Accept both adminNotes and remarks

    console.log(`🔄 Admin moderating event ${eventId} with action: ${action}`);

    // Validate action
    const validActions = ['APPROVE', 'REJECT', 'SUSPEND', 'RESTART'];
    if (!validActions.includes(action)) {
      return res.status(400).json(errorResponse('Invalid action. Must be APPROVE, REJECT, SUSPEND, or RESTART.', 400));
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            user: { select: { id: true, email: true } }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    // Determine the new status based on action
    let newStatus;
    switch (action) {
      case 'APPROVE':
        newStatus = 'APPROVED';
        break;
      case 'REJECT':
        newStatus = 'REJECTED';
        break;
      case 'SUSPEND':
        newStatus = 'SUSPENDED';
        break;
      case 'RESTART':
        newStatus = 'APPROVED'; // Restart reactivates the event
        break;
      default:
        return res.status(400).json(errorResponse('Invalid action.', 400));
    }

    // Update event status
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: newStatus,
        adminNotes: adminNotes || remarks || null, // Accept either field name
        updatedAt: new Date()
      },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            user: { select: { id: true, email: true } }
          }
        }
      }
    });

    console.log(`✅ Event ${eventId} ${action.toLowerCase()}d successfully`);

    // Create notification for coach
    try {
      if (event.coach?.user?.id) {
        await prisma.notification.create({
          data: {
            userId: event.coach.user.id,
            type: 'EVENT_MODERATED',
            title: `Event ${action.charAt(0) + action.slice(1).toLowerCase()}d`,
            message: `Your event "${event.name}" has been ${action.toLowerCase()}d by an administrator.${adminNotes || remarks ? ` Reason: ${adminNotes || remarks}` : ''}`,
            data: {
              eventId: event.id,
              eventName: event.name,
              action: action,
              adminNotes: adminNotes || remarks
            }
          }
        });
      }
    } catch (notificationError) {
      console.error('⚠️ Failed to create notification:', notificationError);
      // Don't fail the request if notification creation fails
    }

    res.json(successResponse({
      event: updatedEvent,
      action: action,
      newStatus: newStatus
    }, `Event ${action.toLowerCase()}d successfully.`));

  } catch (error) {
    console.error('❌ Event moderation error:', error);
    
    // More detailed error logging
    if (error.code) {
      console.error('Database error code:', error.code);
    }
    if (error.meta) {
      console.error('Database error meta:', error.meta);
    }
    
    res.status(500).json(errorResponse(`Failed to moderate event: ${error.message}`, 500));
  }
});

// Get pending events for approval - CORRECTED for your schema
router.get('/pending-events', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    console.log('🔍 Fetching pending events for approval...');

    const where = { 
      status: 'PENDING' // Events waiting for admin approval
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          coach: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true
                }
              }
            }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'asc' } // Oldest first for approval queue
      }),
      prisma.event.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.name,
      name: event.name,
      description: event.description,
      sport: event.sport,
      location: event.venue,
      venue: event.venue,
      address: event.address,
      city: event.city,
      state: event.state,
      startDate: event.startDate,
      endDate: event.endDate,
      maxParticipants: event.maxParticipants,
      currentParticipants: event.currentParticipants,
      registrationFee: event.eventFee,
      eventFee: event.eventFee,
      status: event.status,
      createdAt: event.createdAt,
      organizer: {
        id: event.coach?.user?.id,
        email: event.coach?.user?.email,
        role: event.coach?.user?.role,
        name: event.coach?.name || 'Unknown Coach'
      },
      coach: {
        id: event.coach?.id,
        name: event.coach?.name,
        primarySport: event.coach?.primarySport,
        city: event.coach?.city
      }
    }));

    res.json(successResponse({
      events: formattedEvents,
      pagination
    }, 'Pending events retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get pending events error:', error);
    res.status(500).json(errorResponse('Failed to retrieve pending events.', 500));
  }
});

// Bulk approve/reject events - NEW ENDPOINT
router.put('/events/bulk-moderate', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventIds, action, remarks } = req.body;

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json(errorResponse('eventIds must be a non-empty array.', 400));
    }

    if (!['APPROVE', 'REJECT', 'SUSPEND'].includes(action)) {
      return res.status(400).json(errorResponse('Action must be APPROVE, REJECT, or SUSPEND.', 400));
    }

    console.log(`🔍 Bulk moderating ${eventIds.length} events with action: ${action}`);

    try {
      let newStatus;
      switch (action) {
        case 'APPROVE':
          newStatus = 'APPROVED';
          break;
        case 'REJECT':
          newStatus = 'REJECTED';
          break;
        case 'SUSPEND':
          newStatus = 'SUSPENDED';
          break;
      }

      const updatedEvents = await prisma.event.updateMany({
        where: {
          id: { in: eventIds },
          status: 'PENDING' // Only update pending events
        },
        data: {
          status: newStatus,
          moderationRemarks: remarks,
          moderatedBy: req.user.id,
          moderatedAt: new Date()
        }
      });

      console.log(`✅ Bulk moderated ${updatedEvents.count} events`);

      res.json(successResponse({
        updatedCount: updatedEvents.count
      }, `${updatedEvents.count} events ${action.toLowerCase()}d successfully.`));

    } catch (error) {
      if (error.code === 'P2021' || error.message.includes('does not exist')) {
        return res.status(501).json(errorResponse('Event moderation system not yet implemented.', 501));
      }
      throw error;
    }

  } catch (error) {
    console.error('❌ Bulk event moderation error:', error);
    res.status(500).json(errorResponse('Failed to bulk moderate events.', 500));
  }
});

// Get event participants (Admin access)
router.get('/events/:eventId/participants', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    console.log(`👥 Admin viewing participants for event ${eventId}`);

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        coach: {
          select: { id: true, name: true }
        }
      }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    const [registrations, total] = await Promise.all([
      prisma.eventRegistration.findMany({
        where: { eventId },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              sport: true,
              level: true,
              school: true,
              club: true,
              dateOfBirth: true,
              address: true,
              state: true,
              district: true,
              pincode: true,
              fatherName: true,
              achievements: true,
              coachName: true,
              coachMobile: true,
              user: {
                select: {
                  email: true,
                  phone: true
                }
              }
            }
          }
        },
        skip,
        take,
        orderBy: {
          createdAt: 'asc'
        }
      }),
      prisma.eventRegistration.count({ where: { eventId } })
    ]);

    console.log(`👥 Found ${total} participants for event ${event.name}`);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      event: {
        id: event.id,
        name: event.name,
        startDate: event.startDate,
        endDate: event.endDate,
        venue: event.venue,
        maxParticipants: event.maxParticipants,
        currentParticipants: total,
        coach: event.coach
      },
      registrations,
      pagination
    }, 'Event participants retrieved successfully.'));

  } catch (error) {
    console.error('Get event participants error:', error);
    res.status(500).json(errorResponse('Failed to retrieve event participants.', 500));
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
          action: `Connected with coach ${conn.coach.name}`,
          date: conn.createdAt,
          status: conn.status
        })),
        ...eventRegistrations.map(reg => ({
          type: 'EVENT_REGISTRATION',
          action: `Registered for event ${reg.event.name || reg.event.title}`,
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

// Event Orders Management

// Get all event orders for admin
router.get('/orders', authenticate, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      eventId, 
      coachId, 
      search,
      urgentOnly 
    } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    console.log('🔍 Fetching event orders for admin...');

    const where = {
      ...(status && { status: status.toUpperCase() }),
      ...(eventId && { eventId }),
      ...(coachId && { coachId }),
      ...(urgentOnly === 'true' && { urgentDelivery: true }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { event: { name: { contains: search, mode: 'insensitive' } } },
          { coach: { name: { contains: search, mode: 'insensitive' } } },
          { specialInstructions: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [orders, total] = await Promise.all([
      prisma.eventOrder.findMany({
        where,
        include: {
          event: {
            select: { 
              id: true, 
              name: true, 
              sport: true, 
              startDate: true,
              venue: true,
              city: true
            }
          },
          coach: {
            select: { 
              id: true, 
              name: true,
              specialization: true
            }
          },
          admin: {
            select: { name: true }
          }
        },
        skip,
        take,
        orderBy: [
          { urgentDelivery: 'desc' }, // Urgent orders first
          { createdAt: 'desc' }
        ]
      }),
      prisma.eventOrder.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    // Calculate summary statistics
    const summary = {
      total,
      pending: await prisma.eventOrder.count({ where: { status: 'PENDING' } }),
      confirmed: await prisma.eventOrder.count({ where: { status: 'CONFIRMED' } }),
      inProgress: await prisma.eventOrder.count({ where: { status: 'IN_PROGRESS' } }),
      completed: await prisma.eventOrder.count({ where: { status: 'COMPLETED' } }),
      urgent: await prisma.eventOrder.count({ where: { urgentDelivery: true, status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] } } })
    };

    console.log(`✅ Found ${orders.length} orders (${summary.urgent} urgent)`);

    res.json(successResponse({
      orders,
      pagination,
      summary
    }, 'Event orders retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get admin orders error:', error);
    res.status(500).json(errorResponse('Failed to retrieve orders.', 500));
  }
});

// Update order status and pricing (Admin only)
router.put('/orders/:orderId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { 
      status, 
      adminRemarks,
      certificatePrice,
      medalPrice,
      trophyPrice,
      totalAmount
    } = req.body;

    console.log(`📦 Admin updating order ${orderId}`);
    console.log(`📦 Update data:`, { status, adminRemarks, certificatePrice, medalPrice, trophyPrice, totalAmount });

    const order = await prisma.eventOrder.findUnique({
      where: { id: orderId },
      include: {
        event: { select: { name: true } },
        coach: { select: { name: true } }
      }
    });

    if (!order) {
      return res.status(404).json(errorResponse('Order not found.', 404));
    }

    // Automatically calculate total amount whenever any price is provided
    let calculatedTotal = null;
    
    // If any price field is provided, calculate the total using current or updated prices
    if (certificatePrice !== undefined || medalPrice !== undefined || trophyPrice !== undefined) {
      const certPrice = certificatePrice !== undefined ? parseFloat(certificatePrice) : (order.certificatePrice || 0);
      const medPrice = medalPrice !== undefined ? parseFloat(medalPrice) : (order.medalPrice || 0);
      const tropPrice = trophyPrice !== undefined ? parseFloat(trophyPrice) : (order.trophyPrice || 0);
      
      calculatedTotal = 
        (order.certificates * certPrice) + 
        (order.medals * medPrice) + 
        (order.trophies * tropPrice);
        
      console.log(`💰 Calculated total: ${order.certificates} × ₹${certPrice} + ${order.medals} × ₹${medPrice} + ${order.trophies} × ₹${tropPrice} = ₹${calculatedTotal}`);
    } else if (totalAmount !== undefined) {
      // If only totalAmount is provided explicitly (without individual prices)
      calculatedTotal = parseFloat(totalAmount);
    }

    const updateData = {
      ...(status && { status: status.toUpperCase() }),
      ...(adminRemarks !== undefined && { adminRemarks }),
      ...(certificatePrice !== undefined && { certificatePrice: parseFloat(certificatePrice) }),
      ...(medalPrice !== undefined && { medalPrice: parseFloat(medalPrice) }),
      ...(trophyPrice !== undefined && { trophyPrice: parseFloat(trophyPrice) }),
      ...(calculatedTotal !== undefined && { totalAmount: parseFloat(calculatedTotal) }),
      processedBy: req.admin.id,
      processedAt: new Date()
    };

    // Set completion timestamp if status is COMPLETED
    if (status && status.toUpperCase() === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const updatedOrder = await prisma.eventOrder.update({
      where: { id: orderId },
      data: updateData,
      include: {
        event: { select: { id: true, name: true, sport: true } },
        coach: { select: { id: true, name: true } },
        admin: { select: { name: true } }
      }
    });

    console.log(`✅ Order ${order.orderNumber} updated to ${updatedOrder.status}`);

    res.json(successResponse(updatedOrder, 'Order updated successfully.'));

  } catch (error) {
    console.error('❌ Update order error:', error);
    res.status(500).json(errorResponse('Failed to update order.', 500));
  }
});

// Get order statistics for admin dashboard
router.get('/orders/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching order statistics...');

    const stats = {
      totalOrders: await prisma.eventOrder.count(),
      pendingOrders: await prisma.eventOrder.count({ where: { status: 'PENDING' } }),
      confirmedOrders: await prisma.eventOrder.count({ where: { status: 'CONFIRMED' } }),
      inProgressOrders: await prisma.eventOrder.count({ where: { status: 'IN_PROGRESS' } }),
      completedOrders: await prisma.eventOrder.count({ where: { status: 'COMPLETED' } }),
      urgentOrders: await prisma.eventOrder.count({ 
        where: { 
          urgentDelivery: true,
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
        }
      }),
      totalCertificates: await prisma.eventOrder.aggregate({
        _sum: { certificates: true }
      }).then(result => result._sum.certificates || 0),
      totalMedals: await prisma.eventOrder.aggregate({
        _sum: { medals: true }
      }).then(result => result._sum.medals || 0),
      totalTrophies: await prisma.eventOrder.aggregate({
        _sum: { trophies: true }
      }).then(result => result._sum.trophies || 0),
      totalRevenue: await prisma.eventOrder.aggregate({
        _sum: { totalAmount: true }
      }).then(result => result._sum.totalAmount || 0)
    };

    // Recent orders
    const recentOrders = await prisma.eventOrder.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        event: { select: { name: true } },
        coach: { select: { name: true } }
      }
    });

    console.log(`📊 Order stats: ${stats.totalOrders} total, ${stats.pendingOrders} pending, ${stats.urgentOrders} urgent`);

    res.json(successResponse({
      stats,
      recentOrders
    }, 'Order statistics retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get order stats error:', error);
    res.status(500).json(errorResponse('Failed to retrieve order statistics.', 500));
  }
});

// Bulk update order status
router.put('/orders/bulk-update', authenticate, requireAdmin, async (req, res) => {
  try {
    const { orderIds, status, adminRemarks } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json(errorResponse('Order IDs are required.', 400));
    }

    if (!status) {
      return res.status(400).json(errorResponse('Status is required.', 400));
    }

    console.log(`📦 Bulk updating ${orderIds.length} orders to ${status}`);

    const updateData = {
      status: status.toUpperCase(),
      processedBy: req.admin.id,
      processedAt: new Date(),
      ...(adminRemarks && { adminRemarks })
    };

    if (status.toUpperCase() === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const result = await prisma.eventOrder.updateMany({
      where: {
        id: { in: orderIds }
      },
      data: updateData
    });

    console.log(`✅ Bulk updated ${result.count} orders`);

    res.json(successResponse({
      updatedCount: result.count
    }, `Successfully updated ${result.count} orders.`));

  } catch (error) {
    console.error('❌ Bulk update orders error:', error);
    res.status(500).json(errorResponse('Failed to bulk update orders.', 500));
  }
});

module.exports = router;