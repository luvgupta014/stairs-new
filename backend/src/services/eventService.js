const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const { 
  getPaginationParams, 
  getPaginationMeta,
  successResponse,
  errorResponse 
} = require('../utils/helpers');
const { generateEventUID } = require('../utils/eventUIDGenerator');

const prisma = new PrismaClient();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../../uploads/event-results');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Events Service
 * Handles all event-related business logic for coaches, institutes, clubs, and students
 */
class EventService {
  /**
   * Resolve event by ID or uniqueId
   * @param {string} eventIdentifier - Either database ID (cuid) or uniqueId
   * @returns {Promise<Object>} - Event object
   */
  async resolveEventId(eventIdentifier) {
    // Try to find by uniqueId first (format: XXX-YYY-EVT-ZZZ-MMYYYY)
    // If not found or looks like a cuid, try by id
    let event = null;
    
    // Check if it looks like a uniqueId (contains hyphens and EVT)
    if (eventIdentifier.includes('-') && eventIdentifier.includes('EVT')) {
      event = await prisma.event.findUnique({
        where: { uniqueId: eventIdentifier }
      });
    }
    
    // If not found by uniqueId, try by database id
    if (!event) {
      event = await prisma.event.findUnique({
        where: { id: eventIdentifier }
      });
    }
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    return event;
  }

