const EventService = require('../services/eventService');
const { successResponse, errorResponse } = require('../utils/helpers');

const eventService = new EventService();

/**
 * Events Controller
 * Handles HTTP requests for event operations
 */
class EventController {
  /**
   * Create a new event
   * POST /api/events
   */
  async createEvent(req, res) {
    try {
      const { user } = req;
      
      // Determine creator type and ID based on user role
      let creatorId, creatorType;
      
      if (user.role === 'COACH') {
        if (!req.coach?.id) {
          return res.status(400).json(errorResponse('Coach profile not found', 400));
        }
        creatorId = req.coach.id;
        creatorType = 'COACH';
      } else if (user.role === 'INSTITUTE') {
        if (!req.institute?.id) {
          return res.status(400).json(errorResponse('Institute profile not found', 400));
        }
        creatorId = req.institute.id;
        creatorType = 'INSTITUTE';
      } else if (user.role === 'CLUB') {
        if (!req.club?.id) {
          return res.status(400).json(errorResponse('Club profile not found', 400));
        }
        creatorId = req.club.id;
        creatorType = 'CLUB';
      } else {
        return res.status(403).json(errorResponse('Only coaches, institutes, and clubs can create events', 403));
      }

      const event = await eventService.createEvent(req.body, creatorId, creatorType);

      res.status(201).json(successResponse(
        event,
        `Event created successfully. It will be reviewed by admin before activation.`
      ));
    } catch (error) {
      console.error('Create event error:', error);
      res.status(400).json(errorResponse(error.message || 'Failed to create event', 400));
    }
  }

  /**
   * Get events with filtering and pagination
   * GET /api/events
   */
  async getEvents(req, res) {
    try {
      const { user } = req;
      const filters = {
        sport: req.query.sport,
        location: req.query.location,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        maxFees: req.query.maxFees,
        search: req.query.search,
        status: req.query.status,
        creatorType: req.query.creatorType
      };

      const pagination = {
        page: req.query.page || 1,
        limit: req.query.limit || 10
      };

      // Get user-specific ID based on role
      let userId = null;
      if (user.role === 'COACH') userId = req.coach?.id;
      else if (user.role === 'INSTITUTE') userId = req.institute?.id;
      else if (user.role === 'CLUB') userId = req.club?.id;
      else if (user.role === 'STUDENT') userId = req.student?.id;

      const result = await eventService.getEvents(filters, pagination, user.role, userId);

      res.json(successResponse(result, 'Events retrieved successfully'));
    } catch (error) {
      console.error('Get events error:', error);
      res.status(500).json(errorResponse(error.message || 'Failed to retrieve events', 500));
    }
  }

  /**
   * Get events by creator (for coaches, institutes, clubs)
   * GET /api/events/my-events
   */
  async getEventsByCreator(req, res) {
    try {
      const { user } = req;
      
      // Get user-specific ID based on role
      let creatorId, creatorType;
      if (user.role === 'COACH') {
        creatorId = req.coach?.id;
        creatorType = 'COACH';
      } else if (user.role === 'INSTITUTE') {
        creatorId = req.institute?.id;
        creatorType = 'INSTITUTE';
      } else if (user.role === 'CLUB') {
        creatorId = req.club?.id;
        creatorType = 'CLUB';
      } else {
        return res.status(403).json(errorResponse('Only coaches, institutes, and clubs can access this endpoint', 403));
      }

      if (!creatorId) {
        return res.status(400).json(errorResponse('Creator profile not found', 400));
      }

      const filters = {
        sport: req.query.sport,
        status: req.query.status,
        search: req.query.search,
        creatorId,
        creatorType
      };

      const pagination = {
        page: req.query.page || 1,
        limit: req.query.limit || 10
      };

      const result = await eventService.getEventsByCreator(filters, pagination);

      res.json(successResponse(result, 'Your events retrieved successfully'));
    } catch (error) {
      console.error('Get events by creator error:', error);
      res.status(500).json(errorResponse(error.message || 'Failed to retrieve events', 500));
    }
  }

