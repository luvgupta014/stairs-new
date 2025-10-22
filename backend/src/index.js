const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const coachRoutes = require('./routes/coach');
const instituteRoutes = require('./routes/institute');
const clubRoutes = require('./routes/club');
const adminRoutes = require('./routes/admin');
const exampleRoutes = require('./routes/example');
const tournamentResultsRoutes = require('./routes/tournament-results');

// Import middleware
const { errorResponse } = require('./utils/helpers');

const app = express();
const prisma = new PrismaClient();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: errorResponse('Too many requests from this IP, please try again later.', 429),
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    'http://localhost:5174',
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Serve uploaded tournament result files publicly
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware
app.use((req, res, next) => {
  // console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  // console.log('Request body:', JSON.stringify(req.body, null, 2));
  // console.log('Request headers:', req.headers);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/institute', instituteRoutes);
app.use('/api/club', clubRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/example', exampleRoutes);
app.use('/api/tournament-results', tournamentResultsRoutes);

// Static file serving (for uploaded files)
app.use('/uploads', express.static('uploads'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'STAIRS Talent Hub API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api/docs',
    health: '/health'
  });
});

// 404 handler (must be after all other routes)
app.use((req, res) => {
  res.status(404).json(errorResponse(`Route ${req.originalUrl} not found.`, 404));
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Prisma errors
  if (error.code === 'P2002') {
    return res.status(409).json(errorResponse('A record with this data already exists.', 409));
  }
  
  if (error.code === 'P2025') {
    return res.status(404).json(errorResponse('Record not found.', 404));
  }

  // Multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json(errorResponse('File too large.', 400));
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json(errorResponse(error.message, 400));
  }

  // JSON parsing errors
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json(errorResponse('Invalid JSON in request body.', 400));
  }

  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json(errorResponse(
    process.env.NODE_ENV === 'production' ? 'Something went wrong!' : message,
    statusCode,
    process.env.NODE_ENV === 'development' ? error.stack : undefined
  ));
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Graceful shutdown...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Graceful shutdown...');
  await prisma.$disconnect();
  process.exit(0);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 STAIRS Talent Hub API Server running on port ${PORT}`);
  console.log(`� Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  }
});

module.exports = app;