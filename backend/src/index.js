const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const coachRoutes = require('./routes/coach');
const instituteRoutes = require('./routes/institute');
const clubRoutes = require('./routes/club');
const adminRoutes = require('./routes/admin');
const eventRoutes = require('./routes/event');
const adminPaymentsRouter = require('./routes/admin/events-payments');
const paymentRoutes = require('./routes/payment');
const certificateRoutes = require('./routes/certificates');
const eventInchargeRoutes = require('./routes/eventIncharge');
const mapsRoutes = require('./routes/maps');

// Import middleware
const { errorResponse } = require('./utils/helpers');

// Import Prisma client (optimized for Vercel)
const prisma = require('./utils/prismaClient');

const app = express();

// Trust proxy - important for production behind load balancer/nginx
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased from 100 to 200 requests per windowMs to handle normal usage better
  message: errorResponse('Too many requests from this IP, please try again later.', 429),
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain endpoints
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

app.use(limiter);

// CORS configuration - Allow specific origins
// IMPORTANT: In production, prefer controlling this via `CORS_ORIGINS` env (comma-separated)
// so deployments don't accidentally drift from hardcoded lists.
const defaultAllowedOrigins = [
  'http://localhost:5173',      // Local dev
  'http://localhost:5174',      // Local dev (vite alt port)
  'http://localhost:3000',      // Local dev (alternative)
  'http://160.187.22.41:3008',  // Local server
  'http://160.187.22.41:5173',
  'https://stairs.astroraag.com',      // Production frontend
  'https://www.stairs.astroraag.com',
  'http://stairs.astroraag.com',
  'https://portal.stairs.org.in',
  'https://www.portal.stairs.org.in'
];

const envAllowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envAllowedOrigins]));

// Helper function to check if origin matches allowed patterns
const isOriginAllowed = (origin) => {
  if (!origin) return false;
  
  // Exact match
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Check for subdomain matches (e.g., www.portal.stairs.org.in matches portal.stairs.org.in)
  const originUrl = new URL(origin);
  const originHostname = originUrl.hostname;
  
  for (const allowed of allowedOrigins) {
    try {
      const allowedUrl = new URL(allowed);
      const allowedHostname = allowedUrl.hostname;
      
      // Check if hostname matches or is a subdomain
      if (originHostname === allowedHostname || 
          originHostname.endsWith('.' + allowedHostname)) {
        return true;
      }
    } catch (e) {
      // If allowed origin is not a valid URL, skip
      continue;
    }
  }
  
  return false;
};

// CORS middleware (handles preflight + correct headers)
// NOTE: withCredentials=true on frontend requires a specific origin (not '*') + credentials=true.
const corsOptionsDelegate = (req, callback) => {
  const origin = req.header('Origin');

  // Non-browser / same-origin requests often have no Origin header; CORS is irrelevant there.
  if (!origin) {
    return callback(null, { origin: false });
  }

  const isProd = process.env.NODE_ENV === 'production';
  const allowed = isOriginAllowed(origin) || !isProd;

  if (!allowed && isProd) {
    console.warn(`⚠️ CORS blocked origin: ${origin}. Allowed origins:`, allowedOrigins);
  }

  const corsOptions = {
    origin: allowed ? origin : false,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
  };

  return callback(null, corsOptions);
};

app.use(cors(corsOptionsDelegate));
// Express v5 / path-to-regexp no longer supports bare "*" for routes.
// Use a regex to match all paths for CORS preflight.
app.options(/.*/, cors(corsOptionsDelegate));

// Body parsing middleware - Increased limits for bulk uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload middleware for bulk uploads
// Applied to /api/coach routes to support bulk student uploads
// NOT applied globally to avoid conflicts with multer on other routes
const fileUploadMiddleware = fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max (increased for bulk uploads)
  useTempFiles: true,
  tempFileDir: path.join(__dirname, '../temp/'),
  createParentPath: true, // Automatically create temp directory
  debug: false, // Disable debug logging for production
  abortOnLimit: false, // Don't abort on file size limit, return error instead
  responseOnLimit: 'File size limit exceeded (50MB max)',
  uploadTimeout: 120000 // 2 minutes timeout for uploads
});

// Apply fileUpload only to coach routes (for bulk student uploads)
// Do this after routes are defined using app.use middleware wrapper

// Ensure temp and uploads directories exist
const fs = require('fs');
const tempDir = path.join(__dirname, '../temp');
const uploadsDir = path.join(__dirname, '../uploads');
[tempDir, uploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Serve uploaded tournament result files publicly with proper MIME types
app.use('/uploads', (req, res, next) => {
  // Set proper MIME types for Excel files
  if (req.path.endsWith('.xlsx')) {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  } else if (req.path.endsWith('.xls')) {
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
  } else if (req.path.endsWith('.csv')) {
    res.setHeader('Content-Type', 'text/csv');
  } else if (req.path.endsWith('.pdf')) {
    res.setHeader('Content-Type', 'application/pdf');
  }

  next();
}, express.static(path.join(__dirname, '../uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.path.includes('/login')) {
    console.log('Login request body:', JSON.stringify(req.body, null, 2));
  }
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
// Apply express-fileupload ONLY to coach routes for bulk uploads
app.use('/api/coach', fileUploadMiddleware, coachRoutes);
app.use('/api/institute', instituteRoutes);
app.use('/api/club', clubRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', adminPaymentsRouter);
app.use('/api/events', eventRoutes);
app.use('/api/payment', paymentRoutes);
// Backwards/forwards compatibility: some frontends call /api/payments/*
app.use('/api/payments', paymentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/event-incharge', eventInchargeRoutes);
app.use('/api/maps', mapsRoutes);
// Notification routes are included in admin routes for now

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

  // Prisma schema/db mismatch (migration missing)
  if (error.code === 'P2022') {
    const col = error?.meta?.column || 'unknown column';
    return res.status(500).json(errorResponse(
      `Database migration pending: missing column (${col}). Please apply the latest Prisma migrations to this database.`,
      500
    ));
  }

  // Prisma missing table
  if (error.code === 'P2021') {
    const tbl = error?.meta?.table || 'unknown table';
    return res.status(500).json(errorResponse(
      `Database migration pending: missing table (${tbl}). Please apply the latest Prisma migrations to this database.`,
      500
    ));
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

const server = app.listen(PORT, () => {
  console.log(`🚀 STAIRS Talent Hub API Server running on port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);

  if (process.env.NODE_ENV !== 'production') {
    'http://160.187.22.41:3008',
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  }
});

// Set server timeout to 5 minutes for bulk uploads
server.timeout = 300000;
server.keepAliveTimeout = 300000;
server.headersTimeout = 310000;

module.exports = app;
