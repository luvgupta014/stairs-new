const express = require('express');
const EventController = require('../controllers/eventController');
const { authenticate, requireRole, requireStudent, requireCoach } = require('../utils/authMiddleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const eventController = new EventController();

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
 * All routes require authentication
 */

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

// Get event participants (event creators and admin only)
router.get('/:eventId/participants', 
  authenticate, 
  requireRole(['COACH', 'INSTITUTE', 'CLUB', 'ADMIN']), 
  eventController.getEventParticipants.bind(eventController)
);

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

// Upload event results (coaches only for now due to schema limitations)
router.post('/:eventId/results', 
  authenticate, 
  requireCoach, // Use requireCoach middleware to ensure req.coach is set
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

// GET /api/events/:eventId/results/sample-sheet - Download sample result sheet template (for coaches)
router.get('/:eventId/results/sample-sheet', authenticate, requireCoach, async (req, res) => {
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

    // Verify event belongs to coach
    if (event.coachId !== req.coach.id) {
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
            uniqueId: true
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
  eventController.getResults.bind(eventController)
);

// Get student results with scores and placements (only after validation)
router.get('/:eventId/student-results', 
  authenticate,
  eventController.getStudentResults.bind(eventController)
);

// Download event results (coaches only for now due to schema limitations)
router.get('/:eventId/results/download', 
  authenticate,
  requireCoach, // Add requireCoach for consistency
  eventController.downloadResults.bind(eventController)
);

// Download individual result file (coaches only)
router.get('/:eventId/results/:fileId/download', 
  authenticate,
  requireCoach,
  eventController.downloadResultFile.bind(eventController)
);

// Delete event results (coaches only for now due to schema limitations)
router.delete('/:eventId/results', 
  authenticate, 
  requireCoach, // Use requireCoach middleware to ensure req.coach is set
  eventController.deleteResults.bind(eventController)
);

// Delete individual result file (coaches only)
router.delete('/:eventId/results/:fileId', 
  authenticate, 
  requireCoach,
  eventController.deleteResultFile.bind(eventController)
);

module.exports = router;