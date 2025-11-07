-- Allow orderId to be nullable in certificates table
-- Some certificates don't have associated orders (issued directly without order)
ALTER TABLE certificates ALTER COLUMN "orderId" DROP NOT NULL;
