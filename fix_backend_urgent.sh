#!/bin/bash

# URGENT: Fix Production Backend CORS and Rate Limiting Issues
# This script fixes the backend that stopped working due to CORS and rate limiting

echo "🚨 FIXING CRITICAL BACKEND ISSUES..."

# 1. Update CORS configuration in index.js
echo "📝 Updating CORS configuration..."
cat > src/index.js.cors_patch << 'EOF'
// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://160.187.22.41:3008',  // Production frontend
    'http://160.187.22.41:5173',  // Development on production server
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
EOF

# 2. Update rate limiting configuration
echo "⚡ Updating rate limiting configuration..."
cat > src/index.js.rate_patch << 'EOF'
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for production - 1000 requests per 15 minutes
  message: errorResponse('Too many requests from this IP, please try again later.', 429),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});
EOF

# 3. Update environment variables
echo "🌐 Updating environment variables..."
cat > .env.production_fix << 'EOF'
# CORS Configuration
FRONTEND_URL=http://160.187.22.41:3008

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
EOF

# 4. Fix the email service createTransporter issue
echo "📧 Fixing email service..."
sed -i 's/createTransporter/createTransport/g' src/utils/emailService.js

echo "✅ All fixes prepared. Now apply them:"
echo ""
echo "1. Backup current index.js:"
echo "   cp src/index.js src/index.js.backup"
echo ""
echo "2. Apply CORS fix (find and replace the CORS section):"
echo "   nano src/index.js"
echo "   # Replace the cors() configuration with the one from src/index.js.cors_patch"
echo ""
echo "3. Apply rate limiting fix (find and replace the rate limiting section):"
echo "   # Replace the rateLimit() configuration with the one from src/index.js.rate_patch"
echo ""
echo "4. Update environment:"
echo "   echo 'FRONTEND_URL=http://160.187.22.41:3008' >> .env"
echo ""
echo "5. Restart backend:"
echo "   pm2 restart all"
echo "   pm2 logs"
echo ""
echo "6. Test backend health:"
echo "   curl http://localhost:5000/health"
echo ""

echo "🎯 QUICK MANUAL STEPS:"
echo "1. SSH to server: ssh user@160.187.22.41"
echo "2. cd ~/stairs-new/backend"
echo "3. Run this script: bash fix_backend_urgent.sh"