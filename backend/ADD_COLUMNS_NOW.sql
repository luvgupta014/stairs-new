-- =====================================================
-- ADD MISSING COLUMNS TO EVENTS TABLE
-- =====================================================
-- Run this SQL DIRECTLY on your PostgreSQL database
-- This will fix the "coordinatorFee does not exist" error
-- =====================================================

-- Step 1: Add coordinatorFee column
ALTER TABLE "events" 
ADD COLUMN IF NOT EXISTS "coordinatorFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Step 2: Add eventCategory column
ALTER TABLE "events" 
ADD COLUMN IF NOT EXISTS "eventCategory" TEXT;

-- Step 3: Add feeMode column
ALTER TABLE "events" 
ADD COLUMN IF NOT EXISTS "feeMode" TEXT NOT NULL DEFAULT 'GLOBAL';

-- Step 4: Add level column
ALTER TABLE "events" 
ADD COLUMN IF NOT EXISTS "level" TEXT NOT NULL DEFAULT 'DISTRICT';

-- Step 5: Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('coordinatorFee', 'eventCategory', 'feeMode', 'level')
ORDER BY column_name;

-- Expected output:
-- coordinatorFee | double precision | 0
-- eventCategory  | text             | NULL
-- feeMode        | text             | 'GLOBAL'::text
-- level          | text             | 'DISTRICT'::text

