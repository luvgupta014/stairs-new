-- Add uid column to users table
-- This migration adds the new UID field in format: [a/c/i/b][00001-99999][StateCode][MM][YYYY]
-- Example: a00001DL112025

-- Add uid column
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "uid" TEXT;

-- Add unique constraint
ALTER TABLE "users" ADD CONSTRAINT "users_uid_key" UNIQUE ("uid");

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS "users_uid_idx" ON "users"("uid");

-- Add comment for documentation
COMMENT ON COLUMN "users"."uid" IS 'Unique ID format: [a/c/i/b][00001-99999][StateCode][MM][YYYY]';
