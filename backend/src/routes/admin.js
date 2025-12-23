const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../utils/authMiddleware');
const { 
  successResponse, 
  errorResponse, 
  getPaginationParams, 
  getPaginationMeta,
  hashPassword,
  validateEmail
} = require('../utils/helpers');
const { sendEventModerationEmail, sendOrderStatusEmail, sendEventCompletionEmail, sendAssignmentEmail, sendEventInchargeInviteEmail } = require('../utils/emailService');
const EventService = require('../services/eventService');
const { generateEventUID, generateUID } = require('../utils/uidGenerator');

const router = express.Router();
const prisma = new PrismaClient();
const eventService = new EventService();

// Get admin profile
router.get('/profile', authenticate, requireAdmin, async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            uniqueId: true,
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
    // Add revenue and revenueGrowth calculation
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 1);

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
      monthlyGrowthResult,
      // Revenue for current month
      currentMonthRevenueResult,
      // Revenue for previous month
      prevMonthRevenueResult
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
          uniqueId: true,
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
      })(),
      // Revenue for current month (event orders + event payments + payments)
      (async () => {
        // Event Orders
        const eventOrders = await prisma.eventOrder.aggregate({
          where: {
            paymentStatus: 'SUCCESS',
            createdAt: { gte: startOfMonth }
          },
          _sum: { totalAmount: true }
        });
        // Event Payments
        const eventPayments = await prisma.eventPayment.aggregate({
          where: {
            status: 'SUCCESS',
            createdAt: { gte: startOfMonth }
          },
          _sum: { amount: true }
        });
        // General Payments
        const payments = await prisma.payment.aggregate({
          where: {
            status: 'SUCCESS',
            createdAt: { gte: startOfMonth }
          },
          _sum: { amount: true }
        });
        return (
          (eventOrders._sum.totalAmount || 0) +
          (eventPayments._sum.amount || 0) +
          (payments._sum.amount || 0)
        );
      })(),
      // Revenue for previous month
      (async () => {
        // Event Orders
        const eventOrders = await prisma.eventOrder.aggregate({
          where: {
            paymentStatus: 'SUCCESS',
            createdAt: { gte: startOfPrevMonth, lt: endOfPrevMonth }
          },
          _sum: { totalAmount: true }
        });
        // Event Payments
        const eventPayments = await prisma.eventPayment.aggregate({
          where: {
            status: 'SUCCESS',
            createdAt: { gte: startOfPrevMonth, lt: endOfPrevMonth }
          },
          _sum: { amount: true }
        });
        // General Payments
        const payments = await prisma.payment.aggregate({
          where: {
            status: 'SUCCESS',
            createdAt: { gte: startOfPrevMonth, lt: endOfPrevMonth }
          },
          _sum: { amount: true }
        });
        return (
          (eventOrders._sum.totalAmount || 0) +
          (eventPayments._sum.amount || 0) +
          (payments._sum.amount || 0)
        );
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
      monthlyGrowth: monthlyGrowthResult.status === 'fulfilled' ? monthlyGrowthResult.value : 0,
      revenue: currentMonthRevenueResult.status === 'fulfilled' ? currentMonthRevenueResult.value : 0,
      revenueGrowth: (() => {
        const prev = prevMonthRevenueResult.status === 'fulfilled' ? prevMonthRevenueResult.value : 0;
        const curr = currentMonthRevenueResult.status === 'fulfilled' ? currentMonthRevenueResult.value : 0;
        if (prev > 0) {
          return Math.round(((curr - prev) / prev) * 100 * 100) / 100;
        } else {
          return curr > 0 ? 100 : 0;
        }
      })()
    };

    const recentRegistrations = recentRegistrationsResult.status === 'fulfilled' ? recentRegistrationsResult.value : [];
    const recentEvents = recentEventsResult.status === 'fulfilled' ? recentEventsResult.value : [];

    // Format recent registrations
    const formattedRecentRegistrations = recentRegistrations.map(user => {
      const profile = user.studentProfile || user.coachProfile || user.instituteProfile || user.clubProfile || user.adminProfile;
      return {
        id: user.id,
        email: user.email,
        uniqueId: user.uniqueId,
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
      uniqueId: event.uniqueId, // Custom event UID
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
          { uniqueId: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { studentProfile: { 
            OR: [
              { name: { contains: search, mode: 'insensitive' } }
            ]
          }},
          { coachProfile: { 
            OR: [
              { name: { contains: search, mode: 'insensitive' } }
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
          uniqueId: true,
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
          },
          adminProfile: {
            select: {
              id: true,
              name: true,
              role: true
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

// Get single user by uniqueId with full details
router.get('/users/:uniqueId/details', authenticate, requireAdmin, async (req, res) => {
  try {
    const { uniqueId } = req.params;

    console.log(`🔍 Fetching full details for user with UID: ${uniqueId}`);

    const user = await prisma.user.findUnique({
      where: { uniqueId },
      include: {
        studentProfile: true,
        coachProfile: true,
        instituteProfile: true,
        clubProfile: true,
        adminProfile: true,
        payments: {
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!user) {
      return res.status(404).json(errorResponse('User not found.', 404));
    }

    // Fetch additional data based on role to avoid deep nested queries
    try {
      if (user.role === 'STUDENT' && user.studentProfile) {
        const eventRegistrations = await prisma.eventRegistration.findMany({
          where: { studentId: user.studentProfile.id },
          include: {
            event: {
              select: {
                id: true,
                name: true,
                sport: true,
                startDate: true,
                venue: true,
                city: true,
                status: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        });
        user.studentProfile.eventRegistrations = eventRegistrations;
      }

      if (user.role === 'COACH' && user.coachProfile) {
        const events = await prisma.event.findMany({
          where: { coachId: user.coachProfile.id },
          select: {
            id: true,
            name: true,
            sport: true,
            startDate: true,
            venue: true,
            city: true,
            status: true,
            currentParticipants: true,
            maxParticipants: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        });
        user.coachProfile.events = events;
      }

      if (user.role === 'INSTITUTE' && user.instituteProfile) {
        const students = await prisma.instituteStudent.findMany({
          where: { instituteId: user.instituteProfile.id },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                sport: true
              }
            }
          },
          take: 20
        });
        user.instituteProfile.students = students;

        const coaches = await prisma.instituteCoach.findMany({
          where: { instituteId: user.instituteProfile.id },
          include: {
            coach: {
              select: {
                id: true,
                name: true,
                specialization: true
              }
            }
          },
          take: 20
        });
        user.instituteProfile.coaches = coaches;
      }

      if (user.role === 'CLUB' && user.clubProfile) {
        const members = await prisma.clubMember.findMany({
          where: { clubId: user.clubProfile.id },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                sport: true
              }
            }
          },
          take: 20
        });
        user.clubProfile.members = members;
      }
    } catch (nestedError) {
      console.warn('⚠️ Error fetching nested data:', nestedError.message);
      // Continue anyway - main user data is fetched
    }

    console.log(`✅ Retrieved full details for user: ${user.email}`);

    res.json(successResponse(user, 'User details retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get user details error:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json(errorResponse('Failed to retrieve user details.', 500));
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

    // Validate and sanitize inputs
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 per page
    
    const { skip, take } = getPaginationParams(pageNum, limitNum);

    const where = {};
    
    // Add filters if provided (with validation)
    if (status && typeof status === 'string') {
      where.status = status.toUpperCase();
    }
    if (sport && typeof sport === 'string') {
      where.sport = { contains: sport.trim(), mode: 'insensitive' };
    }
    
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { venue: { contains: searchTerm, mode: 'insensitive' } },
        { city: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // Use select to avoid querying columns that might not exist yet
    // Try to fetch events - handle missing columns gracefully using raw SQL
    let events, total;
    try {
      [events, total] = await Promise.all([
        prisma.event.findMany({
          where,
          include: {
            coach: {
              include: {
                user: {
                  select: {
                    id: true,
                    uniqueId: true,
                    email: true,
                    phone: true,
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
    } catch (dbError) {
      // If error is about missing columns (P2022), use raw SQL to query only existing columns
      if (dbError.code === 'P2022' || (dbError.message && dbError.message.includes('does not exist'))) {
        console.log('⚠️  Missing columns detected, using raw SQL fallback query...');
        
        // Build WHERE clause for raw SQL
        let whereClause = '1=1';
        const params = [];
        let paramIndex = 1;
        
        if (where.status) {
          whereClause += ` AND e.status = $${paramIndex}`;
          params.push(where.status);
          paramIndex++;
        }
        if (where.sport) {
          whereClause += ` AND e.sport ILIKE $${paramIndex}`;
          params.push(`%${where.sport}%`);
          paramIndex++;
        }
        if (where.OR && Array.isArray(where.OR) && where.OR.length > 0) {
          const orConditions = [];
          where.OR.forEach(condition => {
            if (condition.name?.contains) {
              orConditions.push(`e.name ILIKE $${paramIndex}`);
              params.push(`%${condition.name.contains}%`);
              paramIndex++;
            }
            if (condition.description?.contains) {
              orConditions.push(`e.description ILIKE $${paramIndex}`);
              params.push(`%${condition.description.contains}%`);
              paramIndex++;
            }
            if (condition.venue?.contains) {
              orConditions.push(`e.venue ILIKE $${paramIndex}`);
              params.push(`%${condition.venue.contains}%`);
              paramIndex++;
            }
            if (condition.city?.contains) {
              orConditions.push(`e.city ILIKE $${paramIndex}`);
              params.push(`%${condition.city.contains}%`);
              paramIndex++;
            }
          });
          if (orConditions.length > 0) {
            whereClause += ` AND (${orConditions.join(' OR ')})`;
          }
        }
        
        const eventsQuery = `
          SELECT 
            e.id, e."uniqueId", e.name, e.description, e.sport, e.venue, e.address,
            e.city, e.state, e.latitude, e.longitude, e."startDate", e."endDate",
            e."maxParticipants", e."currentParticipants", e."eventFee", e.status,
            e."adminNotes", e."createdAt", e."updatedAt", e."coachId", e.level,
            c.id as "coach_id", c.name as "coach_name", c."primarySport" as "coach_primarySport", c.city as "coach_city",
            u.id as "user_id", u."uniqueId" as "user_uniqueId", u.email as "user_email", u.phone as "user_phone", u.role as "user_role"
          FROM events e
          LEFT JOIN coaches c ON e."coachId" = c.id
          LEFT JOIN users u ON c."userId" = u.id
          WHERE ${whereClause}
          ORDER BY e."createdAt" DESC
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        params.push(take, skip);
        
        const countQuery = `
          SELECT COUNT(*) as count
          FROM events e
          WHERE ${whereClause}
        `;
        
        let eventsRaw = [];
        try {
          const [eventsRawResult, totalRaw] = await Promise.all([
            prisma.$queryRawUnsafe(eventsQuery, ...params),
            prisma.$queryRawUnsafe(countQuery, ...params.slice(0, -2))
          ]);
          
          eventsRaw = eventsRawResult || [];
          total = parseInt(totalRaw[0]?.count || 0);
          console.log(`✅ Raw SQL query returned ${eventsRaw.length} events, total: ${total}`);
        } catch (sqlError) {
          console.error('❌ Raw SQL query error:', sqlError);
          // Fallback: return empty array
          eventsRaw = [];
          total = 0;
        }
        
        // Transform raw results to match expected format
        if (!eventsRaw || eventsRaw.length === 0) {
          console.log('⚠️  No events found in raw SQL query');
          events = [];
        } else {
          events = eventsRaw.map(row => ({
            id: row.id,
            uniqueId: row.uniqueId,
            name: row.name,
            description: row.description,
            sport: row.sport,
            venue: row.venue,
            address: row.address,
            city: row.city,
            state: row.state,
            // Preserve actual event level from DB (DISTRICT/STATE/NATIONAL/SCHOOL)
            level: row.level || 'DISTRICT',
            latitude: row.latitude ? parseFloat(row.latitude) : null,
            longitude: row.longitude ? parseFloat(row.longitude) : null,
            startDate: row.startDate,
            endDate: row.endDate,
            maxParticipants: row.maxParticipants,
            currentParticipants: row.currentParticipants,
            eventFee: row.eventFee ? parseFloat(row.eventFee) : 0,
            status: row.status,
            adminNotes: row.adminNotes,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            coachId: row.coachId,
            coordinatorFee: 0, // Default value for missing column
            eventCategory: null,
            feeMode: 'GLOBAL',
            coach: row.coach_id ? {
              id: row.coach_id,
              name: row.coach_name,
              primarySport: row.coach_primarySport,
              city: row.coach_city,
              user: row.user_id ? {
                id: row.user_id,
                uniqueId: row.user_uniqueId,
                email: row.user_email,
                phone: row.user_phone,
                role: row.user_role
              } : null
            } : null
          }));
        }
      } else {
        throw dbError;
      }
    }

    // Ensure events is always an array and total is a number
    if (!events || !Array.isArray(events)) {
      console.log('⚠️  Events is not an array, setting to empty array');
      events = [];
    }
    if (typeof total !== 'number' || isNaN(total)) {
      console.log('⚠️  Total is not a valid number, setting to 0');
      total = 0;
    }
    
    console.log(`✅ Final events count: ${events.length}, total: ${total}`);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    // Calculate payment status for each event.
    // NOTE: There are multiple revenue/payment sources:
    // - EventRegistrationOrder (legacy / coordinator flows)
    // - Payment (includes student participation fee payments: type=EVENT_STUDENT_FEE, tied via metadata.eventId)
    const eventsWithPaymentStatus = await Promise.all(
      events.map(async (event) => {
        try {
          // Get all registration orders for this event (EventRegistrationOrder model)
          const registrationOrders = await prisma.eventRegistrationOrder.findMany({
            where: { eventId: event.id },
            select: {
              totalFeeAmount: true,
              paymentStatus: true,
              totalStudents: true,
              createdAt: true
            }
          }).catch(() => []); // Fallback to empty array on error

          // 1) Registration order summary (existing behavior)
          const orderTotalAmount = registrationOrders.reduce((sum, order) => sum + (parseFloat(order.totalFeeAmount) || 0), 0);
          const orderPaidAmount = registrationOrders
            .filter(order => order.paymentStatus === 'PAID' || order.paymentStatus === 'SUCCESS')
            .reduce((sum, order) => sum + (parseFloat(order.totalFeeAmount) || 0), 0);

          // 2) Payment table summary (student participation fee + other payment records tied via metadata.eventId)
          const rawPayments = await prisma.payment.findMany({
            where: {
              metadata: { contains: event.id }
            },
            select: {
              id: true,
              type: true,
              amount: true,
              status: true,
              metadata: true
            },
            orderBy: { createdAt: 'desc' }
          }).catch(() => []);

          const eventPayments = rawPayments.filter(p => {
            try {
              const meta = p.metadata ? JSON.parse(p.metadata) : {};
              return meta.eventId === event.id;
            } catch {
              return false;
            }
          });

          const paymentTotalAmount = eventPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          const paymentPaidAmount = eventPayments
            .filter(p => p.status === 'SUCCESS' || p.status === 'PAID' || p.status === 'COMPLETED')
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

          // Prefer payment table summary when present; otherwise fall back to registration order summary.
          const hasPaymentRecords = eventPayments.length > 0;
          const totalAmount = hasPaymentRecords ? paymentTotalAmount : orderTotalAmount;
          const paidAmount = hasPaymentRecords ? paymentPaidAmount : orderPaidAmount;
          const orderCount = hasPaymentRecords ? eventPayments.length : registrationOrders.length;
          const paidOrderCount = hasPaymentRecords
            ? eventPayments.filter(p => p.status === 'SUCCESS' || p.status === 'PAID' || p.status === 'COMPLETED').length
            : registrationOrders.filter(o => o.paymentStatus === 'PAID' || o.paymentStatus === 'SUCCESS').length;

          let paymentStatus = 'NO_PAYMENTS';
          if (totalAmount > 0 || orderCount > 0) {
            if (paidAmount > 0 && (paidAmount >= totalAmount || totalAmount === 0)) {
              paymentStatus = 'PAID';
            } else if (paidAmount > 0) {
              paymentStatus = 'PARTIAL';
            } else {
              paymentStatus = 'PENDING';
            }
          }

          return {
            ...event,
            paymentSummary: {
              totalAmount,
              paidAmount,
              status: paymentStatus,
              orderCount,
              paidOrderCount
            }
          };
        } catch (error) {
          console.error(`Error calculating payment status for event ${event.id}:`, error);
          // Return event with default payment status on error
          return {
            ...event,
            paymentSummary: {
              totalAmount: 0,
              paidAmount: 0,
              status: 'NO_PAYMENTS',
              orderCount: 0,
              paidOrderCount: 0
            }
          };
        }
      })
    );

    // Format events for admin view with correct field names, including payment summary
    // Ensure all events have required fields with safe defaults
    const formattedEvents = eventsWithPaymentStatus.map(event => {
      // Validate event has required fields
      if (!event || !event.id) {
        console.warn('⚠️  Invalid event object found, skipping:', event);
        return null;
      }
      return {
      id: event.id,
      uniqueId: event.uniqueId, // Custom event UID
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
      coordinatorFee: event.coordinatorFee || 0,
      feeMode: event.feeMode || 'GLOBAL',
      level: event.level || 'DISTRICT',
      eventCategory: event.eventCategory || null,
      status: event.status,
      adminNotes: event.adminNotes,
      createdAt: event.createdAt,
      paymentSummary: event.paymentSummary || { // Include payment summary from registration orders
        totalAmount: 0,
        paidAmount: 0,
        status: 'NO_PAYMENTS',
        orderCount: 0,
        paidOrderCount: 0
      },
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
        city: event.coach?.city,
        user: event.coach?.user || null // Include user object with uniqueId, email, phone
      }
    };
    }).filter(event => event !== null); // Remove any null entries

    // Ensure response is always valid
    const responseData = {
      events: Array.isArray(formattedEvents) ? formattedEvents : [],
      pagination: pagination || {
        page: pageNum,
        limit: limitNum,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    };

    res.json(successResponse(responseData, 'Events retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get events error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Always return a valid response, even on error
    const errorResponseData = {
      events: [],
      pagination: {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    };
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve events. Please try again or contact support.',
      data: errorResponseData,
      statusCode: 500,
      ...(process.env.NODE_ENV === 'development' && {
        error: {
          message: error.message,
          code: error.code
        }
      })
    });
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
        // Map action to proper notification type enum
        const notificationTypeMap = {
          'APPROVE': 'EVENT_APPROVED',
          'REJECT': 'EVENT_REJECTED',
          'SUSPEND': 'EVENT_SUSPENDED',
          'RESTART': 'EVENT_RESTARTED'
        };
        const notificationType = notificationTypeMap[action] || `EVENT_${action}`;
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

// Update event status (e.g., to COMPLETED for certificate generation)
router.put('/events/:eventId/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'REJECTED', 'SUSPENDED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json(errorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
    }

    console.log(`🔄 Updating event ${eventId} status to ${status.toUpperCase()}`);

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: status.toUpperCase(),
        updatedAt: new Date()
      },
      include: {
        coach: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`✅ Event status updated to ${updatedEvent.status}`);
    res.json(successResponse(updatedEvent, `Event status updated to ${updatedEvent.status}`));

  } catch (error) {
    console.error('❌ Update event status error:', error);
    res.status(500).json(errorResponse(`Failed to update event status: ${error.message}`, 500));
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
      uniqueId: event.uniqueId, // Custom event UID
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
                  uniqueId: true,
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
        uniqueId: event.uniqueId, // Custom event UID
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

// Get event payments (Admin access) - includes student participation fee payments
router.get('/events/:eventId/payments', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, uniqueId: true }
    });
    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    // Fetch payments that reference this event in metadata (covers EVENT_STUDENT_FEE and other event-related payments)
    const rawPayments = await prisma.payment.findMany({
      where: {
        metadata: { contains: eventId }
      },
      include: {
        user: {
          select: {
            id: true,
            uniqueId: true,
            email: true,
            phone: true,
            role: true,
            name: true,
            studentProfile: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter to payments actually for this event (metadata contains can be noisy)
    const payments = rawPayments.filter(p => {
      try {
        const meta = p.metadata ? JSON.parse(p.metadata) : {};
        return meta.eventId === eventId;
      } catch {
        return false;
      }
    }).map(p => {
      let meta = {};
      try { meta = p.metadata ? JSON.parse(p.metadata) : {}; } catch {}

      return {
        id: p.id,
        type: p.type,
        amount: Number(p.amount) || 0,
        currency: p.currency || 'INR',
        status: p.status,
        description: p.description,
        razorpayOrderId: p.razorpayOrderId,
        razorpayPaymentId: p.razorpayPaymentId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        metadata: meta,
        user: p.user ? {
          id: p.user.id,
          uniqueId: p.user.uniqueId,
          email: p.user.email,
          phone: p.user.phone,
          role: p.user.role,
          name: p.user.studentProfile?.name || p.user.name || p.user.email
        } : null
      };
    });

    res.json(successResponse({
      event,
      payments
    }, 'Event payments retrieved successfully.'));
  } catch (error) {
    console.error('Get event payments error:', error);
    res.status(500).json(errorResponse('Failed to retrieve event payments.', 500));
  }
});

// Admin: Create Event Incharge user (no self-register)
router.post('/create-event-incharge', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, password, state = 'Delhi' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json(errorResponse('name, email and password are required.', 400));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : [])
        ]
      }
    });
    if (existingUser) {
      return res.status(409).json(errorResponse('User with this email/phone already exists.', 409));
    }

    const uniqueId = await generateUID('EVENT_INCHARGE', state);
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        uniqueId,
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: 'EVENT_INCHARGE',
        isActive: true,
        isVerified: true
      },
      select: {
        id: true,
        uniqueId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true
      }
    });

    res.status(201).json(successResponse({ user }, 'Event Incharge user created successfully.', 201));
  } catch (error) {
    console.error('Create event incharge error:', error);
    res.status(500).json(errorResponse('Failed to create Event Incharge user.', 500));
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
              level: true,
              startDate: true,
              venue: true,
              city: true
            }
          },
          coach: {
            select: { 
              id: true, 
              name: true,
              specialization: true,
              user: {
                select: {
                  uniqueId: true,
                  email: true,
                  phone: true
                }
              }
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

    const normalizedStatus = status ? status.toUpperCase() : null;

    const safeTotalAmount =
      calculatedTotal !== null &&
      calculatedTotal !== undefined &&
      Number.isFinite(Number(calculatedTotal))
        ? Number.parseFloat(calculatedTotal)
        : undefined;

    const updateData = {
      ...(normalizedStatus && { status: normalizedStatus }),
      ...(adminRemarks !== undefined && { adminRemarks }),
      ...(certificatePrice !== undefined && { certificatePrice: parseFloat(certificatePrice) }),
      ...(medalPrice !== undefined && { medalPrice: parseFloat(medalPrice) }),
      ...(trophyPrice !== undefined && { trophyPrice: parseFloat(trophyPrice) }),
      ...(safeTotalAmount !== undefined && { totalAmount: safeTotalAmount }),
      processedBy: req.admin.id,
      processedAt: new Date()
    };

    // Set completion timestamp if status is COMPLETED
    if (normalizedStatus && normalizedStatus === 'COMPLETED') {
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
                    phone: true,
                    uniqueId: true
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
        uniqueId: file.event.uniqueId, // Custom event UID
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

// Get user notifications - Optimized with caching
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

    // Add cache headers (cache for 30 seconds)
    res.set('Cache-Control', 'private, max-age=30');

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

// Get notification count (for header badge) - Optimized with caching
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

    // Add cache headers to reduce database load (cache for 30 seconds)
    res.set('Cache-Control', 'private, max-age=30');

    res.json(successResponse({
      unreadCount
    }, 'Notification count retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get notification count error:', error);
    res.status(500).json(errorResponse('Failed to retrieve notification count.', 500));
  }
});

// Revenue Dashboard - Get comprehensive financial insights
router.get('/revenue/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    const { dateRange = '30' } = req.query; // Days to look back
    let daysBack;
    let startDate = new Date();
    if (dateRange === 'ytd') {
      // Year to Date: from Jan 1st of current year
      startDate = new Date(startDate.getFullYear(), 0, 1);
      // Calculate daysBack as days from Jan 1 to today (inclusive)
      const now = new Date();
      daysBack = Math.floor((now - startDate) / (1000 * 60 * 60 * 24)) + 1;
      console.log(`💰 Fetching revenue dashboard data for Year to Date (YTD): from ${startDate.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]} (${daysBack} days)`);
    } else {
      daysBack = parseInt(dateRange);
      startDate.setDate(startDate.getDate() - daysBack);
      console.log(`💰 Fetching revenue dashboard data for last ${daysBack} days...`);
    }

    // Get all revenue sources in parallel
    const [
      // Membership Payments (Coaches, Institutes, Clubs)
      coachSubscriptions,
      instituteMemberships,
      clubMemberships,
      
      // Event Order Payments
      eventOrders,
      eventPayments,
      
      // All Payments
      allPayments,
      
      // Premium Members
      premiumCoaches,
      activeCoaches,
      
      // Top Spenders
      topSpendingCoaches
    ] = await Promise.all([
      // Coach subscriptions
      prisma.coach.findMany({
        where: {
          paymentStatus: 'SUCCESS',
          subscriptionType: { in: ['MONTHLY', 'ANNUAL'] }
        },
        select: {
          id: true,
          name: true,
          paymentStatus: true,
          subscriptionType: true,
          subscriptionExpiresAt: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              uniqueId: true
            }
          }
        }
      }),

      // Institute memberships
      prisma.institute.findMany({
        where: {
          paymentStatus: 'SUCCESS'
        },
        select: {
          id: true,
          name: true,
          paymentStatus: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              uniqueId: true
            }
          }
        }
      }),

      // Club memberships
      prisma.club.findMany({
        where: {
          paymentStatus: 'SUCCESS'
        },
        select: {
          id: true,
          name: true,
          paymentStatus: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              uniqueId: true
            }
          }
        }
      }),

      // Event Orders
      prisma.eventOrder.findMany({
        where: {
          paymentStatus: 'SUCCESS',
          createdAt: { gte: startDate }
        },
        include: {
          coach: {
            select: {
              id: true,
              name: true,
              user: {
                select: {
                  email: true,
                  phone: true,
                  uniqueId: true
                }
              }
            }
          },
          event: {
            select: {
              id: true,
              name: true,
              sport: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Event Payments
      prisma.eventPayment.findMany({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startDate }
        },
        include: {
          event: {
            select: {
              name: true,
              sport: true,
              coach: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }),

      // All successful payments - Using raw query to avoid type casting issues
      prisma.$queryRaw`
        SELECT 
          p.id, p."userId", p."userType", p."coachId", p.type, p.amount, 
          p.currency, p."razorpayOrderId", p."razorpayPaymentId", p.status, 
          p.description, p.metadata, p."expiresAt", p."createdAt", p."updatedAt"
        FROM payments p
        WHERE p.status::text = 'SUCCESS'
        AND p."createdAt" >= ${startDate}
        ORDER BY p."createdAt" DESC
      `.then(async (payments) => {
        // Fetch related user and coach data for each payment
        return Promise.all(payments.map(async (payment) => {
          const user = payment.userId ? await prisma.user.findUnique({
            where: { id: payment.userId },
            select: {
              role: true,
              email: true,
              studentProfile: { select: { name: true } },
              coachProfile: { select: { name: true } },
              instituteProfile: { select: { name: true } },
              clubProfile: { select: { name: true } }
            }
          }) : null;
          
          const coach = payment.coachId ? await prisma.coach.findUnique({
            where: { id: payment.coachId },
            select: { name: true }
          }) : null;
          
          return {
            ...payment,
            user,
            coach
          };
        }));
      }),

      // Premium Coaches (Active subscriptions)
      prisma.coach.findMany({
        where: {
          paymentStatus: 'SUCCESS',
          subscriptionType: { in: ['MONTHLY', 'ANNUAL'] },
          subscriptionExpiresAt: { gt: new Date() }
        },
        select: {
          id: true,
          name: true,
          subscriptionType: true,
          subscriptionExpiresAt: true,
          primarySport: true,
          city: true,
          totalStudents: true,
          rating: true,
          user: {
            select: {
              email: true,
              phone: true,
              uniqueId: true,
              createdAt: true
            }
          }
        },
        orderBy: { subscriptionExpiresAt: 'desc' }
      }),

      // Total active coaches (coaches with users that are active)
      prisma.coach.count({
        where: { 
          user: {
            isActive: true
          }
        }
      }),

      // Top spending coaches (by event orders)
      prisma.coach.findMany({
        where: {
          eventOrders: {
            some: {
              paymentStatus: 'SUCCESS'
            }
          }
        },
        select: {
          id: true,
          name: true,
          primarySport: true,
          city: true,
          user: {
            select: {
              email: true,
              phone: true,
              uniqueId: true
            }
          },
          eventOrders: {
            where: {
              paymentStatus: 'SUCCESS',
              totalAmount: { not: null }
            },
            select: {
              totalAmount: true,
              createdAt: true
            }
          }
        },
        take: 20
      })
    ]);

    // Calculate revenue totals
    const membershipRevenue = {
      coaches: coachSubscriptions.length,
      institutes: instituteMemberships.length,
      clubs: clubMemberships.length,
      total: coachSubscriptions.length + instituteMemberships.length + clubMemberships.length
    };

    const orderRevenue = {
      totalOrders: eventOrders.length,
      totalAmount: eventOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      certificates: eventOrders.reduce((sum, order) => sum + (order.certificates || 0), 0),
      medals: eventOrders.reduce((sum, order) => sum + (order.medals || 0), 0),
      trophies: eventOrders.reduce((sum, order) => sum + (order.trophies || 0), 0)
    };

    const eventPaymentRevenue = {
      totalPayments: eventPayments.length,
      totalAmount: eventPayments.reduce((sum, payment) => sum + payment.amount, 0)
    };

    const paymentRevenue = {
      total: allPayments.length,
      totalAmount: allPayments.reduce((sum, payment) => sum + payment.amount, 0),
      byType: {}
    };

    // Group payments by type
    allPayments.forEach(payment => {
      const type = payment.type || 'OTHER';
      if (!paymentRevenue.byType[type]) {
        paymentRevenue.byType[type] = {
          count: 0,
          amount: 0
        };
      }
      paymentRevenue.byType[type].count++;
      paymentRevenue.byType[type].amount += payment.amount;
    });

    // Calculate total revenue
    const totalRevenue = 
      orderRevenue.totalAmount + 
      eventPaymentRevenue.totalAmount + 
      paymentRevenue.totalAmount;

    // Process top spending coaches
    const topSpenders = topSpendingCoaches
      .map(coach => ({
        id: coach.id,
        name: coach.name,
        uniqueId: coach.user?.uniqueId,
        email: coach.user?.email,
        phone: coach.user?.phone,
        primarySport: coach.primarySport,
        city: coach.city,
        totalSpent: coach.eventOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
        orderCount: coach.eventOrders.length,
        avgOrderValue: coach.eventOrders.length > 0 
          ? coach.eventOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / coach.eventOrders.length 
          : 0,
        lastOrderDate: coach.eventOrders.length > 0 
          ? Math.max(...coach.eventOrders.map(o => new Date(o.createdAt).getTime()))
          : null
      }))
      .filter(coach => coach.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Format premium members
    const premiumMembers = premiumCoaches.map(coach => ({
      id: coach.id,
      name: coach.name,
      uniqueId: coach.user?.uniqueId,
      email: coach.user?.email,
      phone: coach.user?.phone,
      subscriptionType: coach.subscriptionType,
      subscriptionExpiresAt: coach.subscriptionExpiresAt,
      primarySport: coach.primarySport,
      city: coach.city,
      totalStudents: coach.totalStudents,
      rating: coach.rating,
      memberSince: coach.user?.createdAt,
      daysUntilExpiry: Math.ceil(
        (new Date(coach.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    }));

    // Recent transactions (last 20)
    const recentTransactions = [
      ...eventOrders.map(order => ({
        id: order.id,
        type: 'ORDER',
        description: `Order #${order.orderNumber || ''} - ${(order.certificates || 0)} certificates, ${(order.medals || 0)} medals, ${(order.trophies || 0)} trophies`,
        amount: order.totalAmount || 0,
        status: order.paymentStatus || '',
        date: order.paymentDate || order.createdAt,
        customer: {
          name: order.coach?.name || '',
          uniqueId: order.coach?.user?.uniqueId || '',
          email: order.coach?.user?.email || '',
          type: 'COACH'
        },
        eventName: order.event?.name || '',
        sport: order.event?.sport || ''
      })),
      ...eventPayments.map(payment => ({
        id: payment.id,
        type: 'EVENT_PAYMENT',
        description: `Event Fee - ${payment.event?.name}`,
        amount: payment.amount,
        status: payment.status,
        date: payment.createdAt,
        customer: {
          name: payment.event?.coach?.name,
          type: 'EVENT'
        },
        eventName: payment.event?.name,
        sport: payment.event?.sport
      })),
      ...allPayments.map(payment => ({
        id: payment.id,
        type: payment.type,
        description: payment.description || `${payment.type} Payment`,
        amount: payment.amount,
        status: payment.status,
        date: payment.createdAt,
        customer: {
          name: payment.user?.studentProfile?.name || 
                payment.user?.coachProfile?.name || 
                payment.user?.instituteProfile?.name || 
                payment.user?.clubProfile?.name ||
                payment.coach?.name ||
                'Unknown',
          type: payment.userType || payment.user?.role || 'UNKNOWN',
          email: payment.user?.email
        }
      }))
    ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

    // Revenue trend with appropriate granularity
    const dailyRevenue = [];
    
    // Determine granularity based on date range
    let granularity = 'day'; // default
    if (dateRange === '1') {
      granularity = 'hour'; // 24 hours
    } else if (daysBack <= 90) {
      granularity = 'day'; // daily for up to 90 days
    } else if (daysBack <= 365 || dateRange === 'ytd') {
      granularity = 'week'; // weekly for 6 months to 1 year
    } else {
      granularity = 'month'; // monthly for > 1 year
    }

    console.log(`📊 Using ${granularity} granularity for ${daysBack} days`);

    if (granularity === 'hour') {
      // Hourly breakdown for 1 day (24 hours)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let hour = 0; hour < 24; hour++) {
        const hourStart = new Date(today);
        hourStart.setHours(hour);
        const hourEnd = new Date(today);
        hourEnd.setHours(hour + 1);

        const hourOrders = eventOrders.filter(o => {
          const orderDate = new Date(o.paymentDate || o.createdAt);
          return orderDate >= hourStart && orderDate < hourEnd;
        });

        const hourPayments = allPayments.filter(p => {
          const paymentDate = new Date(p.createdAt);
          return paymentDate >= hourStart && paymentDate < hourEnd;
        });

        dailyRevenue.push({
          date: `${hourStart.toISOString().split('T')[0]} ${hour.toString().padStart(2, '0')}:00`,
          label: `${hour.toString().padStart(2, '0')}:00`,
          revenue: hourOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) +
                  hourPayments.reduce((sum, p) => sum + p.amount, 0),
          orders: hourOrders.length,
          payments: hourPayments.length
        });
      }
    } else if (granularity === 'day') {
      // Daily breakdown
      for (let i = daysBack - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayOrders = eventOrders.filter(o => {
          const orderDate = new Date(o.paymentDate || o.createdAt);
          return orderDate >= date && orderDate < nextDate;
        });

        const dayPayments = allPayments.filter(p => {
          const paymentDate = new Date(p.createdAt);
          return paymentDate >= date && paymentDate < nextDate;
        });

        dailyRevenue.push({
          date: date.toISOString().split('T')[0],
          label: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          revenue: dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) +
                  dayPayments.reduce((sum, p) => sum + p.amount, 0),
          orders: dayOrders.length,
          payments: dayPayments.length
        });
      }
    } else if (granularity === 'week') {
      // Weekly breakdown
      const weeks = Math.ceil(daysBack / 7);
      for (let i = weeks - 1; i >= 0; i--) {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        weekEnd.setHours(23, 59, 59, 999);
        
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);

        const weekOrders = eventOrders.filter(o => {
          const orderDate = new Date(o.paymentDate || o.createdAt);
          return orderDate >= weekStart && orderDate <= weekEnd;
        });

        const weekPayments = allPayments.filter(p => {
          const paymentDate = new Date(p.createdAt);
          return paymentDate >= weekStart && paymentDate <= weekEnd;
        });

        dailyRevenue.push({
          date: weekStart.toISOString().split('T')[0],
          label: `${weekStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`,
          revenue: weekOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) +
                  weekPayments.reduce((sum, p) => sum + p.amount, 0),
          orders: weekOrders.length,
          payments: weekPayments.length
        });
      }
    } else if (granularity === 'month') {
      // Monthly breakdown
      const months = Math.ceil(daysBack / 30);
      const endDate = new Date();
      const tempStartDate = new Date(startDate);
      
      // Get unique months in range
      const monthsSet = new Set();
      for (let d = new Date(tempStartDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
        monthsSet.add(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`);
      }
      
      const monthsList = Array.from(monthsSet).sort();
      
      monthsList.forEach(monthKey => {
        const [year, month] = monthKey.split('-').map(Number);
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

        const monthOrders = eventOrders.filter(o => {
          const orderDate = new Date(o.paymentDate || o.createdAt);
          return orderDate >= monthStart && orderDate <= monthEnd;
        });

        const monthPayments = allPayments.filter(p => {
          const paymentDate = new Date(p.createdAt);
          return paymentDate >= monthStart && paymentDate <= monthEnd;
        });

        dailyRevenue.push({
          date: monthStart.toISOString().split('T')[0],
          label: monthStart.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
          revenue: monthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) +
                  monthPayments.reduce((sum, p) => sum + p.amount, 0),
          orders: monthOrders.length,
          payments: monthPayments.length
        });
      });
    }

    const dashboardData = {
      summary: {
        totalRevenue,
        orderRevenue: orderRevenue.totalAmount,
        paymentRevenue: paymentRevenue.totalAmount,
        eventPaymentRevenue: eventPaymentRevenue.totalAmount,
        premiumMemberCount: premiumMembers.length,
        totalActiveCoaches: activeCoaches,
        premiumPercentage: activeCoaches > 0 ? (premiumMembers.length / activeCoaches * 100).toFixed(2) : 0
      },
      membership: membershipRevenue,
      orders: orderRevenue,
      payments: paymentRevenue,
      eventPayments: eventPaymentRevenue,
      premiumMembers: premiumMembers.slice(0, 20), // Top 20
      topSpenders,
      recentTransactions,
      dailyRevenue,
      dateRange: {
        from: startDate.toISOString(),
        to: new Date().toISOString(),
        days: daysBack
      }
    };

    console.log(`✅ Revenue dashboard data compiled successfully`);
    console.log(`💰 Total Revenue: ₹${totalRevenue.toFixed(2)}`);
    console.log(`👥 Premium Members: ${premiumMembers.length} / ${activeCoaches} coaches`);
    console.log(`📦 Orders: ${orderRevenue.totalOrders} orders worth ₹${orderRevenue.totalAmount.toFixed(2)}`);
    console.log(`📈 Daily Revenue Data Points: ${dailyRevenue.length}`);
    console.log(`📊 Sample Daily Revenue:`, dailyRevenue.slice(0, 3));

    res.json(successResponse(dashboardData, 'Revenue dashboard data retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get revenue dashboard error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    if (error.meta) {
      console.error('Prisma error meta:', JSON.stringify(error.meta, null, 2));
    }
    res.status(500).json(errorResponse(`Failed to retrieve revenue dashboard data: ${error.message}`, 500));
  }
});

// Admin: Create event
router.post('/events', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      sport,
      venue,
      address,
      city,
      state,
      latitude,
      longitude,
      startDate,
      endDate,
      maxParticipants
    } = req.body;

    // Validation
    if (!name || !description || !sport || !venue || !startDate) {
      return res.status(400).json(errorResponse('Name, description, sport, venue, and start date are required.', 400));
    }

    // Load global payment defaults
    const globalSettings = await prisma.globalSettings.findFirst();

    // Parse dates for India (IST) only platform
    const parseAsIST = (dateString) => {
      if (!dateString) return null;
      if (dateString.includes('+') || dateString.includes('Z')) {
        return new Date(dateString);
      }
      return new Date(dateString + '+05:30');
    };
    
    let startDateObj, endDateObj;
    
    if (startDate) {
      startDateObj = parseAsIST(startDate);
      console.log('📅 Admin creating event - Start date:', {
        input: startDate,
        parsed: startDateObj
      });
    }
    
    if (endDate) {
      endDateObj = parseAsIST(endDate);
      console.log('📅 Admin creating event - End date:', {
        input: endDate,
        parsed: endDateObj
      });
    }

    if (!startDateObj || startDateObj <= new Date()) {
      return res.status(400).json(errorResponse('Event start date must be in the future.', 400));
    }

    if (endDateObj && endDateObj <= startDateObj) {
      return res.status(400).json(errorResponse('Event end date must be after start date.', 400));
    }

    // Get or create a system coach for admin-created events
    // First check if there's a coach with email "system-admin-coach@stairs.com"
    let systemCoach = await prisma.coach.findFirst({
      where: {
        user: {
          email: 'system-admin-coach@stairs.com'
        }
      },
      include: {
        user: true
      }
    }).catch(() => null);

    if (!systemCoach) {
      console.log('🔧 Creating system coach for admin events...');
      // Create a system user first
      const systemUser = await prisma.user.create({
        data: {
          email: 'system-admin-coach@stairs.com',
          password: '', // No password needed for system account
          role: 'COACH',
          isActive: true,
          isVerified: true,
          name: 'System Admin Coach'
        }
      });

      // Create the coach profile
      systemCoach = await prisma.coach.create({
        data: {
          userId: systemUser.id,
          name: 'System Admin Coach',
          isActive: true,
          specialization: 'System Events'
        },
        include: {
          user: true
        }
      });

      console.log('✅ System coach created:', systemCoach.id);
    }

    // Generate unique event ID (format: EVT-0001-FB-DL-071125)
    const eventUniqueId = await generateEventUID(sport, state || 'Delhi');

    // Admin-created events are automatically approved
    const event = await prisma.event.create({
      data: {
        name,
        description,
        sport,
        venue,
        address,
        city,
        state,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        startDate: startDateObj,
        endDate: endDateObj || null,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : 50,
        eventFee: 0,
        // Student participation fee defaults for admin-created events
        studentFeeEnabled: req.body?.studentFeeEnabled !== undefined
          ? !!req.body.studentFeeEnabled
          : (globalSettings?.adminStudentFeeEnabled ?? false),
        studentFeeAmount: req.body?.studentFeeAmount !== undefined
          ? Number(req.body.studentFeeAmount) || 0
          : (globalSettings?.adminStudentFeeAmount ?? 0),
        studentFeeUnit: 'PERSON',
        createdByAdmin: true,
        status: 'APPROVED', // Admin events are auto-approved
        uniqueId: eventUniqueId,
        coachId: systemCoach.id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        coach: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        },
        registrations: true
      }
    });

    console.log('✅ Admin created event:', event.id, 'linked to coach:', systemCoach.id);

    res.status(201).json(successResponse(event, 'Event created successfully by admin.'));

  } catch (error) {
    console.error('❌ Admin create event error:', error);
    res.status(500).json(errorResponse('Failed to create event: ' + error.message, 500));
  }
});

/**
 * POST-EVENT COMPLETION & CERTIFICATE MANAGEMENT
 */

// Get all registration orders for a completed event (for admin certificate issuance)
router.get('/events/:eventId/registrations/orders', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    const orders = await prisma.eventRegistrationOrder.findMany({
      where: { eventId },
      include: {
        registrationItems: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                sport: true
              }
            }
          }
        },
        coach: {
          select: {
            id: true,
            name: true,
            user: {
              select: { email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(successResponse({
      event: {
        id: event.id,
        name: event.name,
        sport: event.sport,
        status: event.status,
        startDate: event.startDate,
        endDate: event.endDate
      },
      orders
    }, 'Event registration orders retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get event registration orders error:', error);
    res.status(500).json(errorResponse('Registration orders not found.', 500));
  }
});

// Notify coordinator for final payment & generate certificates after event completion
router.post('/events/:eventId/registrations/notify-completion', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { notifyMessage } = req.body;

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    // Allow notification even if event is not COMPLETED (admin can notify early)
    // But warn if event is not completed
    if (event.status !== 'COMPLETED') {
      console.warn(`⚠️ Notifying for event ${eventId} with status: ${event.status} (not COMPLETED)`);
    }

    // Find all paid registration orders for this event (legacy flow)
    const registrationOrders = await prisma.eventRegistrationOrder.findMany({
      where: {
        eventId,
        paymentStatus: 'PAID' // Only notify coaches who have paid
      },
      include: {
        registrationItems: {
          include: {
            student: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        coach: {
          include: {
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

    // If there are no paid registration orders (e.g. admin-created events / student-fee events),
    // fall back to notifying event owner + assigned users (INCHARGE/COORDINATOR/TEAM).
    if (registrationOrders.length === 0) {
      const fallbackMessage =
        (notifyMessage && String(notifyMessage).trim()) ||
        `Event "${event.name}" has been completed. Certificates can now be issued. Please check your dashboard for details.`;

      // Build target users: event owner (coach user) + assigned users
      const targets = [];

      // Event owner coach user (if available)
      const owner = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          coach: { select: { userId: true, name: true, user: { select: { email: true } } } }
        }
      }).catch(() => null);
      if (owner?.coach?.userId) {
        targets.push({
          userId: owner.coach.userId,
          name: owner.coach.name || 'Coordinator',
          email: owner.coach.user?.email || null
        });
      }

      // Assigned users
      const assignments = await prisma.eventAssignment.findMany({
        where: { eventId, role: { in: ['INCHARGE', 'COORDINATOR', 'TEAM'] } },
        include: {
          user: { select: { id: true, email: true, name: true } }
        }
      }).catch(() => []);

      assignments.forEach(a => {
        if (a?.user?.id) {
          targets.push({
            userId: a.user.id,
            name: a.user.name || 'Assigned User',
            email: a.user.email || null
          });
        }
      });

      // Deduplicate by userId
      const uniqueTargets = Array.from(new Map(targets.map(t => [t.userId, t])).values());
      if (uniqueTargets.length === 0) {
        return res.status(400).json(errorResponse('No paid registration orders found and no assigned users available to notify for this event.', 400));
      }

      // Count participants + paid amount (best-effort) for email content
      const participantCount = await prisma.eventRegistration.count({ where: { eventId } }).catch(() => 0);
      const paidStudentAmount = await prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          type: 'EVENT_STUDENT_FEE',
          metadata: { contains: eventId }
        },
        _sum: { amount: true }
      }).then(r => r?._sum?.amount || 0).catch(() => 0);

      const results = await Promise.all(uniqueTargets.map(async (t) => {
        let dbNotification = null;
        let emailSent = false;
        const errors = [];

        try {
          dbNotification = await prisma.notification.create({
            data: {
              userId: t.userId,
              type: 'ORDER_COMPLETED',
              title: `Event Completed - Certificates Ready: ${event.name}`,
              message: fallbackMessage,
              data: JSON.stringify({
                eventId,
                eventName: event.name,
                participantCount,
                totalPaidAmount: paidStudentAmount,
                notificationType: 'event_completion',
                actionUrl: `/events/${eventId}`
              })
            }
          });
        } catch (e) {
          errors.push(`Failed to create notification: ${e.message}`);
        }

        if (t.email) {
          try {
            const emailResult = await sendEventCompletionEmail(
              t.email,
              t.name,
              event.name,
              participantCount,
              paidStudentAmount,
              notifyMessage || ''
            );
            emailSent = !!emailResult?.success;
            if (!emailSent) errors.push(`Failed to send email: ${emailResult?.error || 'unknown error'}`);
          } catch (e) {
            errors.push(`Error sending email: ${e.message}`);
          }
        } else {
          errors.push('Missing email, skipping email notification');
        }

        return { userId: t.userId, name: t.name, notificationCreated: !!dbNotification, emailSent, errors };
      }));

      const notificationsCreated = results.filter(r => r.notificationCreated).length;
      const emailsSent = results.filter(r => r.emailSent).length;
      const totalErrors = results.reduce((s, r) => s + (r.errors?.length || 0), 0);

      return res.json(successResponse({
        ordersNotified: 0,
        totalStudentsForCertificates: participantCount,
        totalAmount: paidStudentAmount,
        notificationsCreated,
        emailsSent,
        totalErrors,
        coachesNotified: results.map(r => ({
          coachId: null,
          coachName: r.name,
          notificationCreated: r.notificationCreated,
          emailSent: r.emailSent,
          errors: r.errors
        })),
        message: `Notified ${notificationsCreated}/${uniqueTargets.length} user(s) via dashboard. ${emailsSent}/${uniqueTargets.length} email(s) sent.${totalErrors > 0 ? ` ${totalErrors} warning(s) occurred.` : ''}`
      }, 'Completion notification sent successfully.'));
    }

    // Mark orders as notified and ready for certificate generation
    const updatedOrders = await Promise.all(
      registrationOrders.map(order =>
        prisma.eventRegistrationOrder.update({
          where: { id: order.id },
          data: {
            adminNotified: true,
            adminNotes: notifyMessage || 'Admin notified coordinator for final payment and certificate generation'
          }
        })
      )
    );

    // Send notifications to coaches (database notifications + emails) with comprehensive error handling
    const notificationPromises = registrationOrders.map(async (order) => {
      let dbNotification = null;
      let emailSent = false;
      const errors = [];

      // Create database notification - use ORDER_COMPLETED type for better visibility in coordinator dashboard
      try {
        if (!order.coach?.user?.id) {
          throw new Error(`Coach ${order.coach?.id} missing user ID`);
        }

        dbNotification = await prisma.notification.create({
          data: {
            userId: order.coach.user.id,
            type: 'ORDER_COMPLETED', // More specific than GENERAL - shows in coordinator dashboard with proper icon/color
            title: `Event Completed - Certificates Ready: ${event.name}`,
            message: notifyMessage || `Your event "${event.name}" has been completed. ${order.registrationItems.length} student certificate(s) are ready for generation. Please check your dashboard for details.${order.totalFeeAmount ? ` Total amount: ₹${order.totalFeeAmount.toLocaleString()}` : ''}`,
            data: JSON.stringify({
              eventId,
              eventName: event.name,
              registrationOrderId: order.id,
              studentCount: order.registrationItems.length,
              totalAmount: order.totalFeeAmount,
              notificationType: 'event_completion',
              actionUrl: `/coach/events/${eventId}`
            })
          }
        });
        console.log(`✅ Database notification created for coach ${order.coach.id} (user ${order.coach.user.id})`);
      } catch (notificationError) {
        const errorMsg = `Failed to create notification for coach ${order.coach?.id}: ${notificationError.message}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
        // Continue with email even if notification creation fails
      }

      // Send email notification to coach
      if (order.coach?.user?.email && order.coach?.name) {
        try {
          const emailResult = await sendEventCompletionEmail(
            order.coach.user.email,
            order.coach.name,
            event.name,
            order.registrationItems.length,
            order.totalFeeAmount,
            notifyMessage || ''
          );
          
          if (emailResult.success) {
            emailSent = true;
            console.log(`📧 Event completion email sent to ${order.coach.user.email}`);
          } else {
            const errorMsg = `Failed to send email to ${order.coach.user.email}: ${emailResult.error}`;
            console.error(`⚠️ ${errorMsg}`);
            errors.push(errorMsg);
          }
        } catch (emailError) {
          const errorMsg = `Error sending email to ${order.coach.user.email}: ${emailError.message}`;
          console.error(`⚠️ ${errorMsg}`);
          errors.push(errorMsg);
          // Don't fail the request if email fails
        }
      } else {
        const warningMsg = `Coach ${order.coach?.id} missing email or name, skipping email notification`;
        console.warn(`⚠️ ${warningMsg}`);
        errors.push(warningMsg);
      }

      return {
        notification: dbNotification,
        emailSent,
        errors,
        coachId: order.coach?.id,
        coachName: order.coach?.name
      };
    });

    const notificationResults = await Promise.all(notificationPromises);

    // Calculate statistics
    const successfulNotifications = notificationResults.filter(r => r.notification !== null).length;
    const successfulEmails = notificationResults.filter(r => r.emailSent).length;
    const totalErrors = notificationResults.reduce((sum, r) => sum + r.errors.length, 0);
    const totalStudents = updatedOrders.reduce((sum, order) => sum + (order.registrationItems?.length || 0), 0);
    const totalAmount = updatedOrders.reduce((sum, order) => sum + (order.totalFeeAmount || 0), 0);

    console.log(`✅ Notified ${successfulNotifications}/${registrationOrders.length} coaches (database), ${successfulEmails}/${registrationOrders.length} (email)`);
    if (totalErrors > 0) {
      console.warn(`⚠️ ${totalErrors} error(s) occurred during notification process`);
    }

    res.json(successResponse({
      ordersNotified: updatedOrders.length,
      totalStudentsForCertificates: totalStudents,
      totalAmount: totalAmount,
      notificationsCreated: successfulNotifications,
      emailsSent: successfulEmails,
      totalErrors: totalErrors,
      coachesNotified: notificationResults.map(r => ({
        coachId: r.coachId,
        coachName: r.coachName,
        notificationCreated: r.notification !== null,
        emailSent: r.emailSent,
        errors: r.errors
      })),
      message: `Successfully notified ${successfulNotifications} coordinator(s) via dashboard. ${successfulEmails} email(s) sent. ${totalStudents} certificate(s) ready for generation.${totalErrors > 0 ? ` ${totalErrors} warning(s) occurred.` : ''}`
    }, 'Completion notification sent successfully.'));

  } catch (error) {
    console.error('❌ Notify completion error:', error);
    res.status(500).json(errorResponse('Failed to send completion notification: ' + error.message, 500));
  }
});

// Generate certificates for a registration order
router.post('/registrations/orders/:orderId/generate-certificates', authenticate, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;

    const registrationOrder = await prisma.eventRegistrationOrder.findUnique({
      where: { id: orderId },
      include: {
        event: true,
        registrationItems: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    email: true,
                    uniqueId: true
                  }
                }
              }
            }
          }
        },
        coach: true
      }
    });

    if (!registrationOrder) {
      return res.status(404).json(errorResponse('Registration order not found.', 404));
    }

    // Ensure the registration order is paid before issuing certificates
    if (registrationOrder.paymentStatus !== 'PAID') {
      return res.status(400).json(errorResponse('Cannot generate certificates until the registration order is PAID.', 400));
    }

    // Check event is completed
    if (registrationOrder.event.status !== 'COMPLETED') {
      return res.status(400).json(errorResponse('Cannot generate certificates until event is completed.', 400));
    }

    // Generate certificates for each student
    const certificatePromises = registrationOrder.registrationItems.map(async (item) => {
      const existingCert = await prisma.certificate.findFirst({
        where: {
          studentId: item.studentId,
          eventId: registrationOrder.eventId
        }
      });

      if (existingCert) {
        return existingCert;
      }

      // Generate certificate UID
      const certUid = `STAIRS-CERT-${registrationOrder.event.uniqueId}-${item.student.user.uniqueId}-${Date.now()}`;

      const certificate = await prisma.certificate.create({
        data: {
          studentId: item.studentId,
          eventId: registrationOrder.eventId,
          orderId: registrationOrder.id,
          participantName: item.student.name,
          sportName: registrationOrder.event.sport,
          eventName: registrationOrder.event.name,
          uniqueId: certUid,
          certificateUrl: `/certificates/${certUid}.pdf` // Placeholder - implement actual PDF generation
        }
      });

      return certificate;
    });

    const certificates = await Promise.all(certificatePromises);

    // Update registration order
    await prisma.eventRegistrationOrder.update({
      where: { id: orderId },
      data: {
        certificateGenerated: true,
        status: 'COMPLETED'
      }
    });

    console.log(`✅ Generated ${certificates.length} certificates for order ${orderId}`);

    res.json(successResponse({
      certificatesGenerated: certificates.length,
      certificates
    }, `${certificates.length} certificates generated successfully.`));

  } catch (error) {
    console.error('❌ Generate certificates error:', error);
    res.status(500).json(errorResponse('Failed to generate certificates: ' + error.message, 500));
  }
});

// Get generated certificates for an event (admin view)
router.get('/events/:eventId/certificates', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;

    const certificates = await prisma.certificate.findMany({
      where: { eventId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                email: true,
                uniqueId: true
              }
            }
          }
        }
      },
      orderBy: { issueDate: 'desc' }
    });

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        sport: true,
        status: true
      }
    });

    res.json(successResponse({
      event,
      certificateCount: certificates.length,
      certificates
    }, 'Certificates retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get certificates error:', error);
    res.status(500).json(errorResponse('Failed to retrieve certificates.', 500));
  }
});

