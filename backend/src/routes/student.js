const express = require('express');
const { PrismaClient } = require('@prisma/client');
const EventService = require('../services/eventService');
const { authenticate, requireStudent } = require('../utils/authMiddleware');
const { 
  successResponse, 
  errorResponse, 
  getPaginationParams, 
  getPaginationMeta 
} = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();
const eventService = new EventService();

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
            status: 'ACCEPTED'
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

// Get available events - FIXED to use consolidated event service
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

    console.log('🔍 Student fetching available events...');

    const filters = {
      sport,
      location,
      dateFrom,
      dateTo,
      maxFees,
      search
      // Don't set status here - let the service handle student filtering
    };

    const pagination = { page, limit };

    // Use consolidated event service
    const result = await eventService.getEvents(filters, pagination, 'STUDENT', req.student.id);

    // Format events for frontend compatibility  
    const formattedEvents = result.events.map(event => ({
      id: event.id,
      title: event.name,                    // Map name to title for frontend
      name: event.name,
      description: event.description,
      sport: event.sport,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.venue,                // Map venue to location for frontend
      venue: event.venue,
      address: event.address,
      city: event.city,
      state: event.state,
      fees: event.eventFee,                 // Map eventFee to fees for frontend
      eventFee: event.eventFee,
      maxParticipants: event.maxParticipants,
      currentParticipants: event.currentParticipants,
      status: event.status,
      isRegistered: event.isRegistered,
      organizer: {                          // Use coach as organizer
        id: event.coach?.id,
        firstName: event.coach?.name?.split(' ')[0] || 'Unknown',
        lastName: event.coach?.name?.split(' ').slice(1).join(' ') || '',
        name: event.coach?.name || 'Unknown Coach',
        email: event.coach?.user?.email,
        phone: event.coach?.user?.phone
      },
      coach: event.coach,
      createdAt: event.createdAt
    }));

    console.log(`📊 Found ${formattedEvents.length} available events for student`);

    res.json(successResponse({
      events: formattedEvents,
      pagination: result.pagination,
      total: result.total
    }, 'Events retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get events error:', error);
    res.status(500).json(errorResponse('Failed to retrieve events.', 500));
  }
});

// Get event details
router.get('/events/:eventId', authenticate, requireStudent, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`🔍 Student fetching event details for: ${eventId}`);

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    if (!student) {
      return res.status(404).json(errorResponse('Student profile not found.', 404));
    }

    // Get event details with enhanced information
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            primarySport: true,
            specialization: true,
            experience: true,
            rating: true,
            city: true,
            user: {
              select: {
                email: true,
                phone: true
              }
            }
          }
        },
        registrations: {
          where: { studentId: student.id },
          select: {
            id: true,
            status: true,
            createdAt: true,
            message: true
          }
        },
        _count: {
          select: {
            registrations: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    // Check if student can view this event (must be approved/active)
    if (!['APPROVED', 'ACTIVE'].includes(event.status)) {
      return res.status(403).json(errorResponse('This event is not available for viewing.', 403));
    }

    // Format event details for frontend
    const eventDetails = {
      id: event.id,
      title: event.name,
      name: event.name,
      description: event.description,
      sport: event.sport,
      startDate: event.startDate,
      endDate: event.endDate,
      venue: event.venue,
      address: event.address,
      city: event.city,
      state: event.state,
      latitude: event.latitude,
      longitude: event.longitude,
      eventFee: event.eventFee,
      fees: event.eventFee,
      maxParticipants: event.maxParticipants,
      currentParticipants: event._count.registrations,
      availableSpots: event.maxParticipants - event._count.registrations,
      status: event.status,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      
      // Registration info
      isRegistered: event.registrations.length > 0,
      registrationStatus: event.registrations.length > 0 ? event.registrations[0].status : null,
      registrationDate: event.registrations.length > 0 ? event.registrations[0].createdAt : null,
      registrationMessage: event.registrations.length > 0 ? event.registrations[0].message : null,
      
      // Check if registration is still possible
      canRegister: event.registrations.length === 0 && 
                   event._count.registrations < event.maxParticipants &&
                   new Date(event.startDate) > new Date() &&
                   ['APPROVED', 'ACTIVE'].includes(event.status),
      
      // Coach/Organizer details
      organizer: {
        id: event.coach.id,
        name: event.coach.name,
        primarySport: event.coach.primarySport,
        specialization: event.coach.specialization,
        experience: event.coach.experience,
        rating: event.coach.rating,
        city: event.coach.city,
        email: event.coach.user.email,
        phone: event.coach.user.phone
      }
    };

    res.json(successResponse(eventDetails, 'Event details retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get event details error:', error);
    res.status(500).json(errorResponse('Failed to retrieve event details.', 500));
  }
});

