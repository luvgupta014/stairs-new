-- Add event format + tournament links, and online registration snapshot fields

-- Create enum type for event format if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "EventFormat" AS ENUM ('OFFLINE', 'ONLINE', 'HYBRID');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Events: add format + tournament URLs
ALTER TABLE "events"
ADD COLUMN IF NOT EXISTS "eventFormat" "EventFormat" NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN IF NOT EXISTS "tournamentBracketUrl" TEXT,
ADD COLUMN IF NOT EXISTS "tournamentCommsUrl" TEXT;

-- Event registrations: add snapshot fields for online events
ALTER TABLE "event_registrations"
ADD COLUMN IF NOT EXISTS "contactEmail" TEXT,
ADD COLUMN IF NOT EXISTS "contactPhone" TEXT,
ADD COLUMN IF NOT EXISTS "playstationId" TEXT,
ADD COLUMN IF NOT EXISTS "eaId" TEXT,
ADD COLUMN IF NOT EXISTS "instagramHandle" TEXT;