// Generate certificates directly from event registrations (supports admin-created/student-fee events)
router.post('/events/:eventId/certificates/generate-from-registrations', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        uniqueId: true,
        name: true,
        sport: true,
        status: true,
        createdByAdmin: true,
        studentFeeEnabled: true,
        studentFeeAmount: true
      }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    if (event.status !== 'COMPLETED') {
      return res.status(400).json(errorResponse('Cannot generate certificates until event is COMPLETED.', 400));
    }

    // Eligible registrations:
    // - Paid admin-created student-fee events: only APPROVED registrations (payment verified)
    // - Otherwise: REGISTERED/APPROVED
    const requiresStudentPayment = !!(event.createdByAdmin && event.studentFeeEnabled && (event.studentFeeAmount || 0) > 0);
    const eligibleStatuses = requiresStudentPayment ? ['APPROVED'] : ['APPROVED', 'REGISTERED'];

    const regs = await prisma.eventRegistration.findMany({
      where: {
        eventId,
        status: { in: eligibleStatuses }
      },
      include: {
        student: {
          include: {
            user: { select: { uniqueId: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (!regs || regs.length === 0) {
      return res.status(400).json(errorResponse('No eligible participants found for certificate generation.', 400));
    }

    let created = 0;
    let skippedExisting = 0;
    let skippedNoUid = 0;

    const certificates = [];
    for (const r of regs) {
      const studentUid = r.student?.user?.uniqueId;
      if (!studentUid || !event.uniqueId) {
        skippedNoUid += 1;
        continue;
      }

      const existingCert = await prisma.certificate.findFirst({
        where: { studentId: r.studentId, eventId }
      });
      if (existingCert) {
        skippedExisting += 1;
        certificates.push(existingCert);
        continue;
      }

      const certUid = `STAIRS-CERT-${event.uniqueId}-${studentUid}`;
      try {
        const cert = await prisma.certificate.create({
          data: {
            studentId: r.studentId,
            eventId,
            orderId: null,
            participantName: r.student?.name || 'Participant',
            sportName: event.sport || '',
            eventName: event.name || '',
            uniqueId: certUid,
            certificateUrl: `/certificates/${certUid}.pdf`
          }
        });
        created += 1;
        certificates.push(cert);
      } catch (e) {
        // If uniqueId collided, append timestamp and retry once
        if (String(e?.message || '').toLowerCase().includes('unique') || String(e?.code || '') === 'P2002') {
          const certUid2 = `STAIRS-CERT-${event.uniqueId}-${studentUid}-${Date.now()}`;
          const cert2 = await prisma.certificate.create({
            data: {
              studentId: r.studentId,
              eventId,
              orderId: null,
              participantName: r.student?.name || 'Participant',
              sportName: event.sport || '',
              eventName: event.name || '',
              uniqueId: certUid2,
              certificateUrl: `/certificates/${certUid2}.pdf`
            }
          });
          created += 1;
          certificates.push(cert2);
        } else {
          throw e;
        }
      }
    }

    return res.json(successResponse({
      eventId,
      certificatesGenerated: created,
      skippedExisting,
      skippedNoUid,
      totalEligibleParticipants: regs.length,
      certificates
    }, 'Certificates generated successfully from registrations.'));
  } catch (error) {
    console.error('❌ Generate certificates from registrations error:', error);
    return res.status(500).json(errorResponse('Failed to generate certificates from registrations: ' + error.message, 500));
  }
});

// PUT /api/admin/events/:eventId/validate-results -- admin validates event results
// Requires EventStatus enum update in DB/schema!
router.put('/events/:eventId/validate-results', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { notes } = req.body;
    // Only admin can call this!
    const adminId = req.admin?.id || req.user.id;
    const eventService = new (require('../services/eventService'))();
    const updatedEvent = await eventService.validateEventResults(eventId, adminId, notes);
    res.json(successResponse(updatedEvent, 'Event results validated. Event is now ready for certificate issuing and visibility.'));
  } catch (error) {
    console.error('Admin validate results error:', error);
    res.status(500).json(errorResponse('Failed to validate results for event.', 500));
  }
});

// POST /api/admin/events/:eventId/results -- admin uploads result sheet
// Allows admin to upload result sheets (same functionality as coach upload)
const multer = require('multer');
// Note: path and fs are already required at the top of the file

// Configure multer for admin result uploads
const adminUploadsDir = path.join(__dirname, '../../uploads/event-results');
// fs is used inline below - no need to declare if already available
if (!require('fs').existsSync(adminUploadsDir)) {
  require('fs').mkdirSync(adminUploadsDir, { recursive: true });
}

const adminStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, adminUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `admin-${uniqueSuffix}-${file.originalname}`);
  }
});

