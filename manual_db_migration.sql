-- Manual Database Migration Queries
-- Add category fields for athlete registration
-- Run these queries in your PostgreSQL database

-- ============================================
-- 1. Add categoriesAvailable to events table
-- ============================================
-- This field stores the available categories (Age Groups, Distances, Strokes) 
-- that admins can configure for each event

ALTER TABLE "events" 
ADD COLUMN IF NOT EXISTS "categoriesAvailable" TEXT;

-- Add comment for documentation
COMMENT ON COLUMN "events"."categoriesAvailable" IS 
'Categories available for this event (Age Groups, Distances, Strokes/Event types). 
Example format: "Group I (11-12), Group II (13-14) | Freestyle, Backstroke | 25m, 50m"';

-- ============================================
-- 2. Add selectedCategory to event_registrations table
-- ============================================
-- This field stores the category selected by the athlete during registration

ALTER TABLE "event_registrations" 
ADD COLUMN IF NOT EXISTS "selectedCategory" TEXT;

-- Add comment for documentation
COMMENT ON COLUMN "event_registrations"."selectedCategory" IS 
'Selected category by athlete during registration. 
Example format: "Group II (13-14) | Freestyle | 50m"';

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify the columns were added successfully

-- Check if categoriesAvailable column exists in events table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'categoriesAvailable';

-- Check if selectedCategory column exists in event_registrations table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'event_registrations' 
AND column_name = 'selectedCategory';

-- ============================================
-- Optional: Update existing events with sample categories
-- ============================================
-- Uncomment and modify if you want to add sample categories to existing swimming events

-- UPDATE "events" 
-- SET "categoriesAvailable" = 'Age Groups: Group I (11-12), Group II (13-14), Group III (15-16)
-- Strokes: Freestyle, Backstroke, Breaststroke, Butterfly
-- Distances: 25m, 50m, 100m'
-- WHERE "sport" = 'Swimming' 
-- AND "categoriesAvailable" IS NULL;

-- ============================================
-- Rollback Queries (if needed)
-- ============================================
-- Uncomment these if you need to remove the columns

-- ALTER TABLE "events" DROP COLUMN IF EXISTS "categoriesAvailable";
-- ALTER TABLE "event_registrations" DROP COLUMN IF EXISTS "selectedCategory";

