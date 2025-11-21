# STAIRS Platform - Low-Level Design (LLD)

## Document Information
- **Project Name:** STAIRS Platform
- **Version:** 1.0
- **Date:** November 2025
- **Author:** Development Team
- **Audience:** Developers, Tech Leads

---

## 1. Overview

This document provides detailed technical specifications for implementing the STAIRS platform. It covers module-level design, API specifications, database schema details, algorithms, and component interactions.

---

## 2. Module-Level Design

### 2.1 Authentication Module

#### 2.1.1 Registration Flow

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "role": "STUDENT|COACH|INSTITUTE|CLUB",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "9876543210",
  "subscriptionType": "MONTHLY|ANNUAL" // Only for COACH
}
```

**Processing Steps:**
1. Validate input data (email format, password strength, phone format)
2. Check if email already exists in database
3. Hash password using bcrypt (10 salt rounds)
4. Create User record in database
5. Create role-specific profile record (Student/Coach/Institute/Club)
6. If COACH: Create Razorpay order for subscription
7. Generate JWT token (expires in 24 hours)
8. Send OTP to email for verification
9. Return user data and token

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "STUDENT",
    "uniqueId": "STU-001-MH-131125"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2.1.2 Login Flow

**Endpoint:** `POST /api/auth/login/:role`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Processing Steps:**
1. Query User table by email and role
2. Compare password hash using bcrypt
3. Check if user is active
4. Generate new JWT token
5. Update last login timestamp
6. Return user data and token

**JWT Token Structure:**
```javascript
{
  userId: user.id,
  email: user.email,
  role: user.role,
  iat: <issued_at_timestamp>,
  exp: <expiry_timestamp>
}
```

#### 2.1.3 OTP Verification

**Algorithm:**
```javascript
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
}

function storeOTP(email, otp) {
  // Store in database with 10-minute expiry
  const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.otp.create({
    data: { email, otp: otp.toString(), expiresAt: expiryTime }
  });
}

function verifyOTP(email, otp) {
  const record = await prisma.otp.findFirst({
    where: {
      email,
      otp: otp.toString(),
      expiresAt: { gte: new Date() },
      isUsed: false
    }
  });
  
  if (record) {
    await prisma.otp.update({
      where: { id: record.id },
      data: { isUsed: true }
    });
    return true;
  }
  return false;
}
```

---

### 2.2 Event Management Module

#### 2.2.1 Event Creation

**Endpoint:** `POST /api/coach/events`

**Request Body:**
```json
{
  "name": "Mumbai Marathon 2025",
  "sport": "Running",
  "description": "Annual city marathon",
  "startDate": "2025-12-15T06:00:00", // IST format
  "endDate": "2025-12-15T12:00:00",
  "venue": "Marine Drive, Mumbai",
  "venueCoordinates": {
    "lat": 18.9432,
    "lng": 72.8236
  },
  "participantLimit": 500
}
```

**IST to UTC Conversion Algorithm:**
```javascript
function convertISTtoUTC(istDateString) {
  // IST is UTC+5:30
  const istDate = new Date(istDateString);
  const utcDate = new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000));
  return utcDate;
}

