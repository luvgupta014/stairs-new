const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireStudent } = require('../utils/authMiddleware');
const { 
  successResponse, 
  errorResponse, 
  getPaginationParams, 
  getPaginationMeta 
} = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

// Get student profile
router.get('/profile', authenticate, requireStudent, async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
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
        },
        coachConnections: {
          include: {
            coach: {
              select: {
                id: true,
                name: true,
                specialization: true,
                rating: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        eventRegistrations: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                venue: true,
                eventFee: true,
                status: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json(errorResponse('Student profile not found.', 404));
    }

    res.json(successResponse(student, 'Student profile retrieved successfully.'));

  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json(errorResponse('Failed to retrieve profile.', 500));
  }
});

// Update student profile
router.put('/profile', authenticate, requireStudent, async (req, res) => {
  try {
    const {
      name,
      dateOfBirth,
      sport,
      level,
      address,
      city,
      state,
      pincode,
      achievements
    } = req.body;

    const updatedStudent = await prisma.student.update({
      where: { userId: req.user.id },
      data: {
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        sport,
        level,
        address,
        city,
        state,
        pincode,
        achievements: achievements || null
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            isActive: true,
            isVerified: true
          }
        }
      }
    });

    res.json(successResponse(updatedStudent, 'Profile updated successfully.'));

  } catch (error) {
    console.error('Update student profile error:', error);
    res.status(500).json(errorResponse('Failed to update profile.', 500));
  }
});

