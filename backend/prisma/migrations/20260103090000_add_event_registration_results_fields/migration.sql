-- Add result/leaderboard fields to event_registrations
-- Safe to run even if some columns already exist.

ALTER TABLE "event_registrations"
  ADD COLUMN IF NOT EXISTS "score" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "placement" INTEGER,
  ADD COLUMN IF NOT EXISTS "placementText" TEXT,
  ADD COLUMN IF NOT EXISTS "points" DOUBLE PRECISION;


