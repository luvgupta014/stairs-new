#!/bin/bash
# EMERGENCY: Backend Server Recovery - Production Server Down
# Run this on your production server (160.187.22.41)

echo "🚨 EMERGENCY BACKEND RECOVERY - Server appears to be DOWN"
echo "Connection refused means the backend process is not running"
echo ""

# Step 1: Check if backend is running
echo "🔍 Step 1: Checking backend process status..."
pm2 list

echo ""
echo "📋 If you see 'stairs-new' or 'backend' processes above:"
echo "   - Status 'online' = Good, but port issue"
echo "   - Status 'stopped/errored' = Need to restart"
echo "   - No processes = Need to start from scratch"
echo ""

# Step 2: Check what's using port 5000
echo "🔍 Step 2: Checking what's on port 5000..."
lsof -i :5000 || echo "Nothing running on port 5000"
netstat -tlnp | grep :5000 || echo "Port 5000 is free"

echo ""

# Step 3: Check PM2 logs for errors
echo "🔍 Step 3: Checking recent PM2 logs..."
pm2 logs --lines 20

echo ""
echo "🚨 RECOVERY OPTIONS:"
echo ""

echo "OPTION A: If PM2 shows stopped/errored processes:"
echo "pm2 restart all"
echo "pm2 logs"
echo ""

echo "OPTION B: If no PM2 processes exist:"
echo "cd ~/stairs-new/backend"
echo "pm2 start src/index.js --name 'stairs-backend'"
echo "pm2 logs"
echo ""

echo "OPTION C: If PM2 restart fails, manual start:"
echo "cd ~/stairs-new/backend"
echo "pm2 delete all"
echo "npm start &"
echo "# Or:"
echo "node src/index.js &"
echo ""

echo "OPTION D: Complete fresh start:"
echo "cd ~/stairs-new/backend"
echo "pm2 delete all"
echo "pm2 start npm --name 'stairs-backend' -- start"
echo "pm2 save"
echo "pm2 logs"
echo ""

echo "🧪 AFTER RESTART, TEST WITH:"
echo "curl http://localhost:5000/health"
echo "curl http://localhost:5000/"
echo ""

echo "📱 EXPECTED RESPONSE:"
echo '{"status":"healthy","timestamp":"...","database":"connected"}'
echo ""

echo "🔧 AFTER SERVER IS RUNNING, APPLY CORS FIXES:"
echo "sed -i 's/localhost:5173/localhost:5173,http:\/\/160.187.22.41:3008/g' src/index.js"
echo "pm2 restart all"
echo ""

echo "💡 COMMON CAUSES OF BACKEND CRASHES:"
echo "1. Database connection lost (Neon timeout)"
echo "2. Environment variables missing"
echo "3. Port already in use"
echo "4. Memory issues"
echo "5. Unhandled exceptions"
echo ""

echo "🎯 PRIORITY ORDER:"
echo "1. Get server running (any option above)"
echo "2. Check logs for crash cause"
echo "3. Apply CORS fixes"
echo "4. Test frontend login"