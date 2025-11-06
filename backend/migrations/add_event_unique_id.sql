-- Add unique_id column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS unique_id VARCHAR(255);

-- Create a unique index on unique_id
CREATE UNIQUE INDEX IF NOT EXISTS events_unique_id_key ON events(unique_id);
