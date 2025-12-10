-- =====================================================
-- QUICK FIX: Add Missing Columns to Events Table
-- =====================================================
-- Run this SQL directly on your PostgreSQL database
-- This fixes the immediate error: "coordinatorFee does not exist"
-- =====================================================

-- Step 1: Create enum types (safe to run multiple times)
-- =====================================================
DO $$ BEGIN
    CREATE TYPE "EventFeeMode" AS ENUM ('GLOBAL', 'EVENT', 'DISABLED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "EventLevel" AS ENUM ('DISTRICT', 'STATE', 'NATIONAL', 'SCHOOL');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "EventAssignmentRole" AS ENUM ('INCHARGE', 'COORDINATOR', 'TEAM');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Step 2: Add missing columns to events table
-- =====================================================
ALTER TABLE "events" 
ADD COLUMN IF NOT EXISTS "coordinatorFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "events" 
ADD COLUMN IF NOT EXISTS "eventCategory" TEXT;

ALTER TABLE "events" 
ADD COLUMN IF NOT EXISTS "feeMode" TEXT NOT NULL DEFAULT 'GLOBAL';

ALTER TABLE "events" 
ADD COLUMN IF NOT EXISTS "level" TEXT NOT NULL DEFAULT 'DISTRICT';

-- Step 3: Convert TEXT columns to enum types (if needed)
-- =====================================================
-- Convert feeMode to enum
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'feeMode' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE "events" 
        ALTER COLUMN "feeMode" TYPE "EventFeeMode" USING "feeMode"::"EventFeeMode";
    END IF;
END $$;

-- Convert level to enum
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'level' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE "events" 
        ALTER COLUMN "level" TYPE "EventLevel" USING "level"::"EventLevel";
    END IF;
END $$;

-- Step 4: Create global_settings table (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS "global_settings" (
    "id" TEXT NOT NULL,
    "perStudentBaseCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultEventFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "global_settings_pkey" PRIMARY KEY ("id")
);

-- Insert default row if empty
INSERT INTO "global_settings" ("id", "perStudentBaseCharge", "defaultEventFee", "createdAt", "updatedAt")
SELECT gen_random_uuid()::TEXT, 0, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "global_settings");

-- Step 5: Create event_assignments table (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS "event_assignments" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "EventAssignmentRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_assignments_eventId_userId_role_key" 
ON "event_assignments"("eventId", "userId", "role");

-- Add foreign keys (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'event_assignments_eventId_fkey'
    ) THEN
        ALTER TABLE "event_assignments" 
        ADD CONSTRAINT "event_assignments_eventId_fkey" 
        FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'event_assignments_userId_fkey'
    ) THEN
        ALTER TABLE "event_assignments" 
        ADD CONSTRAINT "event_assignments_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Step 6: Create event_permissions table (if not exists)
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

CREATE UNIQUE INDEX IF NOT EXISTS "event_permissions_eventId_role_key" 
ON "event_permissions"("eventId", "role");

-- Add foreign key (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'event_permissions_eventId_fkey'
    ) THEN
        ALTER TABLE "event_permissions" 
        ADD CONSTRAINT "event_permissions_eventId_fkey" 
        FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Verification
SELECT 'Migration completed! Columns added: coordinatorFee, eventCategory, feeMode, level' AS status;

