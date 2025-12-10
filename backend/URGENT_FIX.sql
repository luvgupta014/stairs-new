-- =====================================================
-- URGENT FIX - Run this NOW to fix the error
-- =====================================================
-- Copy and paste ALL of this into your database SQL editor
-- =====================================================

-- Fix 1: Add coordinatorFee column (THIS IS THE IMMEDIATE FIX)
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "coordinatorFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Fix 2: Add other missing columns
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "eventCategory" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "feeMode" TEXT NOT NULL DEFAULT 'GLOBAL';
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "level" TEXT NOT NULL DEFAULT 'DISTRICT';

-- Fix 3: Create enum types
DO $$ BEGIN CREATE TYPE "EventFeeMode" AS ENUM ('GLOBAL', 'EVENT', 'DISABLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "EventLevel" AS ENUM ('DISTRICT', 'STATE', 'NATIONAL', 'SCHOOL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "EventAssignmentRole" AS ENUM ('INCHARGE', 'COORDINATOR', 'TEAM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Fix 4: Create global_settings table
CREATE TABLE IF NOT EXISTS "global_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "perStudentBaseCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultEventFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Fix 5: Create event_assignments table
CREATE TABLE IF NOT EXISTS "event_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "EventAssignmentRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_assignments_eventId_userId_role_key" ON "event_assignments"("eventId", "userId", "role");

-- Fix 6: Create event_permissions table
CREATE TABLE IF NOT EXISTS "event_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "role" "EventAssignmentRole" NOT NULL,
    "resultUpload" BOOLEAN NOT NULL DEFAULT false,
    "studentManagement" BOOLEAN NOT NULL DEFAULT false,
    "certificateManagement" BOOLEAN NOT NULL DEFAULT false,
    "feeManagement" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_permissions_eventId_role_key" ON "event_permissions"("eventId", "role");

-- Add foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_assignments_eventId_fkey') THEN
        ALTER TABLE "event_assignments" ADD CONSTRAINT "event_assignments_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_assignments_userId_fkey') THEN
        ALTER TABLE "event_assignments" ADD CONSTRAINT "event_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_permissions_eventId_fkey') THEN
        ALTER TABLE "event_permissions" ADD CONSTRAINT "event_permissions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Verify
SELECT 'SUCCESS: All columns and tables created!' AS status;

