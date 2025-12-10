#!/bin/bash
# Fix Prisma Client Cache Issue
# Run this script on your production server

echo "🔧 Fixing Prisma Client Cache Issue..."
echo ""

cd /root/stairs-new/backend || exit 1

echo "Step 1: Stopping backend server..."
pm2 stop backend 2>/dev/null || pkill -f "node.*backend" || echo "Backend not running or already stopped"

echo "Step 2: Removing old Prisma client cache..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

echo "Step 3: Regenerating Prisma client..."
npx prisma generate

echo "Step 4: Verifying Prisma client..."
if [ -d "node_modules/@prisma/client" ]; then
    echo "✅ Prisma client generated successfully"
else
    echo "❌ Prisma client generation failed"
    exit 1
fi

echo "Step 5: Restarting backend server..."
pm2 restart backend || pm2 start backend || echo "Please start backend manually"

echo ""
echo "✅ Done! Check your backend logs to verify it's working."
echo "Run: pm2 logs backend"

