#!/bin/bash
# CLEANUP: Remove Duplicate Backend Processes
# You have 7 stairs-backend processes running - this causes port conflicts!

echo "🚨 CLEANING UP DUPLICATE BACKEND PROCESSES"
echo "Current issue: Multiple backends fighting for port 5000"
echo ""

# Step 1: Stop all stairs-backend processes
echo "🛑 Step 1: Stopping all stairs-backend processes..."
pm2 delete stairs-backend

# This will remove ALL processes named "stairs-backend" (IDs 14, 18, 19, 20, 21, 22, 23)

echo "✅ All duplicate stairs-backend processes removed"
echo ""

# Step 2: Clean up and start fresh
echo "🧹 Step 2: Starting ONE clean backend process..."
cd ~/stairs-new/backend

# Start a single, clean backend process
pm2 start src/index.js --name "stairs-backend-clean"

echo "✅ Clean backend process started"
echo ""

# Step 3: Verify it's working
echo "🧪 Step 3: Testing backend..."
sleep 3
curl http://localhost:5000/health

echo ""
echo "📋 Checking new PM2 status..."
pm2 list

echo ""
echo "🎯 EXPECTED RESULT:"
echo "- Only ONE stairs-backend-clean process"
echo "- Status should be 'online'"
echo "- Health check should return JSON"
echo ""

echo "🔧 NEXT STEPS AFTER CLEANUP:"
echo "1. Verify only one backend is running"
echo "2. Apply CORS fixes"
echo "3. Test frontend login"
echo ""

echo "💡 WHY THIS HAPPENED:"
echo "- Process ID 14 had 46 restarts (kept crashing)"
echo "- You kept starting new ones instead of fixing the original"
echo "- Multiple backends on same port = connection refused"