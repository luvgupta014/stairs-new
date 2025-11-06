-- AlterTable: Make orderId optional in certificates table
ALTER TABLE "certificates" ALTER COLUMN "orderId" DROP NOT NULL;

-- DropConstraint: Drop old unique constraint
ALTER TABLE "certificates" DROP CONSTRAINT IF EXISTS "certificates_studentId_eventId_orderId_key";

-- CreateIndex: Create new unique constraint without orderId
CREATE UNIQUE INDEX "certificates_studentId_eventId_key" ON "certificates"("studentId", "eventId");
