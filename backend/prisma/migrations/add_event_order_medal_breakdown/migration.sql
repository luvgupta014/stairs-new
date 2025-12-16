-- Add medal breakdown columns to event_orders
ALTER TABLE "event_orders"
  ADD COLUMN IF NOT EXISTS "medalGold" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "medalSilver" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "medalBronze" INTEGER NOT NULL DEFAULT 0;


