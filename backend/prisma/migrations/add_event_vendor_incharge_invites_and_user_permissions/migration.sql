-- Event Vendor / Incharge / Invite / User Permission Overrides

-- Add point-of-contact flag to event assignments
ALTER TABLE "event_assignments"
ADD COLUMN IF NOT EXISTS "isPointOfContact" BOOLEAN NOT NULL DEFAULT false;

-- Create event_vendors table
CREATE TABLE IF NOT EXISTS "event_vendors" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "gstin" TEXT,
  "pan" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "pincode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "event_vendors_pkey" PRIMARY KEY ("id")
);

-- Create event_incharges table
CREATE TABLE IF NOT EXISTS "event_incharges" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "phone" TEXT,
  "designation" TEXT,
  "panNumber" TEXT,
  "aadhaar" TEXT,
  "gstin" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "event_incharges_pkey" PRIMARY KEY ("id")
);

-- Create event_incharge_invites table
CREATE TABLE IF NOT EXISTS "event_incharge_invites" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "isPointOfContact" BOOLEAN NOT NULL DEFAULT false,
  "vendorId" TEXT,
  "resultUpload" BOOLEAN NOT NULL DEFAULT false,
  "studentManagement" BOOLEAN NOT NULL DEFAULT false,
  "certificateManagement" BOOLEAN NOT NULL DEFAULT false,
  "feeManagement" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "event_incharge_invites_pkey" PRIMARY KEY ("id")
);

-- Create event_user_permissions table (per-user overrides)
CREATE TABLE IF NOT EXISTS "event_user_permissions" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "resultUpload" BOOLEAN NOT NULL DEFAULT false,
  "studentManagement" BOOLEAN NOT NULL DEFAULT false,
  "certificateManagement" BOOLEAN NOT NULL DEFAULT false,
  "feeManagement" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "event_user_permissions_pkey" PRIMARY KEY ("id")
);

-- Unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "event_incharges_userId_key" ON "event_incharges"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "event_incharge_invites_tokenHash_key" ON "event_incharge_invites"("tokenHash");
CREATE UNIQUE INDEX IF NOT EXISTS "event_user_permissions_eventId_userId_key" ON "event_user_permissions"("eventId", "userId");

-- Helpful indexes
CREATE INDEX IF NOT EXISTS "event_incharge_invites_eventId_idx" ON "event_incharge_invites"("eventId");
CREATE INDEX IF NOT EXISTS "event_incharge_invites_email_idx" ON "event_incharge_invites"("email");

-- Foreign keys
ALTER TABLE "event_incharges"
ADD CONSTRAINT IF NOT EXISTS "event_incharges_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_incharges"
ADD CONSTRAINT IF NOT EXISTS "event_incharges_vendorId_fkey"
FOREIGN KEY ("vendorId") REFERENCES "event_vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "event_incharge_invites"
ADD CONSTRAINT IF NOT EXISTS "event_incharge_invites_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_incharge_invites"
ADD CONSTRAINT IF NOT EXISTS "event_incharge_invites_vendorId_fkey"
FOREIGN KEY ("vendorId") REFERENCES "event_vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "event_user_permissions"
ADD CONSTRAINT IF NOT EXISTS "event_user_permissions_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_user_permissions"
ADD CONSTRAINT IF NOT EXISTS "event_user_permissions_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


