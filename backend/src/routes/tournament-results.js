const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireCoach, requireApproved } = require('../utils/authMiddleware');
const {
  successResponse,
  errorResponse,
  getPaginationParams,
  getPaginationMeta
} = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadDir = path.join(__dirname, '../../uploads/tournament-results');
      // Ensure directory exists
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and coach ID
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const coachId = req.coach?.id || 'unknown';
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    
    // Clean filename to remove special characters
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9\-_]/g, '_');
    const filename = `${coachId}_${timestamp}_${cleanBaseName}${extension}`;
    
    cb(null, filename);
  }
});

// File filter to accept only Excel files
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/excel',
    'application/x-excel',
    'application/x-msexcel'
  ];
  
  const allowedExtensions = ['.xlsx', '.xls'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
  }
};

// Configure multer with limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10 // Maximum 10 files per upload
  }
});

/**
 * @route POST /api/tournament-results/upload
 * @desc Upload multiple tournament result Excel files
 * @access Private (Coach only)
 */
router.post('/upload', authenticate, requireCoach, requireApproved, upload.array('tournamentFiles', 10), async (req, res) => {
  try {
    const { description, tournament_name, tournament_date } = req.body;
    const coachId = req.coach.id;
    
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json(errorResponse('No files uploaded. Please select Excel files to upload.', 400));
    }

    console.log(`Processing ${req.files.length} tournament result files for coach ${coachId}`);

    const uploadedFiles = [];
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/tournament-results`;

    // Process each uploaded file
    for (const file of req.files) {
      try {
        // Create file record in database
        const fileRecord = await prisma.tournamentResultFile.create({
          data: {
            coachId: coachId,
            originalName: file.originalname,
            filename: file.filename,
            filepath: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
            description: description || null,
            tournamentName: tournament_name || null,
            tournamentDate: tournament_date ? new Date(tournament_date) : null,
            uploadDate: new Date(),
            isPublic: true // Make files publicly accessible
          }
        });

        uploadedFiles.push({
          id: fileRecord.id,
          originalName: file.originalname,
          filename: file.filename,
          fileSize: file.size,
          downloadUrl: `${baseUrl}/${file.filename}`,
          uploadDate: fileRecord.uploadDate,
          description: description,
          tournamentName: tournament_name,
          tournamentDate: tournament_date
        });

        console.log(`Successfully processed file: ${file.originalname}`);
      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        // Continue processing other files even if one fails
      }
    }

    if (uploadedFiles.length === 0) {
      return res.status(500).json(errorResponse('Failed to process any files. Please try again.', 500));
    }

    // Log the upload activity
    console.log(`Coach ${coachId} uploaded ${uploadedFiles.length} tournament result files`);

    res.status(201).json(successResponse({
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      files: uploadedFiles,
      totalFiles: uploadedFiles.length
    }, 'Tournament result files uploaded successfully.', 201));

  } catch (error) {
    console.error('Tournament results upload error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error(`Failed to delete file ${file.path}:`, unlinkError);
        }
      }
    }

    // Handle specific multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json(errorResponse('File too large. Maximum file size is 10MB.', 400));
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json(errorResponse('Too many files. Maximum 10 files per upload.', 400));
    }
    
    if (error.message.includes('Only Excel files')) {
      return res.status(400).json(errorResponse(error.message, 400));
    }

    res.status(500).json(errorResponse('Failed to upload tournament result files.', 500));
  }
});

/**
 * @route GET /api/tournament-results
 * @desc Get tournament result files for a coach
 * @access Private (Coach only)
 */
router.get('/', authenticate, requireCoach, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, tournament_name, date_from, date_to } = req.query;
    const { skip, take } = getPaginationParams(page, limit);
    const coachId = req.coach.id;

    // Build where clause
    const where = {
      coachId: coachId,
      ...(search && {
        OR: [
          { originalName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tournamentName: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(tournament_name && {
        tournamentName: { contains: tournament_name, mode: 'insensitive' }
      }),
      ...(date_from && date_to && {
        tournamentDate: {
          gte: new Date(date_from),
          lte: new Date(date_to)
        }
      })
    };

    const [files, total] = await Promise.all([
      prisma.tournamentResultFile.findMany({
        where,
        skip,
        take,
        orderBy: {
          uploadDate: 'desc'
        }
      }),
      prisma.tournamentResultFile.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/tournament-results`;

    // Add download URLs to files
    const filesWithUrls = files.map(file => ({
      ...file,
      downloadUrl: `${baseUrl}/${file.filename}`
    }));

    res.json(successResponse({
      files: filesWithUrls,
      pagination
    }, 'Tournament result files retrieved successfully.'));

  } catch (error) {
    console.error('Get tournament results error:', error);
    res.status(500).json(errorResponse('Failed to retrieve tournament result files.', 500));
  }
});

/**
 * @route DELETE /api/tournament-results/:fileId
 * @desc Delete a tournament result file
 * @access Private (Coach only)
 */
router.delete('/:fileId', authenticate, requireCoach, async (req, res) => {
  try {
    const { fileId } = req.params;
    const coachId = req.coach.id;

    // Find the file
    const file = await prisma.tournamentResultFile.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json(errorResponse('File not found.', 404));
    }

    // Check if file belongs to coach
    if (file.coachId !== coachId) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    // Delete file from filesystem
    try {
      await fs.unlink(file.filepath);
    } catch (fsError) {
      console.warn(`Failed to delete file from filesystem: ${file.filepath}`, fsError);
      // Continue with database deletion even if file doesn't exist on filesystem
    }

    // Delete file record from database
    await prisma.tournamentResultFile.delete({
      where: { id: fileId }
    });

    res.json(successResponse(null, 'Tournament result file deleted successfully.'));

  } catch (error) {
    console.error('Delete tournament result file error:', error);
    res.status(500).json(errorResponse('Failed to delete tournament result file.', 500));
  }
});

/**
 * @route GET /api/tournament-results/admin/all
 * @desc Get all tournament result files for admin
 * @access Private (Admin only)
 */
router.get('/admin/all', authenticate, async (req, res) => {
  try {
    // Check if user is admin (you may need to adjust this based on your auth system)
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json(errorResponse('Access denied. Admin access required.', 403));
    }

    const { page = 1, limit = 20, coach_name, tournament_name, date_from, date_to } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    // Build where clause
    const where = {
      ...(coach_name && {
        coach: {
          name: { contains: coach_name, mode: 'insensitive' }
        }
      }),
      ...(tournament_name && {
        tournamentName: { contains: tournament_name, mode: 'insensitive' }
      }),
      ...(date_from && date_to && {
        tournamentDate: {
          gte: new Date(date_from),
          lte: new Date(date_to)
        }
      })
    };

    const [files, total] = await Promise.all([
      prisma.tournamentResultFile.findMany({
        where,
        include: {
          coach: {
            select: {
              id: true,
              name: true,
              specialization: true
            }
          }
        },
        skip,
        take,
        orderBy: {
          uploadDate: 'desc'
        }
      }),
      prisma.tournamentResultFile.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/tournament-results`;

    // Add download URLs to files
    const filesWithUrls = files.map(file => ({
      ...file,
      downloadUrl: `${baseUrl}/${file.filename}`
    }));

    res.json(successResponse({
      files: filesWithUrls,
      pagination
    }, 'All tournament result files retrieved successfully.'));

  } catch (error) {
    console.error('Get all tournament results error:', error);
    res.status(500).json(errorResponse('Failed to retrieve tournament result files.', 500));
  }
});

module.exports = router;