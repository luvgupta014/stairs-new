# 🎓 Student Registration & Certificate Issuance System - Quick Start Guide

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     STAIRS Platform                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  FRONTEND (React)                  BACKEND (Express.js)          │
│  ┌─────────────────────────┐      ┌──────────────────────────┐  │
│  │ EventBulkRegistration   │      │ Coach Routes             │  │
│  │ - Student Selection     │      │ POST /bulk               │  │
│  │ - Fee Configuration     │──────┤ GET /orders              │  │
│  │ - Razorpay Integration  │      │ POST /payment            │  │
│  │                         │      │ POST /payment-success    │  │
│  └─────────────────────────┘      └──────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────┐      ┌──────────────────────────┐  │
│  │ AdminCertificateIssuance│      │ Admin Routes             │  │
│  │ - Mark Completed        │      │ GET /registrations/      │  │
│  │ - Notify Coordinators   │──────┤     orders               │  │
│  │ - Generate Certificates │      │ POST /notify-completion  │  │
│  │ - View Certificates     │      │ POST /generate-certs     │  │
│  └─────────────────────────┘      │ GET /certificates        │  │
│                                    │ PUT /status              │  │
│  API Client (api.js)               └──────────────────────────┘  │
│  - 9 new functions                                                │
│  - Razorpay key access                                            │
│  - Error handling                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Complete User Journey

### **COACH JOURNEY: Register Students & Collect Fees**

```
1. COACH VIEW: Event Management Page
   ├─ Clicks "Register Students" button
   └─ Opens EventBulkRegistration Modal
   
2. STUDENT SELECTION
   ├─ ✓ Displays all connected students
   ├─ ✓ Multi-select with checkboxes
   ├─ ✓ "Select All" convenience button
   └─ ✓ Shows student count selected

3. FEE CONFIGURATION
   ├─ Input: Event Fee per Student (e.g., ₹500)
   ├─ Display: Total Fee Calculation (Students × Fee)
   │  Example: 50 students × ₹500 = ₹25,000
   ├─ Validation: Prevents empty selections
   └─ Submit: "Create Registration Order" Button

4. ORDER CREATION
   ├─ Backend creates EventRegistrationOrder record
   ├─ Creates EventRegistrationOrderItem for each student
   ├─ Stores: totalFeeAmount, eventFeePerStudent, totalStudents
   └─ Display: Order created successfully message

5. PAYMENT INITIATION
   ├─ Click: "Pay Now" button on registration order
   ├─ Backend: Creates Razorpay order
   ├─ Response: razorpayOrderId, amount, key
   └─ Frontend: Opens Razorpay payment modal

6. RAZORPAY PAYMENT
   ├─ Display: Amount = ₹25,000 (calculated in paise)
   ├─ Methods: Card, NetBanking, UPI, Wallet
   ├─ Redirect: Back to app after payment
   └─ Status: PENDING while processing

7. PAYMENT VERIFICATION
   ├─ Frontend: Captures razorpayPaymentId
   ├─ Signature: HMAC-SHA256(orderId|paymentId, SECRET)
   ├─ Backend: Validates signature
   └─ Auto-Registration: Students added to EventRegistration

8. CONFIRMATION
   ├─ Display: "✅ 50 students registered successfully"
   ├─ Update: Event.currentParticipants += 50
   ├─ Refresh: Order status shows "PAID"
   └─ Notification: Coach receives confirmation
```

### **ADMIN JOURNEY: Generate & Issue Certificates**

```
1. ADMIN VIEW: Events Management Page
   ├─ Selects completed event
   └─ Opens Event Details Modal

2. CERTIFICATE ISSUANCE TAB
   ├─ Click: "🎓 Certificate Issuance" tab
   └─ Display: Certificate management interface

3. MARK EVENT COMPLETED (STEP 1)
   ├─ Check: Is event.status === COMPLETED?
   ├─ If NO:
   │  ├─ Show: "Step 1: Mark Event as Completed"
   │  ├─ Button: "✓ Mark Event as Completed"
   │  └─ Action: PUT /admin/events/:id/status → COMPLETED
   └─ If YES: Skip to Step 2

4. NOTIFY COORDINATORS (STEP 2)
   ├─ Prerequisite: Event must be COMPLETED
   ├─ Input: Custom message for coaches
   │  Example: "Event completed! Please review payment details 
   │            for ₹25,000. Certificates ready for ₹500/student"
   ├─ Submit: "Send Notification to All Coordinators"
   └─ Action: POST /notify-completion
      - Creates Notification records
      - Sets adminNotified = true for orders
      - Coaches receive alert

5. GENERATE CERTIFICATES (STEP 3)
   ├─ View: Registration Orders table
   ├─ Filter: Only PAID orders shown
   ├─ Action: "Generate Certificates (50)" button
   └─ Process:
      ├─ For each student in order:
      │  ├─ Create Certificate record
      │  ├─ Generate uniqueId: STAIRS-CERT-<eventUID>-<studentUID>-<ts>
      │  ├─ Set status: COMPLETED
      │  └─ Store issue date
      └─ Mark: order.certificateGenerated = true

6. VIEW CERTIFICATES (STEP 4)
   ├─ Click: "Issued Certificates" tab
   ├─ Display: Table of certificates
   │  Columns:
   │  - Student Name
   │  - Sport
   │  - Certificate ID (unique)
   │  - Issued Date
   │  - Download Button
   └─ Filter/Search: By student, sport, date

7. DISTRIBUTION
   ├─ [Future] Send email to students
   ├─ [Future] Student dashboard shows certificates
   ├─ [Future] Download PDF from portal
   └─ [Manual] Admin can view and share
```