  /**
   * Get a single event by ID
   * GET /api/events/:eventId
   */
  async getEventById(req, res) {
    try {
      const { eventId } = req.params;
      const { user } = req;

      // Get user-specific ID based on role
      let userId = null;
      if (user.role === 'COACH') userId = req.coach?.id;
      else if (user.role === 'INSTITUTE') userId = req.institute?.id;
      else if (user.role === 'CLUB') userId = req.club?.id;
      else if (user.role === 'STUDENT') userId = req.student?.id;

      const event = await eventService.getEventById(eventId, user.role, userId);

      res.json(successResponse(event, 'Event retrieved successfully'));
    } catch (error) {
      console.error('Get event error:', error);
      const statusCode = error.message === 'Event not found' ? 404 : 
                        error.message === 'Access denied to this event' ? 403 : 500;
      res.status(statusCode).json(errorResponse(error.message || 'Failed to retrieve event', statusCode));
    }
  }

  /**
   * Update an event
   * PUT /api/events/:eventId
   */
  async updateEvent(req, res) {
    try {
      const { eventId } = req.params;
      const { user } = req;

      // Get user-specific ID based on role
      let userId = null;
      if (user.role === 'COACH') userId = req.coach?.id;
      else if (user.role === 'INSTITUTE') userId = req.institute?.id;
      else if (user.role === 'CLUB') userId = req.club?.id;

      if (!userId) {
        return res.status(400).json(errorResponse('User profile not found', 400));
      }

      const updatedEvent = await eventService.updateEvent(eventId, req.body, user.role, userId);

      res.json(successResponse(updatedEvent, 'Event updated successfully'));
    } catch (error) {
      console.error('Update event error:', error);
      const statusCode = error.message.includes('permission') ? 403 : 
                        error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json(errorResponse(error.message || 'Failed to update event', statusCode));
    }
  }

  /**
   * Delete an event
   * DELETE /api/events/:eventId
   */
  async deleteEvent(req, res) {
    try {
      const { eventId } = req.params;
      const { user } = req;

      // Get user-specific ID based on role
      let userId = null;
      if (user.role === 'COACH') userId = req.coach?.id;
      else if (user.role === 'INSTITUTE') userId = req.institute?.id;
      else if (user.role === 'CLUB') userId = req.club?.id;

      if (!userId) {
        return res.status(400).json(errorResponse('User profile not found', 400));
      }

      const result = await eventService.deleteEvent(eventId, user.role, userId);

      res.json(successResponse(result, 'Event deleted successfully'));
    } catch (error) {
      console.error('Delete event error:', error);
      const statusCode = error.message.includes('permission') ? 403 : 
                        error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json(errorResponse(error.message || 'Failed to delete event', statusCode));
    }
  }

  /**
   * Cancel an event
   * PUT /api/events/:eventId/cancel
   */
  async cancelEvent(req, res) {
    try {
      const { eventId } = req.params;
      const { reason } = req.body;
      const { user } = req;

      // Get user-specific ID based on role
      let userId = null;
      if (user.role === 'COACH') userId = req.coach?.id;
      else if (user.role === 'INSTITUTE') userId = req.institute?.id;
      else if (user.role === 'CLUB') userId = req.club?.id;

      if (!userId) {
        return res.status(400).json(errorResponse('User profile not found', 400));
      }

      const cancelledEvent = await eventService.cancelEvent(eventId, user.role, userId, reason);

      res.json(successResponse(cancelledEvent, 'Event cancelled successfully'));
    } catch (error) {
      console.error('Cancel event error:', error);
      const statusCode = error.message.includes('permission') ? 403 : 
                        error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json(errorResponse(error.message || 'Failed to cancel event', statusCode));
    }
  }

