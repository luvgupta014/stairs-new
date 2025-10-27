const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../utils/authMiddleware');
const { 
  successResponse, 
  errorResponse, 
  getPaginationParams, 
  getPaginationMeta,
  hashPassword
} = require('../utils/helpers');
const { sendEventModerationEmail, sendOrderStatusEmail } = require('../utils/emailService');

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
    const startTime = Date.now();

    // Use Promise.allSettled to handle errors gracefully and run queries in parallel
    const [
      totalUsersResult,
      totalStudentsResult,
      totalCoachesResult,
      totalInstitutesResult,
      totalClubsResult,
      pendingCoachApprovalsResult,
      pendingInstituteApprovalsResult,
      totalEventsResult,
      pendingEventsResult,
      approvedEventsResult,
      activeEventsResult,
      recentRegistrationsResult,
      recentEventsResult,
      monthlyGrowthResult
    ] = await Promise.allSettled([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'COACH' } }),
      prisma.user.count({ where: { role: 'INSTITUTE' } }),
      prisma.user.count({ where: { role: 'CLUB' } }),
      prisma.user.count({ where: { role: 'COACH', isVerified: true, isActive: false } }),
      prisma.user.count({ where: { role: 'INSTITUTE', isVerified: true, isActive: false } }),
      prisma.event.count(),
      prisma.event.count({ where: { status: 'PENDING' } }),
      prisma.event.count({ where: { status: 'APPROVED' } }),
      prisma.event.count({ where: { status: 'ACTIVE' } }),
      // Recent registrations with reduced data - only users with valid profiles
      prisma.user.findMany({
        where: {
          OR: [
            { AND: [{ role: 'STUDENT' }, { studentProfile: { isNot: null } }] },
            { AND: [{ role: 'COACH' }, { coachProfile: { isNot: null } }] },
            { AND: [{ role: 'INSTITUTE' }, { instituteProfile: { isNot: null } }] },
            { AND: [{ role: 'CLUB' }, { clubProfile: { isNot: null } }] },
            { AND: [{ role: 'ADMIN' }, { adminProfile: { isNot: null } }] }
          ]
        },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          studentProfile: { select: { name: true } },
          coachProfile: { select: { name: true } },
          instituteProfile: { select: { name: true } },
          clubProfile: { select: { name: true } },
          adminProfile: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      // Recent pending events with reduced data
      prisma.event.findMany({
        where: { status: 'PENDING' },
        include: {
          coach: {
            select: {
              id: true,
              name: true,
              user: { select: { email: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      // Monthly growth calculation
      (async () => {
        try {
          const thisMonth = new Date();
          thisMonth.setDate(1);
          thisMonth.setHours(0, 0, 0, 0);

          const lastMonth = new Date(thisMonth);
          lastMonth.setMonth(lastMonth.getMonth() - 1);

          const [thisMonthUsers, lastMonthUsers] = await Promise.all([
            prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
            prisma.user.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } })
          ]);

          if (lastMonthUsers > 0) {
            return Math.round(((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 * 100) / 100;
          } else {
            return thisMonthUsers > 0 ? 100 : 0;
          }
        } catch (error) {
          console.error('Error calculating monthly growth:', error);
          return 0;
        }
      })()
    ]);

    // Extract results with fallbacks
    const stats = {
      totalUsers: totalUsersResult.status === 'fulfilled' ? totalUsersResult.value : 0,
      totalStudents: totalStudentsResult.status === 'fulfilled' ? totalStudentsResult.value : 0,
      totalCoaches: totalCoachesResult.status === 'fulfilled' ? totalCoachesResult.value : 0,
      totalInstitutes: totalInstitutesResult.status === 'fulfilled' ? totalInstitutesResult.value : 0,
      totalClubs: totalClubsResult.status === 'fulfilled' ? totalClubsResult.value : 0,
      pendingCoachApprovals: pendingCoachApprovalsResult.status === 'fulfilled' ? pendingCoachApprovalsResult.value : 0,
      pendingInstituteApprovals: pendingInstituteApprovalsResult.status === 'fulfilled' ? pendingInstituteApprovalsResult.value : 0,
      totalEvents: totalEventsResult.status === 'fulfilled' ? totalEventsResult.value : 0,
      pendingEvents: pendingEventsResult.status === 'fulfilled' ? pendingEventsResult.value : 0,
      approvedEvents: approvedEventsResult.status === 'fulfilled' ? approvedEventsResult.value : 0,
      activeEvents: activeEventsResult.status === 'fulfilled' ? activeEventsResult.value : 0,
      monthlyGrowth: monthlyGrowthResult.status === 'fulfilled' ? monthlyGrowthResult.value : 0
    };

    const recentRegistrations = recentRegistrationsResult.status === 'fulfilled' ? recentRegistrationsResult.value : [];
    const recentEvents = recentEventsResult.status === 'fulfilled' ? recentEventsResult.value : [];

    // Format recent registrations
    const formattedRecentRegistrations = recentRegistrations.map(user => {
      const profile = user.studentProfile || user.coachProfile || user.instituteProfile || user.clubProfile || user.adminProfile;
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        name: profile?.name || 'Unknown'
      };
    });

    // Format recent events
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
      recentEvents: formattedRecentEvents,
      pendingEvents: formattedRecentEvents,
      monthlyRegistrations: []
    };

    const elapsed = Date.now() - startTime;
    console.log(`✅ Admin dashboard data fetched successfully in ${elapsed}ms`);
    console.log(`📊 Dashboard summary: ${stats.totalUsers} users, ${stats.totalEvents} events, ${stats.pendingEvents} pending`);
    
    res.json(successResponse(dashboardData, 'Dashboard data retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get admin dashboard error:', error);
    res.status(500).json(errorResponse('Failed to retrieve dashboard data.', 500));
  }
});

// Clean up invalid and test user registrations
router.post('/cleanup-invalid-registrations', authenticate, requireAdmin, async (req, res) => {
  try {
    console.log('🧹 Starting cleanup of invalid user registrations...');
    
    const cleanupReport = {
      orphanedProfiles: [],
      testUsers: [],
      incompleteProfiles: [],
      totalCleaned: 0
    };

    // Find users with test/fake data patterns
    const testUserPatterns = [
      'john.doe@email.com',
      'jane.smith@email.com', 
      'mike.johnson@email.com',
      'lg@email.com',
      'lg2@email.com'
    ];

    const testNames = ['MJ', 'John Doe', 'Jane Smith', 'Mike Johnson'];

    // Find test users by email pattern
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { in: testUserPatterns } },
          {
            AND: [
              { role: 'STUDENT' },
              { studentProfile: { name: { in: testNames } } }
            ]
          },
          {
            AND: [
              { role: 'COACH' },
              { coachProfile: { name: { in: testNames } } }
            ]
          }
        ]
      },
      include: {
        studentProfile: true,
        coachProfile: true,
        instituteProfile: true,
        clubProfile: true,
        adminProfile: true
      }
    });

    // Find orphaned profiles (profiles without users)
    const [orphanedStudents, orphanedCoaches, orphanedInstitutes, orphanedClubs, orphanedAdmins] = await Promise.allSettled([
      prisma.student.findMany({
        where: { user: null },
        select: { id: true, userId: true, name: true, createdAt: true }
      }),
      prisma.coach.findMany({
        where: { user: null },
        select: { id: true, userId: true, name: true, createdAt: true }
      }),
      prisma.institute.findMany({
        where: { user: null },
        select: { id: true, userId: true, name: true, createdAt: true }
      }),
      prisma.club.findMany({
        where: { user: null },
        select: { id: true, userId: true, name: true, createdAt: true }
      }),
      prisma.admin.findMany({
        where: { user: null },
        select: { id: true, userId: true, name: true, createdAt: true }
      })
    ]);

    const orphanedProfiles = [
      ...(orphanedStudents.status === 'fulfilled' ? orphanedStudents.value : []),
      ...(orphanedCoaches.status === 'fulfilled' ? orphanedCoaches.value : []),
      ...(orphanedInstitutes.status === 'fulfilled' ? orphanedInstitutes.value : []),
      ...(orphanedClubs.status === 'fulfilled' ? orphanedClubs.value : []),
      ...(orphanedAdmins.status === 'fulfilled' ? orphanedAdmins.value : [])
    ];

    console.log(`🔍 Found invalid registrations:`, {
      testUsers: testUsers.length,
      orphanedProfiles: orphanedProfiles.length
    });

    cleanupReport.testUsers = testUsers.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.studentProfile?.name || user.coachProfile?.name || user.instituteProfile?.name || user.clubProfile?.name || 'Unknown',
      createdAt: user.createdAt
    }));

    cleanupReport.orphanedProfiles = orphanedProfiles;

    // Delete invalid data in a transaction
    const deleteResults = await prisma.$transaction(async (tx) => {
      const results = { deletedUsers: 0, deletedProfiles: 0 };

      // Delete test users and their profiles
      if (testUsers.length > 0) {
        const deletedUsers = await tx.user.deleteMany({
          where: { id: { in: testUsers.map(u => u.id) } }
        });
        results.deletedUsers = deletedUsers.count;
      }

      // Delete orphaned profiles
      if (orphanedStudents.status === 'fulfilled' && orphanedStudents.value.length > 0) {
        const deleted = await tx.student.deleteMany({
          where: { id: { in: orphanedStudents.value.map(s => s.id) } }
        });
        results.deletedProfiles += deleted.count;
      }

      if (orphanedCoaches.status === 'fulfilled' && orphanedCoaches.value.length > 0) {
        const deleted = await tx.coach.deleteMany({
          where: { id: { in: orphanedCoaches.value.map(c => c.id) } }
        });
        results.deletedProfiles += deleted.count;
      }

      if (orphanedInstitutes.status === 'fulfilled' && orphanedInstitutes.value.length > 0) {
        const deleted = await tx.institute.deleteMany({
          where: { id: { in: orphanedInstitutes.value.map(i => i.id) } }
        });
        results.deletedProfiles += deleted.count;
      }

      if (orphanedClubs.status === 'fulfilled' && orphanedClubs.value.length > 0) {
        const deleted = await tx.club.deleteMany({
          where: { id: { in: orphanedClubs.value.map(c => c.id) } }
        });
        results.deletedProfiles += deleted.count;
      }

      if (orphanedAdmins.status === 'fulfilled' && orphanedAdmins.value.length > 0) {
        const deleted = await tx.admin.deleteMany({
          where: { id: { in: orphanedAdmins.value.map(a => a.id) } }
        });
        results.deletedProfiles += deleted.count;
      }

      return results;
    });

    cleanupReport.totalCleaned = deleteResults.deletedUsers + deleteResults.deletedProfiles;

    console.log(`✅ Cleanup completed:`, {
      usersDeleted: deleteResults.deletedUsers,
      profilesDeleted: deleteResults.deletedProfiles,
      totalCleaned: cleanupReport.totalCleaned
    });

    res.json(successResponse({
      cleanupReport,
      deleteResults,
      summary: {
        totalInvalidRecords: cleanupReport.totalCleaned,
        testUsersDeleted: deleteResults.deletedUsers,
        orphanedProfilesDeleted: deleteResults.deletedProfiles
      }
    }, `Successfully cleaned up ${cleanupReport.totalCleaned} invalid registrations.`));

  } catch (error) {
    console.error('❌ Cleanup invalid registrations error:', error);
    res.status(500).json(errorResponse('Failed to cleanup invalid registrations.', 500));
  }
});