## Data Flow Diagrams

### **Fee Collection Flow**
```
Coach                    Frontend              Backend                 Razorpay
  │                         │                     │                        │
  ├──Select Students───────>│                     │                        │
  │                         │                     │                        │
  ├──Enter Fee Per Student─>│                     │                        │
  │                         │                     │                        │
  ├──Create Order──────────>│                     │                        │
  │                         ├──POST /bulk────────>│                        │
  │                         │                     ├─Create Order Record    │
  │                         │<──Order Created─────│                        │
  │<────Show Order──────────│                     │                        │
  │                         │                     │                        │
  ├──Pay Now───────────────>│                     │                        │
  │                         ├──POST /payment────>│                        │
  │                         │                     ├───Create Order────────>│
  │                         │                     │<──razorpayOrderId─────│
  │                         │<──Order ID──────────│                        │
  │<────Razorpay Modal──────│                     │                        │
  │                         │                     │                        │
  ├──Complete Payment──────────────────────────────────────────────────────>│
  │                         │                     │                        │
  │<──Payment Success──────────────────────────────────────────────────────┤
  │                         │                     │                        │
  │                         ├──POST /payment-success─────────────────────>│
  │                         │     (signature)     │                        │
  │                         │                     ├─Verify Signature      │
  │                         │                     ├─Create Registrations   │
  │                         │                     ├─Update Event Counter   │
  │                         │<──Success──────────│                        │
  │<────Confirmation────────│                     │                        │
```

### **Certificate Generation Flow**
```
Admin                    Frontend              Backend                Database
  │                         │                     │                        │
  ├──Click Certificates Tab─>│                     │                        │
  │                         │                     │                        │
  ├──Mark Event Complete───>│                     │                        │
  │                         ├──PUT /status───────>│                        │
  │                         │                     ├─Update Event Status────>│
  │                         │<──Confirmed────────│                        │
  │                         │                     │                        │
  ├──Send Notification─────>│                     │                        │
  │                         ├──POST /notify──────>│                        │
  │                         │                     ├─Create Notifications──>│
  │                         │<──Notified─────────│                        │
  │                         │                     │                        │
  ├──Generate Certificates─>│                     │                        │
  │                         ├──POST /generate───>│                        │
  │                         │                     ├─For each student:     │
  │                         │                     │  ├─Create Certificate─>│
  │                         │                     │  ├─Generate uniqueId   │
  │                         │                     │  └─Mark as COMPLETED   │
  │                         │<──Generated────────│                        │
  │<────Success Message─────│                     │                        │
  │                         │                     │                        │
  ├──View Certificates─────>│                     │                        │
  │                         ├──GET /certificates>│                        │
  │                         │                     ├─Query all certs───────>│
  │                         │<──Certificate List─│                        │
  │<────Display Table───────│                     │                        │
```

## Database Schema

### Tables Created

```sql
-- EventRegistrationOrder: Bulk registration orders
CREATE TABLE event_registration_orders (
  id                    TEXT PRIMARY KEY,
  eventId              TEXT NOT NULL,
  coachId              TEXT NOT NULL,
  orderNumber          TEXT NOT NULL UNIQUE,
  eventFeePerStudent   REAL NOT NULL,      -- ₹500
  totalStudents        INTEGER NOT NULL,   -- 50
  totalFeeAmount       REAL NOT NULL,      -- ₹25,000
  paymentStatus        TEXT NOT NULL,      -- PENDING, PAID
  razorpayOrderId      TEXT,
  razorpayPaymentId    TEXT,
  adminNotified        BOOLEAN DEFAULT false,
  certificateGenerated BOOLEAN DEFAULT false,
  createdAt            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (eventId) REFERENCES events(id),
  FOREIGN KEY (coachId) REFERENCES coaches(id),
  UNIQUE(eventId, coachId)
);

-- EventRegistrationOrderItem: Individual students in order
CREATE TABLE event_registration_order_items (
  id                  TEXT PRIMARY KEY,
  registrationOrderId TEXT NOT NULL,
  studentId          TEXT NOT NULL,
  eventId            TEXT NOT NULL,
  status             TEXT NOT NULL,        -- REGISTERED, APPROVED, REJECTED
  createdAt          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (registrationOrderId) REFERENCES event_registration_orders(id),
  FOREIGN KEY (studentId) REFERENCES students(id),
  FOREIGN KEY (eventId) REFERENCES events(id),
  UNIQUE(registrationOrderId, studentId)
);

-- Certificate: Generated certificates (already exists, used as-is)
CREATE TABLE certificates (
  id          TEXT PRIMARY KEY,
  eventId     TEXT NOT NULL,
  studentId   TEXT NOT NULL,
  uniqueId    TEXT UNIQUE,       -- STAIRS-CERT-xxx-yyy-zzz
  status      TEXT,              -- COMPLETED
  issueDate   TIMESTAMP,
  ...
);
```

