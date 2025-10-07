const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { authenticate, requireCoach, requireApproved } = require('../utils/authMiddleware');
const { 
  successResponse, 
  errorResponse, 
  getPaginationParams, 
  getPaginationMeta 
} = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Get coach profile
router.get('/profile', authenticate, requireCoach, async (req, res) => {
  try {
    const coach = await prisma.coach.findUnique({
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
        studentConnections: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                sport: true,
                level: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        events: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        },
        payments: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    });

    if (!coach) {
      return res.status(404).json(errorResponse('Coach profile not found.', 404));
    }

    res.json(successResponse(coach, 'Coach profile retrieved successfully.'));

  } catch (error) {
    console.error('Get coach profile error:', error);
    res.status(500).json(errorResponse('Failed to retrieve profile.', 500));
  }
});

// Update coach profile
router.put('/profile', authenticate, requireCoach, async (req, res) => {
  try {
    const {
      name,
      specialization,
      experience,
      certifications,
      bio,
      location
    } = req.body;

    const updatedCoach = await prisma.coach.update({
      where: { userId: req.user.id },
      data: {
        name,
        specialization,
        experience: experience ? parseInt(experience) : undefined,
        certifications: certifications || undefined,
        bio,
        location
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            status: true
          }
        }
      }
    });

    res.json(successResponse(updatedCoach, 'Profile updated successfully.'));

  } catch (error) {
    console.error('Update coach profile error:', error);
    res.status(500).json(errorResponse('Failed to update profile.', 500));
  }
});

// Get connection requests
router.get('/connection-requests', authenticate, requireCoach, async (req, res) => {
  try {
    const { status = 'PENDING', page = 1, limit = 10 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      coachId: req.coach.id,
      status: status.toUpperCase()
    };

    const [connections, total] = await Promise.all([
      prisma.studentCoachConnection.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              sport: true,
              level: true,
              institute: true,
              bio: true,
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
          createdAt: 'desc'
        }
      }),
      prisma.studentCoachConnection.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      connections,
      pagination
    }, 'Connection requests retrieved successfully.'));

  } catch (error) {
    console.error('Get connection requests error:', error);
    res.status(500).json(errorResponse('Failed to retrieve connection requests.', 500));
  }
});

// Respond to connection request
router.put('/connection-requests/:connectionId', authenticate, requireCoach, requireApproved, async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { action, message } = req.body; // action: 'ACCEPT' or 'REJECT'

    if (!['ACCEPT', 'REJECT'].includes(action)) {
      return res.status(400).json(errorResponse('Action must be ACCEPT or REJECT.', 400));
    }

    const connection = await prisma.studentCoachConnection.findUnique({
      where: { id: connectionId },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!connection) {
      return res.status(404).json(errorResponse('Connection request not found.', 404));
    }

    if (connection.coachId !== req.coach.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    if (connection.status !== 'PENDING') {
      return res.status(400).json(errorResponse('Connection request is not pending.', 400));
    }

    const updatedConnection = await prisma.studentCoachConnection.update({
      where: { id: connectionId },
      data: {
        status: action === 'ACCEPT' ? 'ACTIVE' : 'REJECTED',
        responseMessage: message,
        respondedAt: new Date()
      },
      include: {
        student: {
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

    // TODO: Send notification to student

    res.json(successResponse(updatedConnection, `Connection request ${action.toLowerCase()}ed successfully.`));

  } catch (error) {
    console.error('Respond to connection request error:', error);
    res.status(500).json(errorResponse('Failed to respond to connection request.', 500));
  }
});

// Get connected students
router.get('/students', authenticate, requireCoach, requireApproved, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      coachId: req.coach.id,
      status: 'ACTIVE',
      ...(search && {
        student: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { sport: { contains: search, mode: 'insensitive' } }
          ]
        }
      })
    };

    const [connections, total] = await Promise.all([
      prisma.studentCoachConnection.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              sport: true,
              level: true,
              institute: true,
              bio: true,
              achievements: true,
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
          createdAt: 'desc'
        }
      }),
      prisma.studentCoachConnection.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      students: connections.map(conn => ({
        connectionId: conn.id,
        connectedAt: conn.createdAt,
        ...conn.student
      })),
      pagination
    }, 'Connected students retrieved successfully.'));

  } catch (error) {
    console.error('Get connected students error:', error);
    res.status(500).json(errorResponse('Failed to retrieve connected students.', 500));
  }
});