// Clean up orphaned user registrations
router.post('/cleanup-orphaned-registrations', authenticate, requireAdmin, async (req, res) => {
  try {
    console.log('🧹 Starting cleanup of orphaned user registrations...');
    
    const cleanupReport = {
      orphanedStudents: [],
      orphanedCoaches: [],
      orphanedInstitutes: [],
      orphanedClubs: [],
      orphanedAdmins: [],
      totalCleaned: 0
    };

    // Find orphaned student profiles (student profile exists but user doesn't)
    const orphanedStudents = await prisma.student.findMany({
      where: {
        user: null
      },
      select: {
        id: true,
        userId: true,
        name: true,
        createdAt: true
      }
    });

    // Find orphaned coach profiles
    const orphanedCoaches = await prisma.coach.findMany({
      where: {
        user: null
      },
      select: {
        id: true,
        userId: true,
        name: true,
        createdAt: true
      }
    });

    // Find orphaned institute profiles
    const orphanedInstitutes = await prisma.institute.findMany({
      where: {
        user: null
      },
      select: {
        id: true,
        userId: true,
        name: true,
        createdAt: true
      }
    });

    // Find orphaned club profiles
    const orphanedClubs = await prisma.club.findMany({
      where: {
        user: null
      },
      select: {
        id: true,
        userId: true,
        name: true,
        createdAt: true
      }
    });

    // Find orphaned admin profiles
    const orphanedAdmins = await prisma.admin.findMany({
      where: {
        user: null
      },
      select: {
        id: true,
        userId: true,
        name: true,
        createdAt: true
      }
    });

    console.log(`🔍 Found orphaned records:`, {
      students: orphanedStudents.length,
      coaches: orphanedCoaches.length,
      institutes: orphanedInstitutes.length,
      clubs: orphanedClubs.length,
      admins: orphanedAdmins.length
    });

    // Store the records before deletion for reporting
    cleanupReport.orphanedStudents = orphanedStudents;
    cleanupReport.orphanedCoaches = orphanedCoaches;
    cleanupReport.orphanedInstitutes = orphanedInstitutes;
    cleanupReport.orphanedClubs = orphanedClubs;
    cleanupReport.orphanedAdmins = orphanedAdmins;

    // Delete orphaned records in a transaction
    const deleteResults = await prisma.$transaction(async (tx) => {
      const results = {};

      if (orphanedStudents.length > 0) {
        results.deletedStudents = await tx.student.deleteMany({
          where: {
            id: { in: orphanedStudents.map(s => s.id) }
          }
        });
      }

      if (orphanedCoaches.length > 0) {
        results.deletedCoaches = await tx.coach.deleteMany({
          where: {
            id: { in: orphanedCoaches.map(c => c.id) }
          }
        });
      }

      if (orphanedInstitutes.length > 0) {
        results.deletedInstitutes = await tx.institute.deleteMany({
          where: {
            id: { in: orphanedInstitutes.map(i => i.id) }
          }
        });
      }

      if (orphanedClubs.length > 0) {
        results.deletedClubs = await tx.club.deleteMany({
          where: {
            id: { in: orphanedClubs.map(c => c.id) }
          }
        });
      }

      if (orphanedAdmins.length > 0) {
        results.deletedAdmins = await tx.admin.deleteMany({
          where: {
            id: { in: orphanedAdmins.map(a => a.id) }
          }
        });
      }

      return results;
    });

    cleanupReport.totalCleaned = 
      (deleteResults.deletedStudents?.count || 0) +
      (deleteResults.deletedCoaches?.count || 0) +
      (deleteResults.deletedInstitutes?.count || 0) +
      (deleteResults.deletedClubs?.count || 0) +
      (deleteResults.deletedAdmins?.count || 0);

    console.log(`✅ Cleanup completed:`, {
      studentsDeleted: deleteResults.deletedStudents?.count || 0,
      coachesDeleted: deleteResults.deletedCoaches?.count || 0,
      institutesDeleted: deleteResults.deletedInstitutes?.count || 0,
      clubsDeleted: deleteResults.deletedClubs?.count || 0,
      adminsDeleted: deleteResults.deletedAdmins?.count || 0,
      totalCleaned: cleanupReport.totalCleaned
    });

    res.json(successResponse({
      cleanupReport,
      deleteResults,
      summary: {
        totalOrphanedRecords: cleanupReport.totalCleaned,
        studentsDeleted: deleteResults.deletedStudents?.count || 0,
        coachesDeleted: deleteResults.deletedCoaches?.count || 0,
        institutesDeleted: deleteResults.deletedInstitutes?.count || 0,
        clubsDeleted: deleteResults.deletedClubs?.count || 0,
        adminsDeleted: deleteResults.deletedAdmins?.count || 0
      }
    }, `Successfully cleaned up ${cleanupReport.totalCleaned} orphaned registrations.`));

  } catch (error) {
    console.error('❌ Cleanup orphaned registrations error:', error);
    res.status(500).json(errorResponse('Failed to cleanup orphaned registrations.', 500));
  }
});

