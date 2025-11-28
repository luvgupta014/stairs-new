-- CreateTable "event_registration_orders"
CREATE TABLE "event_registration_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "eventFeePerStudent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalStudents" INTEGER NOT NULL DEFAULT 0,
    "totalFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "certificateGenerated" BOOLEAN NOT NULL DEFAULT false,
    "adminNotified" BOOLEAN NOT NULL DEFAULT false,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "event_registration_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable "event_registration_order_items"
CREATE TABLE "event_registration_order_items" (
    "id" TEXT NOT NULL,
    "registrationOrderId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "certificateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registration_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_registration_orders_orderNumber_key" ON "event_registration_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "event_registration_orders_eventId_coachId_key" ON "event_registration_orders"("eventId", "coachId");

-- CreateIndex
CREATE UNIQUE INDEX "event_registration_order_items_registrationOrderId_studentId_key" ON "event_registration_order_items"("registrationOrderId", "studentId");

-- AddForeignKey
ALTER TABLE "event_registration_orders" ADD CONSTRAINT "event_registration_orders_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registration_orders" ADD CONSTRAINT "event_registration_orders_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registration_order_items" ADD CONSTRAINT "event_registration_order_items_registrationOrderId_fkey" FOREIGN KEY ("registrationOrderId") REFERENCES "event_registration_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registration_order_items" ADD CONSTRAINT "event_registration_order_items_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registration_order_items" ADD CONSTRAINT "event_registration_order_items_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