// Add student manually (Coach-initiated)
router.post('/students/add', authenticate, requireCoach, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      sport,
      level,
      dateOfBirth,
      address,
      city,
      state,
      pincode
    } = req.body;

    // Check if coach has completed payment or has active subscription
    const coach = await prisma.coach.findUnique({
      where: { userId: req.user.id }
    });

    if (!coach || (coach.paymentStatus === 'PENDING' && !coach.isActive)) {
      return res.status(403).json(errorResponse('Please complete payment to add students. If you chose "Pay Later", please complete the payment to access this feature.', 403));
    }

    if (!name || !email || !phone || !sport) {
      return res.status(400).json(errorResponse('Name, email, phone, and sport are required.', 400));
    }

    // Check if user already exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone }
        ]
      }
    });

    let student;
    if (user) {
      // User exists, check if they have a student profile
      student = await prisma.student.findUnique({
        where: { userId: user.id }
      });
      
      if (!student) {
        // Create student profile for existing user
        student = await prisma.student.create({
          data: {
            userId: user.id,
            name,
            sport,
            level: level || 'BEGINNER',
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            address,
            city,
            state,
            pincode
          }
        });
      }
    } else {
      // Create new user and student profile
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await require('../utils/helpers').hashPassword(tempPassword);
      
      user = await prisma.user.create({
        data: {
          email,
          phone,
          password: hashedPassword,
          role: 'STUDENT',
          isActive: true,
          isVerified: true,
          studentProfile: {
            create: {
              name,
              sport,
              level: level || 'BEGINNER',
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
              address,
              city,
              state,
              pincode
            }
          }
        },
        include: {
          studentProfile: true
        }
      });
      
      student = user.studentProfile;
      
      // TODO: Send login credentials to student via email/SMS
      console.log(`Temporary password for ${email}: ${tempPassword}`);
    }

    // Create direct connection between coach and student
    const connection = await prisma.studentCoachConnection.create({
      data: {
        studentId: student.id,
        coachId: req.coach.id,
        status: 'ACCEPTED',
        initiatedBy: 'COACH'
      },
      include: {
        student: {
          include: {
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

    res.status(201).json(successResponse(connection, 'Student added and connected successfully.', 201));

  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json(errorResponse('Failed to add student.', 500));
  }
});

// Bulk upload students
router.post('/students/bulk-upload', authenticate, requireCoach, async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json(errorResponse('Please upload a file.', 400));
    }

    const file = req.files.file;
    const allowedTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json(errorResponse('Please upload a valid Excel or CSV file.', 400));
    }

    const results = [];
    const errors = [];

    // Parse file based on type
    let studentData = [];
    
    if (file.mimetype.includes('csv')) {
      const csv = require('csv-parser');
      const Readable = require('stream').Readable;
      
      return new Promise((resolve, reject) => {
        const stream = Readable.from(file.data);
        stream
          .pipe(csv())
          .on('data', (data) => studentData.push(data))
          .on('end', async () => {
            await processBulkStudents(studentData, req.coach.id, results, errors);
            resolve(res.json(successResponse({ results, errors }, 'Bulk upload completed.')));
          })
          .on('error', reject);
      });
    } else {
      // Handle Excel files
      const XLSX = require('xlsx');
      const workbook = XLSX.read(file.data, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      studentData = XLSX.utils.sheet_to_json(worksheet);
      
      await processBulkStudents(studentData, req.coach.id, results, errors);
      res.json(successResponse({ results, errors }, 'Bulk upload completed.'));
    }

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json(errorResponse('Bulk upload failed.', 500));
  }
});