function convertUTCtoIST(utcDate) {
  const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
  return istDate;
}
```

**Unique ID Generation:**
```javascript
function generateEventUID(coachId, eventName, createdDate) {
  const stateCode = getStateCodeFromCoach(coachId); // e.g., "MH", "GJ"
  const date = new Date(createdDate);
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  
  return `EVT-${stateCode}-${year}${month}${day}-${randomSuffix}`;
  // Example: EVT-MH-251215-5432
}
```

#### 2.2.2 Event Status Computation

**Dynamic Status Algorithm:**
```javascript
function computeEventStatus(event) {
  const now = new Date();
  const startDate = convertUTCtoIST(event.startDate);
  const endDate = convertUTCtoIST(event.endDate);
  
  if (now < startDate) {
    return 'UPCOMING';
  } else if (now >= startDate && now <= endDate) {
    return 'ONGOING';
  } else {
    return 'ENDED';
  }
}
```

#### 2.2.3 Event Registration

**Endpoint:** `POST /api/student/events/:eventId/register`

**Validation Logic:**
```javascript
async function validateRegistration(studentId, eventId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { registrations: true } } }
  });
  
  // Check if event exists and is approved
  if (!event || event.status !== 'APPROVED') {
    throw new Error('Event not available for registration');
  }
  
  // Check if event has started
  const now = new Date();
  if (now >= event.startDate) {
    throw new Error('Cannot register for ongoing or past events');
  }
  
  // Check participant limit
  if (event._count.registrations >= event.participantLimit) {
    throw new Error('Event is full');
  }
  
  // Check if already registered
  const existingReg = await prisma.eventRegistration.findFirst({
    where: { studentId, eventId }
  });
  
  if (existingReg) {
    throw new Error('Already registered for this event');
  }
  
  return true;
}
```

---

### 2.3 Certificate Generation Module

#### 2.3.1 Certificate UID Generation

**Algorithm:**
```javascript
function generateCertificateUID(studentId, eventId, issuanceDate) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true }
  });
  
  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });
  
  const stateCode = extractStateCode(student.user.uniqueId); // e.g., "MH"
  const sportCode = getSportCode(event.sport); // e.g., "RUN" for Running
  const year = new Date(issuanceDate).getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  
  return `STAIRS-CERT-${stateCode}-${sportCode}-${year}-${randomSuffix}`;
  // Example: STAIRS-CERT-MH-RUN-2025-54321
}
```

#### 2.3.2 PDF Generation with Puppeteer

**Implementation:**
```javascript
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateCertificatePDF(certificateData) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Read HTML template
  const templatePath = path.join(__dirname, '../templates/certificate-template.html');
  let htmlContent = fs.readFileSync(templatePath, 'utf8');
  
  // Replace placeholders with actual data
  htmlContent = htmlContent
    .replace('{{studentName}}', certificateData.studentName)
    .replace('{{eventName}}', certificateData.eventName)
    .replace('{{sport}}', certificateData.sport)
    .replace('{{date}}', certificateData.date)
    .replace('{{certificateUID}}', certificateData.uid)
    .replace('{{qrCodeData}}', certificateData.qrCodeData);
  
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  // Generate PDF
  const pdfBuffer = await page.pdf({
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  
  await browser.close();
  
  // Save to file system
  const fileName = `${certificateData.uid}.pdf`;
  const filePath = path.join(__dirname, '../../uploads/certificates/', fileName);
  fs.writeFileSync(filePath, pdfBuffer);
  
  return filePath;
}
```

#### 2.3.3 Certificate Verification

**Endpoint:** `GET /api/certificates/verify/:uid`

**Logic:**
```javascript
async function verifyCertificate(uid) {
  const certificate = await prisma.certificate.findUnique({
    where: { uniqueId: uid },
    include: {
      student: { include: { user: true } },
      event: true
    }
  });
  
  if (!certificate) {
    return { valid: false, message: 'Certificate not found' };
  }
  
  return {
    valid: true,
    data: {
      studentName: certificate.student.user.name,
      eventName: certificate.event.name,
      sport: certificate.event.sport,
      issuedDate: certificate.issuedDate,
      uid: certificate.uniqueId
    }
  };
}
```

---

### 2.4 Payment Processing Module

#### 2.4.1 Razorpay Order Creation

**Implementation:**
```javascript
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function createRazorpayOrder(amount, currency, receipt, notes) {
  const options = {
    amount: amount * 100, // Razorpay expects amount in paise
    currency: currency || 'INR',
    receipt: receipt,
    notes: notes
  };
  
  const order = await razorpay.orders.create(options);
  return order;
}
```

**Endpoint:** `POST /api/payment/create-order`

**Request Body:**
```json
{
  "type": "SUBSCRIPTION|ORDER",
  "amount": 2000,
  "orderId": 123, // For ORDER type
  "subscriptionType": "MONTHLY|ANNUAL" // For SUBSCRIPTION type
}
```

#### 2.4.2 Payment Verification

**Signature Verification Algorithm:**
```javascript
const crypto = require('crypto');

function verifyPaymentSignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  
  return generatedSignature === signature;
}
```

**Endpoint:** `POST /api/payment/verify`

**Request Body:**
```json
{
  "razorpay_order_id": "order_xyz123",
  "razorpay_payment_id": "pay_abc456",
  "razorpay_signature": "abc123xyz456...",
  "type": "SUBSCRIPTION|ORDER",
  "orderId": 123
}
```

**Processing Logic:**
```javascript
async function handlePaymentVerification(data) {
  // Verify signature
  const isValid = verifyPaymentSignature(
    data.razorpay_order_id,
    data.razorpay_payment_id,
    data.razorpay_signature
  );
  
  if (!isValid) {
    throw new Error('Invalid payment signature');
  }
  
  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      razorpayOrderId: data.razorpay_order_id,
      razorpayPaymentId: data.razorpay_payment_id,
      amount: data.amount,
      status: 'SUCCESS',
      type: data.type
    }
  });
  
  // Update related entity
  if (data.type === 'SUBSCRIPTION') {
    await updateCoachSubscription(data.userId, data.subscriptionType);
  } else if (data.type === 'ORDER') {
    await updateOrderStatus(data.orderId, 'PAID');
  }
  
  return payment;
}
```

---

### 2.5 Order Management Module

#### 2.5.1 Order Creation

**Endpoint:** `POST /api/coach/orders`

**Request Body:**
```json
{
  "eventId": 123,
  "certificates": 50,
  "medals": 30,
  "trophies": 5
}
```

**Processing:**
```javascript
async function createOrder(coachId, orderData) {
  // Validate event ownership
  const event = await prisma.event.findUnique({
    where: { id: orderData.eventId }
  });
  
  if (event.createdBy !== coachId) {
    throw new Error('Unauthorized: Event not created by this coach');
  }
  
  // Create order with PENDING status
  const order = await prisma.eventOrder.create({
    data: {
      eventId: orderData.eventId,
      coachId: coachId,
      certificates: orderData.certificates,
      medals: orderData.medals,
      trophies: orderData.trophies,
      status: 'PENDING'
    }
  });
  
  // Notify admin for pricing
  await sendEmailNotification('admin@stairs.com', 'New Order', 
    `Order ${order.id} requires pricing`);
  
  return order;
}
```

#### 2.5.2 Order Pricing (Admin)

**Endpoint:** `PATCH /api/admin/orders/:orderId/price`

**Request Body:**
```json
{
  "certificatePrice": 100,
  "medalPrice": 150,
  "trophyPrice": 500
}
```

**Total Calculation:**
```javascript
function calculateOrderTotal(order, pricing) {
  const certificateTotal = order.certificates * pricing.certificatePrice;
  const medalTotal = order.medals * pricing.medalPrice;
  const trophyTotal = order.trophies * pricing.trophyPrice;
  
  const subtotal = certificateTotal + medalTotal + trophyTotal;
  const tax = subtotal * 0.18; // 18% GST
  const total = subtotal + tax;
  
  return {
    subtotal,
    tax,
    total,
    breakdown: {
      certificates: certificateTotal,
      medals: medalTotal,
      trophies: trophyTotal
    }
  };
}
```

---

### 2.6 Email Service Module

#### 2.6.1 Email Configuration

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

#### 2.6.2 Email Templates

**OTP Email:**
```javascript
function getOTPEmailTemplate(name, otp) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>STAIRS - OTP Verification</h2>
        <p>Hi ${name},</p>
        <p>Your OTP for verification is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <br>
        <p>Thanks,<br>STAIRS Team</p>
      </body>
    </html>
  `;
}
```

