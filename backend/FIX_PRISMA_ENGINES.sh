#!/bin/bash
# Fix Missing @prisma/engines Module
# Run this on your production server

set -e

echo "=========================================="
echo "Fixing Prisma Engines Module"
echo "=========================================="
echo ""

cd /root/stairs-new/backend || exit 1

echo "Step 1: Stopping backend..."
pm2 stop backend 2>/dev/null || echo "Backend stopped"
sleep 2

echo ""
echo "Step 2: Removing Prisma packages..."
rm -rf node_modules/prisma
rm -rf node_modules/@prisma
rm -rf node_modules/.prisma

echo ""
echo "Step 3: Reinstalling Prisma packages..."
npm install prisma @prisma/client --save

echo ""
echo "Step 4: Verifying @prisma/engines exists..."
if [ -d "node_modules/@prisma/engines" ]; then
    echo "✅ @prisma/engines installed"
    ls -la node_modules/@prisma/engines | head -5
else
    echo "❌ @prisma/engines still missing!"
    echo "Trying full npm install..."
    npm install
fi

echo ""
echo "Step 5: Verifying Prisma CLI works..."
if npx prisma --version; then
    echo "✅ Prisma CLI working"
else
    echo "❌ Prisma CLI not working!"
    echo "Trying: npm install -g prisma"
    npm install -g prisma
fi

echo ""
echo "Step 6: Formatting schema..."
npx prisma format

echo ""
echo "Step 7: Generating Prisma client..."
npx prisma generate --force

echo ""
echo "Step 8: Verifying coordinatorFee in client..."
if grep -r "coordinatorFee" node_modules/@prisma/client/ 2>/dev/null | head -1 > /dev/null; then
    echo "✅ coordinatorFee found in Prisma client"
else
    echo "⚠️  coordinatorFee not found - but client generated"
fi

echo ""
echo "Step 9: Restarting backend..."
pm2 restart backend || pm2 start backend

echo ""
echo "=========================================="
echo "✅ Complete!"
echo "=========================================="