// Get orphaned registrations report (without deleting)
router.get('/orphaned-registrations-report', authenticate, requireAdmin, async (req, res) => {
  try {
    console.log('📊 Generating orphaned registrations report...');
    
    // Find profiles without corresponding users
    const [orphanedStudents, orphanedCoaches, orphanedInstitutes, orphanedClubs, orphanedAdmins] = await Promise.allSettled([
      prisma.student.findMany({
        where: {
          user: null
        },
        select: {
          id: true,
          userId: true,
          name: true,
          createdAt: true,
          sport: true
        }
      }),
      prisma.coach.findMany({
        where: {
          user: null
        },
        select: {
          id: true,
          userId: true,
          name: true,
          createdAt: true,
          primarySport: true
        }
      }),
      prisma.institute.findMany({
        where: {
          user: null
        },
        select: {
          id: true,
          userId: true,
          name: true,
          createdAt: true,
          type: true
        }
      }),
      prisma.club.findMany({
        where: {
          user: null
        },
        select: {
          id: true,
          userId: true,
          name: true,
          createdAt: true,
          type: true
        }
      }),
      prisma.admin.findMany({
        where: {
          user: null
        },
        select: {
          id: true,
          userId: true,
          name: true,
          createdAt: true,
          role: true
        }
      })
    ]);

    const report = {
      orphanedStudents: orphanedStudents.status === 'fulfilled' ? orphanedStudents.value : [],
      orphanedCoaches: orphanedCoaches.status === 'fulfilled' ? orphanedCoaches.value : [],
      orphanedInstitutes: orphanedInstitutes.status === 'fulfilled' ? orphanedInstitutes.value : [],
      orphanedClubs: orphanedClubs.status === 'fulfilled' ? orphanedClubs.value : [],
      orphanedAdmins: orphanedAdmins.status === 'fulfilled' ? orphanedAdmins.value : [],
      summary: {
        totalOrphanedStudents: orphanedStudents.status === 'fulfilled' ? orphanedStudents.value.length : 0,
        totalOrphanedCoaches: orphanedCoaches.status === 'fulfilled' ? orphanedCoaches.value.length : 0,
        totalOrphanedInstitutes: orphanedInstitutes.status === 'fulfilled' ? orphanedInstitutes.value.length : 0,
        totalOrphanedClubs: orphanedClubs.status === 'fulfilled' ? orphanedClubs.value.length : 0,
        totalOrphanedAdmins: orphanedAdmins.status === 'fulfilled' ? orphanedAdmins.value.length : 0,
        grandTotal: (orphanedStudents.status === 'fulfilled' ? orphanedStudents.value.length : 0) +
                   (orphanedCoaches.status === 'fulfilled' ? orphanedCoaches.value.length : 0) +
                   (orphanedInstitutes.status === 'fulfilled' ? orphanedInstitutes.value.length : 0) +
                   (orphanedClubs.status === 'fulfilled' ? orphanedClubs.value.length : 0) +
                   (orphanedAdmins.status === 'fulfilled' ? orphanedAdmins.value.length : 0)
      }
    };

    console.log(`📊 Orphaned registrations report:`, report.summary);

    res.json(successResponse(report, 'Orphaned registrations report generated successfully.'));

  } catch (error) {
    console.error('❌ Generate orphaned registrations report error:', error);
    res.status(500).json(errorResponse('Failed to generate orphaned registrations report.', 500));
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
          { instituteProfile: { name: { contains: search, mode: 'insensitive' } } },
          { clubProfile: { name: { contains: search, mode: 'insensitive' } } }
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

    // Send email and create notification for coach
    try {
      if (event.coach?.user?.id) {
        const notificationType = `EVENT_${action}`;
        const notificationTitle = `Event ${action.charAt(0) + action.slice(1).toLowerCase()}d`;
        const notificationMessage = `Your event "${event.name}" has been ${action.toLowerCase()}d by an administrator.${adminNotes || remarks ? ` Reason: ${adminNotes || remarks}` : ''}`;
        
        // Create notification in database only if notification model exists
        if (prisma.notification) {
          await prisma.notification.create({
            data: {
              userId: event.coach.user.id,
              type: notificationType,
              title: notificationTitle,
              message: notificationMessage,
              data: JSON.stringify({
                eventId: event.id,
                eventName: event.name,
                action: action,
                adminNotes: adminNotes || remarks
              })
            }
          });
          console.log(`🔔 Notification created for user ${event.coach.user.id}`);
        } else {
          console.log('⚠️ Notification model not available, skipping notification creation');
        }

        // Send email notification
        if (event.coach?.user?.email && event.coach?.name) {
          const emailResult = await sendEventModerationEmail(
            event.coach.user.email,
            event.coach.name,
            action,
            {
              name: event.name,
              sport: event.sport,
              startDate: event.startDate,
              venue: event.venue,
              city: event.city,
              maxParticipants: event.maxParticipants
            },
            adminNotes || remarks
          );
          
          if (emailResult.success) {
            console.log(`📧 Event moderation email sent to ${event.coach.user.email}`);
          } else {
            console.error('⚠️ Failed to send event moderation email:', emailResult.error);
          }
        }
      }
    } catch (notificationError) {
      console.error('⚠️ Failed to create notification or send email:', notificationError);
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
        isActive: true,
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
        coach: { 
          select: { 
            name: true,
            user: {
              select: {
                id: true,
                email: true
              }
            }
          } 
        }
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

    // Send email and create notification for coach
    try {
      if (order.coach?.user?.id) {
        // Map order status to valid notification types
        const statusToNotificationType = {
          'PENDING': 'ORDER_CONFIRMED',
          'CONFIRMED': 'ORDER_CONFIRMED',
          'PAYMENT_PENDING': 'ORDER_CONFIRMED',
          'PAID': 'ORDER_CONFIRMED',
          'IN_PROGRESS': 'ORDER_IN_PROGRESS',
          'COMPLETED': 'ORDER_COMPLETED',
          'CANCELLED': 'ORDER_CANCELLED'
        };

        const notificationType = statusToNotificationType[updatedOrder.status] || 'GENERAL';
        const notificationTitle = `Order ${updatedOrder.status.charAt(0) + updatedOrder.status.slice(1).toLowerCase().replace(/_/g, ' ')}`;
        const notificationMessage = `Your order ${order.orderNumber} has been updated to ${updatedOrder.status.toLowerCase().replace(/_/g, ' ')}.${adminRemarks ? ` Notes: ${adminRemarks}` : ''}`;
        
        // Create notification in database only if notification model exists
        if (prisma.notification) {
          await prisma.notification.create({
            data: {
              userId: order.coach.user.id,
              type: notificationType,
              title: notificationTitle,
              message: notificationMessage,
              data: JSON.stringify({
                orderId: order.id,
                orderNumber: order.orderNumber,
                status: updatedOrder.status,
                adminRemarks: adminRemarks
              })
            }
          });
          console.log(`🔔 Notification created for user ${order.coach.user.id}`);
        } else {
          console.log('⚠️ Notification model not available, skipping notification creation');
        }

        // Send email notification
        if (order.coach?.user?.email && order.coach?.name) {
          const emailResult = await sendOrderStatusEmail(
            order.coach.user.email,
            order.coach.name,
            updatedOrder.status,
            {
              orderNumber: order.orderNumber,
              certificates: order.certificates,
              medals: order.medals,
              trophies: order.trophies,
              totalAmount: updatedOrder.totalAmount,
              event: { name: order.event?.name }
            },
            adminRemarks
          );
          
          if (emailResult.success) {
            console.log(`📧 Order status email sent to ${order.coach.user.email}`);
          } else {
            console.error('⚠️ Failed to send order status email:', emailResult.error);
          }
        }
      }
    } catch (notificationError) {
      console.error('⚠️ Failed to create notification or send email:', notificationError);
      // Don't fail the request if notification creation fails
    }

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

// Get all event result files for admin
router.get('/event-results', authenticate, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Admin fetching all event result files...');
    console.log('👤 Request user:', { id: req.user?.id, role: req.user?.role });

    const { page = 1, limit = 20, search, sport, coachName, dateRange } = req.query;
    console.log('📋 Query params:', { page, limit, search, sport, coachName, dateRange });
    
    const { skip, take } = getPaginationParams(page, limit);
    console.log('📋 Pagination:', { skip, take });

    // First, let's try a simple query to see if the table exists
    console.log('🔍 Testing basic EventResultFile query...');
    let testCount;
    try {
      testCount = await prisma.eventResultFile.count();
      console.log('📊 Total EventResultFile records:', testCount);
    } catch (countError) {
      console.error('❌ Error counting EventResultFile records:', countError);
      return res.status(500).json(errorResponse('Database table not accessible.', 500));
    }

    // Build where clause for filtering
    let where = {};

    // Search filter (by event name or original file name)
    if (search) {
      where = {
        OR: [
          { originalName: { contains: search, mode: 'insensitive' } },
          { 
            event: {
              name: { contains: search, mode: 'insensitive' }
            }
          }
        ]
      };
    }

    // Sport filter
    if (sport && sport !== '') {
      where.event = { ...where.event, sport: { contains: sport, mode: 'insensitive' } };
    }

    // Coach name filter
    if (coachName && coachName !== '') {
      where.coach = { name: { contains: coachName, mode: 'insensitive' } };
    }

    // Date range filter
    if (dateRange && dateRange !== '') {
      const now = new Date();
      let dateFilter = {};
      
      switch (dateRange) {
        case 'today':
          dateFilter = {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          };
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = { gte: weekAgo };
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFilter = { gte: monthAgo };
          break;
      }
      
      if (Object.keys(dateFilter).length > 0) {
        where.uploadedAt = dateFilter;
      }
    }

    console.log('📋 Final where clause:', JSON.stringify(where, null, 2));

    // Get event result files with all related data
    console.log('🔍 Fetching event result files with relations...');
    
    let files, totalCount;
    try {
      [files, totalCount] = await Promise.all([
        prisma.eventResultFile.findMany({
          where,
          include: {
            event: {
              select: {
                id: true,
                name: true,
                sport: true,
                startDate: true,
                venue: true,
                status: true
              }
            },
            coach: {
              select: {
                id: true,
                name: true,
                user: {
                  select: {
                    email: true,
                    phone: true
                  }
                }
              }
            }
          },
          orderBy: { uploadedAt: 'desc' },
          skip,
          take
        }),
        prisma.eventResultFile.count({ where })
      ]);
    } catch (queryError) {
      console.error('❌ Error fetching event result files:', queryError);
      return res.status(500).json(errorResponse('Failed to fetch result files from database.', 500));
    }

    console.log('📊 Found files:', files?.length || 0, 'Total count:', totalCount);

    // Format the response
    const formattedFiles = files.map(file => ({
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      description: file.description,
      uploadedAt: file.uploadedAt,
      downloadUrl: `/uploads/event-results/${file.filename}`,
      isExcel: file.mimeType.includes('spreadsheet') || file.originalName.toLowerCase().endsWith('.xlsx') || file.originalName.toLowerCase().endsWith('.xls'),
      event: {
        id: file.event.id,
        name: file.event.name,
        sport: file.event.sport,
        startDate: file.event.startDate,
        location: file.event.venue,
        status: file.event.status
      },
      coach: {
        id: file.coach.id,
        name: file.coach.name,
        firstName: file.coach.name.split(' ')[0] || '',
        lastName: file.coach.name.split(' ').slice(1).join(' ') || '',
        email: file.coach.user.email,
        phone: file.coach.user.phone
      }
    }));

    const pagination = getPaginationMeta(totalCount, page, limit);

    console.log(`✅ Found ${totalCount} event result files, returning ${formattedFiles.length} files`);

    res.json(successResponse({
      files: formattedFiles,
      pagination,
      totalCount
    }, 'Event result files retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get all event result files error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json(errorResponse('Failed to retrieve event result files.', 500));
  }
});

// Download event result file (Admin)
router.get('/event-results/:fileId/download', authenticate, requireAdmin, async (req, res) => {
  try {
    const { fileId } = req.params;

    console.log(`📥 Admin downloading result file ${fileId}`);

    // Get file details
    const file = await prisma.eventResultFile.findUnique({
      where: {
        id: fileId
      },
      include: {
        event: {
          select: {
            name: true
          }
        },
        coach: {
          select: {
            name: true
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json(errorResponse('File not found.', 404));
    }

    const filePath = path.join(__dirname, '../../../uploads/event-results', file.filename);
    
    // Check if file exists on disk
    if (!require('fs').existsSync(filePath)) {
      return res.status(404).json(errorResponse('File not found on server.', 404));
    }

    // Set appropriate headers for Excel files
    const isExcel = file.mimeType.includes('spreadsheet') || file.originalName.toLowerCase().endsWith('.xlsx') || file.originalName.toLowerCase().endsWith('.xls');
    
    if (isExcel) {
      if (file.originalName.toLowerCase().endsWith('.xlsx')) {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      } else if (file.originalName.toLowerCase().endsWith('.xls')) {
        res.setHeader('Content-Type', 'application/vnd.ms-excel');
      }
    } else {
      res.setHeader('Content-Type', file.mimeType);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.sendFile(filePath);

    console.log(`✅ File ${file.originalName} downloaded by admin`);

  } catch (error) {
    console.error('❌ Download result file error:', error);
    res.status(500).json(errorResponse('Failed to download file.', 500));
  }
});

// Get user payment status (lightweight endpoint)
router.get('/users/:userId/payment-status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🔍 Getting payment status for user ${userId}`);
    
    // Get user role first
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user) {
      return res.status(404).json(errorResponse('User not found.', 404));
    }
    
    let paymentStatus = null;
    let subscriptionType = null;
    let subscriptionExpiresAt = null;
    
    // Get payment status based on user role
    if (user.role === 'COACH') {
      const coach = await prisma.coach.findUnique({
        where: { userId },
        select: {
          paymentStatus: true,
          subscriptionType: true,
          subscriptionExpiresAt: true
        }
      });
      if (coach) {
        paymentStatus = coach.paymentStatus;
        subscriptionType = coach.subscriptionType;
        subscriptionExpiresAt = coach.subscriptionExpiresAt;
      }
    } else if (user.role === 'CLUB') {
      const club = await prisma.club.findUnique({
        where: { userId },
        select: {
          paymentStatus: true,
          subscriptionType: true,
          subscriptionExpiresAt: true
        }
      });
      if (club) {
        paymentStatus = club.paymentStatus;
        subscriptionType = club.subscriptionType;
        subscriptionExpiresAt = club.subscriptionExpiresAt;
      }
    } else if (user.role === 'INSTITUTE') {
      const institute = await prisma.institute.findUnique({
        where: { userId },
        select: {
          paymentStatus: true,
          subscriptionType: true,
          subscriptionExpiresAt: true
        }
      });
      if (institute) {
        paymentStatus = institute.paymentStatus;
        subscriptionType = institute.subscriptionType;
        subscriptionExpiresAt = institute.subscriptionExpiresAt;
      }
    }
    
    res.json(successResponse({
      paymentStatus,
      subscriptionType,
      subscriptionExpiresAt
    }, 'Payment status retrieved successfully.'));
    
  } catch (error) {
    console.error('Get user payment status error:', error);
    res.status(500).json(errorResponse('Failed to retrieve payment status.', 500));
  }
});

// Notification Management Endpoints

// Get user notifications
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    console.log(`🔔 Fetching notifications for user ${req.user.id}`);

    // Check if notification model exists
    if (!prisma.notification) {
      console.log('⚠️ Notification model not found in Prisma schema, returning empty notifications');
      return res.json(successResponse({
        notifications: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: parseInt(limit),
          hasNextPage: false,
          hasPrevPage: false
        },
        unreadCount: 0
      }, 'Notifications retrieved successfully.'));
    }

    const where = {
      userId: req.user.id,
      ...(unreadOnly === 'true' && { isRead: false })
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.notification.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    // Parse JSON data for each notification
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      data: notification.data ? JSON.parse(notification.data) : null
    }));

    res.json(successResponse({
      notifications: formattedNotifications,
      pagination,
      unreadCount: await prisma.notification.count({
        where: { userId: req.user.id, isRead: false }
      })
    }, 'Notifications retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get notifications error:', error);
    res.status(500).json(errorResponse('Failed to retrieve notifications.', 500));
  }
});

// Mark notification as read
router.patch('/notifications/:notificationId/read', authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;

    console.log(`🔔 Marking notification ${notificationId} as read`);

    // Check if notification model exists
    if (!prisma.notification) {
      console.log('⚠️ Notification model not found in Prisma schema');
      return res.status(404).json(errorResponse('Notifications feature not available.', 404));
    }

    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId: req.user.id // Ensure user can only update their own notifications
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    if (!notification) {
      return res.status(404).json(errorResponse('Notification not found.', 404));
    }

    res.json(successResponse(notification, 'Notification marked as read.'));

  } catch (error) {
    console.error('❌ Mark notification as read error:', error);
    res.status(500).json(errorResponse('Failed to mark notification as read.', 500));
  }
});

