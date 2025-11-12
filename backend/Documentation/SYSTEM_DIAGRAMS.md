# STAIRS Platform - System Architecture Diagrams

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Student    │  │    Coach     │  │    Admin     │           │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Events     │  │ Certificates │  │   Profile    │          │
│  │   Listing    │  │    View      │  │ Management   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST API
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js/Express)                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Authentication Middleware (JWT)             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌──────────┬─────────┬─────────┬──────────┬──────────┐         │
│  │  Auth    │ Student │ Coach   │ Admin    │ Event    │         │
│  │  Routes  │ Routes  │ Routes  │ Routes   │ Routes   │         │
│  └──────────┴─────────┴─────────┴──────────┴──────────┘         │
│                              │                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Controllers Layer                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Services Layer                         │   │
│  │  ┌────────────┐  ┌──────────────┐  ┌────────────────┐    │   │
│  │  │   Event    │  │ Certificate  │  │   Email        │    │   │
│  │  │  Service   │  │   Service    │  │  Service       │    │   │
│  │  └────────────┘  └──────────────┘  └────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Prisma ORM (Database Layer)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
┌──────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                      │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐      │
│  │  Users  │  │ Events  │  │  Orders │  │ Certificates│      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────┘      │
│                                                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐       │
│  │Students │  │ Coaches │  │  Event  │  │    Event    │       │
│  │         │  │         │  │  Regs   │  │   Results   │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────┘       │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                     External Services                         │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Razorpay │  │ Nodemailer│ │ Puppeteer│  │  Google  │       │
│  │ Payment  │  │   Email   │ │   PDF    │  │   Maps   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└───────────────────────────────────────────────────────────────┘
```

## 2. Event Creation & Approval Flow

```
Coach creates event → Event stored (PENDING)
         ↓
Admin receives notification
         ↓
Admin approves/rejects
         ↓
Coach receives notification
         ↓
If approved → Event visible to students
         ↓
Student registers
         ↓
Event occurs → Coach uploads results
         ↓
Admin issues certificates
         ↓
Student receives certificate
```

## 3. Payment & Order Flow

```
Coach creates order → Admin sets pricing
         ↓
Coach initiates payment → Razorpay gateway
         ↓
Payment verified → Order status updated
         ↓
Admin marks complete → Certificates issued
```

## 4. Database Entity Relationships

```
User (1) ──── (1) Student/Coach/Institute/Club
Coach (1) ──── (M) Events
Event (1) ──── (M) EventRegistrations
Event (1) ──── (M) Certificates
Event (1) ──── (M) EventOrders
Student (1) ──── (M) EventRegistrations
Student (1) ──── (M) Certificates
```

---

This architecture documentation provides a comprehensive visual representation of how all modules, services, and components interact within the STAIRS platform.
