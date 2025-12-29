#!/bin/bash
# Diagnostic script to check backend status
# Run this on your backend server

echo "🔍 Backend Diagnostic Script"
echo "================================"
echo ""

# Check if backend directory exists
BACKEND_DIR="/root/stairs-new/backend"
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found at $BACKEND_DIR"
    echo "   Trying alternative location..."
    BACKEND_DIR="/home/astroraag/public_html/stairs-api.astroraag"
fi

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found. Please update BACKEND_DIR in script."
    exit 1
fi

echo "✅ Backend directory: $BACKEND_DIR"
echo ""

# Check PM2 processes
echo "📋 PM2 Processes:"
if command -v pm2 &> /dev/null; then
    pm2 list
else
    echo "   PM2 not installed or not in PATH"
fi
echo ""

# Check Node.js processes
echo "📋 Node.js Processes:"
ps aux | grep -E "node|npm" | grep -v grep || echo "   No Node.js processes found"
echo ""

# Check port 5000
echo "🔌 Port 5000 Status:"
if command -v lsof &> /dev/null; then
    PORT_CHECK=$(lsof -i :5000 2>/dev/null)
    if [ -z "$PORT_CHECK" ]; then
        echo "   ❌ Port 5000 is NOT in use (backend not running)"
    else
        echo "   ✅ Port 5000 is in use:"
        echo "$PORT_CHECK"
    fi
else
    netstat -tulpn | grep :5000 || echo "   Port 5000 not in use"
fi
echo ""

# Check backend health (local)
echo "🏥 Backend Health Check (Local):"
HEALTH_CHECK=$(curl -s http://localhost:5000/health 2>/dev/null)
if [ -z "$HEALTH_CHECK" ]; then
    echo "   ❌ Backend not responding on localhost:5000"
else
    echo "   ✅ Backend is responding:"
    echo "$HEALTH_CHECK" | head -5
fi
echo ""

# Check .env file
echo "📄 Environment File:"
ENV_FILE="$BACKEND_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    echo "   ✅ .env file exists"
    echo "   📋 Checking critical variables:"
    grep -E "^PORT=|^DATABASE_URL=|^JWT_SECRET=|^CORS_ORIGINS=" "$ENV_FILE" | sed 's/=.*/=***/' || echo "   ⚠️  Some variables missing"
else
    echo "   ❌ .env file not found at $ENV_FILE"
fi
echo ""

# Check database connection (if DATABASE_URL exists)
if [ -f "$ENV_FILE" ]; then
    DB_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    if [ ! -z "$DB_URL" ]; then
        echo "🗄️  Database Connection:"
        if command -v psql &> /dev/null; then
            if psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
                echo "   ✅ Database is accessible"
            else
                echo "   ❌ Cannot connect to database"
            fi
        else
            echo "   ⚠️  psql not available to test database"
        fi
    fi
    echo ""
fi

# Check recent logs
echo "📝 Recent PM2 Logs (last 10 lines):"
if command -v pm2 &> /dev/null; then
    pm2 logs backend --lines 10 --nostream 2>/dev/null || echo "   No PM2 logs available"
else
    echo "   PM2 not available"
fi
echo ""

# Check Cloudflare status
echo "☁️  Cloudflare Status:"
EXTERNAL_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://stairs-api.astroraag.com/health 2>/dev/null)
if [ "$EXTERNAL_CHECK" == "200" ]; then
    echo "   ✅ Backend is accessible via Cloudflare"
elif [ "$EXTERNAL_CHECK" == "502" ]; then
    echo "   ❌ Cloudflare returning 502 (Bad Gateway)"
    echo "   → Backend is not responding or Cloudflare can't reach it"
elif [ "$EXTERNAL_CHECK" == "000" ]; then
    echo "   ❌ Cannot reach backend via Cloudflare"
else
    echo "   ⚠️  Unexpected status code: $EXTERNAL_CHECK"
fi
echo ""

echo "================================"
echo "✅ Diagnostic complete!"
echo ""
echo "📋 Next Steps:"
echo "1. If backend not running, start it: pm2 start backend"
echo "2. If port in use, check what's using it: lsof -i :5000"
echo "3. Check logs for errors: pm2 logs backend"
echo "4. If database error, check PostgreSQL is running"
echo ""

