-- =====================================================
-- MANUAL MIGRATION: Add Event Fee Mode, Level, and Assignments
-- =====================================================
-- Run this SQL script directly on your PostgreSQL database
-- Make sure to backup your database before running this migration
-- =====================================================

-- Step 1: Create enum types (if they don't exist)
-- =====================================================
DO $$ BEGIN
    CREATE TYPE "EventFeeMode" AS ENUM ('GLOBAL', 'EVENT', 'DISABLED');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'EventFeeMode enum already exists, skipping...';
END $$;

DO $$ BEGIN
    CREATE TYPE "EventLevel" AS ENUM ('DISTRICT', 'STATE', 'NATIONAL', 'SCHOOL');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'EventLevel enum already exists, skipping...';
END $$;

DO $$ BEGIN
    CREATE TYPE "EventAssignmentRole" AS ENUM ('INCHARGE', 'COORDINATOR', 'TEAM');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'EventAssignmentRole enum already exists, skipping...';
END $$;

-- Step 2: Add missing columns to events table
-- =====================================================
ALTER TABLE "events" 
ADD COLUMN IF NOT EXISTS "coordinatorFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "eventCategory" TEXT,
ADD COLUMN IF NOT EXISTS "feeMode" TEXT NOT NULL DEFAULT 'GLOBAL',
ADD COLUMN IF NOT EXISTS "level" TEXT NOT NULL DEFAULT 'DISTRICT';

-- Step 3: Convert TEXT columns to enum types (if they were created as TEXT)
-- =====================================================
-- First, update any existing NULL values
UPDATE "events" SET "feeMode" = 'GLOBAL' WHERE "feeMode" IS NULL;
UPDATE "events" SET "level" = 'DISTRICT' WHERE "level" IS NULL;

-- Convert feeMode column to enum type
DO $$ 
BEGIN
    -- Check if column is TEXT type before converting
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'feeMode' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE "events" 
        ALTER COLUMN "feeMode" TYPE "EventFeeMode" USING "feeMode"::"EventFeeMode";
        RAISE NOTICE 'Converted feeMode column to EventFeeMode enum';
    ELSE
        RAISE NOTICE 'feeMode column is already an enum or does not exist';
    END IF;
END $$;

-- Convert level column to enum type
DO $$ 
BEGIN
    -- Check if column is TEXT type before converting
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'level' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE "events" 
        ALTER COLUMN "level" TYPE "EventLevel" USING "level"::"EventLevel";
        RAISE NOTICE 'Converted level column to EventLevel enum';
    ELSE
        RAISE NOTICE 'level column is already an enum or does not exist';
    END IF;
END $$;

-- Step 4: Create global_settings table
-- =====================================================
CREATE TABLE IF NOT EXISTS "global_settings" (
    "id" TEXT NOT NULL,
    "perStudentBaseCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultEventFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_settings_pkey" PRIMARY KEY ("id")
);

-- Insert default global settings if table is empty
INSERT INTO "global_settings" ("id", "perStudentBaseCharge", "defaultEventFee", "createdAt", "updatedAt")
SELECT gen_random_uuid()::TEXT, 0, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "global_settings");

-- Step 5: Create event_assignments table
-- =====================================================
CREATE TABLE IF NOT EXISTS "event_assignments" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "EventAssignmentRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_assignments_pkey" PRIMARY KEY ("id")
);

-- Step 6: Create event_permissions table
-- =====================================================
CREATE TABLE IF NOT EXISTS "event_permissions" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "role" "EventAssignmentRole" NOT NULL,
    "resultUpload" BOOLEAN NOT NULL DEFAULT false,
    "studentManagement" BOOLEAN NOT NULL DEFAULT false,
    "certificateManagement" BOOLEAN NOT NULL DEFAULT false,
    "feeManagement" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_permissions_pkey" PRIMARY KEY ("id")
);

-- Step 7: Create unique indexes
-- =====================================================
CREATE UNIQUE INDEX IF NOT EXISTS "event_assignments_eventId_userId_role_key" 
ON "event_assignments"("eventId", "userId", "role");

CREATE UNIQUE INDEX IF NOT EXISTS "event_permissions_eventId_role_key" 
ON "event_permissions"("eventId", "role");

-- Step 8: Add foreign key constraints
-- =====================================================
-- Remove existing constraint if it exists, then add new one
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'event_assignments_eventId_fkey'
    ) THEN
        ALTER TABLE "event_assignments" 
        ADD CONSTRAINT "event_assignments_eventId_fkey" 
        FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'event_assignments_userId_fkey'
    ) THEN
        ALTER TABLE "event_assignments" 
        ADD CONSTRAINT "event_assignments_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'event_permissions_eventId_fkey'
    ) THEN
        ALTER TABLE "event_permissions" 
        ADD CONSTRAINT "event_permissions_eventId_fkey" 
        FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 9: Verify migration
-- =====================================================
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Verifying changes...';
    
    -- Check columns in events table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'coordinatorFee'
    ) THEN
        RAISE NOTICE '✓ coordinatorFee column exists';
    ELSE
        RAISE WARNING '✗ coordinatorFee column missing';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'feeMode'
    ) THEN
        RAISE NOTICE '✓ feeMode column exists';
    ELSE
        RAISE WARNING '✗ feeMode column missing';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'level'
    ) THEN
        RAISE NOTICE '✓ level column exists';
    ELSE
        RAISE WARNING '✗ level column missing';
    END IF;
    
    -- Check tables
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'global_settings'
    ) THEN
        RAISE NOTICE '✓ global_settings table exists';
    ELSE
        RAISE WARNING '✗ global_settings table missing';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'event_assignments'
    ) THEN
        RAISE NOTICE '✓ event_assignments table exists';
    ELSE
        RAISE WARNING '✗ event_assignments table missing';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'event_permissions'
    ) THEN
        RAISE NOTICE '✓ event_permissions table exists';
    ELSE
        RAISE WARNING '✗ event_permissions table missing';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run: npx prisma generate (in backend directory)';
    RAISE NOTICE '2. Restart your backend server';
    RAISE NOTICE '========================================';
END $$;

