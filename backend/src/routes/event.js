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

// Get event results
router.get('/:eventId/results', 
  authenticate,
  eventController.getResults.bind(eventController)
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