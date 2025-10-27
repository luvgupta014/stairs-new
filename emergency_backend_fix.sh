#!/bin/bash
# EMERGENCY FIX for Backend CORS Issue - Run on Production Server (160.187.22.41)

echo "🚨 EMERGENCY BACKEND FIX - Starting..."

# Navigate to backend directory
cd ~/stairs-new/backend

# Create backup
cp src/index.js src/index.js.emergency-backup-$(date +%s)
echo "✅ Backup created"

# Fix 1: Update CORS to allow production frontend
echo "🔧 Fixing CORS configuration..."

# Use sed to find and replace the CORS origins array
sed -i '/origin: \[/,/\]/c\
  origin: [\
    '\''http://localhost:3000'\'',\
    '\''http://localhost:5173'\'', \
    '\''http://localhost:5174'\'',\
    '\''http://160.187.22.41:3008'\'',  // Production frontend\
    '\''http://160.187.22.41:5173'\'',  // Development on production server\
    process.env.FRONTEND_URL || '\''http://localhost:5173'\''\
  ],' src/index.js

echo "✅ CORS origins updated"

# Fix 2: Update rate limiting from 100 to 1000
echo "🔧 Fixing rate limiting..."
sed -i 's/max: 100,/max: 1000,/' src/index.js
echo "✅ Rate limiting updated"

# Fix 3: Fix email service method name
echo "📧 Fixing email service..."
sed -i 's/createTransporter/createTransport/g' src/utils/emailService.js
echo "✅ Email service fixed"

# Fix 4: Update environment variable
echo "🌐 Updating environment..."
# Remove old FRONTEND_URL if it exists and add new one
sed -i '/^FRONTEND_URL=/d' .env
echo "FRONTEND_URL=http://160.187.22.41:3008" >> .env
echo "✅ Environment updated"

# Restart PM2
echo "🔄 Restarting backend..."
pm2 restart all

# Wait a moment for restart
sleep 3

# Test the fix
echo "🧪 Testing backend health..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)

if [ "$response" = "200" ]; then
    echo "✅ Backend health check PASSED! (HTTP $response)"
    echo "🎉 CORS and rate limiting fixes applied successfully!"
    echo ""
    echo "Your login should now work on http://160.187.22.41:3008"
else
    echo "❌ Backend health check failed (HTTP $response)"
    echo "📋 Check PM2 logs:"
    pm2 logs --lines 10
fi

echo ""
echo "🔍 Quick verification:"
echo "1. CORS origins should include 160.187.22.41:3008"
echo "2. Rate limit should be 1000 (was 100)"
echo "3. Email service should use createTransport"
echo "4. FRONTEND_URL should be http://160.187.22.41:3008"
echo ""
echo "📱 Test your frontend now: http://160.187.22.41:3008"