const adminUpload = multer({
  storage: adminStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ];
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.endsWith('.xlsx') || 
        file.originalname.endsWith('.xls') || 
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'), false);
    }
  }
});

router.post('/events/:eventId/results', 
  authenticate, 
  requireAdmin,
  adminUpload.array('files', 5),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const description = req.body?.description || '';
      const { user } = req;

      console.log(`📁 Admin uploading result files for event ${eventId}`);
      console.log(`📋 Admin ID: ${req.admin?.id || user.id}, Role: ${user?.role}`);
      console.log('📄 Files:', req.files);

      if (!req.files || req.files.length === 0) {
        return res.status(400).json(errorResponse('No files uploaded', 400));
      }

      const eventService = new (require('../services/eventService'))();
      const adminId = req.admin?.id || user.id;
      const results = [];

      // Process each uploaded file
      for (const file of req.files) {
        const result = await eventService.uploadResults(
          eventId,
          file,
          description,
          adminId,
          'ADMIN'
        );
        results.push(result);
      }

      res.json(successResponse(
        {
          uploadedFiles: results,
          count: results.length
        },
        `Successfully uploaded ${results.length} file(s) for event. Results processed and scores updated.`
      ));
    } catch (error) {
      console.error('❌ Admin upload results error:', error);
      res.status(500).json(errorResponse(error.message || 'Failed to upload result file', 500));
    }
  }
);

