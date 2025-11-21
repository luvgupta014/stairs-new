# STAIRS Platform - High-Level Design (HLD)

---

## 1. Executive Summary

STAIRS is a comprehensive web-based platform designed to streamline sports event management across India. It connects students, coaches, institutes, clubs, and administrators in a unified ecosystem for event organization, registration, certificate issuance, and payment processing.

## 2. Business Objectives

### Primary Goals
1. Simplify sports event creation and management
2. Enable seamless student registration and participation tracking
3. Automate digital certificate generation and verification
4. Facilitate secure payment processing for subscriptions and orders
5. Provide comprehensive dashboards for all stakeholder types


## 3. System Architecture Overview

### 3.1 Architecture Style
**Three-Tier Architecture** with external service integrations

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION TIER                        │
│  React 18 + Vite + Tailwind CSS                            │
│  - Student/Coach/Admin Dashboards                          │
│  - Event Management UI                                      │
│  - Payment Integration UI                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS/REST API
┌──────────────────────┴──────────────────────────────────────┐
│                    APPLICATION TIER                         │
│  Node.js + Express.js                                       │
│  - Authentication & Authorization                           │
│  - Business Logic Layer                                     │
│  - Event Management Engine                                  │
│  - Certificate Generation Service                           │
│  - Payment Processing Service                               │
└──────────────────────┬──────────────────────────────────────┘
                       │ Prisma ORM
┌──────────────────────┴──────────────────────────────────────┐
│                    DATA TIER                                │
│  PostgreSQL 14                                              │
│  - User Data                                                │
│  - Event Data                                               │
│  - Transaction Records                                      │
│  - Certificate Records                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                        │
│  - Razorpay (Payment Gateway)                              │
│  - Nodemailer (Email Service)                              │
│  - Google Maps API (Location Services)                     │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 18.x | UI Framework |
| | Vite | 7.x | Build Tool |
| | Tailwind CSS | 3.x | Styling |
| | React Router | 6.x | Routing |
| | Axios | 1.x | HTTP Client |
| **Backend** | Node.js | 18.x | Runtime |
| | Express.js | 4.x | Web Framework |
| | Prisma | 5.x | ORM |
| **Database** | PostgreSQL | 14.x | Primary Database |
| **Process Manager** | PM2 | 5.x | Process Management |
| **Web Server** | Nginx | 1.22.x | Reverse Proxy |
| **External APIs** | Razorpay | - | Payment Gateway |
| | Google Maps | - | Location Services |
| | Nodemailer | - | Email Service |

---

## 4. System Components

### 4.1 User Management Module
**Purpose:** Handle user authentication, authorization, and profile management

**Key Features:**
- Multi-role authentication (Student, Coach, Institute, Club, Admin)
- JWT-based session management
- OTP verification via email
- Password reset functionality
- Profile completion tracking

**Data Entities:**
- User (base entity with role)
- Student, Coach, Institute, Club (role-specific profiles)

### 4.2 Event Management Module
**Purpose:** Complete lifecycle management of sports events

**Key Features:**
- Event creation with IST timezone handling
- Admin approval workflow (Pending → Approved/Rejected)
- Student registration management
- Venue search via Google Maps integration
- Dynamic event status (Upcoming/Ongoing/Ended)
- Participant limit enforcement

**Data Entities:**
- Event
- EventRegistration
- EventResultFile

### 4.3 Certificate Management Module
**Purpose:** Digital certificate generation, distribution, and verification

**Key Features:**
- PDF certificate generation using Puppeteer
- Unique certificate ID (STAIRS-CERT-XXX-XXX)
- QR code generation for verification
- Bulk certificate issuance
- Download and email delivery
- Public verification portal

**Data Entities:**
- Certificate

### 4.4 Order & Payment Module
**Purpose:** Handle certificate/medal/trophy orders and payment processing

**Key Features:**
- Order creation for events
- Admin pricing workflow
- Razorpay payment integration
- Payment verification
- Subscription management
- Transaction history

**Data Entities:**
- EventOrder
- Payment

### 4.5 Connection Management Module
**Purpose:** Facilitate student-coach relationships

**Key Features:**
- Connection request workflow
- Accept/reject functionality
- Bulk student import (CSV)
- Connection listing

**Data Entities:**
- StudentCoachConnection

---

## 5. Data Flow Diagrams

### 5.1 Student Event Registration Flow

