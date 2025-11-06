#!/bin/bash
# Simple fix for Payment status enum issue
# Run this on your server: bash fix_payment.sh

cd ~/stairs-new/backend

# Extract DATABASE_URL from .env
DB_URL=$(grep "^DATABASE_URL" .env | cut -d'=' -f2- | tr -d ' ')

echo "🔧 Fixing Payment status enum issue..."
echo "Database: $DB_URL"
echo ""

# Run the migration
psql "$DB_URL" << 'SQLEOF'
-- Create PaymentStatus enum type if missing
DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Fix payments table
ALTER TABLE payments ADD COLUMN status_new "PaymentStatus";
UPDATE payments SET status_new = status::text::PaymentStatus;
ALTER TABLE payments DROP COLUMN status;
ALTER TABLE payments RENAME COLUMN status_new TO status;
ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'PENDING'::PaymentStatus;

-- Fix event_payments table
ALTER TABLE event_payments ADD COLUMN status_new "PaymentStatus";
UPDATE event_payments SET status_new = status::text::PaymentStatus;
ALTER TABLE event_payments DROP COLUMN status;
ALTER TABLE event_payments RENAME COLUMN status_new TO status;
ALTER TABLE event_payments ALTER COLUMN status SET DEFAULT 'PENDING'::PaymentStatus;

SELECT '✅ Migration complete!' as status;
SQLEOF

echo ""
echo "Restarting backend..."
pm2 restart stairs-backend

echo ""
echo "✅ Done! Dashboard should now work."
