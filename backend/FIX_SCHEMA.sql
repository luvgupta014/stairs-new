-- =====================================================
-- SCHEMA VALIDATION FIX
-- =====================================================
-- This file contains the complete Event model section
-- that should be in your schema.prisma file
-- =====================================================

-- Make sure these models exist in your schema.prisma file:

/*
model EventRegistrationOrder {
  id                    String                      @id @default(cuid())
  orderNumber           String                      @unique
  eventId               String
  coachId               String
  eventFeePerStudent    Float                       @default(0)
  totalStudents         Int                         @default(0)
  totalFeeAmount        Float                       @default(0)
  status                OrderStatus                 @default(PENDING)
  paymentStatus         PaymentStatus               @default(PENDING)
  razorpayOrderId       String?
  razorpayPaymentId     String?
  paymentDate           DateTime?
  paymentMethod         String?
  certificateGenerated  Boolean                     @default(false)
  adminNotified         Boolean                     @default(false)
  adminNotes            String?
  createdAt             DateTime                    @default(now())
  updatedAt             DateTime                    @updatedAt
  completedAt           DateTime?
  coach                 Coach                       @relation(fields: [coachId], references: [id], onDelete: Cascade)
  event                 Event                       @relation(fields: [eventId], references: [id], onDelete: Cascade)
  registrationItems     EventRegistrationOrderItem[]

  @@unique([eventId, coachId])
  @@map("event_registration_orders")
}

model EventRegistrationOrderItem {
  id                      String                   @id @default(cuid())
  registrationOrderId     String
  eventId                 String
  studentId              String
  status                  RegistrationStatus      @default(REGISTERED)
  certificateId           String?
  createdAt               DateTime                @default(now())
  updatedAt               DateTime                @updatedAt
  registrationOrder       EventRegistrationOrder  @relation(fields: [registrationOrderId], references: [id], onDelete: Cascade)
  event                   Event                   @relation(fields: [eventId], references: [id])
  student                 Student                 @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([registrationOrderId, studentId])
  @@map("event_registration_order_items")
}
*/

-- The Event model should have these relations (NO DUPLICATES):
/*
model Event {
  // ... other fields ...
  assignments         EventAssignment[]
  orders              EventOrder[]
  payments            EventPayment[]
  permissions         EventPermission[]
  registrationOrders  EventRegistrationOrder[]      // This relation
  registrationItems   EventRegistrationOrderItem[]   // This relation
  registrations       EventRegistration[]
  resultFiles         EventResultFile[]
  coach               Coach               @relation(fields: [coachId], references: [id], onDelete: Cascade)
  @@map("events")
}
*/