  /**
   * Compute dynamic event status based on current date/time
   * @param {Object} event - Event object with startDate and endDate
   * @returns {string} - Status: 'about to start', 'ongoing', 'ended', or event.status
   */
  _computeDynamicStatus(event) {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    if (event.status !== 'APPROVED' && event.status !== 'ACTIVE') {
      return event.status;
    }
    if (now < start) {
      return 'about to start';
    } else if (now >= start && now <= end) {
      return 'ongoing';
    } else if (now > end) {
      return 'ended';
    }
    return event.status;
  }
  /**
   * Create a new event
   * @param {Object} eventData - Event data
   * @param {string} creatorId - ID of the creator (coach, institute, or club)
   * @param {string} creatorType - Type of creator ('COACH', 'INSTITUTE', 'CLUB')
   */
  async createEvent(eventData, creatorId, creatorType) {
    try {
      const {
        name,
        description,
        sport,
        startDate,
        endDate,
        venue,
        address,
        city,
        state,
        latitude,
        longitude,
        maxParticipants,
        eventFee = 0,
        registrationDeadline
      } = eventData;

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();

      if (start <= now) {
        throw new Error('Event start date must be in the future');
      }

      if (end <= start) {
        throw new Error('Event end date must be after start date');
      }

      // Generate unique event UID
      const uniqueId = await generateEventUID(sport, city, start);

      // Create event data object based on creator type
      const eventCreateData = {
        uniqueId,
        name,
        description,
        sport,
        startDate: start,
        endDate: end,
        venue,
        address,
        city,
        state,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        maxParticipants: parseInt(maxParticipants),
        eventFee: parseFloat(eventFee),
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        status: 'PENDING', // All events start as pending approval
        currentParticipants: 0
      };

      // Add creator reference based on type
      switch (creatorType) {
        case 'COACH':
          eventCreateData.coachId = creatorId;
          break;
        case 'INSTITUTE':
          eventCreateData.instituteId = creatorId;
          break;
        case 'CLUB':
          eventCreateData.clubId = creatorId;
          break;
        default:
          throw new Error('Invalid creator type');
      }

      const event = await prisma.event.create({
        data: eventCreateData,
        include: {
          coach: creatorType === 'COACH' ? {
            select: {
              id: true,
              name: true,
              primarySport: true,
              user: {
                select: { email: true, phone: true }
              }
            }
          } : undefined,
          institute: creatorType === 'INSTITUTE' ? {
            select: {
              id: true,
              name: true,
              user: {
                select: { email: true, phone: true }
              }
            }
          } : undefined,
          club: creatorType === 'CLUB' ? {
            select: {
              id: true,
              name: true,
              user: {
                select: { email: true, phone: true }
              }
            }
          } : undefined
        }
      });

      return event;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get events with filtering and pagination
   * @param {Object} filters - Filtering options
   * @param {Object} pagination - Pagination options
   * @param {string} userRole - Role of the requesting user
   * @param {string} userId - ID of the requesting user (optional)
   */
  async getEvents(filters = {}, pagination = {}, userRole = null, userId = null) {
    try {
      const { 
        sport, 
        location, 
        dateFrom, 
        dateTo, 
        maxFees, 
        search,
        status,
        creatorType
      } = filters;

      const { page = 1, limit = 10 } = pagination;
      const { skip, take } = getPaginationParams(page, limit);

      // Build where clause based on user role and filters
      const where = {
        // Basic filters
        ...(sport && { sport: { contains: sport, mode: 'insensitive' } }),
        ...(location && { 
          OR: [
            { venue: { contains: location, mode: 'insensitive' } },
            { city: { contains: location, mode: 'insensitive' } },
            { address: { contains: location, mode: 'insensitive' } }
          ]
        }),
        ...(dateFrom && { startDate: { gte: new Date(dateFrom) } }),
        ...(dateTo && { endDate: { lte: new Date(dateTo) } }),
        ...(maxFees && { eventFee: { lte: parseFloat(maxFees) } }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { sport: { contains: search, mode: 'insensitive' } },
            { venue: { contains: search, mode: 'insensitive' } }
          ]
        }),
        ...(status && { status }),
        ...(creatorType && this._getCreatorTypeFilter(creatorType))
      };

      // Apply role-based filtering
      if (userRole === 'STUDENT') {
        // Students see only approved/active future events
        // Exclude events that have already started (not just today's date)
        const now = new Date();
        where.status = { in: ['APPROVED', 'ACTIVE'] };
        where.startDate = { gt: now }; // Changed from gte to gt to exclude current/past events
        console.log('🔍 Student event filters:', JSON.stringify(where, null, 2));
        console.log('🕐 Current date for filtering:', now.toISOString());
        console.log('📝 Note: Events starting now or in the past are excluded for registration');
      } else if (userRole === 'COACH' && userId) {
        // For general events endpoint, don't filter by coach
        // This is handled in getEventsByCreator method
        where.status = { in: ['APPROVED', 'ACTIVE'] };
      } else if (userRole === 'INSTITUTE' && userId) {
        // For general events endpoint, don't filter by institute
        where.status = { in: ['APPROVED', 'ACTIVE'] };
      } else if (userRole === 'CLUB' && userId) {
        // For general events endpoint, don't filter by club
        where.status = { in: ['APPROVED', 'ACTIVE'] };
      }
      // Admin sees all events (no additional filtering)

      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where,
          include: {
            coach: {
              select: {
                id: true,
                name: true,
                primarySport: true,
                user: {
                  select: { email: true, phone: true }
                }
              }
            },
            _count: {
              select: {
                registrations: true
              }
            },
            registrations: userRole === 'STUDENT' && userId ? {
              where: { studentId: userId },
              select: { id: true }
            } : false
          },
          skip,
          take,
          orderBy: {
            startDate: 'asc'
          }
        }),
        prisma.event.count({ where })
      ]);

      // Debug information
      if (userRole === 'STUDENT') {
        const totalEventsInDb = await prisma.event.count();
        const approvedEvents = await prisma.event.count({ 
          where: { status: { in: ['APPROVED', 'ACTIVE'] } } 
        });
        console.log(`📊 Database stats: Total events: ${totalEventsInDb}, Approved events: ${approvedEvents}, Filtered events: ${total}`);
      }

      // Add isRegistered flag for students and dynamic status
      const eventsWithRegistration = events.map(event => ({
        ...event,
        isRegistered: userRole === 'STUDENT' ? event.registrations?.length > 0 : false,
        currentParticipants: event._count.registrations,
        dynamicStatus: this._computeDynamicStatus(event)
      }));

      const paginationMeta = getPaginationMeta(total, parseInt(page), parseInt(limit));

      console.log(`📊 EventService: Found ${eventsWithRegistration.length} events for ${userRole}`);

      return {
        events: eventsWithRegistration,
        pagination: paginationMeta,
        total
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get events by creator (for coaches, institutes, clubs)
   * @param {Object} filters - Filtering options
   * @param {Object} pagination - Pagination options
   */
  async getEventsByCreator(filters = {}, pagination = {}) {
    try {
      const { 
        sport, 
        status,
        search,
        creatorId,
        creatorType
      } = filters;

      const { page = 1, limit = 10 } = pagination;
      const { skip, take } = getPaginationParams(page, limit);

      // Build where clause for creator's events
      const where = {
        ...(sport && { sport: { contains: sport, mode: 'insensitive' } }),
        ...(status && { status }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { sport: { contains: search, mode: 'insensitive' } },
            { venue: { contains: search, mode: 'insensitive' } }
          ]
        })
      };

      // Add creator filter
      switch (creatorType) {
        case 'COACH':
          where.coachId = creatorId;
          break;
        case 'INSTITUTE':
          where.instituteId = creatorId;
          break;
        case 'CLUB':
          where.clubId = creatorId;
          break;
        default:
          throw new Error('Invalid creator type');
      }

      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where,
          include: {
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

      const eventsWithParticipants = events.map(event => ({
        ...event,
        currentParticipants: event._count.registrations,
        dynamicStatus: this._computeDynamicStatus(event)
      }));

      const paginationMeta = getPaginationMeta(total, parseInt(page), parseInt(limit));

      return {
        events: eventsWithParticipants,
        pagination: paginationMeta,
        total
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a single event by ID
   * @param {string} eventId - Event ID
   * @param {string} userRole - Role of requesting user
   * @param {string} userId - ID of requesting user
   */
  async getEventById(eventId, userRole = null, userId = null) {
    try {
      const event = await prisma.event.findFirst({
        where: {
          OR: [
            { id: eventId },
            { uniqueId: eventId }
          ]
        },
        include: {
          coach: {
            select: {
              id: true,
              name: true,
              primarySport: true,
              experience: true,
              user: {
                select: { email: true, phone: true }
              }
            }
          },
          registrations: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  sport: true,
                  user: {
                    select: { 
                      email: true, 
                      phone: true,
                      uniqueId: true
                    }
                  }
                }
              }
            }
          },
          orders: true,
          _count: {
            select: {
              registrations: true
            }
          }
        }
      });

      if (!event) {
        throw new Error('Event not found');
      }

      // Check access permissions
      if (userRole && userId) {
        const hasAccess = this._checkEventAccess(event, userRole, userId);
        if (!hasAccess) {
          throw new Error('Access denied to this event');
        }
      }

      // Add isRegistered flag for students
      if (userRole === 'STUDENT' && userId) {
        const isRegistered = event.registrations.some(reg => reg.studentId === userId);
        event.isRegistered = isRegistered;
      }

      event.currentParticipants = event._count.registrations;
      event.dynamicStatus = this._computeDynamicStatus(event);

      return event;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update an event
   * @param {string} eventId - Event ID
   * @param {Object} updateData - Update data
   * @param {string} userRole - Role of updating user
   * @param {string} userId - ID of updating user
   */
  async updateEvent(eventId, updateData, userRole, userId) {
    try {
      // Get existing event
      const existingEvent = await this.getEventById(eventId, userRole, userId);

      // Check if user can update this event
      if (!this._canModifyEvent(existingEvent, userRole, userId)) {
        throw new Error('You do not have permission to update this event');
      }

      // Don't allow updates to past events
      if (new Date(existingEvent.startDate) <= new Date()) {
        throw new Error('Cannot modify past events');
      }

      // Validate update data
      const validatedData = this._validateEventUpdateData(updateData, existingEvent);

      const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: validatedData,
        include: {
          coach: {
            select: {
              id: true,
              name: true,
              primarySport: true,
              user: { select: { email: true, phone: true } }
            }
          },
          _count: {
            select: { registrations: true }
          }
        }
      });

      updatedEvent.currentParticipants = updatedEvent._count.registrations;
      return updatedEvent;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete an event
   * @param {string} eventId - Event ID
   * @param {string} userRole - Role of deleting user
   * @param {string} userId - ID of deleting user
   */
  async deleteEvent(eventId, userRole, userId) {
    try {
      const event = await this.getEventById(eventId, userRole, userId);

      if (!this._canModifyEvent(event, userRole, userId)) {
        throw new Error('You do not have permission to delete this event');
      }

      // Check if event has registrations
      if (event._count.registrations > 0) {
        throw new Error('Cannot delete event with existing registrations. Consider cancelling instead.');
      }

      await prisma.event.delete({
        where: { id: eventId }
      });

      return { success: true, message: 'Event deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel an event
   * @param {string} eventId - Event ID
   * @param {string} userRole - Role of user
   * @param {string} userId - ID of user
   * @param {string} reason - Cancellation reason
   */
  async cancelEvent(eventId, userRole, userId, reason = null) {
    try {
      const event = await this.getEventById(eventId, userRole, userId);

      if (!this._canModifyEvent(event, userRole, userId)) {
        throw new Error('You do not have permission to cancel this event');
      }

      const cancelledEvent = await prisma.event.update({
        where: { id: eventId },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason
        }
      });

      // TODO: Send notifications to registered students

      return cancelledEvent;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Register student for an event
   * @param {string} eventId - Event ID
   * @param {string} studentId - Student ID
   */
  async registerForEvent(eventId, studentId) {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          _count: {
            select: { registrations: true }
          }
        }
      });

      if (!event) {
        throw new Error('Event not found');
      }

      // Check event status
      if (!['APPROVED', 'ACTIVE'].includes(event.status)) {
        throw new Error('Event is not available for registration');
      }

      // Check if event is in the future
      if (new Date(event.startDate) <= new Date()) {
        throw new Error('Cannot register for past events');
      }

      // Check registration deadline
      if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
        throw new Error('Registration deadline has passed');
      }

      // Check capacity
      if (event._count.registrations >= event.maxParticipants) {
        throw new Error('Event has reached maximum capacity');
      }

      // Check if already registered
      const existingRegistration = await prisma.eventRegistration.findUnique({
        where: {
          eventId_studentId: {
            eventId,
            studentId
          }
        }
      });

      if (existingRegistration) {
        throw new Error('You are already registered for this event');
      }

      // Create registration
      const registration = await prisma.eventRegistration.create({
        data: {
          studentId,
          eventId,
          status: 'REGISTERED'
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              venue: true,
              eventFee: true
            }
          },
          student: {
            select: {
              id: true,
              name: true,
              user: {
                select: { email: true, phone: true }
              }
            }
          }
        }
      });

      // Update event participant count
      await prisma.event.update({
        where: { id: eventId },
        data: {
          currentParticipants: {
            increment: 1
          }
        }
      });

      return registration;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Unregister student from an event
   * @param {string} eventId - Event ID
   * @param {string} studentId - Student ID
   */
  async unregisterFromEvent(eventId, studentId) {
    try {
      const registration = await prisma.eventRegistration.findUnique({
        where: {
          eventId_studentId: {
            eventId,
            studentId
          }
        },
        include: {
          event: {
            select: { name: true, startDate: true }
          }
        }
      });

      if (!registration) {
        throw new Error('You are not registered for this event');
      }

      // Check if event is still in the future
      if (new Date(registration.event.startDate) <= new Date()) {
        throw new Error('Cannot unregister from past events');
      }

      // Delete registration
      await prisma.eventRegistration.delete({
        where: {
          eventId_studentId: {
            eventId,
            studentId
          }
        }
      });

      // Update event participant count
      await prisma.event.update({
        where: { id: eventId },
        data: {
          currentParticipants: {
            decrement: 1
          }
        }
      });

      return { success: true, message: 'Successfully unregistered from event' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get event participants
   * @param {string} eventId - Event ID
   * @param {string} userRole - Role of requesting user
   * @param {string} userId - ID of requesting user
   */
  async getEventParticipants(eventId, userRole, userId) {
    try {
      const event = await this.getEventById(eventId, userRole, userId);

      if (!this._canViewEventParticipants(event, userRole, userId)) {
        throw new Error('You do not have permission to view event participants');
      }

      const participants = event.registrations.map(registration => ({
        id: registration.id,
        status: registration.status,
        registeredAt: registration.registeredAt,
        student: registration.student
      }));

      return {
        event: {
          id: event.id,
          name: event.name,
          startDate: event.startDate,
          endDate: event.endDate,
          maxParticipants: event.maxParticipants,
          currentParticipants: event._count.registrations
        },
        participants
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Helper method to get creator type filter
   */
  _getCreatorTypeFilter(creatorType) {
    switch (creatorType) {
      case 'COACH':
        return { coachId: { not: null } };
      case 'INSTITUTE':
        return { instituteId: { not: null } };
      case 'CLUB':
        return { clubId: { not: null } };
      default:
        return {};
    }
  }

  /**
   * Helper method to check event access
   */
  _checkEventAccess(event, userRole, userId) {
    if (userRole === 'ADMIN') return true;
    if (userRole === 'STUDENT') return ['APPROVED', 'ACTIVE'].includes(event.status);
    
    // Check ownership for coaches, institutes, clubs
    if (userRole === 'COACH') return event.coachId === userId;
    if (userRole === 'INSTITUTE') return event.instituteId === userId;
    if (userRole === 'CLUB') return event.clubId === userId;
    
    return false;
  }

  /**
   * Helper method to check if user can modify event
   */
  _canModifyEvent(event, userRole, userId) {
    if (userRole === 'ADMIN') return true;
    
    // Only event creators can modify their events
    if (userRole === 'COACH') return event.coachId === userId;
    if (userRole === 'INSTITUTE') return event.instituteId === userId;
    if (userRole === 'CLUB') return event.clubId === userId;
    
    return false;
  }

  /**
   * Helper method to check if user can view event participants
   */
  _canViewEventParticipants(event, userRole, userId) {
    if (userRole === 'ADMIN') return true;
    
    // Only event creators can view participants
    if (userRole === 'COACH') return event.coachId === userId;
    if (userRole === 'INSTITUTE') return event.instituteId === userId;
    if (userRole === 'CLUB') return event.clubId === userId;
    
    return false;
  }

  /**
   * Helper method to validate event update data
   */
  _validateEventUpdateData(updateData, existingEvent) {
    const validatedData = {};

    // Only include allowed fields
    const allowedFields = [
      'name', 'description', 'sport', 'startDate', 'endDate', 'venue',
      'address', 'city', 'state', 'latitude', 'longitude', 'maxParticipants',
      'eventFee', 'registrationDeadline'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        validatedData[field] = updateData[field];
      }
    });

    // Validate dates if provided
    if (validatedData.startDate) {
      const startDate = new Date(validatedData.startDate);
      if (startDate <= new Date()) {
        throw new Error('Event start date must be in the future');
      }
      validatedData.startDate = startDate;
    }

    if (validatedData.endDate) {
      const endDate = new Date(validatedData.endDate);
      const startDate = validatedData.startDate || existingEvent.startDate;
      if (endDate <= startDate) {
        throw new Error('Event end date must be after start date');
      }
      validatedData.endDate = endDate;
    }

    // Validate numeric fields
    if (validatedData.maxParticipants) {
      validatedData.maxParticipants = parseInt(validatedData.maxParticipants);
    }

    if (validatedData.eventFee !== undefined) {
      validatedData.eventFee = parseFloat(validatedData.eventFee);
    }

    if (validatedData.latitude) {
      validatedData.latitude = parseFloat(validatedData.latitude);
    }

    if (validatedData.longitude) {
      validatedData.longitude = parseFloat(validatedData.longitude);
    }

    return validatedData;
  }

  /**
   * Upload result file for an event
   * @param {string} eventId - Event ID
   * @param {Object} file - Uploaded file
   * @param {string} description - Description of the file
   * @param {string} uploaderId - ID of the uploader
   * @param {string} uploaderType - Type of uploader (COACH, INSTITUTE, CLUB, ADMIN)
   */
  async uploadResults(eventId, file, description = '', uploaderId, uploaderType) {
    try {
      // Verify event exists and uploader has permission
      const event = await this._verifyEventAccess(eventId, uploaderId, uploaderType);

      console.log(`📄 Processing file for event ${event.name}`);
      console.log(`📍 Event database ID: ${event.id}`);
      console.log(`📍 Event uniqueId: ${event.uniqueId}`);

      // Process the uploaded file - pass actual database ID, not the provided eventId
      // because eventId might be uniqueId, but we need the actual database id for FK constraint
      const uploadResult = await this._processFile(file, event.id, description, uploaderId, uploaderType);

      return {
        event: {
          id: event.id,
          name: event.name
        },
        file: uploadResult
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get result files for an event
   * @param {string} eventId - Event ID
   * @param {Object} pagination - Pagination options
   * @param {string} userId - ID of the requesting user
   * @param {string} userType - Type of user (COACH, INSTITUTE, CLUB, ADMIN, STUDENT)
   */
  async getResults(eventId, pagination = {}, userId, userType) {
    try {
      const { page = 1, limit = 20 } = pagination;
      const { skip, take } = getPaginationParams(page, limit);

      // Resolve event ID first
      const resolvedEvent = await this.resolveEventId(eventId);
      const actualEventId = resolvedEvent.id;

      // Verify access to event (students can view results too)
      if (userType !== 'STUDENT') {
        await this._verifyEventAccess(eventId, userId, userType);
      } else {
        // For students, just verify event exists (already done by resolveEventId)
      }

      // Get event details using actual database ID
      const event = await prisma.event.findUnique({
        where: { id: actualEventId },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true
        }
      });

      const [files, total] = await Promise.all([
        prisma.eventResultFile.findMany({
          where: { eventId: actualEventId },
          include: {
            coach: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { uploadedAt: 'desc' },
          skip,
          take
        }),
        prisma.eventResultFile.count({ where: { eventId: actualEventId } })
      ]);

      const paginationMeta = getPaginationMeta(total, parseInt(page), parseInt(limit));

      return {
        event,
        files,
        pagination: paginationMeta
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete result files for an event
   * @param {string} eventId - Event ID
   * @param {string} userId - ID of the user
   * @param {string} userType - Type of user
   */
  async deleteResults(eventId, userId, userType) {
    try {
      // Verify event access and resolve ID
      const event = await this._verifyEventAccess(eventId, userId, userType);
      const actualEventId = event.id;

      // Check permissions
      if (!this._canModifyFile(event, userId, userType)) {
        throw new Error('You do not have permission to delete result files for this event');
      }

      // Get all files for this event
      const files = await prisma.eventResultFile.findMany({
        where: { eventId: actualEventId }
      });

      // Delete physical files
      for (const file of files) {
        const filePath = path.join(uploadsDir, file.filename); // Using correct field name
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Delete database records
      await prisma.eventResultFile.deleteMany({
        where: { eventId: actualEventId }
      });

      return { 
        success: true, 
        message: `Deleted ${files.length} result file(s) for event ${event.name}` 
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Download result file for an event
   * @param {string} eventId - Event ID (can be database ID or uniqueId)
   */
  async downloadResults(eventId) {
    try {
      // Resolve eventId to actual database ID (it could be uniqueId)
      const resolvedEvent = await this.resolveEventId(eventId);
      const actualEventId = resolvedEvent.id;

      const file = await prisma.eventResultFile.findFirst({
        where: { eventId: actualEventId },
        orderBy: { uploadedAt: 'desc' }
      });

      if (!file) {
        return null;
      }

      const filePath = path.join(uploadsDir, file.filename); // Using correct field name
      
      if (!fs.existsSync(filePath)) {
        throw new Error('Physical file not found');
      }

      return {
        filePath,
        originalName: file.originalName,
        mimeType: file.mimeType
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Private method to verify event access for file operations
   */
  async _verifyEventAccess(eventId, userId, userType) {
    // Resolve event ID (supports both database ID and uniqueId)
    const event = await this.resolveEventId(eventId);
    console.log(`🔍 resolveEventId returned: ID=${event.id}, uniqueId=${event.uniqueId}`);
    
    // Re-fetch with includes for permission checking
    const eventWithDetails = await prisma.event.findUnique({
      where: { id: event.id },
      include: {
        coach: { select: { id: true, name: true } }
      }
    });

    if (!eventWithDetails) {
      throw new Error('Event not found');
    }

    console.log(`✅ _verifyEventAccess returning: ID=${eventWithDetails.id}`);

    // Check permissions
    if (userType === 'ADMIN') {
      return eventWithDetails; // Admin has access to all events
    }

    const hasAccess = this._canModifyFile(eventWithDetails, userId, userType);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this event');
    }

    return eventWithDetails;
  }

  /**
   * Private method to process file upload
   */
  async _processFile(file, eventId, description, uploaderId, uploaderType) {
    try {
      // Multer has already saved the file to the final location
      // file.path contains the full path to the saved file
      // file.filename contains the filename generated by multer
      
      console.log(`📁 File saved by multer to: ${file.path}`);
      console.log(`📄 Multer filename: ${file.filename}`);
      console.log(`🔑 EventID being used for database: ${eventId}`);

      // For now, only coaches can upload files (schema limitation)
      // TODO: Extend schema to support multiple uploader types
      let dataToSave = {
        eventId,
        filename: file.filename,         // Use multer's generated filename
        originalName: file.originalname, // Schema field name
        mimeType: file.mimetype,         // Schema field name
        size: file.size,                 // Schema field name
        description: description,        // Include description
      };

      // Only set coachId if uploader is a coach
      if (uploaderType === 'COACH') {
        dataToSave.coachId = uploaderId;
      } else {
        // For non-coach users, we need to find a related coach or handle differently
        // For now, throw an error as the schema doesn't support this
        throw new Error('Only coaches can upload event result files');
      }

      console.log(`💾 Saving to database:`, dataToSave);

      // Save file info to database - using correct field names from schema
      const savedFile = await prisma.eventResultFile.create({
        data: dataToSave
      });

      console.log(`✅ File uploaded: ${file.originalname} -> ${file.filename}`);

      return {
        id: savedFile.id,
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: savedFile.uploadedAt
      };
    } catch (error) {
      console.error(`❌ File upload error for ${file?.originalname}:`, error.message);
      throw error;
    }
  }

  /**
   * Private method to check if user can modify files for an event
   */
  _canModifyFile(event, userId, userType) {
    if (userType === 'ADMIN') return true;
    
    // Check ownership based on user type
    if (userType === 'COACH') return event.coachId === userId;
    if (userType === 'INSTITUTE') return event.instituteId === userId;
    if (userType === 'CLUB') return event.clubId === userId;
    
    return false;
  }
}

module.exports = EventService;