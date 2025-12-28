const express = require('express');
const EventController = require('../controllers/eventController');
const { authenticate, requireRole, requireStudent, requireCoach, checkEventPermission } = require('../utils/authMiddleware');
const multer = require('multer');
const path = require('path');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { successResponse, errorResponse } = require('../utils/helpers');
const prisma = require('../utils/prismaClient');

const router = express.Router();
const eventController = new EventController();

// Razorpay instance (used for Event Orders payments)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsPath = path.join(__dirname, '../../../uploads/event-results/');
    console.log('📁 Upload destination:', uploadsPath);
    
    // Ensure directory exists
    const fs = require('fs');
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
      console.log('📁 Created uploads directory:', uploadsPath);
    }
    
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `event-${req.params.eventId}-${uniqueSuffix}${path.extname(file.originalname)}`;
    console.log('📄 Generated filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit (increased from 10MB)
    files: 5 // Maximum 5 files per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.xlsx', '.xls', '.csv'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Excel, and CSV files are allowed.'));
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  console.error('❌ Multer error:', err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Maximum size is 50MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, message: 'Too many files. Maximum is 5 files.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ success: false, message: 'Unexpected field name. Use "files" as field name.' });
    }
  }
  if (err.message === 'Invalid file type. Only PDF, Excel, and CSV files are allowed.') {
    return res.status(400).json({ success: false, message: err.message });
  }
  return res.status(500).json({ success: false, message: 'File upload error: ' + err.message });
};

// Middleware to prevent express-fileupload interference with multer
// express-fileupload parses the stream, consuming it before multer can
// This middleware attempts to prevent that by setting a flag
const clearExpressFileUpload = (req, res, next) => {
  // Tell express-fileupload to skip this request
  // (Doesn't actually work since express-fileupload is global, but we try anyway)
  req._skipFileUpload = true;
  
  // If files were already parsed by express-fileupload, remove them
  if (req.files) {
    req.files = undefined;
  }
  
  // Clear the body if it was set
  if (req.body && typeof req.body === 'object' && !req.body.description) {
    req.body = { description: req.body.description || '' };
  }
  
  next();
};

/**
 * Event Routes
 * Most routes require authentication
 */

// Public route: Get event by uniqueId (no authentication required)
router.get('/public/:uniqueId', eventController.getPublicEventByUniqueId.bind(eventController));

// Serve HTML with meta tags for social media crawlers
router.get('/preview/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params;
    const EventService = require('../services/eventService');
    const eventService = new EventService();
    
    try {
      const event = await eventService.getPublicEventByUniqueId(uniqueId);
      
      // Build event details for description
      const eventDetails = [];
      if (event.sport) eventDetails.push(event.sport);
      if (event.level) eventDetails.push(`${event.level} Level`);
      if (event.startDate) {
        const date = new Date(event.startDate);
        const formattedDate = date.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        eventDetails.push(formattedDate);
      }
      if (event.venue) {
        let venueInfo = event.venue;
        if (event.city) venueInfo += `, ${event.city}`;
        if (event.state) venueInfo += `, ${event.state}`;
        eventDetails.push(venueInfo);
      }
      
      const organizerName = event.createdByAdmin
        ? 'STAIRS Talent Hub'
        : (event.coach?.name || 'STAIRS Talent Hub');
      
      const cleanDescription = event.description
        ? event.description.replace(/\n+/g, ' ').trim().substring(0, 200)
        : '';
      
      let enhancedDescription = '';
      if (cleanDescription) {
        enhancedDescription = `${cleanDescription} | ${eventDetails.join(' • ')} | Organized by ${organizerName}`;
      } else {
        enhancedDescription = `${event.name} - ${eventDetails.join(' • ')} | Organized by ${organizerName} on STAIRS Talent Hub`;
      }
      
      if (enhancedDescription.length > 300) {
        enhancedDescription = enhancedDescription.substring(0, 297) + '...';
      }
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const eventUrl = `${frontendUrl}/event/${event.uniqueId}`;
      const logoUrl = `${frontendUrl}/logo.png`;
      
      // Serve HTML with meta tags
      const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${event.name} | STAIRS Talent Hub</title>
    <meta name="description" content="${enhancedDescription.replace(/"/g, '&quot;')}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${eventUrl}" />
    <meta property="og:title" content="${event.name.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${enhancedDescription.replace(/"/g, '&quot;')}" />
    <meta property="og:image" content="${logoUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${event.name.replace(/"/g, '&quot;')} - STAIRS Talent Hub Event" />
    <meta property="og:site_name" content="STAIRS Talent Hub" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${eventUrl}" />
    <meta name="twitter:title" content="${event.name.replace(/"/g, '&quot;')}" />
    <meta name="twitter:description" content="${enhancedDescription.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${logoUrl}" />
    
    <!-- Redirect to actual page -->
    <meta http-equiv="refresh" content="0;url=${eventUrl}" />
    <link rel="canonical" href="${eventUrl}" />
  </head>
  <body>
    <script>
      window.location.href = '${eventUrl}';
    </script>
    <p>Redirecting to <a href="${eventUrl}">${event.name}</a>...</p>
  </body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      // If event not found, serve default HTML
      const defaultHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Event Not Found | STAIRS Talent Hub</title>
    <meta name="description" content="The event you're looking for doesn't exist or is no longer available." />
  </head>
  <body>
    <h1>Event Not Found</h1>
    <p>The event you're looking for doesn't exist or is no longer available.</p>
  </body>
