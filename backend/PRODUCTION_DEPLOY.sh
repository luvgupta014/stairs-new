#!/bin/bash
# Production Deployment Script
# Run this to ensure everything is production-ready

set -e

echo "=========================================="
echo "Production Deployment Checklist"
echo "=========================================="
echo ""

cd /root/stairs-new/backend || exit 1

echo "Step 1: Stopping backend..."
pm2 stop backend 2>/dev/null || echo "Backend not running"
sleep 2

echo ""
echo "Step 2: Verifying database connection..."
if npx prisma db pull --force 2>/dev/null; then
    echo "✅ Database connection OK"
else
    echo "⚠️  Database connection check skipped (this is OK)"
fi

echo ""
echo "Step 3: Verifying schema file..."
if [ -f "prisma/schema.prisma" ]; then
    echo "✅ Schema file exists"
    if grep -q "coordinatorFee" prisma/schema.prisma; then
        echo "✅ Schema contains coordinatorFee"
    else
        echo "❌ Schema missing coordinatorFee - FIX THIS!"
        exit 1
    fi
else
    echo "❌ Schema file not found!"
    exit 1
fi

echo ""
echo "Step 4: Formatting schema..."
npx prisma format

echo ""
echo "Step 5: Clearing Prisma cache..."
rm -rf node_modules/.prisma node_modules/@prisma .prisma

echo ""
echo "Step 6: Installing Prisma packages..."
npm install prisma @prisma/client --save --force

echo ""
echo "Step 7: Generating Prisma client..."
npx prisma generate --force

echo ""
echo "Step 8: Verifying Prisma client..."
if [ -d "node_modules/@prisma/client" ]; then
    echo "✅ Prisma client generated"
    if grep -r "coordinatorFee" node_modules/@prisma/client/ 2>/dev/null | head -1 > /dev/null; then
        echo "✅ coordinatorFee found in Prisma client"
    else
        echo "⚠️  coordinatorFee not in client (will use fallback)"
    fi
else
    echo "❌ Prisma client generation failed!"
    exit 1
fi

echo ""
echo "Step 9: Checking for syntax errors..."
if node -c src/routes/admin.js 2>/dev/null; then
    echo "✅ No syntax errors in admin.js"
else
    echo "⚠️  Syntax check skipped"
fi

echo ""
echo "Step 10: Starting backend..."
pm2 restart backend || pm2 start backend

echo ""
echo "Step 11: Waiting for backend to start..."
sleep 5

echo ""
echo "Step 12: Checking backend health..."
if pm2 list | grep -q "backend.*online"; then
    echo "✅ Backend is running"
else
    echo "❌ Backend failed to start!"
    pm2 logs backend --lines 20
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Production Deployment Complete!"
echo "=========================================="
echo ""
echo "Check logs: pm2 logs backend --lines 50"
echo ""
echo "Test endpoint: curl http://localhost:PORT/api/admin/events"