// Helper function for processing bulk students
async function processBulkStudents(studentData, coachId, results, errors) {
  for (let i = 0; i < studentData.length; i++) {
    const row = studentData[i];
    try {
      const { name, email, phone, sport, level, dateOfBirth, address, city, state, pincode } = row;
      
      if (!name || !email || !phone || !sport) {
        errors.push({ row: i + 1, error: 'Missing required fields' });
        continue;
      }

      // Check if user already exists
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email },
            { phone: phone }
          ]
        }
      });

      let student;
      if (user && user.role === 'STUDENT') {
        student = await prisma.student.findUnique({
          where: { userId: user.id }
        });
      }

      if (!student) {
        // Create new user and student
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await require('../utils/helpers').hashPassword(tempPassword);
        
        user = await prisma.user.create({
          data: {
            email,
            phone,
            password: hashedPassword,
            role: 'STUDENT',
            isActive: true,
            isVerified: true,
            studentProfile: {
              create: {
                name,
                sport,
                level: level || 'BEGINNER',
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                address,
                city,
                state,
                pincode
              }
            }
          },
          include: {
            studentProfile: true
          }
        });
        
        student = user.studentProfile;
      }

      // Create connection
      const existingConnection = await prisma.studentCoachConnection.findUnique({
        where: {
          studentId_coachId: {
            studentId: student.id,
            coachId: coachId
          }
        }
      });

      if (!existingConnection) {
        await prisma.studentCoachConnection.create({
          data: {
            studentId: student.id,
            coachId: coachId,
            status: 'ACCEPTED',
            initiatedBy: 'COACH'
          }
        });
      }

      results.push({ row: i + 1, name, email, status: 'success' });

    } catch (error) {
      errors.push({ row: i + 1, error: error.message });
    }
  }
}

// Create event
router.post('/events', authenticate, requireCoach, async (req, res) => {
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
      maxParticipants,
      eventFee
    } = req.body;

    // Check if coach is active (payment completed)
    const coach = await prisma.coach.findUnique({
      where: { userId: req.user.id }
    });

    if (!coach || !coach.isActive) {
      return res.status(403).json(errorResponse('Your account is not active. Please complete payment to create events.', 403));
    }

    // Validation
    if (!name || !description || !sport || !venue || !startDate) {
      return res.status(400).json(errorResponse('Name, description, sport, venue, and start date are required.', 400));
    }

    if (new Date(startDate) <= new Date()) {
      return res.status(400).json(errorResponse('Event start date must be in the future.', 400));
    }

    if (endDate && new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json(errorResponse('Event end date must be after start date.', 400));
    }

    const event = await prisma.event.create({
      data: {
        coachId: coach.id,
        name,
        description,
        sport,
        venue,
        address,
        city,
        state,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : 50,
        eventFee: eventFee ? parseFloat(eventFee) : 0,
        status: 'PENDING'
      }
    });

    res.status(201).json(successResponse({
      event,
      message: 'Event created successfully. It will be reviewed by admin before activation.',
      requiresPayment: eventFee && eventFee > 0
    }, 'Event created successfully.', 201));

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json(errorResponse('Failed to create event.', 500));
  }
});

// Process event payment
router.post('/events/:eventId/payment', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { amount, razorpayOrderId, razorpayPaymentId } = req.body;

    // Find the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { coach: true }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    if (event.coachId !== req.coach.id) {
      return res.status(403).json(errorResponse('Unauthorized access.', 403));
    }

    // Create event payment record
    const payment = await prisma.eventPayment.create({
      data: {
        eventId,
        amount: parseFloat(amount),
        razorpayOrderId,
        razorpayPaymentId,
        status: 'SUCCESS',
        description: `Event fee payment for ${event.name}`
      }
    });

    // Update event status to submit for admin approval
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: 'PENDING'
      }
    });

    res.json(successResponse({
      payment,
      event: updatedEvent,
      message: 'Payment successful! Event has been submitted for admin approval.'
    }, 'Event payment processed successfully.'));

  } catch (error) {
    console.error('Event payment error:', error);
    res.status(500).json(errorResponse('Event payment failed.', 500));
  }
});

