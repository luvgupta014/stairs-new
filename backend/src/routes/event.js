const express = require('express');
const EventController = require('../controllers/eventController');
const { authenticate, requireRole } = require('../utils/authMiddleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const eventController = new EventController();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/results/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `event-${req.params.eventId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
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
  requireRole(['STUDENT']), 
  eventController.registerForEvent.bind(eventController)
);

// Unregister from event (students only)
router.delete('/:eventId/register', 
  authenticate, 
  requireRole(['STUDENT']), 
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

// Upload event results (creators and admin only)
router.post('/:eventId/results', 
  authenticate, 
  requireRole(['COACH', 'INSTITUTE', 'CLUB', 'ADMIN']),
  upload.single('resultsFile'),
  eventController.uploadResults.bind(eventController)
);

// Get event results
router.get('/:eventId/results', 
  authenticate,
  eventController.getResults.bind(eventController)
);

// Download event results
router.get('/:eventId/results/download', 
  authenticate,
  eventController.downloadResults.bind(eventController)
);

// Delete event results (creators and admin only)
router.delete('/:eventId/results', 
  authenticate, 
  requireRole(['COACH', 'INSTITUTE', 'CLUB', 'ADMIN']),
  eventController.deleteResults.bind(eventController)
);

module.exports = router;