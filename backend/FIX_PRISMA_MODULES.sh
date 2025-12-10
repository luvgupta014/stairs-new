#!/bin/bash
# Fix Missing Prisma Modules
# Run this on your production server

set -e

echo "=========================================="
echo "Fixing Prisma Module Dependencies"
echo "=========================================="
echo ""

cd /root/stairs-new/backend || exit 1

echo "Step 1: Stopping backend..."
pm2 stop backend 2>/dev/null || pkill -f "node.*backend" || echo "Backend stopped"
sleep 2

echo ""
echo "Step 2: Removing Prisma cache..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma
rm -rf .prisma

echo ""
echo "Step 3: Removing Prisma packages..."
rm -rf node_modules/prisma
rm -rf node_modules/@prisma/client
rm -rf node_modules/@prisma/engines

echo ""
echo "Step 4: Reinstalling Prisma packages..."
npm install prisma @prisma/client --save

echo ""
echo "Step 5: Verifying Prisma installation..."
if [ -d "node_modules/prisma" ] && [ -d "node_modules/@prisma/client" ]; then
    echo "✅ Prisma packages installed"
else
    echo "❌ Prisma packages missing!"
    echo "Trying npm install..."
    npm install
fi

echo ""
echo "Step 6: Formatting Prisma schema..."
if npx prisma format; then
    echo "✅ Schema formatted successfully"
else
    echo "❌ Schema formatting failed!"
    echo "Trying with npm install first..."
    npm install
    npx prisma format
fi

echo ""
echo "Step 7: Generating Prisma client..."
if npx prisma generate --force; then
    echo "✅ Prisma client generated"
else
    echo "❌ Prisma client generation failed!"
    exit 1
fi

echo ""
echo "Step 8: Verifying coordinatorFee in generated client..."
if grep -r "coordinatorFee" node_modules/@prisma/client/ 2>/dev/null | head -1 > /dev/null; then
    echo "✅ SUCCESS: coordinatorFee found in Prisma client!"
else
    echo "❌ ERROR: coordinatorFee NOT found in Prisma client!"
    exit 1
fi

echo ""
echo "Step 9: Restarting backend..."
pm2 restart backend || pm2 start backend || echo "Please start backend manually"

echo ""
echo "=========================================="
echo "✅ Fix Complete!"
echo "=========================================="
echo ""
echo "Check backend logs: pm2 logs backend --lines 50"