  /**
   * Register for an event (Student only)
   * POST /api/events/:eventId/register
   */
  async registerForEvent(req, res) {
    try {
      const { eventId } = req.params;
      const { user } = req;

      if (user.role !== 'STUDENT') {
        return res.status(403).json(errorResponse('Only students can register for events', 403));
      }

      if (!req.student?.id) {
        return res.status(400).json(errorResponse('Student profile not found', 400));
      }

      const registration = await eventService.registerForEvent(eventId, req.student.id);

      res.status(201).json(successResponse(registration, 'Successfully registered for event'));
    } catch (error) {
      console.error('Event registration error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('already registered') ? 409 : 
                        error.message.includes('capacity') ? 409 : 400;
      res.status(statusCode).json(errorResponse(error.message || 'Failed to register for event', statusCode));
    }
  }

  /**
   * Unregister from an event (Student only)
   * DELETE /api/events/:eventId/register
   */
  async unregisterFromEvent(req, res) {
    try {
      const { eventId } = req.params;
      const { user } = req;

      if (user.role !== 'STUDENT') {
        return res.status(403).json(errorResponse('Only students can unregister from events', 403));
      }

      if (!req.student?.id) {
        return res.status(400).json(errorResponse('Student profile not found', 400));
      }

      await eventService.unregisterFromEvent(eventId, req.student.id);

      res.json(successResponse(null, 'Successfully unregistered from event'));
    } catch (error) {
      console.error('Event unregistration error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json(errorResponse(error.message || 'Failed to unregister from event', statusCode));
    }
  }

  /**
   * Get event participants (For event creators)
   * GET /api/events/:eventId/participants
   */
  async getEventParticipants(req, res) {
    try {
      const { eventId } = req.params;
      const { user } = req;

      // Get user-specific ID based on role
      let userId = null;
      if (user.role === 'COACH') userId = req.coach?.id;
      else if (user.role === 'INSTITUTE') userId = req.institute?.id;
      else if (user.role === 'CLUB') userId = req.club?.id;
      else if (user.role === 'ADMIN') userId = null; // Admin can see all

      const participants = await eventService.getEventParticipants(eventId, user.role, userId);

      res.json(successResponse(participants, 'Event participants retrieved successfully'));
    } catch (error) {
      console.error('Get event participants error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('Access denied') ? 403 : 500;
      res.status(statusCode).json(errorResponse(error.message || 'Failed to retrieve participants', statusCode));
    }
  }

  /**
   * Get event registrations (For event creators)
   * GET /api/events/:eventId/registrations
   */
  async getEventRegistrations(req, res) {
    try {
      const { eventId } = req.params;
      const { user } = req;

      // Get user-specific ID based on role
      let userId = null;
      if (user.role === 'COACH') userId = req.coach?.id;
      else if (user.role === 'INSTITUTE') userId = req.institute?.id;
      else if (user.role === 'CLUB') userId = req.club?.id;
      else if (user.role === 'ADMIN') userId = null; // Admin can see all

      // First, verify access to the event
      const event = await eventService.getEventById(eventId, user.role, userId);

      res.json(successResponse({
        event: {
          id: event.id,
          name: event.name,
          startDate: event.startDate,
          endDate: event.endDate,
          maxParticipants: event.maxParticipants,
          currentParticipants: event._count.registrations
        },
        registrations: event.registrations
      }, 'Event registrations retrieved successfully'));
    } catch (error) {
      console.error('Get event registrations error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('Access denied') ? 403 : 500;
      res.status(statusCode).json(errorResponse(error.message || 'Failed to retrieve registrations', statusCode));
    }
  }

  /**
   * Upload result files for an event
   * POST /api/events/:eventId/results
   */
  async uploadResults(req, res) {
    try {
      const { eventId } = req.params;
      const description = req.body?.description || '';
      const { user } = req;

      console.log(`📁 Uploading result files for event ${eventId}`);
      console.log(`📋 User ID: ${user?.id}, Role: ${user?.role}`);
      console.log('📄 File:', req.file);
      console.log('📄 Description:', description);

      // Get user-specific ID based on role
      let uploaderId = null;
      let uploaderType = user.role;

      if (user.role === 'COACH') {
        if (!req.coach?.id) {
          return res.status(400).json(errorResponse('Coach profile not found', 400));
        }
        uploaderId = req.coach.id;
      } else if (user.role === 'INSTITUTE') {
        if (!req.institute?.id) {
          return res.status(400).json(errorResponse('Institute profile not found', 400));
        }
        uploaderId = req.institute.id;
      } else if (user.role === 'CLUB') {
        if (!req.club?.id) {
          return res.status(400).json(errorResponse('Club profile not found', 400));
        }
        uploaderId = req.club.id;
      } else if (user.role === 'ADMIN') {
        uploaderId = user.id;
      } else {
        return res.status(403).json(errorResponse('Only coaches, institutes, clubs and admins can upload result files', 403));
      }

      if (!req.file) {
        return res.status(400).json(errorResponse('No file uploaded', 400));
      }

      const result = await eventService.uploadResults(
        eventId, 
        req.file, 
        description, 
        uploaderId, 
        uploaderType
      );

      res.json(successResponse(
        result,
        `Successfully uploaded result file for event "${result.event.name}".`
      ));
    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json(errorResponse(error.message || 'Failed to upload result file', 500));
    }
  }

  /**
   * Get result files for an event
   * GET /api/events/:eventId/results
   */
  async getResults(req, res) {
    try {
      const { eventId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const { user } = req;

      console.log(`📁 Getting result files for event ${eventId}`);
      console.log(`📋 User ID: ${user?.id}, Role: ${user?.role}`);

      // Get user-specific ID based on role
      let userId = null;
      if (user.role === 'COACH') userId = req.coach?.id;
      else if (user.role === 'INSTITUTE') userId = req.institute?.id;
      else if (user.role === 'CLUB') userId = req.club?.id;
      else if (user.role === 'ADMIN') userId = null; // Admin can access all
      else if (user.role === 'STUDENT') userId = req.student?.id; // Students can view results

      const result = await eventService.getResults(
        eventId, 
        { page, limit }, 
        userId, 
        user.role
      );

      res.json(successResponse(result, 'Event result files retrieved successfully'));
    } catch (error) {
      console.error('❌ Get files error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('permission') ? 403 : 500;
      res.status(statusCode).json(errorResponse(error.message || 'Failed to retrieve result files', statusCode));
    }
  }

  /**
   * Delete a result file
   * DELETE /api/events/:eventId/results
   */
  async deleteResults(req, res) {
    try {
      const { eventId } = req.params;
      const { user } = req;

      // Get user-specific ID based on role
      let userId = null;
      if (user.role === 'COACH') userId = req.coach?.id;
      else if (user.role === 'INSTITUTE') userId = req.institute?.id;
      else if (user.role === 'CLUB') userId = req.club?.id;
      else if (user.role === 'ADMIN') userId = null; // Admin can delete any file

      if (!userId && user.role !== 'ADMIN') {
        return res.status(400).json(errorResponse('User profile not found', 400));
      }

      const result = await eventService.deleteResults(eventId, userId, user.role);

      res.json(successResponse(result, 'Event result files deleted successfully'));
    } catch (error) {
      console.error('❌ Delete file error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('permission') ? 403 : 500;
      res.status(statusCode).json(errorResponse(error.message || 'Failed to delete result files', statusCode));
    }
  }

  /**
   * Download a result file
   * GET /api/events/:eventId/results/download
   */
  async downloadResults(req, res) {
    try {
      const { eventId } = req.params;

      const fileInfo = await eventService.downloadResults(eventId);

      if (!fileInfo) {
        return res.status(404).json(errorResponse('No results file found for this event', 404));
      }

      res.download(fileInfo.filePath, fileInfo.originalName, (err) => {
        if (err) {
          console.error('❌ Download error:', err);
          if (!res.headersSent) {
            res.status(500).json(errorResponse('Failed to download file', 500));
          }
        }
      });
    } catch (error) {
      console.error('❌ Download preparation error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json(errorResponse(error.message || 'Failed to prepare file download', statusCode));
    }
  }
}

module.exports = EventController;