// Get coach events
router.get('/events', authenticate, requireCoach, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      organizerId: req.coach.id,
      ...(status && { status: status.toUpperCase() })
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          registrations: {
            include: {
              student: {
                select: {
                  firstName: true,
                  lastName: true
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
        orderBy: {
          createdAt: 'desc'
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
    console.error('Get coach events error:', error);
    res.status(500).json(errorResponse('Failed to retrieve events.', 500));
  }
});

// Update event
router.put('/events/:eventId', authenticate, requireCoach, requireApproved, async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      title,
      description,
      sport,
      startDate,
      endDate,
      location,
      fees,
      maxParticipants,
      registrationDeadline,
      requirements,
      status
    } = req.body;

    // Check if event exists and belongs to coach
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!existingEvent) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    if (existingEvent.organizerId !== req.coach.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    // Validate dates if provided
    if (startDate && new Date(startDate) <= new Date()) {
      return res.status(400).json(errorResponse('Event start date must be in the future.', 400));
    }

    if (endDate && startDate && new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json(errorResponse('Event end date must be after start date.', 400));
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title,
        description,
        sport,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        location,
        fees: fees !== undefined ? parseFloat(fees) : undefined,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
        requirements: requirements || undefined,
        status: status || undefined
      },
      include: {
        registrations: {
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    res.json(successResponse(updatedEvent, 'Event updated successfully.'));

  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json(errorResponse('Failed to update event.', 500));
  }
});

// Delete event
router.delete('/events/:eventId', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event exists and belongs to coach
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            registrations: true
          }
        }
      }
    });

    if (!existingEvent) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    if (existingEvent.organizerId !== req.coach.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    if (existingEvent._count.registrations > 0) {
      return res.status(400).json(errorResponse('Cannot delete event with registrations.', 400));
    }

    await prisma.event.delete({
      where: { id: eventId }
    });

    res.json(successResponse(null, 'Event deleted successfully.'));

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json(errorResponse('Failed to delete event.', 500));
  }
});

// Get event registrations
router.get('/events/:eventId/registrations', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    // Check if event belongs to coach
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    if (event.organizerId !== req.coach.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    const [registrations, total] = await Promise.all([
      prisma.eventRegistration.findMany({
        where: { eventId },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              sport: true,
              level: true,
              institute: true,
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
          registrationDate: 'asc'
        }
      }),
      prisma.eventRegistration.count({ where: { eventId } })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      event: {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        maxParticipants: event.maxParticipants,
        currentParticipants: event.currentParticipants
      },
      registrations,
      pagination
    }, 'Event registrations retrieved successfully.'));

  } catch (error) {
    console.error('Get event registrations error:', error);
    res.status(500).json(errorResponse('Failed to retrieve event registrations.', 500));
  }
});

// Get dashboard analytics
router.get('/dashboard', authenticate, requireCoach, async (req, res) => {
  try {
    const coachId = req.coach.id;

    // Get various analytics
    const [
      totalStudents,
      pendingRequests,
      totalEvents,
      upcomingEvents,
      totalEarnings,
      activeEvents
    ] = await Promise.all([
      prisma.studentCoachConnection.count({
        where: { coachId, status: 'ACCEPTED' }
      }),
      prisma.studentCoachConnection.count({
        where: { coachId, status: 'PENDING' }
      }),
      prisma.event.count({
        where: { coachId }
      }),
      prisma.event.count({
        where: { 
          coachId, 
          startDate: { gte: new Date() },
          status: { in: ['APPROVED', 'ACTIVE'] }
        }
      }),
      prisma.payment.aggregate({
        where: { coachId, status: 'SUCCESS' },
        _sum: { amount: true }
      }),
      prisma.event.count({
        where: { coachId, status: 'ACTIVE' }
      })
    ]);

    // Monthly earnings for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyEarnings = await prisma.payment.groupBy({
      by: ['createdAt'],
      where: {
        coachId,
        status: 'SUCCESS',
        createdAt: { gte: sixMonthsAgo }
      },
      _sum: { amount: true }
    });

    // Get coach profile for rating info
    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
      select: {
        rating: true,
        totalStudents: true,
        name: true,
        specialization: true,
        createdAt: true,
        paymentStatus: true,
        isActive: true,
        user: {
          select: {
            createdAt: true
          }
        }
      }
    });

    // Get recent students (last 5 connections)
    const recentStudents = await prisma.studentCoachConnection.findMany({
      where: { coachId, status: 'ACCEPTED' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            sport: true,
            level: true,
            achievements: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get recent events (last 5)
    const recentEvents = await prisma.event.findMany({
      where: { coachId },
      select: {
        id: true,
        name: true,
        startDate: true,
        status: true,
        currentParticipants: true,
        maxParticipants: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get recent notifications/activities
    const notifications = [
      {
        id: 1,
        type: 'student',
        message: `You have ${pendingRequests} pending connection request${pendingRequests !== 1 ? 's' : ''}`,
        time: '1 hour ago'
      },
      {
        id: 2,
        type: 'event',
        message: `You have ${upcomingEvents} upcoming event${upcomingEvents !== 1 ? 's' : ''}`,
        time: '2 hours ago'
      },
      {
        id: 3,
        type: 'payment',
        message: `Total earnings: ₹${totalEarnings._sum.amount || 0}`,
        time: '1 day ago'
      }
    ];

    res.json(successResponse({
      // Coach basic info
      coach: {
        name: coach?.name || 'Coach',
        specialization: coach?.specialization || 'Sports Training',
        studentsCount: totalStudents,
        eventsCreated: totalEvents,
        rating: coach?.rating || 0,
        totalRevenue: totalEarnings._sum.amount || 0,
        joinedDate: coach?.user?.createdAt || coach?.createdAt,
        paymentStatus: coach?.paymentStatus || 'PENDING',
        isActive: coach?.isActive || false
      },
      // Students data
      students: recentStudents.map(conn => ({
        id: conn.student.id,
        name: conn.student.name,
        sport: conn.student.sport || 'General',
        level: conn.student.level || 'Beginner',
        achievements: conn.student.achievements ? JSON.parse(conn.student.achievements) : [],
        joinedDate: conn.createdAt,
        performance: Math.floor(Math.random() * 30) + 70 // Mock performance data
      })),
      // Events data
      recentEvents: recentEvents.map(event => ({
        id: event.id,
        name: event.name,
        date: event.startDate,
        participants: event.currentParticipants || 0,
        maxParticipants: event.maxParticipants || 50,
        status: event.status === 'APPROVED' || event.status === 'ACTIVE' ? 'upcoming' : 
               event.status === 'COMPLETED' ? 'completed' : 'pending'
      })),
      // Notifications
      notifications,
      // Analytics data
      totalStudents,
      pendingRequests,
      totalEvents,
      upcomingEvents,
      activeEvents,
      totalEarnings: totalEarnings._sum.amount || 0,
      averageRating: coach?.rating || 0,
      totalReviews: 0, // Will be implemented when review system is added
      recentReviews: [],
      monthlyEarnings
    }, 'Analytics retrieved successfully.'));

  } catch (error) {
    console.error('Get coach analytics error:', error);
    res.status(500).json(errorResponse('Failed to retrieve analytics.', 500));
  }
});

// Get payment history
router.get('/payments', authenticate, requireCoach, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      coachId: req.coach.id,
      ...(status && { status: status.toUpperCase() })
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.payment.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      payments,
      pagination
    }, 'Payment history retrieved successfully.'));

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json(errorResponse('Failed to retrieve payment history.', 500));
  }
});