// Mark all notifications as read
router.patch('/notifications/mark-all-read', authenticate, async (req, res) => {
  try {
    console.log(`🔔 Marking all notifications as read for user ${req.user.id}`);

    // Check if notification model exists
    if (!prisma.notification) {
      console.log('⚠️ Notification model not found in Prisma schema');
      return res.json(successResponse({
        updatedCount: 0
      }, 'Notifications feature not available.'));
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json(successResponse({
      updatedCount: result.count
    }, `${result.count} notifications marked as read.`));

  } catch (error) {
    console.error('❌ Mark all notifications as read error:', error);
    res.status(500).json(errorResponse('Failed to mark all notifications as read.', 500));
  }
});

// Delete notification
router.delete('/notifications/:notificationId', authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;

    console.log(`🔔 Deleting notification ${notificationId}`);

    // Check if notification model exists
    if (!prisma.notification) {
      console.log('⚠️ Notification model not found in Prisma schema');
      return res.status(404).json(errorResponse('Notifications feature not available.', 404));
    }

    const notification = await prisma.notification.delete({
      where: {
        id: notificationId,
        userId: req.user.id // Ensure user can only delete their own notifications
      }
    });

    if (!notification) {
      return res.status(404).json(errorResponse('Notification not found.', 404));
    }

    res.json(successResponse(null, 'Notification deleted successfully.'));

  } catch (error) {
    console.error('❌ Delete notification error:', error);
    res.status(500).json(errorResponse('Failed to delete notification.', 500));
  }
});

// Get notification count (for header badge)
router.get('/notifications/count', authenticate, async (req, res) => {
  try {
    // Check if notification model exists
    if (!prisma.notification) {
      console.log('⚠️ Notification model not found in Prisma schema, returning zero count');
      return res.json(successResponse({
        unreadCount: 0
      }, 'Notification count retrieved successfully.'));
    }

    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.user.id,
        isRead: false
      }
    });

    res.json(successResponse({
      unreadCount
    }, 'Notification count retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get notification count error:', error);
    res.status(500).json(errorResponse('Failed to retrieve notification count.', 500));
  }
});

module.exports = router;