-- Fix Payment status field type issue
-- This migration converts the status column from TEXT to ENUM type

-- Step 1: Create the PaymentStatus ENUM type if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
  END IF;
END
$$;

-- Step 2: Update the payment table status column to use the ENUM type
-- First, create a temporary column with the correct type
ALTER TABLE payments ADD COLUMN status_new "PaymentStatus" DEFAULT 'PENDING';

-- Copy existing data, mapping text values to enum values
UPDATE payments 
SET status_new = CASE 
  WHEN status = 'PENDING' THEN 'PENDING'::PaymentStatus
  WHEN status = 'SUCCESS' THEN 'SUCCESS'::PaymentStatus
  WHEN status = 'FAILED' THEN 'FAILED'::PaymentStatus
  WHEN status = 'REFUNDED' THEN 'REFUNDED'::PaymentStatus
  ELSE 'PENDING'::PaymentStatus
END;

-- Drop the old column and rename the new one
ALTER TABLE payments DROP COLUMN status;
ALTER TABLE payments RENAME COLUMN status_new TO status;

-- Ensure the column has the correct default
ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'PENDING'::PaymentStatus;

-- Do the same for event_payments table
ALTER TABLE event_payments ADD COLUMN status_new "PaymentStatus" DEFAULT 'PENDING';

UPDATE event_payments 
SET status_new = CASE 
  WHEN status = 'PENDING' THEN 'PENDING'::PaymentStatus
  WHEN status = 'SUCCESS' THEN 'SUCCESS'::PaymentStatus
  WHEN status = 'FAILED' THEN 'FAILED'::PaymentStatus
  WHEN status = 'REFUNDED' THEN 'REFUNDED'::PaymentStatus
  ELSE 'PENDING'::PaymentStatus
END;

ALTER TABLE event_payments DROP COLUMN status;
ALTER TABLE event_payments RENAME COLUMN status_new TO status;

ALTER TABLE event_payments ALTER COLUMN status SET DEFAULT 'PENDING'::PaymentStatus;