// Register for event - FIXED
router.post('/events/:eventId/register', authenticate, requireStudent, async (req, res) => {
  try {
    const { eventId } = req.params;

    console.log(`🔍 Student ${req.user.id} registering for event ${eventId}`);

    // Check if event exists and is available
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        coach: {
          select: {
            name: true,
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    // FIXED: Check for approved or active events
    if (!['APPROVED', 'ACTIVE'].includes(event.status)) {
      return res.status(400).json(errorResponse('Event is not available for registration.', 400));
    }

    if (new Date() > event.startDate) {
      return res.status(400).json(errorResponse('Event has already started.', 400));
    }

    if (event.currentParticipants >= event.maxParticipants) {
      return res.status(400).json(errorResponse('Event is full.', 400));
    }

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    if (!student) {
      return res.status(404).json(errorResponse('Student profile not found.', 404));
    }

    // Check if already registered
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_studentId: {                // FIXED: Use correct unique constraint name
          studentId: student.id,
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
          studentId: student.id,
          eventId: eventId,
          status: 'REGISTERED'             // Changed: Set status to REGISTERED upon successful registration
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              startDate: true,
              venue: true,
              eventFee: true
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

    console.log(`✅ Student registered for event successfully`);

    res.status(201).json(successResponse(registration, 'Event registration successful.', 201));

  } catch (error) {
    console.error('❌ Event registration error:', error);
    res.status(500).json(errorResponse('Failed to register for event.', 500));
  }
});

// Get student event registrations - FIXED
router.get('/event-registrations', authenticate, requireStudent, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    if (!student) {
      return res.status(404).json(errorResponse('Student profile not found.', 404));
    }

    const where = {
      studentId: student.id,
      ...(status && { status: status.toUpperCase() })
    };

    const [registrations, total] = await Promise.all([
      prisma.eventRegistration.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              name: true,
              description: true,
              sport: true,
              startDate: true,
              endDate: true,
              venue: true,
              eventFee: true,
              status: true,
              coach: {
                select: {
                  name: true
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
      prisma.eventRegistration.count({ where })
    ]);

    // Filter out registrations for cancelled, suspended, or deleted events
    const validRegistrations = registrations.filter(reg => {
      // Keep registrations for events that are still active/approved/pending/completed
      const validStatuses = ['APPROVED', 'ACTIVE', 'PENDING', 'COMPLETED'];
      return validStatuses.includes(reg.event.status);
    });

    // Update total count to reflect filtered results
    const filteredTotal = validRegistrations.length;

    const pagination = getPaginationMeta(filteredTotal, parseInt(page), parseInt(limit));

    // Format for frontend compatibility
    const formattedRegistrations = validRegistrations.map(reg => ({
      id: reg.id,
      status: reg.status,
      message: reg.message,
      createdAt: reg.createdAt,
      updatedAt: reg.updatedAt,
      event: {
        id: reg.event.id,
        title: reg.event.name,      // Map name to title
        name: reg.event.name,
        description: reg.event.description,
        sport: reg.event.sport,
        startDate: reg.event.startDate,
        endDate: reg.event.endDate,
        location: reg.event.venue,  // Map venue to location
        venue: reg.event.venue,
        fees: reg.event.eventFee,   // Map eventFee to fees
        eventFee: reg.event.eventFee,
        status: reg.event.status,
        organizer: {
          name: reg.event.coach?.name || 'Unknown Coach'
        }
      }
    }));

    res.json(successResponse({
      registrations: formattedRegistrations,
      pagination
    }, 'Event registrations retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get event registrations error:', error);
    res.status(500).json(errorResponse('Failed to retrieve event registrations.', 500));
  }
});

// FIXED: Update dashboard to show correct upcoming events
router.get('/dashboard', authenticate, requireStudent, async (req, res) => {
  try {
    console.log('🔍 Fetching student dashboard...');

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    if (!student) {
      return res.status(404).json(errorResponse('Student profile not found.', 404));
    }

    const studentId = student.id;

    // Get dashboard analytics
    const [
      totalConnections,
      pendingConnections,
      totalEvents,
      upcomingEvents,
      recentConnections,
      recentEventRegistrations
    ] = await Promise.all([
      prisma.studentCoachConnection.count({
        where: { studentId, status: 'ACCEPTED' }
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
            startDate: { gt: new Date() },                     // Changed to gt: exclude current/past events
            status: { in: ['APPROVED', 'ACTIVE'] }
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
              primarySport: true,
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
            startDate: { gt: new Date() },                     // Changed to gt: exclude current/past events
            status: { in: ['APPROVED', 'ACTIVE'] }
          }
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              sport: true,
              startDate: true,
              venue: true,
              eventFee: true,
              status: true
            }
          }
        },
        orderBy: { 
          event: {
            startDate: 'asc'
          }
        },
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
      upcomingEvents: recentEventRegistrations.map(reg => ({
        id: reg.id,
        registrationStatus: reg.status,
        event: {
          id: reg.event.id,
          title: reg.event.name,
          name: reg.event.name,
          sport: reg.event.sport,
          startDate: reg.event.startDate,
          location: reg.event.venue,
          venue: reg.event.venue,
          fees: reg.event.eventFee,
          status: reg.event.status
        }
      }))
    };

    console.log('✅ Student dashboard data retrieved successfully');

    res.json(successResponse(dashboardData, 'Dashboard data retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get student dashboard error:', error);
    res.status(500).json(errorResponse('Failed to retrieve dashboard data.', 500));
  }
});

module.exports = router;