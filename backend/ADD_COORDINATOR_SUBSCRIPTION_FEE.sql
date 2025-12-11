-- Migration: Add coordinatorSubscriptionFee to global_settings table
-- This adds support for coordinator subscription fees that can be changed globally

-- Step 1: Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'global_settings' 
        AND column_name = 'coordinatorSubscriptionFee'
    ) THEN
        ALTER TABLE "global_settings" 
        ADD COLUMN "coordinatorSubscriptionFee" DOUBLE PRECISION NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added coordinatorSubscriptionFee column to global_settings';
    ELSE
        RAISE NOTICE 'coordinatorSubscriptionFee column already exists';
    END IF;
END $$;

-- Step 2: Update existing records to have default value 0 if NULL
UPDATE "global_settings" 
SET "coordinatorSubscriptionFee" = 0 
WHERE "coordinatorSubscriptionFee" IS NULL;

-- Verification query (uncomment to run manually)
-- SELECT id, "perStudentBaseCharge", "defaultEventFee", "coordinatorSubscriptionFee", "createdAt", "updatedAt" 
-- FROM "global_settings";

