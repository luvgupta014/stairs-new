-- Add optional social / gaming identifiers to students
ALTER TABLE "students"
ADD COLUMN IF NOT EXISTS "playstationId" TEXT,
ADD COLUMN IF NOT EXISTS "eaId" TEXT,
ADD COLUMN IF NOT EXISTS "alias" TEXT,
ADD COLUMN IF NOT EXISTS "instagramHandle" TEXT;