**Certificate Issued Email:**
```javascript
function getCertificateEmailTemplate(name, eventName, certificateUID) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>STAIRS - Certificate Issued</h2>
        <p>Hi ${name},</p>
        <p>Congratulations! Your certificate for <strong>${eventName}</strong> has been issued.</p>
        <p>Certificate ID: <strong>${certificateUID}</strong></p>
        <p>You can download your certificate from your dashboard.</p>
        <br>
        <p>Thanks,<br>STAIRS Team</p>
      </body>
    </html>
  `;
}
```

#### 2.6.3 Send Email Function

```javascript
async function sendEmail(to, subject, htmlContent, attachments = []) {
  const mailOptions = {
    from: `"STAIRS Platform" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: subject,
    html: htmlContent,
    attachments: attachments
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
}
```

---

## 3. Database Schema Details

### 3.1 Core Tables

#### User Table
```sql
CREATE TABLE "User" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(15),
  "role" VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'COACH', 'INSTITUTE', 'CLUB', 'ADMIN')),
  "isActive" BOOLEAN DEFAULT true,
  "isEmailVerified" BOOLEAN DEFAULT false,
  "uniqueId" VARCHAR(50) UNIQUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_email ON "User"("email");
CREATE INDEX idx_user_role ON "User"("role");
CREATE INDEX idx_user_uniqueId ON "User"("uniqueId");
```

#### Event Table
```sql
CREATE TABLE "Event" (
  "id" SERIAL PRIMARY KEY,
  "uniqueId" VARCHAR(50) UNIQUE NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "sport" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  "venue" VARCHAR(255) NOT NULL,
  "venueLat" DECIMAL(10, 7),
  "venueLng" DECIMAL(10, 7),
  "participantLimit" INTEGER NOT NULL,
  "status" VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
  "adminNotes" TEXT,
  "createdBy" INTEGER REFERENCES "Coach"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_event_status ON "Event"("status");
CREATE INDEX idx_event_createdBy ON "Event"("createdBy");
CREATE INDEX idx_event_startDate ON "Event"("startDate");
CREATE INDEX idx_event_sport ON "Event"("sport");
```

#### Certificate Table
```sql
CREATE TABLE "Certificate" (
  "id" SERIAL PRIMARY KEY,
  "uniqueId" VARCHAR(50) UNIQUE NOT NULL,
  "studentId" INTEGER REFERENCES "Student"("id") ON DELETE CASCADE,
  "eventId" INTEGER REFERENCES "Event"("id") ON DELETE CASCADE,
  "filePath" VARCHAR(255),
  "issuedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_certificate_studentId ON "Certificate"("studentId");
CREATE INDEX idx_certificate_eventId ON "Certificate"("eventId");
CREATE INDEX idx_certificate_uniqueId ON "Certificate"("uniqueId");
```

### 3.2 Relationship Constraints

**EventRegistration (Many-to-Many between Student and Event):**
```sql
CREATE TABLE "EventRegistration" (
  "id" SERIAL PRIMARY KEY,
  "studentId" INTEGER REFERENCES "Student"("id") ON DELETE CASCADE,
  "eventId" INTEGER REFERENCES "Event"("id") ON DELETE CASCADE,
  "registeredAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("studentId", "eventId")
);

CREATE INDEX idx_registration_studentId ON "EventRegistration"("studentId");
CREATE INDEX idx_registration_eventId ON "EventRegistration"("eventId");
```

**StudentCoachConnection:**
```sql
CREATE TABLE "StudentCoachConnection" (
  "id" SERIAL PRIMARY KEY,
  "studentId" INTEGER REFERENCES "Student"("id") ON DELETE CASCADE,
  "coachId" INTEGER REFERENCES "Coach"("id") ON DELETE CASCADE,
  "status" VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
  "requestedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "respondedAt" TIMESTAMP,
  UNIQUE("studentId", "coachId")
);

CREATE INDEX idx_connection_studentId ON "StudentCoachConnection"("studentId");
CREATE INDEX idx_connection_coachId ON "StudentCoachConnection"("coachId");
CREATE INDEX idx_connection_status ON "StudentCoachConnection"("status");
```

---

## 4. API Endpoint Specifications

### 4.1 Authentication APIs

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | /api/auth/register | No | User registration |
| POST | /api/auth/login/:role | No | User login |
| POST | /api/auth/send-otp | No | Send OTP to email |
| POST | /api/auth/verify-otp | No | Verify OTP |
| POST | /api/auth/forgot-password | No | Request password reset |
| POST | /api/auth/reset-password | No | Reset password with token |

### 4.2 Student APIs

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | /api/student/profile | Yes (Student) | Get student profile |
| PUT | /api/student/profile | Yes (Student) | Update profile |
| GET | /api/student/dashboard | Yes (Student) | Get dashboard data |
| GET | /api/student/events | Yes (Student) | Get all approved events |
| POST | /api/student/events/:id/register | Yes (Student) | Register for event |
| DELETE | /api/student/events/:id/unregister | Yes (Student) | Unregister from event |
| GET | /api/student/my-events | Yes (Student) | Get registered events |
| GET | /api/student/certificates | Yes (Student) | Get all certificates |
| GET | /api/student/coaches | Yes (Student) | Get all coaches |
| POST | /api/student/coaches/:id/connect | Yes (Student) | Send connection request |

### 4.3 Coach APIs

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | /api/coach/profile | Yes (Coach) | Get coach profile |
| PUT | /api/coach/profile | Yes (Coach) | Update profile |
| GET | /api/coach/dashboard | Yes (Coach) | Get dashboard data |
| POST | /api/coach/events | Yes (Coach) | Create event |
| GET | /api/coach/events | Yes (Coach) | Get coach's events |
| GET | /api/coach/events/:id | Yes (Coach) | Get event details |
| PUT | /api/coach/events/:id | Yes (Coach) | Update event |
| DELETE | /api/coach/events/:id | Yes (Coach) | Delete event |
| GET | /api/coach/events/:id/participants | Yes (Coach) | Get event participants |
| POST | /api/coach/events/:id/results | Yes (Coach) | Upload results |
| GET | /api/coach/students | Yes (Coach) | Get connected students |
| POST | /api/coach/students/add | Yes (Coach) | Add student by email |
| POST | /api/coach/students/bulk-upload | Yes (Coach) | Bulk upload students (CSV) |
| POST | /api/coach/orders | Yes (Coach) | Create order |
| GET | /api/coach/orders | Yes (Coach) | Get all orders |
| GET | /api/coach/orders/:id | Yes (Coach) | Get order details |

### 4.4 Admin APIs

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | /api/admin/dashboard | Yes (Admin) | Get admin dashboard |
| GET | /api/admin/events | Yes (Admin) | Get all events |
| GET | /api/admin/events/pending | Yes (Admin) | Get pending events |
| PATCH | /api/admin/events/:id/approve | Yes (Admin) | Approve event |
| PATCH | /api/admin/events/:id/reject | Yes (Admin) | Reject event |
| PATCH | /api/admin/events/:id/suspend | Yes (Admin) | Suspend event |
| GET | /api/admin/orders | Yes (Admin) | Get all orders |
| PATCH | /api/admin/orders/:id/price | Yes (Admin) | Set order pricing |
| POST | /api/admin/certificates/issue | Yes (Admin) | Issue certificates |
| GET | /api/admin/users | Yes (Admin) | Get all users |
| GET | /api/admin/revenue | Yes (Admin) | Get revenue data |

---

## 5. Component Interactions

### 5.1 Frontend Component Hierarchy

```
App.jsx
├── Header.jsx
├── ProtectedRoute.jsx
│   ├── StudentDashboard.jsx
│   │   ├── EventsList.jsx
│   │   │   └── EventCard.jsx
│   │   ├── StudentEvents.jsx
│   │   └── BrowseCoaches.jsx
│   │       └── CoachCard.jsx
│   ├── CoachDashboard.jsx
│   │   ├── EventCreate.jsx
│   │   │   ├── EventForm.jsx
│   │   │   └── GoogleMapsPlacesAutocomplete.jsx
│   │   ├── EventEdit.jsx
│   │   ├── EventOrders.jsx
│   │   │   └── Payment.jsx (Razorpay integration)
│   │   └── CoachParticipantsModal.jsx
│   └── AdminDashboard.jsx
│       ├── AdminEventsManagement.jsx
│       ├── IssueCertificates.jsx
│       ├── AdminOrders.jsx
│       ├── AdminRevenue.jsx
│       └── AllUsers.jsx
└── Footer.jsx
```

### 5.2 Backend Service Layer Architecture

```
Controller Layer (routes/)
├── auth.js
├── student.js
├── coach.js
├── admin.js
├── event.js
├── payment.js
└── certificates.js
        │
        ▼
Service Layer (services/)
├── eventService.js
│   ├── createEvent()
│   ├── updateEvent()
│   ├── getEventById()
│   └── computeEventStatus()
└── certificateService.js
    ├── generateCertificate()
    ├── issueCertificates()
    └── verifyCertificate()
        │
        ▼
Data Access Layer (Prisma Client)
├── prisma.event.create()
├── prisma.event.update()
├── prisma.certificate.create()
└── prisma.user.findUnique()
```

---

## 6. Error Handling Strategy

### 6.1 HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET, PUT, PATCH requests |
| 201 | Successful POST (resource created) |
| 400 | Bad request (validation errors) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 409 | Conflict (duplicate entry) |
| 500 | Internal server error |

### 6.2 Error Response Format

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": {} // Optional additional details
}
```

### 6.3 Async Error Handler Middleware

```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

---

## 7. Security Implementation

### 7.1 Password Hashing

```javascript
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
```

### 7.2 JWT Middleware

```javascript
const jwt = require('jsonwebtoken');

const authMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ success: false, error: 'No token provided' });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ success: false, error: 'Insufficient permissions' });
      }
      
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
  };
};

// Usage
router.get('/profile', authMiddleware(['STUDENT']), getStudentProfile);
```

### 7.3 Input Validation

```javascript
const { body, validationResult } = require('express-validator');

const validateRegistration = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain number'),
  body('phone').isMobilePhone('en-IN').withMessage('Invalid phone number'),
  body('name').notEmpty().withMessage('Name is required')
];

router.post('/register', validateRegistration, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  // Proceed with registration
});
```

---

## 8. Performance Optimizations

### 8.1 Database Query Optimization

**Bad:**
```javascript
const events = await prisma.event.findMany();
// Then loop through events to count registrations
```

**Good:**
```javascript
const events = await prisma.event.findMany({
  include: {
    _count: {
      select: { registrations: true }
    }
  }
});
```

### 8.2 Pagination Implementation

```javascript
async function getPaginatedEvents(page = 1, limit = 10, filters = {}) {
  const skip = (page - 1) * limit;
  
  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where: filters,
      skip,
      take: limit,
      orderBy: { startDate: 'desc' }
    }),
    prisma.event.count({ where: filters })
  ]);
  
  return {
    events,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    }
  };
}
```

### 8.3 Caching Strategy (Future)

```javascript
const redis = require('redis');
const client = redis.createClient();

async function getCachedOrFetch(key, fetchFunction, ttl = 3600) {
  // Try to get from cache
  const cached = await client.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const data = await fetchFunction();
  
  // Store in cache
  await client.setex(key, ttl, JSON.stringify(data));
  
  return data;
}

// Usage
const events = await getCachedOrFetch(
  'approved_events',
  () => prisma.event.findMany({ where: { status: 'APPROVED' } }),
  3600 // 1 hour
);
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```javascript
// Example: Test OTP generation
describe('OTP Generation', () => {
  it('should generate 6-digit OTP', () => {
    const otp = generateOTP();
    expect(otp.toString()).toHaveLength(6);
    expect(otp).toBeGreaterThanOrEqual(100000);
    expect(otp).toBeLessThanOrEqual(999999);
  });
});

// Example: Test password hashing
describe('Password Hashing', () => {
  it('should hash password correctly', async () => {
    const password = 'TestPass123!';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(await comparePassword(password, hash)).toBe(true);
  });
});
```

### 9.2 Integration Tests

```javascript
// Example: Test event creation API
describe('POST /api/coach/events', () => {
  it('should create event with valid data', async () => {
    const token = await getCoachToken();
    const response = await request(app)
      .post('/api/coach/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Event',
        sport: 'Running',
        startDate: '2025-12-15T06:00:00',
        endDate: '2025-12-15T12:00:00',
        venue: 'Test Venue',
        participantLimit: 100
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.event).toHaveProperty('id');
  });
});
```

---

## 10. Deployment Procedures

### 10.1 Environment Variables

```bash
# Backend .env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/stairs_prod
JWT_SECRET=your_jwt_secret_here
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

```bash
# Frontend .env
VITE_API_URL=https://api.stairs.com
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxx
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### 10.2 Build Commands

```bash
# Backend
cd backend
npm install --production
npx prisma generate
npx prisma migrate deploy

# Frontend
cd frontend
npm install
npm run build
```

### 10.3 PM2 Ecosystem File

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'stairs-backend',
      script: 'src/index.js',
      cwd: '/var/www/stairs-new/backend',
      instances: 4,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
```

---

## 11. Appendices

### Appendix A: Useful Queries

**Get events with registration count:**
```sql
SELECT e.*, COUNT(er.id) as registration_count
FROM "Event" e
LEFT JOIN "EventRegistration" er ON e.id = er."eventId"
GROUP BY e.id;
```

**Get students with certificate count:**
```sql
SELECT s.*, u.name, COUNT(c.id) as certificate_count
FROM "Student" s
JOIN "User" u ON s."userId" = u.id
LEFT JOIN "Certificate" c ON s.id = c."studentId"
GROUP BY s.id, u.name;
```

### Appendix B: Related Documents
- High-Level Design (HLD)
- API Reference Documentation
- Database Schema Documentation
- Testing Guide
- Deployment Guide

---

**Document Version:** 1.0  
**Last Updated:** November 2025  
**Next Review:** February 2026