// Create payment order for coach subscription
router.post('/create-payment-order', authenticate, requireCoach, async (req, res) => {
  try {
    const { planId, amount } = req.body;

    if (!planId || !amount) {
      return res.status(400).json(errorResponse('Plan ID and amount are required.', 400));
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `c${req.coach.id}_${Date.now()}`.slice(0, 40),
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    // Store order details in database
    await prisma.payment.create({
      data: {
        coachId: req.coach.id,
        type: 'SUBSCRIPTION_MONTHLY',
        amount: amount,
        currency: 'INR',
        razorpayOrderId: order.id,
        status: 'PENDING',
        description: `${planId} plan subscription`,
        metadata: JSON.stringify({ planId })
      }
    });

    res.json(successResponse({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    }, 'Payment order created successfully.'));

  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json(errorResponse('Failed to create payment order.', 500));
  }
});

// Verify payment and update coach status
router.post('/verify-payment', authenticate, requireCoach, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json(errorResponse('Invalid payment signature.', 400));
    }

    // Update payment record
    const payment = await prisma.payment.updateMany({
      where: {
        coachId: req.coach.id,
        razorpayOrderId: razorpay_order_id,
        status: 'PENDING'
      },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        status: 'SUCCESS'
      }
    });

    if (payment.count === 0) {
      return res.status(404).json(errorResponse('Payment record not found.', 404));
    }

    // Update coach status
    const subscriptionExpiresAt = new Date();
    subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 1);

    await prisma.coach.update({
      where: { id: req.coach.id },
      data: {
        paymentStatus: 'SUCCESS',
        isActive: true,
        subscriptionType: 'MONTHLY',
        subscriptionExpiresAt
      }
    });

    res.json(successResponse({
      paymentId: razorpay_payment_id,
      status: 'SUCCESS'
    }, 'Payment verified and coach activated successfully.'));

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json(errorResponse('Payment verification failed.', 500));
  }
});

module.exports = router;