## API Reference

### Coach Endpoints

```bash
# 1. Create bulk registration order
POST /api/coach/events/:eventId/registrations/bulk
Body: {
  studentIds: ["student1", "student2", ...],
  eventFeePerStudent: 500
}
Response: {
  success: true,
  data: {
    order: { id, orderNumber, totalFeeAmount, ... }
  }
}

# 2. Get registration orders
GET /api/coach/events/:eventId/registrations/orders
Response: {
  success: true,
  data: {
    orders: [
      { 
        id, orderNumber, paymentStatus, totalFeeAmount,
        registrationItems: [{ student: {...} }, ...]
      }
    ]
  }
}

# 3. Initiate Razorpay payment
POST /api/coach/events/:eventId/registrations/orders/:orderId/payment
Response: {
  success: true,
  data: {
    razorpayOrderId: "order_xxx",
    amount: 2500000,  // in paise
    keyId: "rzp_live_xxx"
  }
}

# 4. Verify and complete payment
POST /api/coach/events/:eventId/registrations/orders/:orderId/payment-success
Body: {
  razorpayPaymentId: "pay_xxx",
  razorpaySignature: "xxx"
}
Response: {
  success: true,
  data: {
    order: { paymentStatus: "PAID", ... },
    registeredCount: 50
  }
}
```

### Admin Endpoints

```bash
# 1. Get registration orders (admin view)
GET /api/admin/events/:eventId/registrations/orders
Response: { orders: [...] }

# 2. Notify coordinators
POST /api/admin/events/:eventId/registrations/notify-completion
Body: { notifyMessage: "Event completed..." }
Response: {
  ordersNotified: 3,
  totalStudentsForCertificates: 150
}

# 3. Generate certificates
POST /api/admin/registrations/orders/:orderId/generate-certificates
Response: {
  certificatesGenerated: 50,
  certificates: [...]
}

# 4. Get certificates
GET /api/admin/events/:eventId/certificates
Response: {
  certificates: [
    {
      id, participantName, sportName, uniqueId,
      issueDate, status
    }
  ]
}

# 5. Update event status
PUT /api/admin/events/:eventId/status
Body: { status: "COMPLETED" }
Response: { event: { status: "COMPLETED", ... } }
```

## Environment Configuration

### Backend (.env)
```
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=your_secret_key
DATABASE_URL=postgresql://user:password@localhost:5432/stairs
```

### Frontend (.env.local)
```
VITE_BACKEND_URL=http://localhost:5000
REACT_APP_RAZORPAY_KEY_ID=rzp_live_xxx
```

## Troubleshooting

### Issue: "Payment signature verification failed"
**Solution:** 
- Verify RAZORPAY_KEY_SECRET is set correctly in backend
- Check that signature format is: `${orderId}|${paymentId}`
- Ensure HMAC-SHA256 is using correct secret

### Issue: "Students not auto-registering after payment"
**Solution:**
- Check EventRegistration table for upsert logic
- Verify event status is APPROVED or ACTIVE
- Check for database transaction errors

### Issue: "Certificates not generating"
**Solution:**
- Ensure event.status === COMPLETED before generation
- Verify Certificate model exists in Prisma schema
- Check orderId exists in event_registration_orders

### Issue: "Can't see orders in admin view"
**Solution:**
- Verify user is authenticated as ADMIN role
- Check event exists and is APPROVED
- Ensure EventRegistrationOrder records exist

## Performance Notes

- ✅ Pagination implemented for large order lists
- ✅ Database indexes on (eventId, coachId) and (registrationOrderId, studentId)
- ✅ Parallel loading of orders and certificates
- ✅ Efficient batch operations for certificate generation

## Future Enhancements

1. **PDF Generation**
   - Install: `npm install puppeteer` or `pdf-lib`
   - Generate actual certificate PDFs
   - Store in cloud storage (S3, GCS)

2. **Email Notifications**
   - Send to students when certificates issued
   - Send to coordinators for payment due
   - Customize email templates

3. **Student Portal**
   - Dashboard showing earned certificates
   - Download certificates section
   - Share certificates on social media

4. **Analytics**
   - Revenue tracking by event
   - Certificate issuance metrics
   - Student registration analytics

5. **Advanced Features**
   - Subscription-based bulk registration
   - Custom certificate designs
   - Digital signature verification
   - Certificate expiration tracking