// Search coaches
router.get('/coaches', authenticate, requireStudent, async (req, res) => {
  try {
    const { 
      sport, 
      location, 
      minRating, 
      maxRate, 
      experience, 
      page = 1, 
      limit = 10,
      search 
    } = req.query;

    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      paymentStatus: 'SUCCESS',
      ...(sport && { specialization: { contains: sport, mode: 'insensitive' } }),
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(minRating && { rating: { gte: parseFloat(minRating) } }),
      ...(maxRate && { hourlyRate: { lte: parseFloat(maxRate) } }),
      ...(experience && { experience: { gte: parseInt(experience) } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { specialization: { contains: search, mode: 'insensitive' } },
          { bio: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [coaches, total] = await Promise.all([
      prisma.coach.findMany({
        where,
        select: {
          id: true,
          name: true,
          specialization: true,
          experience: true,
          location: true,
          rating: true,
          bio: true,
          user: {
            select: {
              phone: true
            }
          }
        },
        skip,
        take,
        orderBy: [
          { rating: 'desc' },
          { totalStudents: 'desc' }
        ]
      }),
      prisma.coach.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      coaches,
      pagination
    }, 'Coaches retrieved successfully.'));

  } catch (error) {
    console.error('Search coaches error:', error);
    res.status(500).json(errorResponse('Failed to search coaches.', 500));
  }
});

// Alias for available coaches (frontend compatibility)
router.get('/coaches/available', authenticate, requireStudent, async (req, res) => {
  try {
    const { 
      sport, 
      location, 
      minRating, 
      maxRate, 
      experience, 
      page = 1, 
      limit = 10,
      search 
    } = req.query;

    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      paymentStatus: 'SUCCESS',
      ...(sport && { specialization: { contains: sport, mode: 'insensitive' } }),
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(minRating && { rating: { gte: parseFloat(minRating) } }),
      ...(maxRate && { hourlyRate: { lte: parseFloat(maxRate) } }),
      ...(experience && { experience: { gte: parseInt(experience) } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { specialization: { contains: search, mode: 'insensitive' } },
          { bio: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [coaches, total] = await Promise.all([
      prisma.coach.findMany({
        where,
        select: {
          id: true,
          name: true,
          specialization: true,
          experience: true,
          location: true,
          rating: true,
          bio: true,
          user: {
            select: {
              phone: true
            }
          }
        },
        skip,
        take,
        orderBy: [
          { rating: 'desc' },
          { totalStudents: 'desc' }
        ]
      }),
      prisma.coach.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      coaches,
      pagination
    }, 'Coaches retrieved successfully.'));

  } catch (error) {
    console.error('Search coaches error:', error);
    res.status(500).json(errorResponse('Failed to search coaches.', 500));
  }
});

// Get coach details
router.get('/coaches/:coachId', authenticate, requireStudent, async (req, res) => {
  try {
    const { coachId } = req.params;

    const coach = await prisma.coach.findUnique({
      where: { 
        id: coachId,
        paymentStatus: 'SUCCESS'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            createdAt: true
          }
        },
        studentConnections: {
          where: {
            status: 'ACTIVE'
          },
          select: {
            student: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!coach) {
      return res.status(404).json(errorResponse('Coach not found.', 404));
    }

    res.json(successResponse(coach, 'Coach details retrieved successfully.'));

  } catch (error) {
    console.error('Get coach details error:', error);
    res.status(500).json(errorResponse('Failed to retrieve coach details.', 500));
  }
});

// Connect with coach
router.post('/connect/:coachId', authenticate, requireStudent, async (req, res) => {
  try {
    const { coachId } = req.params;
    const { message } = req.body;

    // Check if coach exists and has paid
    const coach = await prisma.coach.findUnique({
      where: { 
        id: coachId,
        paymentStatus: 'SUCCESS'
      }
    });

    if (!coach) {
      return res.status(404).json(errorResponse('Coach not found or not approved.', 404));
    }

    // Check if connection already exists
    const existingConnection = await prisma.studentCoachConnection.findUnique({
      where: {
        studentId_coachId: {
          studentId: req.student.id,
          coachId: coachId
        }
      }
    });

    if (existingConnection) {
      return res.status(409).json(errorResponse('Connection already exists.', 409));
    }

    // Create connection request
    const connection = await prisma.studentCoachConnection.create({
      data: {
        studentId: req.student.id,
        coachId: coachId,
        status: 'PENDING',
        message: message || 'I would like to connect with you as my coach.'
      },
      include: {
        coach: {
          select: {
            firstName: true,
            lastName: true,
            specialization: true
          }
        }
      }
    });

    // TODO: Send notification to coach

    res.status(201).json(successResponse(connection, 'Connection request sent successfully.', 201));

  } catch (error) {
    console.error('Connect with coach error:', error);
    res.status(500).json(errorResponse('Failed to send connection request.', 500));
  }
});

// Get student connections
router.get('/connections', authenticate, requireStudent, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      studentId: req.student.id,
      ...(status && { status: status.toUpperCase() })
    };

    const [connections, total] = await Promise.all([
      prisma.studentCoachConnection.findMany({
        where,
        include: {
          coach: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialization: true,
              hourlyRate: true,
              rating: true,
              profilePicture: true,
              user: {
                select: {
                  phone: true,
                  email: true
                }
              }
            }
          }
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.studentCoachConnection.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      connections,
      pagination
    }, 'Connections retrieved successfully.'));

  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json(errorResponse('Failed to retrieve connections.', 500));
  }
});

// Cancel connection request
router.delete('/connections/:connectionId', authenticate, requireStudent, async (req, res) => {
  try {
    const { connectionId } = req.params;

    const connection = await prisma.studentCoachConnection.findUnique({
      where: { id: connectionId }
    });

    if (!connection) {
      return res.status(404).json(errorResponse('Connection not found.', 404));
    }

    if (connection.studentId !== req.student.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    if (connection.status !== 'PENDING') {
      return res.status(400).json(errorResponse('Can only cancel pending connection requests.', 400));
    }

    await prisma.studentCoachConnection.delete({
      where: { id: connectionId }
    });

    res.json(successResponse(null, 'Connection request cancelled successfully.'));

  } catch (error) {
    console.error('Cancel connection error:', error);
    res.status(500).json(errorResponse('Failed to cancel connection request.', 500));
  }
});

// Get available events
router.get('/events', authenticate, requireStudent, async (req, res) => {
  try {
    const { 
      sport, 
      location, 
      dateFrom, 
      dateTo, 
      maxFees, 
      page = 1, 
      limit = 10,
      search 
    } = req.query;

    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      status: 'PUBLISHED',
      startDate: { gte: new Date() }, // Only future events
      ...(sport && { sport: { contains: sport, mode: 'insensitive' } }),
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(dateFrom && { startDate: { gte: new Date(dateFrom) } }),
      ...(dateTo && { endDate: { lte: new Date(dateTo) } }),
      ...(maxFees && { fees: { lte: parseFloat(maxFees) } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sport: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          sport: true,
          startDate: true,
          endDate: true,
          location: true,
          fees: true,
          maxParticipants: true,
          currentParticipants: true,
          registrationDeadline: true,
          organizer: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        skip,
        take,
        orderBy: {
          startDate: 'asc'
        }
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

// Register for event
router.post('/events/:eventId/register', authenticate, requireStudent, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event exists and is available
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    if (event.status !== 'PUBLISHED') {
      return res.status(400).json(errorResponse('Event is not available for registration.', 400));
    }

    if (new Date() > event.registrationDeadline) {
      return res.status(400).json(errorResponse('Registration deadline has passed.', 400));
    }

    if (event.currentParticipants >= event.maxParticipants) {
      return res.status(400).json(errorResponse('Event is full.', 400));
    }

    // Check if already registered
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        studentId_eventId: {
          studentId: req.student.id,
          eventId: eventId
        }
      }
    });

    if (existingRegistration) {
      return res.status(409).json(errorResponse('Already registered for this event.', 409));
    }

    // Create registration and update participant count
    const [registration] = await prisma.$transaction([
      prisma.eventRegistration.create({
        data: {
          studentId: req.student.id,
          eventId: eventId,
          registrationDate: new Date(),
          status: 'REGISTERED'
        },
        include: {
          event: {
            select: {
              title: true,
              startDate: true,
              location: true,
              fees: true
            }
          }
        }
      }),
      prisma.event.update({
        where: { id: eventId },
        data: {
          currentParticipants: {
            increment: 1
          }
        }
      })
    ]);

    res.status(201).json(successResponse(registration, 'Event registration successful.', 201));

  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json(errorResponse('Failed to register for event.', 500));
  }
});

// Get student event registrations
router.get('/event-registrations', authenticate, requireStudent, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      studentId: req.student.id,
      ...(status && { status: status.toUpperCase() })
    };

    const [registrations, total] = await Promise.all([
      prisma.eventRegistration.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              description: true,
              sport: true,
              startDate: true,
              endDate: true,
              location: true,
              fees: true,
              status: true
            }
          }
        },
        skip,
        take,
        orderBy: {
          registrationDate: 'desc'
        }
      }),
      prisma.eventRegistration.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      registrations,
      pagination
    }, 'Event registrations retrieved successfully.'));

  } catch (error) {
    console.error('Get event registrations error:', error);
    res.status(500).json(errorResponse('Failed to retrieve event registrations.', 500));
  }
});

