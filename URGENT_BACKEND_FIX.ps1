# URGENT: Fix Production Backend CORS and Rate Limiting Issues
# Run this on your production server (160.187.22.41)

# SSH Command to run on your production server:
# ssh user@160.187.22.41

Write-Host "🚨 FIXING CRITICAL BACKEND ISSUES..." -ForegroundColor Red

# Step 1: Navigate to backend directory
Write-Host "📂 Navigating to backend directory..." -ForegroundColor Yellow
# cd ~/stairs-new/backend

# Step 2: Backup current files
Write-Host "💾 Creating backup..." -ForegroundColor Yellow
# cp src/index.js src/index.js.backup.$(date +%s)
# cp .env .env.backup.$(date +%s)

# Step 3: Fix CORS configuration
Write-Host "🌐 Fixing CORS configuration..." -ForegroundColor Yellow
$corsConfig = @"
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
"@

# Step 4: Fix rate limiting
Write-Host "⚡ Fixing rate limiting..." -ForegroundColor Yellow
$rateLimitConfig = @"
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
"@

# Step 5: Fix email service
Write-Host "📧 Fixing email service..." -ForegroundColor Yellow
# sed -i 's/createTransporter/createTransport/g' src/utils/emailService.js

# Step 6: Update environment
Write-Host "🔧 Updating environment..." -ForegroundColor Yellow
# echo "FRONTEND_URL=http://160.187.22.41:3008" >> .env

Write-Host ""
Write-Host "🎯 MANUAL STEPS FOR PRODUCTION SERVER:" -ForegroundColor Green
Write-Host "1. SSH to your server:" -ForegroundColor White
Write-Host "   ssh user@160.187.22.41" -ForegroundColor Cyan

Write-Host ""
Write-Host "2. Navigate to backend directory:" -ForegroundColor White
Write-Host "   cd ~/stairs-new/backend" -ForegroundColor Cyan

Write-Host ""
Write-Host "3. Backup current files:" -ForegroundColor White
Write-Host "   cp src/index.js src/index.js.backup" -ForegroundColor Cyan
Write-Host "   cp .env .env.backup" -ForegroundColor Cyan

Write-Host ""
Write-Host "4. Fix CORS in src/index.js (around line 44):" -ForegroundColor White
Write-Host "   nano src/index.js" -ForegroundColor Cyan
Write-Host "   # Find the cors() section and replace with:" -ForegroundColor Yellow
Write-Host $corsConfig -ForegroundColor Gray

Write-Host ""
Write-Host "5. Fix rate limiting in src/index.js (around line 33):" -ForegroundColor White
Write-Host "   # Find the rateLimit() section and replace with:" -ForegroundColor Yellow
Write-Host $rateLimitConfig -ForegroundColor Gray

Write-Host ""
Write-Host "6. Fix email service:" -ForegroundColor White
Write-Host "   nano src/utils/emailService.js" -ForegroundColor Cyan
Write-Host "   # Change 'createTransporter' to 'createTransport'" -ForegroundColor Yellow

Write-Host ""
Write-Host "7. Update environment:" -ForegroundColor White
Write-Host "   echo 'FRONTEND_URL=http://160.187.22.41:3008' >> .env" -ForegroundColor Cyan

Write-Host ""
Write-Host "8. Restart backend:" -ForegroundColor White
Write-Host "   pm2 restart all" -ForegroundColor Cyan
Write-Host "   pm2 logs" -ForegroundColor Cyan

Write-Host ""
Write-Host "9. Test backend:" -ForegroundColor White
Write-Host "   curl http://localhost:5000/health" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔴 CRITICAL: Your backend stopped working because:" -ForegroundColor Red
Write-Host "   • CORS didn't allow http://160.187.22.41:3008" -ForegroundColor White
Write-Host "   • Rate limiting was too strict (100 requests/15min)" -ForegroundColor White
Write-Host "   • Email service had wrong method name" -ForegroundColor White

Write-Host ""
Write-Host "✅ After applying fixes, your login should work again!" -ForegroundColor Green