</html>`;
      res.setHeader('Content-Type', 'text/html');
      res.status(404).send(defaultHtml);
    }
  } catch (error) {
    console.error('Error serving event preview:', error);
    res.status(500).send('Internal server error');
  }
});

// Public event listing (for students)
router.get('/', authenticate, eventController.getEvents.bind(eventController));

// Get events by creator (for coaches, institutes, clubs)
router.get('/my-events', 
  authenticate, 
  requireRole(['COACH', 'INSTITUTE', 'CLUB']), 
  eventController.getEventsByCreator.bind(eventController)
);

// Get specific event
router.get('/:eventId', authenticate, eventController.getEventById.bind(eventController));

/**
 * Fee Management (event-scoped)
 * Allows: Admin, coach who owns the event (via checkEventPermission coach bypass),
 * or assigned user with per-user/role permissions including feeManagement.
 */
router.get('/:eventId/fees', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;

    const has = await checkEventPermission({ user: req.user, eventId, permissionKey: 'feeManagement' });
    if (!has) return res.status(403).json(errorResponse('Access denied. Fee management permission required.', 403));

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        uniqueId: true,
        feeMode: true,
        eventFee: true,
        coordinatorFee: true,
        studentFeeEnabled: true,
        studentFeeAmount: true,
        studentFeeUnit: true,
        createdByAdmin: true
      }
    });
    if (!event) return res.status(404).json(errorResponse('Event not found.', 404));

    res.json(successResponse(event, 'Event fee settings retrieved.'));
  } catch (error) {
    console.error('❌ Get event fee settings error:', error);
    res.status(500).json(errorResponse('Failed to get event fee settings.', 500));
  }
});

router.put('/:eventId/fees', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;

    const has = await checkEventPermission({ user: req.user, eventId, permissionKey: 'feeManagement' });
    if (!has) return res.status(403).json(errorResponse('Access denied. Fee management permission required.', 403));

    const {
      feeMode,
      eventFee,
      // NOTE: coordinatorFee is intentionally not editable here (business decision; keep admin-only)
      studentFeeEnabled,
      studentFeeAmount,
      studentFeeUnit
    } = req.body || {};

    const updateData = {};
    const validModes = ['GLOBAL', 'EVENT', 'DISABLED'];
    if (feeMode !== undefined) {
      const v = feeMode?.toString().toUpperCase();
      if (!validModes.includes(v)) {
        return res.status(400).json(errorResponse('feeMode must be one of GLOBAL, EVENT, DISABLED.', 400));
      }
      updateData.feeMode = v;
    }

    if (eventFee !== undefined) {
      const n = Number(eventFee);
      if (!Number.isFinite(n) || n < 0) return res.status(400).json(errorResponse('eventFee must be a non-negative number.', 400));
      updateData.eventFee = n;
    }

    if (studentFeeEnabled !== undefined) {
      updateData.studentFeeEnabled = !!studentFeeEnabled;
    }

    if (studentFeeAmount !== undefined) {
      const n = Number(studentFeeAmount);
      if (!Number.isFinite(n) || n < 0) return res.status(400).json(errorResponse('studentFeeAmount must be a non-negative number.', 400));
      updateData.studentFeeAmount = n;
    }

    if (studentFeeUnit !== undefined) {
      const unit = studentFeeUnit?.toString().toUpperCase();
      const validUnits = ['PERSON', 'TEAM'];
      if (!validUnits.includes(unit)) {
        return res.status(400).json(errorResponse('studentFeeUnit must be PERSON or TEAM.', 400));
      }
      updateData.studentFeeUnit = unit;
    }

    // If feeMode is EVENT, ensure eventFee is present (either provided or already in DB)
    if (updateData.feeMode === 'EVENT') {
      const existing = await prisma.event.findUnique({ where: { id: eventId }, select: { eventFee: true } });
      const effectiveFee = updateData.eventFee !== undefined ? updateData.eventFee : (existing?.eventFee || 0);
      if (!effectiveFee || Number(effectiveFee) <= 0) {
        return res.status(400).json(errorResponse('eventFee must be provided (> 0) when feeMode is EVENT.', 400));
      }
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: updateData
    });

    res.json(successResponse(updated, 'Event fee settings updated.'));
  } catch (error) {
    console.error('❌ Update event fee settings error:', error);
    res.status(500).json(errorResponse('Failed to update event fee settings.', 500));
  }
});

// Create event (coaches, institutes, clubs only)
router.post('/', 
  authenticate, 
  requireRole(['COACH', 'INSTITUTE', 'CLUB']), 
  eventController.createEvent.bind(eventController)
);

// Update event (creators and admin only)
router.put('/:eventId', 
  authenticate, 
  requireRole(['COACH', 'INSTITUTE', 'CLUB', 'ADMIN']), 
  eventController.updateEvent.bind(eventController)
);

// Delete event (creators and admin only)
router.delete('/:eventId', 
  authenticate, 
  requireRole(['COACH', 'INSTITUTE', 'CLUB', 'ADMIN']), 
  eventController.deleteEvent.bind(eventController)
);

// Cancel event (creators and admin only)
router.put('/:eventId/cancel', 
  authenticate, 
  requireRole(['COACH', 'INSTITUTE', 'CLUB', 'ADMIN']), 
  eventController.cancelEvent.bind(eventController)
);

// Register for event (students only)
router.post('/:eventId/register', 
  authenticate, 
  requireStudent, 
  eventController.registerForEvent.bind(eventController)
);

// Unregister from event (students only)
router.delete('/:eventId/register', 
  authenticate, 
  requireStudent, 
  eventController.unregisterFromEvent.bind(eventController)
);

/**
 * Bulk add/register students to an event (Event Incharge with studentManagement)
 * POST /api/events/:eventId/registrations/bulk
 * Body: { identifiers: string[] }
 *
 * Notes:
 * - Only registers EXISTING students (no student creation here)
 * - Enforces the same payment rules as normal student registration (via EventService.registerForEvent)
 */
router.post('/:eventId/registrations/bulk', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { user } = req;
    const { identifiers = [] } = req.body || {};

    if (!Array.isArray(identifiers) || identifiers.length === 0) {
      return res.status(400).json(errorResponse('identifiers must be a non-empty array.', 400));
    }
    if (identifiers.length > 300) {
      return res.status(400).json(errorResponse('Too many identifiers. Max 300 per request.', 400));
    }

    // Authorization
    if (user.role === 'EVENT_INCHARGE') {
      const has = await checkEventPermission({ user, eventId, permissionKey: 'studentManagement' });
      if (!has) return res.status(403).json(errorResponse('Access denied. Student management permission required.', 403));
    } else if (user.role !== 'ADMIN') {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    // Resolve event to DB id (supports uniqueId too)
    const EventService = require('../services/eventService');
    const eventServiceLocal = new EventService();
    const resolvedEvent = await eventServiceLocal.resolveEventId(eventId);

    // Normalize identifiers
    const uniq = Array.from(new Set(identifiers.map(x => String(x || '').trim()).filter(Boolean)));
    if (uniq.length === 0) return res.status(400).json(errorResponse('No valid identifiers found.', 400));

    // Lookup students by:
    // - student.id
    // - user.uniqueId
    // - user.email
    // - user.phone
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { id: { in: uniq } },
          { user: { uniqueId: { in: uniq } } },
          { user: { email: { in: uniq } } },
          { user: { phone: { in: uniq } } }
        ]
      },
      select: {
        id: true,
        name: true,
        user: { select: { uniqueId: true, email: true, phone: true } }
      }
    });

    // Build best-effort map identifier -> student
    const studentByAnyKey = new Map();
    for (const s of students) {
      studentByAnyKey.set(String(s.id), s);
      if (s.user?.uniqueId) studentByAnyKey.set(String(s.user.uniqueId), s);
      if (s.user?.email) studentByAnyKey.set(String(s.user.email), s);
      if (s.user?.phone) studentByAnyKey.set(String(s.user.phone), s);
    }

    const tasks = uniq.map(async (identifier) => {
      const student = studentByAnyKey.get(identifier);
      if (!student) {
        return { ok: false, identifier, reason: 'Student not found' };
      }
      try {
        await eventServiceLocal.registerForEvent(resolvedEvent.id, student.id);
        return { ok: true, identifier, studentId: student.id };
      } catch (e) {
        return { ok: false, identifier, reason: e?.message || 'Failed to register' };
      }
    });

    const results = await Promise.all(tasks);
    const registered = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok);

    return res.json(successResponse({
      eventId: resolvedEvent.id,
      requested: uniq.length,
      registered,
      failedCount: failed.length,
      failed
    }, 'Bulk registration completed.'));
  } catch (error) {
    console.error('Bulk register students error:', error);
    return res.status(500).json(errorResponse('Failed to bulk register students.', 500));
  }
});

// Get event participants
// - COACH/INSTITUTE/CLUB/ADMIN: allowed (legacy behavior)
// - EVENT_INCHARGE: allowed only when studentManagement permission is granted for this event
router.get('/:eventId/participants', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { user } = req;

    if (['COACH', 'INSTITUTE', 'CLUB', 'ADMIN'].includes(user.role)) {
      return eventController.getEventParticipants(req, res);
    }

    if (user.role !== 'EVENT_INCHARGE') {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    const has = await checkEventPermission({ user, eventId, permissionKey: 'studentManagement' });
    if (!has) {
      return res.status(403).json(errorResponse('Access denied. Student management permission required.', 403));
    }

    const ev = await prisma.event.findFirst({
      where: { OR: [{ id: eventId }, { uniqueId: eventId }] },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        maxParticipants: true,
        _count: { select: { registrations: true } }
      }
    });
    if (!ev) return res.status(404).json(errorResponse('Event not found.', 404));

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId: ev.id },
      orderBy: { registeredAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            sport: true,
            user: { select: { email: true, phone: true, uniqueId: true } }
          }
        }
      }
    });

    const participants = registrations.map(r => ({
      id: r.id,
      status: r.status,
      registeredAt: r.registeredAt,
      student: r.student
    }));

    return res.json(successResponse({
      event: {
        id: ev.id,
        name: ev.name,
        startDate: ev.startDate,
        endDate: ev.endDate,
        maxParticipants: ev.maxParticipants,
        currentParticipants: ev._count.registrations
      },
      participants
    }, 'Event participants retrieved successfully'));
  } catch (error) {
    console.error('Get event participants (incharge) error:', error);
    return res.status(500).json(errorResponse('Failed to retrieve event participants.', 500));
  }
});

// Get event registrations (event creators and admin only)
router.get('/:eventId/registrations', 
  authenticate, 
  requireRole(['COACH', 'INSTITUTE', 'CLUB', 'ADMIN']), 
  eventController.getEventRegistrations.bind(eventController)
);

/**
 * Event Results Routes
 */

// Test endpoint for file upload debugging
router.post('/test-upload', 
  authenticate, 
  requireCoach,
  (req, res, next) => {
    console.log('🧪 Test upload endpoint hit');
    console.log('Headers:', req.headers);
    next();
  },
  upload.array('files', 1),
  (req, res) => {
    console.log('🧪 Test upload successful');
    console.log('Files:', req.files);
    console.log('Body:', req.body);
    res.json({ success: true, message: 'Test upload works', filesCount: req.files?.length || 0 });
  }
);

// Upload event results
// - COACH: allowed (legacy behavior)
// - EVENT_INCHARGE: allowed only when resultUpload permission is granted for this event
router.post('/:eventId/results', 
  authenticate, 
  async (req, res, next) => {
    if (req.user?.role === 'COACH') return requireCoach(req, res, next);
    if (req.user?.role === 'EVENT_INCHARGE') {
      const has = await checkEventPermission({ user: req.user, eventId: req.params.eventId, permissionKey: 'resultUpload' });
      if (!has) return res.status(403).json(errorResponse('Access denied. Result upload permission required.', 403));
      return next();
    }
    return res.status(403).json(errorResponse('Access denied.', 403));
  },
  clearExpressFileUpload, // Prevent express-fileupload interference with multer - MUST BE BEFORE MULTER
  (req, res, next) => {
    console.log('🔍 Upload endpoint hit:', {
      eventId: req.params.eventId,
      coachId: req.coach?.id,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length']
    });
    console.log('📊 Request body:', req.body);
    console.log('📁 Files on req:', !!req.files);
    next();
  },
  upload.array('files', 5), // Multer processes files here
  (err, req, res, next) => {
    // Multer error handler - must have 4 parameters (err, req, res, next)
    if (err) {
      console.error('❌ Multer error:', err);
      return handleMulterError(err, req, res, next);
    }
    next();
  },
  eventController.uploadResults.bind(eventController)
);

// GET /api/events/:eventId/results/sample-sheet - Download sample result sheet template
// - COACH: allowed
// - EVENT_INCHARGE: allowed only when resultUpload permission is granted for this event
router.get('/:eventId/results/sample-sheet', authenticate, async (req, res, next) => {
  if (req.user?.role === 'COACH') return requireCoach(req, res, next);
  if (req.user?.role === 'EVENT_INCHARGE') {
    const has = await checkEventPermission({ user: req.user, eventId: req.params.eventId, permissionKey: 'resultUpload' });
    if (!has) return res.status(403).json(errorResponse('Access denied. Result upload permission required.', 403));
    return next();
  }
  return res.status(403).json(errorResponse('Access denied.', 403));
}, async (req, res) => {
  try {
    const { eventId } = req.params;
    const XLSX = require('xlsx');
    const { PrismaClient } = require('@prisma/client');
    const { errorResponse } = require('../utils/helpers');
    const prisma = new PrismaClient();
    
    // Resolve event ID and verify coach access
    const eventService = new (require('../services/eventService'))();
    let event;
    try {
      event = await eventService.resolveEventId(eventId);
    } catch (error) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }
    // For coaches, keep ownership check. For incharges, route-level permission is enough.
    if (req.user?.role === 'COACH' && event.coachId !== req.coach.id) {
      return res.status(403).json(errorResponse('You can only download sample sheets for your own events.', 403));
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
          studentId: reg.student.id, // Use actual student ID
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

// Get event results (files)
router.get('/:eventId/results', 
  authenticate,
  async (req, res, next) => {
    if (req.user?.role !== 'EVENT_INCHARGE') return next();
    const has = await checkEventPermission({ user: req.user, eventId: req.params.eventId, permissionKey: 'resultUpload' });
    if (!has) return res.status(403).json(errorResponse('Access denied. Result upload permission required.', 403));
    return next();
  },
  eventController.getResults.bind(eventController)
);

// Get student results with scores and placements (only after validation)
router.get('/:eventId/student-results', 
  authenticate,
  eventController.getStudentResults.bind(eventController)
);

// Download event results (legacy: latest file)
router.get('/:eventId/results/download', 
  authenticate,
  async (req, res, next) => {
    if (req.user?.role === 'COACH') return requireCoach(req, res, next);
    if (req.user?.role === 'EVENT_INCHARGE') {
      const has = await checkEventPermission({ user: req.user, eventId: req.params.eventId, permissionKey: 'resultUpload' });
      if (!has) return res.status(403).json(errorResponse('Access denied. Result upload permission required.', 403));
      return next();
    }
    return res.status(403).json(errorResponse('Access denied.', 403));
  },
  eventController.downloadResults.bind(eventController)
);

// Download individual result file
router.get('/:eventId/results/:fileId/download', 
  authenticate,
  async (req, res, next) => {
    if (req.user?.role === 'COACH') return requireCoach(req, res, next);
    if (req.user?.role === 'EVENT_INCHARGE') {
      const has = await checkEventPermission({ user: req.user, eventId: req.params.eventId, permissionKey: 'resultUpload' });
      if (!has) return res.status(403).json(errorResponse('Access denied. Result upload permission required.', 403));
      return next();
    }
    return res.status(403).json(errorResponse('Access denied.', 403));
  },
  eventController.downloadResultFile.bind(eventController)
);

// Delete event results
router.delete('/:eventId/results', 
  authenticate, 
  async (req, res, next) => {
    if (req.user?.role === 'COACH') return requireCoach(req, res, next);
    if (req.user?.role === 'EVENT_INCHARGE') {
      const has = await checkEventPermission({ user: req.user, eventId: req.params.eventId, permissionKey: 'resultUpload' });
      if (!has) return res.status(403).json(errorResponse('Access denied. Result upload permission required.', 403));
      return next();
    }
    return res.status(403).json(errorResponse('Access denied.', 403));
  },
  eventController.deleteResults.bind(eventController)
);

// Delete individual result file
router.delete('/:eventId/results/:fileId', 
  authenticate, 
  async (req, res, next) => {
    if (req.user?.role === 'COACH') return requireCoach(req, res, next);
    if (req.user?.role === 'EVENT_INCHARGE') {
      const has = await checkEventPermission({ user: req.user, eventId: req.params.eventId, permissionKey: 'resultUpload' });
      if (!has) return res.status(403).json(errorResponse('Access denied. Result upload permission required.', 403));
      return next();
    }
    return res.status(403).json(errorResponse('Access denied.', 403));
  },
  eventController.deleteResultFile.bind(eventController)
);

/**
 * Event Orders (certificates/medals/trophies) - event-scoped
 * Allows:
 * - ADMIN (bypass)
 * - COACH who owns event (via checkEventPermission bypass)
 * - Assigned user (INCHARGE/COORDINATOR/TEAM) with certificateManagement permission
 *
 * Notes:
 * - EventOrder requires coachId; for non-coach creators we use the event's coachId.
 * - Medals pricing is based on total medals (Gold+Silver+Bronze) — not on color.
 */

const getDefaultMedalPriceByLevel = (level) => {
  const lvl = String(level || '').toUpperCase().trim();
  // Defaults requested:
  // District: ₹30, State: ₹55
  if (lvl === 'DISTRICT') return 30;
  if (lvl === 'STATE') return 55;
  return null;
};

const getEventForOrders = async (eventId) => {
  const ev = await prisma.event.findFirst({
    where: { OR: [{ id: eventId }, { uniqueId: eventId }] },
    select: { id: true, uniqueId: true, name: true, level: true, startDate: true, endDate: true, coachId: true }
  });
  return ev;
};

const canManageEventOrders = async (user, eventKey) => {
  // IMPORTANT: eventKey can be DB id OR uniqueId; resolve first for correct permission checks.
  const ev = await getEventForOrders(eventKey);
  if (!ev) return { ok: false, ev: null };
  const ok = await checkEventPermission({ user, eventId: ev.id, permissionKey: 'certificateManagement' });
  return { ok, ev };
};

const canSetEventOrderPricing = async (user, eventKey) => {
  const ev = await getEventForOrders(eventKey);
  if (!ev) return { ok: false, ev: null };
  const ok = await checkEventPermission({ user, eventId: ev.id, permissionKey: 'feeManagement' });
  return { ok, ev };
};

// Create order for event
router.post('/:eventId/orders', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { user } = req;

    const { ok: canManage, ev } = await canManageEventOrders(user, eventId);
    if (!ev) return res.status(404).json(errorResponse('Event not found.', 404));
    if (!canManage) return res.status(403).json(errorResponse('Access denied. Certificate management permission required.', 403));
    if (!ev.coachId) return res.status(400).json(errorResponse('Event is missing coach association. Cannot create orders.', 400));

    const {
      certificates = 0,
      medals = 0,
      medalGold = 0,
      medalSilver = 0,
      medalBronze = 0,
      trophies = 0,
      medalPrice,
      certificatePrice,
      trophyPrice,
      specialInstructions = '',
      urgentDelivery = false
    } = req.body || {};

    const parsedCertificates = Math.max(0, parseInt(certificates) || 0);
    const parsedTrophies = Math.max(0, parseInt(trophies) || 0);
    const parsedMedalGold = Math.max(0, parseInt(medalGold) || 0);
    const parsedMedalSilver = Math.max(0, parseInt(medalSilver) || 0);
    const parsedMedalBronze = Math.max(0, parseInt(medalBronze) || 0);
    const medalsFromBreakdown = parsedMedalGold + parsedMedalSilver + parsedMedalBronze;
    const parsedMedals = Math.max(0, parseInt(medals) || 0);
    const finalMedals = medalsFromBreakdown > 0 ? medalsFromBreakdown : parsedMedals;

    const totalQuantity = parsedCertificates + finalMedals + parsedTrophies;
    if (totalQuantity === 0) {
      return res.status(400).json(errorResponse('At least one item must be ordered.', 400));
    }

    // Pricing (optional, permission-gated)
    const { ok: canPrice } = await canSetEventOrderPricing(user, ev.id);
    const defaultMedalPrice = getDefaultMedalPriceByLevel(ev.level);
    const parsedMedalPrice = canPrice
      ? (medalPrice !== undefined && medalPrice !== null && medalPrice !== '' ? Math.max(0, parseFloat(medalPrice) || 0) : (defaultMedalPrice || 0))
      : 0;
    const parsedCertificatePrice = canPrice
      ? (certificatePrice !== undefined && certificatePrice !== null && certificatePrice !== '' ? Math.max(0, parseFloat(certificatePrice) || 0) : 0)
      : 0;
    const parsedTrophyPrice = canPrice
      ? (trophyPrice !== undefined && trophyPrice !== null && trophyPrice !== '' ? Math.max(0, parseFloat(trophyPrice) || 0) : 0)
      : 0;
    const calculatedTotal = canPrice
      ? ((parsedCertificates * parsedCertificatePrice) + (finalMedals * parsedMedalPrice) + (parsedTrophies * parsedTrophyPrice))
      : 0;

    // One order per event (stored against the event owner coachId)
    const existingOrder = await prisma.eventOrder.findFirst({
      where: { eventId: ev.id, coachId: ev.coachId }
    });
    if (existingOrder) {
      return res.status(400).json(errorResponse('An order already exists for this event. Please edit the existing order.', 400));
    }

    const orderCount = await prisma.eventOrder.count();
    const orderNumber = `ORD-${Date.now()}-${String(orderCount + 1).padStart(4, '0')}`;

    const order = await prisma.eventOrder.create({
      data: {
        orderNumber,
        eventId: ev.id,
        coachId: ev.coachId,
        certificates: parsedCertificates,
        medals: finalMedals,
        medalGold: parsedMedalGold,
        medalSilver: parsedMedalSilver,
        medalBronze: parsedMedalBronze,
        trophies: parsedTrophies,
        specialInstructions,
        urgentDelivery,
        ...(canPrice && { certificatePrice: parsedCertificatePrice, medalPrice: parsedMedalPrice, trophyPrice: parsedTrophyPrice }),
        // Do NOT auto-confirm. Explicit confirmation is required.
        status: 'PENDING',
        totalAmount: canPrice ? Number(calculatedTotal.toFixed(2)) : 0
      },
      include: {
        event: { select: { id: true, uniqueId: true, name: true, level: true, startDate: true, endDate: true } }
      }
    });

    return res.status(201).json(successResponse(
      order,
      canPrice && calculatedTotal > 0
        ? 'Order created and priced successfully. Please confirm the order to proceed to payment.'
        : 'Order created successfully. Admin will review and provide pricing.',
      201
    ));
  } catch (error) {
    console.error('Create event order error:', error);
    return res.status(500).json(errorResponse('Failed to create order.', 500));
  }
});

// Get orders for event
router.get('/:eventId/orders', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { user } = req;

    const { ok: canManage, ev } = await canManageEventOrders(user, eventId);
    if (!ev) return res.status(404).json(errorResponse('Event not found.', 404));
    if (!canManage) return res.status(403).json(errorResponse('Access denied. Certificate management permission required.', 403));
    if (!ev.coachId) return res.status(400).json(errorResponse('Event is missing coach association. Cannot load orders.', 400));

    const orders = await prisma.eventOrder.findMany({
      where: { eventId: ev.id, coachId: ev.coachId },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(successResponse({
      event: { id: ev.id, uniqueId: ev.uniqueId, name: ev.name, level: ev.level, startDate: ev.startDate, endDate: ev.endDate },
      orders
    }, 'Orders retrieved successfully.'));
  } catch (error) {
    console.error('Get event orders error:', error);
    return res.status(500).json(errorResponse('Failed to retrieve orders.', 500));
  }
});

// Update order (before admin pricing)
router.put('/:eventId/orders/:orderId', authenticate, async (req, res) => {
  try {
    const { eventId, orderId } = req.params;
    const { user } = req;

    const { ok: canManage, ev } = await canManageEventOrders(user, eventId);
    if (!ev) return res.status(404).json(errorResponse('Event not found.', 404));
    if (!canManage) return res.status(403).json(errorResponse('Access denied. Certificate management permission required.', 403));
    if (!ev.coachId) return res.status(400).json(errorResponse('Event is missing coach association. Cannot update orders.', 400));

    // Verify order exists and is still modifiable (allow before payment)
    const existing = await prisma.eventOrder.findFirst({
      where: { id: orderId, eventId: ev.id, coachId: ev.coachId, status: { in: ['PENDING', 'CONFIRMED'] }, paymentStatus: { not: 'SUCCESS' } }
    });
    if (!existing) return res.status(404).json(errorResponse('Order not found or cannot be modified.', 404));

    const {
      certificates = 0,
      medals = 0,
      medalGold = 0,
      medalSilver = 0,
      medalBronze = 0,
      trophies = 0,
      medalPrice,
      certificatePrice,
      trophyPrice,
      specialInstructions = '',
      urgentDelivery = false
    } = req.body || {};

    const parsedCertificates = Math.max(0, parseInt(certificates) || 0);
    const parsedTrophies = Math.max(0, parseInt(trophies) || 0);
    const parsedMedalGold = Math.max(0, parseInt(medalGold) || 0);
    const parsedMedalSilver = Math.max(0, parseInt(medalSilver) || 0);
    const parsedMedalBronze = Math.max(0, parseInt(medalBronze) || 0);
    const medalsFromBreakdown = parsedMedalGold + parsedMedalSilver + parsedMedalBronze;
    const parsedMedals = Math.max(0, parseInt(medals) || 0);
    const finalMedals = medalsFromBreakdown > 0 ? medalsFromBreakdown : parsedMedals;

    const totalQuantity = parsedCertificates + finalMedals + parsedTrophies;
    if (totalQuantity === 0) {
      return res.status(400).json(errorResponse('At least one item must be ordered.', 400));
    }

    const { ok: canPrice } = await canSetEventOrderPricing(user, ev.id);
    const defaultMedalPrice = getDefaultMedalPriceByLevel(ev.level);
    const nextMedalPrice = canPrice
      ? (medalPrice !== undefined && medalPrice !== null && medalPrice !== '' ? Math.max(0, parseFloat(medalPrice) || 0) : (existing.medalPrice ?? defaultMedalPrice ?? 0))
      : (existing.medalPrice || 0);
    const nextCertificatePrice = canPrice
      ? (certificatePrice !== undefined && certificatePrice !== null && certificatePrice !== '' ? Math.max(0, parseFloat(certificatePrice) || 0) : (existing.certificatePrice || 0))
      : (existing.certificatePrice || 0);
    const nextTrophyPrice = canPrice
      ? (trophyPrice !== undefined && trophyPrice !== null && trophyPrice !== '' ? Math.max(0, parseFloat(trophyPrice) || 0) : (existing.trophyPrice || 0))
      : (existing.trophyPrice || 0);

    const recalculatedTotal = canPrice
      ? ((parsedCertificates * nextCertificatePrice) + (finalMedals * nextMedalPrice) + (parsedTrophies * nextTrophyPrice))
      : (existing.totalAmount || 0);

    const updatedOrder = await prisma.eventOrder.update({
      where: { id: orderId },
      data: {
        certificates: parsedCertificates,
        medals: finalMedals,
        medalGold: parsedMedalGold,
        medalSilver: parsedMedalSilver,
        medalBronze: parsedMedalBronze,
        trophies: parsedTrophies,
        specialInstructions,
        urgentDelivery,
        ...(canPrice && {
          certificatePrice: nextCertificatePrice,
          medalPrice: nextMedalPrice,
          trophyPrice: nextTrophyPrice,
          totalAmount: Number(recalculatedTotal.toFixed(2))
        })
      }
    });

    return res.json(successResponse(updatedOrder, 'Order updated successfully.'));
  } catch (error) {
    console.error('Update event order error:', error);
    return res.status(500).json(errorResponse('Failed to update order.', 500));
  }
});

// Delete order (before admin pricing)
router.delete('/:eventId/orders/:orderId', authenticate, async (req, res) => {
  try {
    const { eventId, orderId } = req.params;
    const { user } = req;

    const { ok: canManage, ev } = await canManageEventOrders(user, eventId);
    if (!ev) return res.status(404).json(errorResponse('Event not found.', 404));
    if (!canManage) return res.status(403).json(errorResponse('Access denied. Certificate management permission required.', 403));
    if (!ev.coachId) return res.status(400).json(errorResponse('Event is missing coach association. Cannot delete orders.', 400));

    const existing = await prisma.eventOrder.findFirst({
      where: { id: orderId, eventId: ev.id, coachId: ev.coachId, status: 'PENDING', paymentStatus: { not: 'SUCCESS' } }
    });
    if (!existing) return res.status(404).json(errorResponse('Order not found or cannot be deleted.', 404));

    await prisma.eventOrder.delete({ where: { id: orderId } });
    return res.json(successResponse({ id: orderId }, 'Order deleted successfully.'));
  } catch (error) {
    console.error('Delete event order error:', error);
    return res.status(500).json(errorResponse('Failed to delete order.', 500));
  }
});

// Confirm order (explicit action; required before payment)
router.post('/:eventId/orders/:orderId/confirm', authenticate, async (req, res) => {
  try {
    const { eventId, orderId } = req.params;
    const { user } = req;

    const { ok: canManage, ev } = await canManageEventOrders(user, eventId);
    if (!ev) return res.status(404).json(errorResponse('Event not found.', 404));
    if (!canManage) return res.status(403).json(errorResponse('Access denied. Certificate management permission required.', 403));

    // Only allow incharge/admin/coach-bypass with feeManagement to confirm (pricing/payment-related)
    const { ok: canPrice } = await canSetEventOrderPricing(user, ev.id);
    if (!canPrice) {
      return res.status(403).json(errorResponse('Access denied. Fee management permission required to confirm orders.', 403));
    }

    const order = await prisma.eventOrder.findFirst({
      where: { id: orderId, eventId: ev.id, coachId: ev.coachId }
    });
    if (!order) return res.status(404).json(errorResponse('Order not found.', 404));
    if (order.paymentStatus === 'SUCCESS') {
      return res.status(400).json(errorResponse('Order is already paid.', 400));
    }
    if (!order.totalAmount || Number(order.totalAmount) <= 0) {
      return res.status(400).json(errorResponse('Order must be priced (total amount > 0) before confirmation.', 400));
    }

    const updated = await prisma.eventOrder.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' }
    });

    return res.json(successResponse(updated, 'Order confirmed. You can proceed to payment.'));
  } catch (error) {
    console.error('Confirm event order error:', error);
    return res.status(500).json(errorResponse('Failed to confirm order.', 500));
  }
});

// Create payment order for event order (works for coach/admin/assigned event staff with permission)
router.post('/orders/:orderId/create-payment', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.eventOrder.findUnique({
      where: { id: orderId },
      include: {
        event: { select: { id: true, name: true } }
      }
    });
    if (!order) return res.status(404).json(errorResponse('Order not found.', 404));

    const { ok: has } = await canManageEventOrders(req.user, order.eventId);
    if (!has) return res.status(403).json(errorResponse('Access denied. Certificate management permission required.', 403));

    // Idempotency: if already created and awaiting payment, return existing Razorpay order id.
    if (order.status === 'PAYMENT_PENDING' && order.razorpayOrderId && order.paymentStatus !== 'SUCCESS') {
      return res.json(successResponse({
        orderId: order.razorpayOrderId,
        amount: Math.round((order.totalAmount || 0) * 100),
        currency: 'INR',
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        orderDetails: {
          id: order.id,
          orderNumber: order.orderNumber,
          eventName: order.event?.name,
          totalAmount: order.totalAmount,
          certificates: order.certificates,
          medals: order.medals,
          trophies: order.trophies
        }
      }, 'Payment order already created. Continue payment.'));
    }

    if (order.status !== 'CONFIRMED') {
      return res.status(400).json(errorResponse('Order must be confirmed/priced before payment.', 400));
    }
    if (!order.totalAmount || order.totalAmount <= 0) {
      return res.status(400).json(errorResponse('Order total amount is required.', 400));
    }
    if (order.paymentStatus === 'SUCCESS') {
      return res.status(400).json(errorResponse('Order payment already completed.', 400));
    }

    const options = {
      amount: Math.round(order.totalAmount * 100),
      currency: 'INR',
      receipt: `order_${orderId}_${Date.now()}`.slice(0, 40),
      payment_capture: 1,
      notes: {
        orderId,
        eventName: order.event?.name || '',
        payerUserId: req.user?.id || '',
        payerRole: req.user?.role || '',
        type: 'EVENT_ORDER'
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    await prisma.eventOrder.update({
      where: { id: orderId },
      data: {
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: 'PENDING',
        status: 'PAYMENT_PENDING'
      }
    });

    return res.json(successResponse({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      orderDetails: {
        id: order.id,
        orderNumber: order.orderNumber,
        eventName: order.event?.name,
        totalAmount: order.totalAmount,
        certificates: order.certificates,
        medals: order.medals,
        trophies: order.trophies
      }
    }, 'Payment order created successfully.'));
  } catch (error) {
    console.error('Create event order payment error:', error);
    return res.status(500).json(errorResponse('Failed to create payment order.', 500));
  }
});

// Verify order payment (works for coach/admin/assigned event staff with permission)
router.post('/orders/:orderId/verify-payment', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    const order = await prisma.eventOrder.findUnique({
      where: { id: orderId },
      include: { event: { select: { id: true, name: true } } }
    });
    if (!order) return res.status(404).json(errorResponse('Order not found.', 404));

    const { ok: has } = await canManageEventOrders(req.user, order.eventId);
    if (!has) return res.status(403).json(errorResponse('Access denied. Certificate management permission required.', 403));

    // Idempotency: already paid
    if (order.paymentStatus === 'SUCCESS') {
      return res.json(successResponse(order, 'Payment already verified.'));
    }

    if (order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json(errorResponse('Invalid order ID.', 400));
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json(errorResponse('Invalid payment signature.', 400));
    }

    const updatedOrder = await prisma.eventOrder.update({
      where: { id: orderId },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        paymentStatus: 'SUCCESS',
        status: 'PAID',
        paymentDate: new Date(),
        paymentMethod: 'razorpay'
      }
    });

    return res.json(successResponse(updatedOrder, 'Payment verified successfully.'));
  } catch (error) {
    console.error('Verify event order payment error:', error);
    return res.status(500).json(errorResponse('Payment verification failed.', 500));
  }
});

/**
 * Share event via email
 * POST /api/events/:eventId/share
 */
router.post('/:eventId/share', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { emails, message } = req.body || {};
    const { user } = req;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json(errorResponse('Email addresses are required', 400));
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return res.status(400).json(errorResponse(`Invalid email addresses: ${invalidEmails.join(', ')}`, 400));
    }

    // Get event details
    const EventService = require('../services/eventService');
    const eventService = new EventService();
    const event = await eventService.resolveEventId(eventId);

    if (!event.uniqueId) {
      return res.status(400).json(errorResponse('Event does not have a shareable link', 400));
    }

    // Generate shareable link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const eventLink = `${frontendUrl}/event/${event.uniqueId}`;

    // Get sender name
    let senderName = 'STAIRS Talent Hub';
    if (user.role === 'COACH' && req.coach) {
      senderName = req.coach.name || senderName;
    } else if (user.role === 'INSTITUTE' && req.institute) {
      senderName = req.institute.name || senderName;
    } else if (user.role === 'CLUB' && req.club) {
      senderName = req.club.name || senderName;
    } else if (user.name) {
      senderName = user.name;
    }

    // Prepare event details for email
    const eventDetails = {
      sport: event.sport,
      level: event.level,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      venue: event.venue,
      address: event.address,
      city: event.city,
      state: event.state,
      maxParticipants: event.maxParticipants,
      currentParticipants: event.currentParticipants || 0,
      studentFeeEnabled: event.studentFeeEnabled,
      studentFeeAmount: event.studentFeeAmount
    };

    // Send emails
    const { sendEventShareEmail } = require('../utils/emailService');
    const emailResults = await Promise.allSettled(
      emails.map(email => sendEventShareEmail({
        to: email,
        eventName: event.name,
        eventLink,
        senderName,
        eventDetails
      }))
    );

    const successful = emailResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = emailResults.length - successful;

    return res.json(successResponse({
      sent: successful,
      failed,
      eventLink
    }, `Event shared successfully. ${successful} email(s) sent.`));
  } catch (error) {
    console.error('Share event error:', error);
    return res.status(500).json(errorResponse('Failed to share event', 500));
  }
});

module.exports = router;