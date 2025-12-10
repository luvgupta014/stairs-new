-- Add missing columns to events table
ALTER TABLE "events" 
ADD COLUMN IF NOT EXISTS "coordinatorFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "eventCategory" TEXT,
ADD COLUMN IF NOT EXISTS "feeMode" TEXT NOT NULL DEFAULT 'GLOBAL',
ADD COLUMN IF NOT EXISTS "level" TEXT NOT NULL DEFAULT 'DISTRICT';

-- Create enum types if they don't exist (PostgreSQL doesn't support IF NOT EXISTS for types, so we check first)
DO $$ BEGIN
    CREATE TYPE "EventFeeMode" AS ENUM ('GLOBAL', 'EVENT', 'DISABLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "EventLevel" AS ENUM ('DISTRICT', 'STATE', 'NATIONAL', 'SCHOOL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "EventAssignmentRole" AS ENUM ('INCHARGE', 'COORDINATOR', 'TEAM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing columns to use enum types (if they were created as TEXT)
ALTER TABLE "events" 
ALTER COLUMN "feeMode" TYPE "EventFeeMode" USING "feeMode"::"EventFeeMode",
ALTER COLUMN "level" TYPE "EventLevel" USING "level"::"EventLevel";

-- Create global_settings table
CREATE TABLE IF NOT EXISTS "global_settings" (
    "id" TEXT NOT NULL,
    "perStudentBaseCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultEventFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_settings_pkey" PRIMARY KEY ("id")
);

-- Create event_assignments table
CREATE TABLE IF NOT EXISTS "event_assignments" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "EventAssignmentRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_assignments_pkey" PRIMARY KEY ("id")
);

-- Create event_permissions table
CREATE TABLE IF NOT EXISTS "event_permissions" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "role" "EventAssignmentRole" NOT NULL,
    "resultUpload" BOOLEAN NOT NULL DEFAULT false,
    "studentManagement" BOOLEAN NOT NULL DEFAULT false,
    "certificateManagement" BOOLEAN NOT NULL DEFAULT false,
    "feeManagement" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_permissions_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "event_assignments_eventId_userId_role_key" ON "event_assignments"("eventId", "userId", "role");
CREATE UNIQUE INDEX IF NOT EXISTS "event_permissions_eventId_role_key" ON "event_permissions"("eventId", "role");

-- Add foreign keys
ALTER TABLE "event_assignments" 
ADD CONSTRAINT IF NOT EXISTS "event_assignments_eventId_fkey" 
FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_assignments" 
ADD CONSTRAINT IF NOT EXISTS "event_assignments_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_permissions" 
ADD CONSTRAINT IF NOT EXISTS "event_permissions_eventId_fkey" 
FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

