#!/bin/bash
# Verify Database Column and Fix Prisma Client
# Run this on your production server

set -e

echo "=========================================="
echo "Verify Database Column and Fix Prisma"
echo "=========================================="
echo ""

cd /root/stairs-new/backend || exit 1

echo "Step 1: Verifying coordinatorFee column exists in database..."
echo "Run this SQL query on your database:"
echo ""
echo "SELECT column_name, data_type FROM information_schema.columns"
echo "WHERE table_name = 'events' AND column_name = 'coordinatorFee';"
echo ""
read -p "Does the column exist? (y/n): " col_exists

if [ "$col_exists" != "y" ]; then
    echo ""
    echo "❌ Column doesn't exist! Adding it now..."
    echo ""
    echo "Run this SQL on your database:"
    echo "ALTER TABLE events ADD COLUMN IF NOT EXISTS \"coordinatorFee\" DOUBLE PRECISION NOT NULL DEFAULT 0;"
    echo "ALTER TABLE events ADD COLUMN IF NOT EXISTS \"eventCategory\" TEXT;"
    echo "ALTER TABLE events ADD COLUMN IF NOT EXISTS \"feeMode\" TEXT NOT NULL DEFAULT 'GLOBAL';"
    echo "ALTER TABLE events ADD COLUMN IF NOT EXISTS \"level\" TEXT NOT NULL DEFAULT 'DISTRICT';"
    echo ""
    read -p "Press Enter after running the SQL..."
else
    echo "✅ Column exists in database"
fi

echo ""
echo "Step 2: Stopping backend..."
pm2 stop backend 2>/dev/null || pkill -f "node.*backend" || echo "Backend stopped"
sleep 3

echo ""
echo "Step 3: Verifying schema file..."
if grep -q "coordinatorFee" prisma/schema.prisma; then
    echo "✅ Schema file has coordinatorFee"
else
    echo "❌ Schema file missing coordinatorFee!"
    exit 1
fi

echo ""
echo "Step 4: Removing ALL Prisma cache..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma
rm -rf .prisma

echo ""
echo "Step 5: Reinstalling Prisma packages..."
npm install prisma @prisma/client --save --force

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
    grep -r "coordinatorFee" node_modules/@prisma/client/ | head -2
else
    echo "❌ coordinatorFee NOT in Prisma client!"
    exit 1
fi

echo ""
echo "Step 9: Restarting backend..."
pm2 restart backend

echo ""
echo "=========================================="
echo "✅ Complete! Check logs: pm2 logs backend"
echo "=========================================="

