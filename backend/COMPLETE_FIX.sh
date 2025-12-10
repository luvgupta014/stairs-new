#!/bin/bash
# Complete Fix Script for Prisma coordinatorFee Issue
# Run this on your production server

set -e

echo "=========================================="
echo "Complete Prisma Fix Script"
echo "=========================================="
echo ""

cd /root/stairs-new/backend || exit 1

echo "Step 1: Stopping backend..."
pm2 stop backend 2>/dev/null || pkill -f "node.*backend" || echo "Backend stopped"
sleep 3

echo ""
echo "Step 2: Verifying schema file has coordinatorFee..."
if grep -q "coordinatorFee" prisma/schema.prisma; then
    echo "✅ Schema file contains coordinatorFee"
    grep -A 2 "eventFee" prisma/schema.prisma | grep -A 2 "coordinatorFee"
else
    echo "❌ ERROR: coordinatorFee NOT found in schema.prisma!"
    echo "Please add it to the Event model after eventFee line"
    exit 1
fi

echo ""
echo "Step 3: Checking for duplicate fields in Event model..."
duplicate_count=$(grep -c "coordinatorFee" prisma/schema.prisma || echo "0")
if [ "$duplicate_count" -gt 1 ]; then
    echo "⚠️  WARNING: coordinatorFee appears $duplicate_count times in schema!"
    echo "Please remove duplicates from Event model"
fi

echo ""
echo "Step 4: Removing ALL Prisma cache..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma
rm -rf .prisma
echo "✅ Cache cleared"

echo ""
echo "Step 5: Formatting Prisma schema..."
if npx prisma format; then
    echo "✅ Schema formatted successfully"
else
    echo "❌ Schema formatting failed! Fix errors above"
    exit 1
fi

echo ""
echo "Step 6: Generating Prisma client (this may take a minute)..."
if npx prisma generate --force; then
    echo "✅ Prisma client generated"
else
    echo "❌ Prisma client generation failed!"
    exit 1
fi

echo ""
echo "Step 7: Verifying coordinatorFee in generated client..."
if grep -r "coordinatorFee" node_modules/@prisma/client/ 2>/dev/null | head -1 > /dev/null; then
    echo "✅ SUCCESS: coordinatorFee found in Prisma client!"
    echo ""
    echo "Sample output:"
    grep -r "coordinatorFee" node_modules/@prisma/client/ | head -2
else
    echo "❌ ERROR: coordinatorFee NOT found in Prisma client!"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check schema.prisma has coordinatorFee in Event model"
    echo "2. Check there are no duplicate fields"
    echo "3. Run: npx prisma format"
    echo "4. Run: npx prisma generate --force"
    exit 1
fi

echo ""
echo "Step 8: Restarting backend..."
pm2 restart backend || pm2 start backend || echo "Please start backend manually"

echo ""
echo "=========================================="
echo "✅ Fix Complete!"
echo "=========================================="
echo ""
echo "Check backend logs:"
echo "  pm2 logs backend --lines 50"
echo ""
echo "If you still see coordinatorFee errors, check:"
echo "  1. Backend actually restarted"
echo "  2. No old Prisma client cached in memory"
echo "  3. Schema file is correct"