```
┌─────────┐
│ Student │
└────┬────┘
     │ 1. Browse Events
     ▼
┌─────────────┐
│   Frontend  │
└────┬────────┘
     │ 2. GET /api/events
     ▼
┌─────────────┐
│   Backend   │
└────┬────────┘
     │ 3. Query Events
     ▼
┌─────────────┐
│  Database   │
└────┬────────┘
     │ 4. Return Events (Status=APPROVED)
     ▼
┌─────────────┐
│   Backend   │
└────┬────────┘
     │ 5. Return JSON
     ▼
┌─────────────┐
│   Frontend  │ 6. Display Events
└────┬────────┘
     │ 7. Click Register
     ▼
┌─────────────┐
│   Frontend  │
└────┬────────┘
     │ 8. POST /api/student/events/:id/register
     ▼
┌─────────────┐
│   Backend   │
└────┬────────┘
     │ 9. Validate & Create Registration
     ▼
┌─────────────┐
│  Database   │
└────┬────────┘
     │ 10. Save Registration
     ▼
┌─────────────┐
│   Backend   │
└────┬────┬───┘
     │    │ 11. Send Confirmation Email
     │    ▼
     │ ┌──────────────┐
     │ │Email Service │
     │ └──────────────┘
     │ 12. Return Success
     ▼
┌─────────────┐
│   Frontend  │ 13. Show Confirmation
└─────────────┘
```

### 5.2 Payment Processing Flow

```
┌─────────┐
│  Coach  │
└────┬────┘
     │ 1. Create Order
     ▼
┌─────────────┐
│   Frontend  │ 2. POST /api/coach/orders
└────┬────────┘
     │
     ▼
┌─────────────┐
│   Backend   │ 3. Create Order (status=PENDING)
└────┬────────┘
     │
     ▼
┌─────────────┐
│  Database   │ 4. Save Order
└─────────────┘
     │
     ▼
┌─────────┐
│  Admin  │ 5. Review Order
└────┬────┘
     │ 6. Set Pricing
     ▼
┌─────────────┐
│   Backend   │ 7. Update Order (status=PRICED)
└────┬────────┘
     │
     ▼
┌─────────┐
│  Coach  │ 8. Receives Notification
└────┬────┘
     │ 9. Initiate Payment
     ▼
┌─────────────┐
│   Frontend  │ 10. POST /api/payment/create-order
└────┬────────┘
     │
     ▼
┌─────────────┐
│   Backend   │ 11. Create Razorpay Order
└────┬────────┘
     │
     ▼
┌─────────────┐
│  Razorpay   │ 12. Return Order ID
└────┬────────┘
     │
     ▼
┌─────────────┐
│   Frontend  │ 13. Open Razorpay Modal
└────┬────────┘
     │ 14. Coach Completes Payment
     ▼
┌─────────────┐
│  Razorpay   │ 15. Process Payment
└────┬────────┘
     │ 16. Payment Success
     ▼
┌─────────────┐
│   Frontend  │ 17. POST /api/payment/verify
└────┬────────┘
     │
     ▼
┌─────────────┐
│   Backend   │ 18. Verify Signature
└────┬────────┘
     │ 19. Update Order (status=PAID)
     ▼
┌─────────────┐
│  Database   │ 20. Save Payment Record
└─────────────┘
```

### 5.3 Certificate Generation Flow

```
┌─────────┐
│  Coach  │ 1. Upload Results (PDF/Excel)
└────┬────┘
     │
     ▼
┌─────────────┐
│   Backend   │ 2. Save Result File
└────┬────────┘
     │
     ▼
┌─────────┐
│  Admin  │ 3. Review Results
└────┬────┘
     │ 4. Select Event & Students
     ▼
┌─────────────┐
│   Frontend  │ 5. POST /api/admin/certificates/issue
└────┬────────┘
     │
     ▼
┌─────────────┐
│   Backend   │ 6. For Each Student:
└────┬────────┘
     │ 7. Generate Unique ID (STAIRS-CERT-XXX-XXX)
     ▼
┌─────────────┐
│  Puppeteer  │ 8. Render HTML Template
└────┬────────┘
     │ 9. Generate PDF
     ▼
┌─────────────┐
│File System  │ 10. Save PDF to uploads/certificates/
└────┬────────┘
     │
     ▼
┌─────────────┐
│  Database   │ 11. Save Certificate Record
└────┬────────┘
     │
     ▼
┌─────────────┐
│Email Service│ 12. Send Email to Student
└─────────────┘
```