// GET /api/admin/events/:eventId/results/sample-sheet - Download sample result sheet template
router.get('/events/:eventId/results/sample-sheet', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const XLSX = require('xlsx');
    
    // Resolve event ID
    const eventService = new (require('../services/eventService'))();
    let event;
    try {
      event = await eventService.resolveEventId(eventId);
    } catch (error) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    // Get registered students for this event to populate sample data
    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId: event.id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                uniqueId: true
              }
            }
          }
        }
      },
      take: 10 // Limit to 10 sample rows
    });

    // Create sample data
    const sampleData = [
      // Header row
      { studentId: 'studentId', name: 'name', score: 'score', remarks: 'remarks (optional)' },
      // Instructions row
      { studentId: 'REQUIRED', name: 'OPTIONAL', score: 'REQUIRED', remarks: 'OPTIONAL' },
      { studentId: 'Student Database ID', name: 'Student Name', score: 'Numeric Score', remarks: 'Any notes' }
    ];

    // Add sample student data if available
    if (registrations.length > 0) {
      registrations.forEach((reg, index) => {
        sampleData.push({
          studentId: reg.student.id, // Use actual student ID (database ID)
          name: reg.student.name || `Student ${index + 1}`,
          score: (100 - index * 5).toFixed(2), // Sample scores decreasing
          remarks: index === 0 ? 'Winner' : index === 1 ? 'Runner-up' : ''
        });
      });
    } else {
      // Add dummy data if no registrations
      for (let i = 1; i <= 5; i++) {
        sampleData.push({
          studentId: `STU-${String(i).padStart(6, '0')}`,
          name: `Sample Student ${i}`,
          score: (100 - i * 5).toFixed(2),
          remarks: i === 1 ? 'Winner' : i === 2 ? 'Runner-up' : ''
        });
      }
    }

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleData, { skipHeader: false });

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // studentId
      { wch: 25 }, // name
      { wch: 15 }, // score
      { wch: 30 }  // remarks
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    const filename = `Sample_Result_Sheet_${event.uniqueId || event.id}_${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);

  } catch (error) {
    console.error('❌ Generate sample sheet error:', error);
    res.status(500).json(errorResponse('Failed to generate sample sheet: ' + error.message, 500));
  }
});

// GET /api/admin/events/:eventId/results/analytics - Get result analytics with winner prediction
router.get('/events/:eventId/results/analytics', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Resolve event ID
    const eventService = new (require('../services/eventService'))();
    let event;
    try {
      event = await eventService.resolveEventId(eventId);
    } catch (error) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    // Get all registrations with scores and placements
    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId: event.id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            sport: true,
            user: {
              select: {
                uniqueId: true
              }
            }
          }
        }
      },
      orderBy: [
        { placement: 'asc' },
        { score: 'desc' }
      ]
    });

    // Separate registrations with and without scores
    const withScores = registrations.filter(r => r.score !== null && r.score !== undefined);
    const withoutScores = registrations.filter(r => r.score === null || r.score === undefined);

    // Calculate statistics
    const totalParticipants = registrations.length;
    const participantsWithScores = withScores.length;
    const participantsWithoutScores = withoutScores.length;
    const completionRate = totalParticipants > 0 
      ? Math.round((participantsWithScores / totalParticipants) * 100) 
      : 0;

    // Get winners (top 3)
    const winners = withScores
      .filter(r => r.placement !== null && r.placement <= 3)
      .sort((a, b) => (a.placement || 999) - (b.placement || 999))
      .slice(0, 3)
      .map(r => ({
        placement: r.placement,
        studentId: r.student.id,
        studentName: r.student.name,
        studentUniqueId: r.student.user?.uniqueId || null,
        score: r.score,
        sport: r.student.sport
      }));

    // Score distribution
    const scores = withScores.map(r => r.score || 0);
    const scoreStats = scores.length > 0 ? {
      min: Math.min(...scores),
      max: Math.max(...scores),
      avg: Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
      median: scores.length > 0 
        ? Number([...scores].sort((a, b) => a - b)[Math.floor(scores.length / 2)].toFixed(2))
        : 0
    } : null;

    // Predict winners based on current scores (if results not fully uploaded)
    let predictedWinners = [];
    if (participantsWithScores > 0 && participantsWithoutScores > 0) {
      // If some participants have scores, predict based on current standings
      const currentTop = withScores
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 3)
        .map((r, idx) => ({
          predictedPlacement: idx + 1,
          studentId: r.student.id,
          studentName: r.student.name,
          studentUniqueId: r.student.user?.uniqueId || null,
          currentScore: r.score,
          confidence: participantsWithScores / totalParticipants > 0.8 ? 'high' : 'medium'
        }));
      predictedWinners = currentTop;
    } else if (participantsWithScores === 0) {
      // No scores yet - predict based on historical performance or registration order
      predictedWinners = registrations.slice(0, 3).map((r, idx) => ({
        predictedPlacement: idx + 1,
        studentId: r.student.id,
        studentName: r.student.name,
        studentUniqueId: r.student.user?.uniqueId || null,
        currentScore: null,
        confidence: 'low',
        note: 'No scores available yet. Prediction based on registration order.'
      }));
    }

    // Placement distribution
    const placementDistribution = {};
    withScores.forEach(r => {
      const place = r.placement || 'Unplaced';
      placementDistribution[place] = (placementDistribution[place] || 0) + 1;
    });

    // Ties analysis
    const ties = [];
    const scoreGroups = {};
    withScores.forEach(r => {
      const score = r.score || 0;
      if (!scoreGroups[score]) {
        scoreGroups[score] = [];
      }
      scoreGroups[score].push(r);
    });
    
    Object.entries(scoreGroups).forEach(([score, group]) => {
      if (group.length > 1) {
        ties.push({
          score: Number(score),
          count: group.length,
          students: group.map(r => ({
            studentId: r.student.id,
            studentName: r.student.name,
            placement: r.placement
          }))
        });
      }
    });

    // Event status analysis
    const resultStatus = event.status === 'RESULTS_UPLOADED' 
      ? 'uploaded' 
      : event.status === 'RESULTS_VALIDATED' 
        ? 'validated' 
        : 'pending';

    res.json(successResponse({
      event: {
        id: event.id,
        name: event.name,
        uniqueId: event.uniqueId,
        sport: event.sport,
        status: event.status,
        resultStatus
      },
      statistics: {
        totalParticipants,
        participantsWithScores,
        participantsWithoutScores,
        completionRate: `${completionRate}%`
      },
      winners: winners.length > 0 ? winners : null,
      predictedWinners: predictedWinners.length > 0 ? predictedWinners : null,
      scoreStatistics: scoreStats,
      placementDistribution,
      ties: ties.length > 0 ? ties : [],
      participantsWithoutScores: withoutScores.length > 0 
        ? withoutScores.slice(0, 10).map(r => ({
            studentId: r.student.id,
            studentName: r.student.name,
            studentUniqueId: r.student.user?.uniqueId || null
          }))
        : [],
      allResults: withScores.map(r => ({
        placement: r.placement,
        studentId: r.student.id,
        studentName: r.student.name,
        studentUniqueId: r.student.user?.uniqueId || null,
        score: r.score
      }))
    }, 'Result analytics retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get result analytics error:', error);
    res.status(500).json(errorResponse('Failed to retrieve result analytics: ' + error.message, 500));
  }
});

// GET /api/admin/orders - Get all event orders with filters
// Legacy/alternate implementation kept for reference; primary endpoint is the earlier /orders route.
router.get('/orders-v2', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, paymentStatus, eventId, coachId, page = 1, limit = 20 } = req.query;
    const { skip, take } = getPaginationParams(parseInt(page), parseInt(limit));

    const where = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (eventId) where.eventId = eventId;
    if (coachId) where.coachId = coachId;

    const [orders, total] = await Promise.all([
      prisma.eventOrder.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              name: true,
              sport: true,
              uniqueId: true,
              level: true
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
          },
          admin: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.eventOrder.count({ where })
    ]);

    res.json(successResponse({
      orders,
      pagination: getPaginationMeta(parseInt(page), parseInt(limit), total)
    }, 'Orders retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get orders error:', error);
    res.status(500).json(errorResponse('Failed to retrieve orders: ' + error.message, 500));
  }
});

// PUT /api/admin/orders/:orderId/fulfill - Mark order as fulfilled/processed (inventory issued)
router.put('/orders/:orderId/fulfill', authenticate, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { adminRemarks, status = 'COMPLETED' } = req.body;

    const order = await prisma.eventOrder.findUnique({
      where: { id: orderId },
      include: {
        event: true,
        coach: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json(errorResponse('Order not found.', 404));
    }

    if (order.paymentStatus !== 'SUCCESS') {
      return res.status(400).json(errorResponse('Order payment must be completed before fulfillment.', 400));
    }

    // Update order status and mark as processed
    const updatedOrder = await prisma.eventOrder.update({
      where: { id: orderId },
      data: {
        status: status,
        processedAt: new Date(),
        processedBy: req.admin.id,
        adminRemarks: adminRemarks || order.adminRemarks,
        completedAt: status === 'COMPLETED' ? new Date() : null
      },
      include: {
        event: true,
        coach: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Send notification to coach about order fulfillment
    try {
      await prisma.notification.create({
        data: {
          userId: order.coach.user.id,
          type: 'ORDER_COMPLETED',
          title: '📦 Order Fulfilled',
          message: `Your order ${order.orderNumber} has been ${status === 'COMPLETED' ? 'completed and shipped' : 'processed'}. Items: ${order.certificates} certificates, ${order.medals} medals, ${order.trophies} trophies.`,
          data: JSON.stringify({
            orderId: updatedOrder.id,
            orderNumber: order.orderNumber,
            status: status
          })
        }
      });

      // Send email notification
      if (order.coach.user.email) {
        await sendOrderStatusEmail(
          order.coach.user.email,
          order.coach.name || order.coach.user.name || 'Coach',
          status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
          {
            orderNumber: order.orderNumber,
            eventName: order.event.name,
            certificates: order.certificates,
            medals: order.medals,
            trophies: order.trophies,
            totalAmount: order.totalAmount
          },
          adminRemarks || ''
        );
      }
    } catch (notifError) {
      console.error('⚠️ Failed to send fulfillment notification (non-critical):', notifError);
    }

    console.log(`✅ Order ${order.orderNumber} marked as ${status} by admin ${req.admin.id}`);

    res.json(successResponse({
      order: updatedOrder,
      inventoryIssued: {
        certificates: order.certificates,
        medals: order.medals,
        trophies: order.trophies
      }
    }, `Order ${status === 'COMPLETED' ? 'fulfilled and completed' : 'processed'} successfully.`));

  } catch (error) {
    console.error('❌ Fulfill order error:', error);
    res.status(500).json(errorResponse('Failed to fulfill order: ' + error.message, 500));
  }
});

// PUT /api/admin/orders/:orderId/price - Admin sets pricing for order (specific endpoint - convenience route)
router.put('/orders/:orderId/price', authenticate, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { certificatePrice, medalPrice, trophyPrice, totalAmount } = req.body;

    const order = await prisma.eventOrder.findUnique({
      where: { id: orderId },
      include: { 
        event: true, 
        coach: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json(errorResponse('Order not found.', 404));
    }

    // Calculate total if not provided
    let calculatedTotal = totalAmount;
    if (!calculatedTotal) {
      calculatedTotal = 
        (order.certificates * (certificatePrice || 0)) +
        (order.medals * (medalPrice || 0)) +
        (order.trophies * (trophyPrice || 0));
    }

    const updatedOrder = await prisma.eventOrder.update({
      where: { id: orderId },
      data: {
        certificatePrice: certificatePrice !== undefined ? parseFloat(certificatePrice) : order.certificatePrice,
        medalPrice: medalPrice !== undefined ? parseFloat(medalPrice) : order.medalPrice,
        trophyPrice: trophyPrice !== undefined ? parseFloat(trophyPrice) : order.trophyPrice,
        totalAmount: calculatedTotal,
        status: 'CONFIRMED' // Move to confirmed once priced
      },
      include: {
        event: true,
        coach: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Notify coach about pricing
    try {
      await prisma.notification.create({
        data: {
          userId: order.coach.user.id,
          type: 'ORDER_CONFIRMED',
          title: '💰 Order Priced',
          message: `Your order ${order.orderNumber} has been priced. Total: ₹${calculatedTotal}. Please proceed with payment.`,
          data: JSON.stringify({
            orderId: updatedOrder.id,
            orderNumber: order.orderNumber,
            totalAmount: calculatedTotal
          })
        }
      });
    } catch (notifError) {
      console.error('⚠️ Failed to send pricing notification (non-critical):', notifError);
    }

    res.json(successResponse(updatedOrder, 'Order priced successfully.'));

  } catch (error) {
    console.error('❌ Price order error:', error);
    res.status(500).json(errorResponse('Failed to price order: ' + error.message, 500));
  }
});

/**
 * Admin: Get event assignments
 */
router.get('/events/:eventId/assignments', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const assignments = await prisma.eventAssignment.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            uniqueId: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(successResponse(assignments, 'Event assignments retrieved.'));
  } catch (error) {
    console.error('❌ Get event assignments error:', error);
    res.status(500).json(errorResponse('Failed to get event assignments.', 500));
  }
});

/**
 * Get user's assigned events (for any authenticated user)
 */
router.get('/users/me/assigned-events', authenticate, async (req, res) => {
  try {
    const assignments = await prisma.eventAssignment.findMany({
      where: { userId: req.user.id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            sport: true,
            startDate: true,
            endDate: true,
            venue: true,
            city: true,
            status: true,
            uniqueId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get permissions for each assignment
    const assignmentsWithPermissions = await Promise.all(
      assignments.map(async (assignment) => {
        const permissions = await prisma.eventPermission.findMany({
          where: {
            eventId: assignment.eventId,
            role: assignment.role
          }
        });
        return {
          ...assignment,
          permissions: permissions[0] || null,
          hasPermissions: permissions.length > 0 && permissions[0] && (
            permissions[0].resultUpload || 
            permissions[0].studentManagement || 
            permissions[0].certificateManagement || 
            permissions[0].feeManagement
          )
        };
      })
    );

    res.json(successResponse(assignmentsWithPermissions, 'User assigned events retrieved.'));
  } catch (error) {
    console.error('❌ Get user assigned events error:', error);
    res.status(500).json(errorResponse('Failed to get assigned events.', 500));
  }
});

/**
 * Verify user has permission for a specific event and permission type
 */
router.get('/events/:eventId/verify-permission/:permissionKey', authenticate, async (req, res) => {
  try {
    const { eventId, permissionKey } = req.params;
    const { checkEventPermission } = require('../utils/authMiddleware');
    
    const validPermissionKeys = ['resultUpload', 'studentManagement', 'certificateManagement', 'feeManagement'];
    if (!validPermissionKeys.includes(permissionKey)) {
      return res.status(400).json(errorResponse(`Invalid permission key. Must be one of: ${validPermissionKeys.join(', ')}`, 400));
    }
    
    // eventId can be DB id or uniqueId; resolve first
    const ev = await prisma.event.findFirst({
      where: { OR: [{ id: eventId }, { uniqueId: eventId }] },
      select: { id: true }
    });
    if (!ev) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    const hasPermission = await checkEventPermission({
      user: req.user,
      eventId: ev.id,
      permissionKey
    });

    // Get assignment details for debugging
    const assignments = await prisma.eventAssignment.findMany({
      where: { eventId, userId: req.user.id },
      include: {
        event: {
          select: { id: true, name: true }
        }
      }
    });

    const permissions = await prisma.eventPermission.findMany({
      where: { 
        eventId,
        role: { in: assignments.map(a => a.role) }
      }
    });

    const userOverride = await prisma.eventUserPermission.findUnique({
      where: { eventId_userId: { eventId, userId: req.user.id } }
    });

    res.json(successResponse({ 
      hasPermission, 
      eventId, 
      permissionKey,
      userId: req.user.id,
      userRole: req.user.role,
      assignments: assignments.map(a => ({ role: a.role, eventName: a.event.name })),
      userOverride: userOverride ? {
        resultUpload: userOverride.resultUpload,
        studentManagement: userOverride.studentManagement,
        certificateManagement: userOverride.certificateManagement,
        feeManagement: userOverride.feeManagement
      } : null,
      permissions: permissions.map(p => ({
        role: p.role,
        [permissionKey]: p[permissionKey]
      }))
    }, hasPermission ? 'User has permission.' : 'User does not have permission.'));
  } catch (error) {
    console.error('❌ Verify permission error:', error);
    res.status(500).json(errorResponse('Failed to verify permission.', 500));
  }
});

/**
 * Admin: Get per-incharge (per-user) permissions for an event.
 * This is the "current flow" for EVENT_INCHARGE users.
 */
router.get('/events/:eventId/incharge-permissions/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId, userId } = req.params;

    const assigned = await prisma.eventAssignment.findFirst({
      where: { eventId, userId, role: 'INCHARGE' },
      select: { id: true, isPointOfContact: true }
    });
    if (!assigned) {
      return res.status(404).json(errorResponse('User is not assigned as INCHARGE to this event.', 404));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true }
    });
    if (!user) return res.status(404).json(errorResponse('User not found.', 404));
    if (user.role !== 'EVENT_INCHARGE') {
      return res.status(400).json(errorResponse('INCHARGE permissions can be set only for EVENT_INCHARGE users.', 400));
    }

    const override = await prisma.eventUserPermission.findUnique({
      where: { eventId_userId: { eventId, userId } }
    });

    res.json(successResponse({
      eventId,
      user,
      assignment: assigned,
      permissions: override ? {
        resultUpload: override.resultUpload,
        studentManagement: override.studentManagement,
        certificateManagement: override.certificateManagement,
        feeManagement: override.feeManagement
      } : {
        resultUpload: false,
        studentManagement: false,
        certificateManagement: false,
        feeManagement: false
      }
    }, 'Incharge permissions retrieved.'));
  } catch (error) {
    console.error('❌ Get incharge permissions error:', error);
    res.status(500).json(errorResponse('Failed to get incharge permissions.', 500));
  }
});

/**
 * Admin: Update per-incharge (per-user) permissions for an event (upsert).
 */
router.put('/events/:eventId/incharge-permissions/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const {
      resultUpload = false,
      studentManagement = false,
      certificateManagement = false,
      feeManagement = false
    } = req.body || {};

    const assigned = await prisma.eventAssignment.findFirst({
      where: { eventId, userId, role: 'INCHARGE' },
      select: { id: true }
    });
    if (!assigned) {
      return res.status(404).json(errorResponse('User is not assigned as INCHARGE to this event.', 404));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true, name: true }
    });
    if (!user) return res.status(404).json(errorResponse('User not found.', 404));
    if (user.role !== 'EVENT_INCHARGE') {
      return res.status(400).json(errorResponse('INCHARGE permissions can be set only for EVENT_INCHARGE users.', 400));
    }

    const updated = await prisma.eventUserPermission.upsert({
      where: { eventId_userId: { eventId, userId } },
      update: {
        resultUpload: !!resultUpload,
        studentManagement: !!studentManagement,
        certificateManagement: !!certificateManagement,
        feeManagement: !!feeManagement
      },
      create: {
        eventId,
        userId,
        resultUpload: !!resultUpload,
        studentManagement: !!studentManagement,
        certificateManagement: !!certificateManagement,
        feeManagement: !!feeManagement
      }
    });

    res.json(successResponse({
      eventId,
      userId,
      permissions: {
        resultUpload: updated.resultUpload,
        studentManagement: updated.studentManagement,
        certificateManagement: updated.certificateManagement,
        feeManagement: updated.feeManagement
      }
    }, 'Incharge permissions updated.'));
  } catch (error) {
    console.error('❌ Update incharge permissions error:', error);
    res.status(500).json(errorResponse('Failed to update incharge permissions.', 500));
  }
});

/**
 * Admin: Create an invite for an Event Incharge (Event Vendor personnel) with per-user permissions.
 * If the email already belongs to an EVENT_INCHARGE user, we assign directly and set per-user overrides.
 */
router.post('/events/:eventId/incharge-invites', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      email,
      isPointOfContact = false,
      vendorId = null,
      permissions = {}
    } = req.body || {};

    if (!email) return res.status(400).json(errorResponse('email is required', 400));
    const normalizedEmail = email.toString().trim().toLowerCase();
    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json(errorResponse('Invalid email format.', 400));
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        sport: true,
        venue: true,
        city: true,
        state: true,
        startDate: true,
        endDate: true,
        uniqueId: true
      }
    });
    if (!event) return res.status(404).json(errorResponse('Event not found.', 404));

    // Optional vendor validation
    if (vendorId) {
      const v = await prisma.eventVendor.findUnique({ where: { id: vendorId } });
      if (!v) return res.status(400).json(errorResponse('Invalid vendorId.', 400));
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    const permFlags = {
      resultUpload: !!permissions.resultUpload,
      studentManagement: !!permissions.studentManagement,
      certificateManagement: !!permissions.certificateManagement,
      feeManagement: !!permissions.feeManagement
    };

    // Prevent duplicate active invites for same event+email (idempotency)
    const now = new Date();
    const activeInvite = await prisma.eventInchargeInvite.findFirst({
      where: {
        eventId,
        email: normalizedEmail,
        revokedAt: null,
        usedAt: null,
        expiresAt: { gte: now }
      },
      select: { id: true, expiresAt: true }
    });
    if (activeInvite && !existingUser) {
      return res.status(409).json(errorResponse(
        `An active invite already exists for ${normalizedEmail}. Use "Resend" or "Revoke" from the invites list.`,
        409,
        { inviteId: activeInvite.id, expiresAt: activeInvite.expiresAt }
      ));
    }

    // If user already exists as EVENT_INCHARGE, assign directly (no registration needed)
    if (existingUser) {
      if (existingUser.role !== 'EVENT_INCHARGE') {
        return res.status(409).json(errorResponse('This email belongs to a non-incharge account. Incharge must be a separate entity/account.', 409));
      }

      await prisma.$transaction(async (tx) => {
        if (isPointOfContact) {
          await tx.eventAssignment.updateMany({
            where: { eventId, role: 'INCHARGE' },
            data: { isPointOfContact: false }
          });
        }

        await tx.eventAssignment.upsert({
          where: {
            eventId_userId_role: {
              eventId,
              userId: existingUser.id,
              role: 'INCHARGE'
            }
          },
          update: {
            isPointOfContact: !!isPointOfContact
          },
          create: {
            eventId,
            userId: existingUser.id,
            role: 'INCHARGE',
            isPointOfContact: !!isPointOfContact
          }
        });

        await tx.eventUserPermission.upsert({
          where: { eventId_userId: { eventId, userId: existingUser.id } },
          update: permFlags,
          create: { eventId, userId: existingUser.id, ...permFlags }
        });
      });

      // Notify existing incharge
      const frontendUrl = process.env.FRONTEND_URL || 'https://portal.stairs.org.in';
      const eventLink = `${frontendUrl}/events/${eventId}`;
      await sendAssignmentEmail({
        to: normalizedEmail,
        role: 'INCHARGE',
        eventName: event.name,
        eventLink
      });

      return res.status(200).json(successResponse({
        assigned: true,
        inviteCreated: false,
        eventId,
        email: normalizedEmail
      }, 'Existing Event Incharge assigned and notified.'));
    }

    // Create invite token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    const invite = await prisma.eventInchargeInvite.create({
      data: {
        eventId,
        email: normalizedEmail,
        tokenHash,
        expiresAt,
        isPointOfContact: !!isPointOfContact,
        vendorId: vendorId || null,
        ...permFlags
      }
    });

    const frontendUrl = process.env.FRONTEND_URL || 'https://portal.stairs.org.in';
    const registrationLink = `${frontendUrl}/register/incharge?token=${rawToken}`;

    const emailResult = await sendEventInchargeInviteEmail({
      to: normalizedEmail,
      event,
      registrationLink,
      permissions: permFlags,
      isPointOfContact: !!isPointOfContact
    });

    // In production, do not silently succeed if email isn't sent.
    if (!emailResult?.success) {
      // Clean up invite so admin can retry after fixing email config
      await prisma.eventInchargeInvite.delete({ where: { id: invite.id } }).catch(() => {});

      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json(errorResponse(
          'Invite email could not be sent. Please configure EMAIL_USER/EMAIL_PASS and try again.',
          503
        ));
      }

      // Non-prod: allow manual testing by returning the link to admin
      return res.status(201).json(successResponse({
        inviteId: invite.id,
        eventId,
        email: normalizedEmail,
        expiresAt: invite.expiresAt,
        emailSent: false,
        emailError: emailResult?.error || 'Email service not configured',
        registrationLink
      }, 'Invite created but email was not sent (non-production).', 201));
    }

    res.status(201).json(successResponse({
      inviteId: invite.id,
      eventId,
      email: normalizedEmail,
      expiresAt: invite.expiresAt,
      emailSent: true
    }, 'Invite created and email sent.', 201));
  } catch (error) {
    console.error('❌ Create incharge invite error:', error);
    res.status(500).json(errorResponse('Failed to create invite.', 500));
  }
});

/**
 * Admin: List incharge invites for an event
 */
router.get('/events/:eventId/incharge-invites', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const invites = await prisma.eventInchargeInvite.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();
    const mapped = invites.map(i => ({
      id: i.id,
      email: i.email,
      createdAt: i.createdAt,
      expiresAt: i.expiresAt,
      usedAt: i.usedAt,
      revokedAt: i.revokedAt,
      isExpired: i.expiresAt < now,
      isPointOfContact: i.isPointOfContact,
      vendorId: i.vendorId,
      permissions: {
        resultUpload: i.resultUpload,
        studentManagement: i.studentManagement,
        certificateManagement: i.certificateManagement,
        feeManagement: i.feeManagement
      }
    }));

    res.json(successResponse(mapped, 'Invites retrieved.'));
  } catch (error) {
    console.error('❌ List incharge invites error:', error);
    res.status(500).json(errorResponse('Failed to list invites.', 500));
  }
});

/**
 * Admin: Revoke an incharge invite
 */
router.delete('/events/:eventId/incharge-invites/:inviteId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { inviteId } = req.params;
    const updated = await prisma.eventInchargeInvite.update({
      where: { id: inviteId },
      data: { revokedAt: new Date() }
    });
    res.json(successResponse({ id: updated.id, revokedAt: updated.revokedAt }, 'Invite revoked.'));
  } catch (error) {
    console.error('❌ Revoke incharge invite error:', error);
    res.status(500).json(errorResponse('Failed to revoke invite.', 500));
  }
});

/**
 * Admin: Resend an incharge invite (revokes old invite and creates a new token)
 */
router.post('/events/:eventId/incharge-invites/:inviteId/resend', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId, inviteId } = req.params;

    const oldInvite = await prisma.eventInchargeInvite.findUnique({ where: { id: inviteId } });
    if (!oldInvite) return res.status(404).json(errorResponse('Invite not found.', 404));
    if (oldInvite.usedAt) return res.status(400).json(errorResponse('Invite has already been used.', 400));
    if (oldInvite.revokedAt) return res.status(400).json(errorResponse('Invite is already revoked.', 400));

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        sport: true,
        venue: true,
        city: true,
        state: true,
        startDate: true,
        endDate: true,
        uniqueId: true
      }
    });
    if (!event) return res.status(404).json(errorResponse('Event not found.', 404));

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const newInvite = await prisma.$transaction(async (tx) => {
      await tx.eventInchargeInvite.update({
        where: { id: oldInvite.id },
        data: { revokedAt: new Date() }
      });

      return tx.eventInchargeInvite.create({
        data: {
          eventId: oldInvite.eventId,
          email: oldInvite.email,
          tokenHash,
          expiresAt,
          isPointOfContact: oldInvite.isPointOfContact,
          vendorId: oldInvite.vendorId,
          resultUpload: oldInvite.resultUpload,
          studentManagement: oldInvite.studentManagement,
          certificateManagement: oldInvite.certificateManagement,
          feeManagement: oldInvite.feeManagement
        }
      });
    });

    const frontendUrl = process.env.FRONTEND_URL || 'https://portal.stairs.org.in';
    const registrationLink = `${frontendUrl}/register/incharge?token=${rawToken}`;
    const permFlags = {
      resultUpload: newInvite.resultUpload,
      studentManagement: newInvite.studentManagement,
      certificateManagement: newInvite.certificateManagement,
      feeManagement: newInvite.feeManagement
    };

    const emailResult = await sendEventInchargeInviteEmail({
      to: newInvite.email,
      event,
      registrationLink,
      permissions: permFlags,
      isPointOfContact: newInvite.isPointOfContact
    });

    if (!emailResult?.success) {
      // Revoke the new invite too to avoid "sent but not delivered" ambiguity.
      await prisma.eventInchargeInvite.update({
        where: { id: newInvite.id },
        data: { revokedAt: new Date() }
      }).catch(() => {});

      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json(errorResponse(
          'Invite email could not be sent. Please configure EMAIL_USER/EMAIL_PASS and try again.',
          503
        ));
      }

      return res.json(successResponse({
        oldInviteId: oldInvite.id,
        newInviteId: newInvite.id,
        expiresAt: newInvite.expiresAt,
        emailSent: false,
        emailError: emailResult?.error || 'Email service not configured',
        registrationLink
      }, 'Invite reissued but email was not sent (non-production).'));
    }

    res.json(successResponse({
      oldInviteId: oldInvite.id,
      newInviteId: newInvite.id,
      expiresAt: newInvite.expiresAt,
      emailSent: true
    }, 'Invite resent.'));
  } catch (error) {
    console.error('❌ Resend incharge invite error:', error);
    res.status(500).json(errorResponse('Failed to resend invite.', 500));
  }
});

/**
 * Admin: Assign event to incharge / coordinator / team
 * Supports both add (mode: 'add') and replace (mode: 'replace', default) operations
 */
router.put('/events/:eventId/assignments', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { assignments = [], mode = 'replace' } = req.body; // [{ userId, role }], mode: 'add' | 'replace'

    if (!Array.isArray(assignments)) {
      return res.status(400).json(errorResponse('assignments must be an array', 400));
    }

    if (!['add', 'replace'].includes(mode)) {
      return res.status(400).json(errorResponse("mode must be 'add' or 'replace'", 400));
    }

    const validRoles = ['INCHARGE', 'COORDINATOR', 'TEAM'];

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    for (const a of assignments) {
      if (!a.userId || !a.role || !validRoles.includes(a.role)) {
        return res.status(400).json(errorResponse('Each assignment needs userId and valid role.', 400));
      }

      // Enforce: INCHARGE assignments must be to EVENT_INCHARGE users only
      if (a.role === 'INCHARGE') {
        const u = await prisma.user.findUnique({ where: { id: a.userId }, select: { id: true, role: true } });
        if (!u) return res.status(400).json(errorResponse(`Invalid userId: ${a.userId}`, 400));
        if (u.role !== 'EVENT_INCHARGE') {
          return res.status(400).json(errorResponse('INCHARGE role can only be assigned to users with role EVENT_INCHARGE.', 400));
        }
      }
    }

    // If mode is 'replace', delete all existing assignments first
    if (mode === 'replace') {
      await prisma.eventAssignment.deleteMany({ where: { eventId } });
    }

    // If any INCHARGE assignment is marked as point-of-contact, clear existing POC first (enforced at app level)
    const hasPoc = assignments.some(a => a.role === 'INCHARGE' && !!a.isPointOfContact);
    if (hasPoc) {
      await prisma.eventAssignment.updateMany({
        where: { eventId, role: 'INCHARGE' },
        data: { isPointOfContact: false }
      });
    }

    // Create new assignments (skipDuplicates will prevent duplicates in 'add' mode)
    const createdAssignments = [];
    if (assignments.length > 0) {
      // Use individual creates to handle duplicates better and get created records
      for (const a of assignments) {
        try {
          const assignment = await prisma.eventAssignment.upsert({
            where: {
              eventId_userId_role: {
                eventId,
                userId: a.userId,
                role: a.role
              }
            },
            update: {
              ...(a.role === 'INCHARGE' ? { isPointOfContact: !!a.isPointOfContact } : {})
            },
            create: {
              eventId,
              userId: a.userId,
              role: a.role,
              ...(a.role === 'INCHARGE' ? { isPointOfContact: !!a.isPointOfContact } : {})
            }
          });
          createdAssignments.push(assignment);
        } catch (err) {
          // Skip if duplicate constraint violation
          if (err.code === 'P2002') {
            console.log(`Assignment already exists: ${a.userId} - ${a.role}`);
            continue;
          }
          throw err;
        }
      }
    }

    // Send notification/email to assigned users
    const frontendUrl = process.env.FRONTEND_URL || 'https://portal.stairs.org.in';
    const eventLink = `${frontendUrl}/events/${eventId}`;
    for (const a of assignments) {
      try {
        const assignedUser = await prisma.user.findUnique({ where: { id: a.userId } });
        if (assignedUser?.email) {
          await sendAssignmentEmail({
            to: assignedUser.email,
            role: a.role,
            eventName: event.name,
            eventLink
          });
        }
      } catch (err) {
        console.error('⚠️ Failed to send assignment email:', err?.message || err);
      }
    }

    res.json(successResponse({ 
      eventId, 
      assignmentsCount: createdAssignments.length,
      mode,
      message: mode === 'add' ? 'Assignment added successfully.' : 'Assignments replaced successfully.'
    }, 'Assignments updated.'));
  } catch (error) {
    console.error('❌ Update event assignments error:', error);
    res.status(500).json(errorResponse('Failed to update assignments.', 500));
  }
});

/**
 * Admin: Set per-event permissions by role
 */
router.put('/events/:eventId/permissions', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { permissions = [] } = req.body; // [{ role, resultUpload, studentManagement, certificateManagement, feeManagement }]

    if (!Array.isArray(permissions)) {
      return res.status(400).json(errorResponse('permissions must be an array', 400));
    }

    const validRoles = ['INCHARGE', 'COORDINATOR', 'TEAM'];

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    for (const p of permissions) {
      if (!p.role || !validRoles.includes(p.role)) {
        return res.status(400).json(errorResponse('Each permission entry needs a valid role.', 400));
      }
    }

    await prisma.eventPermission.deleteMany({ where: { eventId } });
    if (permissions.length > 0) {
      await prisma.eventPermission.createMany({
        data: permissions.map(p => ({
          eventId,
          role: p.role,
          resultUpload: !!p.resultUpload,
          studentManagement: !!p.studentManagement,
          certificateManagement: !!p.certificateManagement,
          feeManagement: !!p.feeManagement
        }))
      });
    }

    res.json(successResponse({ eventId, permissionsCount: permissions.length }, 'Permissions updated.'));
  } catch (error) {
    console.error('❌ Update event permissions error:', error);
    res.status(500).json(errorResponse('Failed to update permissions.', 500));
  }
});

/**
 * Admin: Set fee mode and event fee
 */
router.put('/events/:eventId/fees', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { feeMode, eventFee, studentFeeEnabled, studentFeeAmount, studentFeeUnit } = req.body;
    const validModes = ['GLOBAL', 'EVENT', 'DISABLED'];

    if (!feeMode || !validModes.includes(feeMode)) {
      return res.status(400).json(errorResponse('feeMode must be one of GLOBAL, EVENT, DISABLED.', 400));
    }

    if (feeMode === 'EVENT' && (eventFee === undefined || eventFee === null || Number.isNaN(Number(eventFee)))) {
      return res.status(400).json(errorResponse('eventFee is required when feeMode is EVENT.', 400));
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        feeMode,
        eventFee: feeMode === 'EVENT' ? Number(eventFee) : 0,
        ...(studentFeeEnabled !== undefined && { studentFeeEnabled: !!studentFeeEnabled }),
        ...(studentFeeAmount !== undefined && { studentFeeAmount: Number(studentFeeAmount) || 0 }),
        ...(studentFeeUnit && { studentFeeUnit })
      }
    });

    res.json(successResponse(updated, 'Event fee mode updated.'));
  } catch (error) {
    console.error('❌ Update event fees error:', error);
    res.status(500).json(errorResponse('Failed to update event fees.', 500));
  }
});

/**
 * Admin: Set event level (District/State/National/School)
 */
router.put('/events/:eventId/level', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { level } = req.body;
    const validLevels = ['DISTRICT', 'STATE', 'NATIONAL', 'SCHOOL'];

    if (!level || !validLevels.includes(level)) {
      return res.status(400).json(errorResponse('level must be one of DISTRICT, STATE, NATIONAL, SCHOOL.', 400));
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { level }
    });

    res.json(successResponse(updated, 'Event level updated.'));
  } catch (error) {
    console.error('❌ Update event level error:', error);
    res.status(500).json(errorResponse('Failed to update event level.', 500));
  }
});

/**
 * Admin: Update global payment settings (single row)
 */
router.put('/settings/global-payments', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      perStudentBaseCharge = 0,
      defaultEventFee = 0,
      coordinatorSubscriptionFee = 0,
      adminStudentFeeEnabled = false,
      adminStudentFeeAmount = 0
    } = req.body;

    const toNonNegativeNumber = (v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return 0;
      return Math.max(0, n);
    };

    const payload = {
      perStudentBaseCharge: toNonNegativeNumber(perStudentBaseCharge),
      defaultEventFee: toNonNegativeNumber(defaultEventFee),
      coordinatorSubscriptionFee: toNonNegativeNumber(coordinatorSubscriptionFee),
      adminStudentFeeEnabled: !!adminStudentFeeEnabled,
      adminStudentFeeAmount: toNonNegativeNumber(adminStudentFeeAmount)
    };

    // Upsert single settings row (first row wins)
    const existing = await prisma.globalSettings.findFirst();
    let settings;
    if (existing) {
      settings = await prisma.globalSettings.update({
        where: { id: existing.id },
        data: payload
      });
    } else {
      settings = await prisma.globalSettings.create({ data: payload });
    }

    res.json(successResponse(settings, 'Global payment settings updated.'));
  } catch (error) {
    console.error('❌ Update global payment settings error:', error);
    res.status(500).json(errorResponse('Failed to update global payment settings.', 500));
  }
});

/**
 * Admin: Get global payment settings
 */
router.get('/settings/global-payments', authenticate, requireAdmin, async (req, res) => {
  try {
    const settings = await prisma.globalSettings.findFirst();
    const safe = settings || {};
    res.json(successResponse({
      perStudentBaseCharge: Number(safe.perStudentBaseCharge) || 0,
      defaultEventFee: Number(safe.defaultEventFee) || 0,
      coordinatorSubscriptionFee: Number(safe.coordinatorSubscriptionFee) || 0,
      adminStudentFeeEnabled: !!safe.adminStudentFeeEnabled,
      adminStudentFeeAmount: Number(safe.adminStudentFeeAmount) || 0
    }, 'Global payment settings retrieved.'));
  } catch (error) {
    console.error('❌ Get global payment settings error:', error);
    res.status(500).json(errorResponse('Failed to get global payment settings.', 500));
  }
});

/**
 * Admin: Get all events with their fee information for global payment settings
 */
router.get('/events/fees-overview', authenticate, requireAdmin, async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      select: {
        id: true,
        name: true,
        sport: true,
        feeMode: true,
        eventFee: true,
        coordinatorFee: true,
        // Student-fee specific fields (admin-created events)
        studentFeeEnabled: true,
        studentFeeAmount: true,
        studentFeeUnit: true,
        createdByAdmin: true,
        currentParticipants: true,
        status: true,
        createdAt: true,
        coach: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get global settings to calculate fees
    const globalSettings = await prisma.globalSettings.findFirst();
    const perStudentBaseCharge = globalSettings?.perStudentBaseCharge || 0;
    const defaultEventFee = globalSettings?.defaultEventFee || 0;

    // Calculate effective organizer/coordinator fee for each event
    const eventsWithFees = events.map(event => {
      let calculatedFee = 0;
      if (event.feeMode === 'GLOBAL') {
        if (event.currentParticipants > 0 && perStudentBaseCharge > 0) {
          calculatedFee = perStudentBaseCharge * event.currentParticipants;
        } else {
          calculatedFee = defaultEventFee;
        }
      } else if (event.feeMode === 'EVENT') {
        calculatedFee = (event.eventFee || 0) + (event.coordinatorFee || 0);
      }

      // For admin-created events, student participation fees are handled per student,
      // not as a lump-sum. We surface the configured per-unit fee here for clarity.
      const isAdminCreated = !!event.createdByAdmin;
      const studentFeeEnabled = !!event.studentFeeEnabled && isAdminCreated;
      const studentFeeAmount = studentFeeEnabled ? (event.studentFeeAmount || 0) : 0;
      const studentFeeUnit = studentFeeEnabled ? (event.studentFeeUnit || 'PERSON') : 'PERSON';

      return {
        ...event,
        calculatedFee,
        perStudentFee: event.feeMode === 'GLOBAL' ? perStudentBaseCharge : (event.eventFee || 0),
        // Explicit student fee info (admin-created events only)
        isAdminCreated,
        studentFeeEnabled,
        studentFeeAmount,
        studentFeeUnit
      };
    });

    res.json(successResponse({ events: eventsWithFees, globalSettings }, 'Events with fees retrieved.'));
  } catch (error) {
    console.error('❌ Get events fees overview error:', error);
    res.status(500).json(errorResponse('Failed to get events fees overview.', 500));
  }
});

/**
 * Admin: Update individual event fee (real-time)
 */
router.put('/events/:eventId/fee', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { eventFee, coordinatorFee, feeMode, studentFeeEnabled, studentFeeAmount, studentFeeUnit } = req.body;

    const updateData = {};
    
    if (eventFee !== undefined) {
      updateData.eventFee = Number(eventFee) || 0;
    }
    
    if (coordinatorFee !== undefined) {
      updateData.coordinatorFee = Number(coordinatorFee) || 0;
    }
    
    if (feeMode && ['GLOBAL', 'EVENT', 'DISABLED'].includes(feeMode)) {
      updateData.feeMode = feeMode;
    }

    if (studentFeeEnabled !== undefined) {
      updateData.studentFeeEnabled = !!studentFeeEnabled;
    }

    if (studentFeeAmount !== undefined) {
      updateData.studentFeeAmount = Number(studentFeeAmount) || 0;
    }

    if (studentFeeUnit) {
      updateData.studentFeeUnit = studentFeeUnit;
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: updateData
    });

    res.json(successResponse(updated, 'Event fee updated successfully.'));
  } catch (error) {
    console.error('❌ Update event fee error:', error);
    res.status(500).json(errorResponse('Failed to update event fee.', 500));
  }
});

module.exports = router;