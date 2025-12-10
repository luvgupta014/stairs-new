#!/bin/bash
# Force Complete Prisma Regeneration
# Run this on your production server

set -e

echo "🔧 Force Regenerating Prisma Client..."
echo ""

cd /root/stairs-new/backend || exit 1

echo "Step 1: Stopping backend..."
pm2 stop backend 2>/dev/null || pkill -f "node.*backend" || echo "Backend stopped or not running"
sleep 2

echo "Step 2: Removing ALL Prisma cache and client..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma
rm -rf .prisma

echo "Step 3: Verifying schema file has coordinatorFee..."
if grep -q "coordinatorFee" prisma/schema.prisma; then
    echo "✅ Schema file contains coordinatorFee"
else
    echo "❌ ERROR: Schema file does NOT contain coordinatorFee!"
    echo "Please check your schema.prisma file"
    exit 1
fi

echo "Step 4: Formatting Prisma schema..."
npx prisma format

echo "Step 5: Generating Prisma client (this may take a minute)..."
npx prisma generate --force

echo "Step 6: Verifying coordinatorFee in generated client..."
if grep -r "coordinatorFee" node_modules/@prisma/client/ 2>/dev/null | head -1 > /dev/null; then
    echo "✅ SUCCESS: coordinatorFee found in Prisma client!"
else
    echo "❌ ERROR: coordinatorFee NOT found in Prisma client!"
    echo "Checking schema again..."
    cat prisma/schema.prisma | grep -A 5 -B 5 "coordinatorFee" || echo "coordinatorFee not in schema!"
    exit 1
fi

echo ""
echo "Step 7: Restarting backend..."
pm2 restart backend || pm2 start backend || echo "Please start backend manually"

echo ""
echo "✅ Done! Check logs: pm2 logs backend"

