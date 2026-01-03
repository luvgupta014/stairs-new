-- Add editDetails permission to event permission tables

ALTER TABLE "event_permissions"
ADD COLUMN IF NOT EXISTS "editDetails" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "event_user_permissions"
ADD COLUMN IF NOT EXISTS "editDetails" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "event_incharge_invites"
ADD COLUMN IF NOT EXISTS "editDetails" BOOLEAN NOT NULL DEFAULT false;


