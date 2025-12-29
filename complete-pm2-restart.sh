#!/bin/bash
# Complete PM2 restart to ensure env vars are loaded
echo "🔄 Complete PM2 Restart (Force Reload Environment)"
echo "=================================================="
echo ""

# Backup PM2 config
echo "📋 Current PM2 Status:"
pm2 list | grep stairs-backend
echo ""

# Get backend directory
BACKEND_DIR="/root/stairs-new/backend"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found"
    exit 1
fi

# Get package.json start script
cd "$BACKEND_DIR"

if [ -f "package.json" ]; then
    START_CMD=$(grep -A 5 '"scripts"' package.json | grep '"start"' | cut -d'"' -f4)
    echo "📋 Start command from package.json: $START_CMD"
else
    START_CMD="node src/index.js"
    echo "📋 Using default start command: $START_CMD"
fi

echo ""
read -p "This will delete and recreate the PM2 process. Continue? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Cancelled."
    exit 0
fi

# Stop and delete
echo ""
echo "🛑 Stopping and deleting stairs-backend..."
pm2 delete stairs-backend 2>/dev/null || true

# Wait a moment
sleep 2

# Start fresh
echo "🚀 Starting stairs-backend fresh..."
if [[ "$START_CMD" == *"npm"* ]]; then
    # Extract npm script
    NPM_SCRIPT=$(echo "$START_CMD" | sed 's/npm //' | sed 's/--.*//')
    pm2 start npm --name stairs-backend -- run "$NPM_SCRIPT"
else
    pm2 start "$START_CMD" --name stairs-backend
fi

# Wait for startup
echo ""
echo "⏳ Waiting 5 seconds for backend to start..."
sleep 5

# Verify
echo ""
echo "📋 New PM2 Status:"
pm2 list | grep stairs-backend

# Test
echo ""
echo "🧪 Testing endpoint..."
TEST_RESPONSE=$(curl -s "http://localhost:5000/api/maps/places/autocomplete?input=test" 2>&1)

if echo "$TEST_RESPONSE" | grep -q '"status":"OK"'; then
    echo "   ✅ Endpoint working! Key is valid."
elif echo "$TEST_RESPONSE" | grep -q "expired"; then
    echo "   ❌ Still expired - the key itself is expired in Google Cloud Console"
    echo "   → Create a new key in Google Cloud Console"
else
    ERROR=$(echo "$TEST_RESPONSE" | grep -o '"error_message":"[^"]*"' | cut -d'"' -f4 || echo "Unknown")
    echo "   ❌ Error: $ERROR"
fi

echo ""
echo "📋 Recent logs:"
pm2 logs stairs-backend --lines 10 --nostream 2>/dev/null | tail -5

echo ""
echo "=================================================="
echo "✅ Done!"
echo ""

