/*
  Warnings:

  - You are about to drop the `EventResultFile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tournament_result_files` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "EventResultFile";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "tournament_result_files";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "event_result_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    CONSTRAINT "event_result_files_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_result_files_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "coaches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "certificates" INTEGER NOT NULL DEFAULT 0,
    "medals" INTEGER NOT NULL DEFAULT 0,
    "trophies" INTEGER NOT NULL DEFAULT 0,
    "specialInstructions" TEXT,
    "urgentDelivery" BOOLEAN NOT NULL DEFAULT false,
    "certificatePrice" REAL,
    "medalPrice" REAL,
    "trophyPrice" REAL,
    "totalAmount" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminRemarks" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "paymentDate" DATETIME,
    "paymentMethod" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "processedAt" DATETIME,
    "completedAt" DATETIME,
    "eventId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "processedBy" TEXT,
    CONSTRAINT "event_orders_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_orders_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "coaches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_orders_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "admins" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "event_orders_orderNumber_key" ON "event_orders"("orderNumber");