// Rate coach
router.post('/coaches/:coachId/rate', authenticate, requireStudent, async (req, res) => {
  try {
    const { coachId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json(errorResponse('Rating must be between 1 and 5.', 400));
    }

    // Check if there's an active connection
    const connection = await prisma.studentCoachConnection.findUnique({
      where: {
        studentId_coachId: {
          studentId: req.student.id,
          coachId: coachId
        }
      }
    });

    if (!connection || connection.status !== 'ACTIVE') {
      return res.status(400).json(errorResponse('You can only rate coaches you have an active connection with.', 400));
    }

    // Check if already rated
    const existingReview = await prisma.coachReview.findUnique({
      where: {
        studentId_coachId: {
          studentId: req.student.id,
          coachId: coachId
        }
      }
    });

    if (existingReview) {
      return res.status(409).json(errorResponse('You have already rated this coach.', 409));
    }

    // Create review and update coach rating
    const [review, updatedCoach] = await prisma.$transaction(async (prisma) => {
      const newReview = await prisma.coachReview.create({
        data: {
          studentId: req.student.id,
          coachId: coachId,
          rating: parseInt(rating),
          comment
        }
      });

      // Recalculate coach rating
      const allRatings = await prisma.coachReview.findMany({
        where: { coachId: coachId },
        select: { rating: true }
      });

      const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

      const coach = await prisma.coach.update({
        where: { id: coachId },
        data: {
          rating: avgRating,
          totalRatings: allRatings.length
        }
      });

      return [newReview, coach];
    });

    res.status(201).json(successResponse(review, 'Rating submitted successfully.', 201));

  } catch (error) {
    console.error('Rate coach error:', error);
    res.status(500).json(errorResponse('Failed to submit rating.', 500));
  }
});

// Get student dashboard
router.get('/dashboard', authenticate, requireStudent, async (req, res) => {
  try {
    const studentId = req.student.id;

    // Get dashboard analytics
    const [
      totalConnections,
      pendingConnections,
      totalEvents,
      upcomingEvents,
      recentConnections,
      recentEvents
    ] = await Promise.all([
      prisma.studentCoachConnection.count({
        where: { studentId, status: 'ACCEPTED' } // <-- FIXED HERE
      }),
      prisma.studentCoachConnection.count({
        where: { studentId, status: 'PENDING' }
      }),
      prisma.eventRegistration.count({
        where: { studentId }
      }),
      prisma.eventRegistration.count({
        where: { 
          studentId,
          event: {
            startDate: { gte: new Date() },
            status: 'ACTIVE' // <-- FIXED: use a valid EventStatus value
          }
        }
      }),
      prisma.studentCoachConnection.findMany({
        where: { studentId },
        include: {
          coach: {
            select: {
              id: true,
              name: true,
              specialization: true,
              rating: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.eventRegistration.findMany({
        where: { 
          studentId,
          event: {
            startDate: { gte: new Date() },
            status: 'ACTIVE' // <-- FIXED here too
          }
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              sport: true,
              startDate: true,
              venue: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    const dashboardData = {
      analytics: {
        totalConnections,
        pendingConnections,
        totalEvents,
        upcomingEvents
      },
      recentConnections,
      upcomingEvents: recentEvents
    };

    res.json(successResponse(dashboardData, 'Dashboard data retrieved successfully.'));

  } catch (error) {
    console.error('Get student dashboard error:', error);
    res.status(500).json(errorResponse('Failed to retrieve dashboard data.', 500));
  }
});

module.exports = router;