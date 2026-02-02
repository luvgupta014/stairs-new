# STAIRS Talent Hub – Technical Handover (Developer Guide)

## 1. Overview

### 1.1 Purpose of This Document
This document is a **technical, end-to-end handover** for developers taking ownership of the STAIRS Talent Hub platform. It explains the system architecture, core flows, deployment, and operations so that a new engineer can:
- Set up the project locally
- Understand the main bounded contexts (auth, events, payments, revenue, certificates)
- Safely extend or debug functionality
- Operate and deploy the system in production-like environments

### 1.2 Product Summary
STAIRS Talent Hub is a sports talent management platform connecting:
- **Students / Athletes** – user registration, event discovery & registration, payments, results, and certificates
- **Coaches / Coordinators** – managing events, participants, fees, and event operations
- **Institutes / Clubs** – organizing events and coordinating multiple coaches
- **Admins** – system-wide configuration, event oversight, user management, revenue visibility, and reporting

Core capabilities include:
- Multi-role authentication and authorization
- Event lifecycle management (creation → registration → results → certificates)
- Payment processing via Razorpay (subscriptions + event fees)
- Admin revenue dashboard with event-wise and user-wise revenue + Razorpay commission
- Certificate issuance (participation + winners) with email + notification delivery
- Annual subscription model aligned to the Indian financial year (1 Apr – 31 Mar)

## 2. System Architecture

### 2.1 High-Level Architecture
The system is a **two-tier web application**:
- **Backend** – Node.js + Express + Prisma ORM
- **Frontend** – React + Vite + Tailwind CSS

Supporting services:
- **Razorpay** – external payment gateway
- **Email infrastructure** – SMTP-compatible service for OTPs, resets, certificates, and renewal reminders
- **Scheduler / Cron jobs** – Node-based recurring jobs for subscription reminders and event notifications

### 2.2 Repository Layout (High-Level)

- `backend/` – Express API server, Prisma schema, jobs, utilities
- `frontend/` – React SPA, pages, components, route-level layouts
- `uploads/` – File uploads (e.g., CSVs, certificates, assets)
- `*.md` guides – Deployment, debugging, quick start, and troubleshooting playbooks

You should read `README.md` first for a quick local setup overview.

### 2.3 Core Backend Domains

- **Authentication & Users**
  - Registration, login, OTP verification, password reset
  - Role-based access control (student, coach, admin, etc.)
- **Events & Registrations**
  - Event creation & editing (including mode: Online/Hybrid/Offline)
  - Structured category management (multi-dimension categories)
  - Athlete registrations + status management
- **Payments**
  - Razorpay order creation and verification
  - Event fee payments
  - Subscription payments (annual plans)
- **Revenue & Reporting**
  - Aggregated revenue dashboard
  - Event-wise and user-wise revenue breakdowns
  - Razorpay commission and net revenue calculation
- **Certificates & Notifications**
  - Participation + winner certificates
  - Email and in-app notifications
  - Coordinator notifications for final payments & certificates
- **Scheduling**
  - Subscription renewal reminders based on financial year expiry
  - Event-related notifications (e.g., event starting/ending)

### 2.4 Core Frontend Areas

- **Authentication UI** – login, registration, OTP flows, error handling
- **Dashboards** – Admin, Coach/Coordinator, Student
- **Event Management** – admin event management views, event edit screens
- **Event Discovery & Details** – public event details, registration, category picking
- **Payments UI** – Razorpay checkout integration, success/failure handling
- **Admin Revenue Dashboard** – summary, breakdown tabs, exports
- **Certificates & Notifications** – admin certificate issuance UI, notification controls

## 3. Backend – Detailed Overview

### 3.1 Stack & Entry Point

- **Language/Runtime**: Node.js (18+ recommended)
- **Framework**: Express
- **ORM**: Prisma (targets a SQL database; dev examples often use SQLite, production likely PostgreSQL/MySQL)
- **Entry file**: `backend/src/index.js`
  - Configures Express middlewares
  - Mounts route modules under `/api/...`
  - Starts HTTP server
  - Starts background schedulers (e.g., subscription reminders)

### 3.2 Key Backend Modules

> File paths are relative to `backend/src/` unless otherwise noted.

- `routes/auth.js`
  - **Responsibilities**:
    - Registration, login, logout
    - Email OTP verification
    - Resend verification OTP
    - Forgot-password and reset-password flows
    - Account status checks (e.g., existence + verification state)
  - **Important behaviors**:
    - Returns explicit errors when email sending fails
    - Differentiates between unverified and invalid accounts, enabling UI to route unverified users to verification flows

- `routes/admin.js`
  - **Responsibilities**:
    - Admin CRUD over events and key entities
    - Revenue dashboard endpoint(s), including:
      - Subscriptions breakdown (per user)
      - Coordinator event fees (per coordinator)
      - Athlete event fees (per athlete)
      - Razorpay commission calculation and net revenue
      - Event-wise revenue aggregation
    - Event-wise revenue details endpoint:
      - Given an `eventId`, return user-level paid amounts for that event
    - Coordinator notification flows:
      - "Notify Coordinators for Final Payment & Certificates" with idempotency and preview

- `routes/payment.js`
  - **Responsibilities**:
    - Payment initiation (Razorpay order creation)
    - Payment verification webhook/endpoint
    - Subscription handling:
      - Uses financial year logic for `ANNUAL` plans
      - Sets `subscriptionExpiresAt` according to the current or upcoming financial year

- `routes/coach.js`
  - **Responsibilities**:
    - Coach profile and subscription APIs
    - Consistent financial-year-based subscription expiry handling for coaches

- `config/paymentPlans.js`
  - **Responsibilities**:
    - Defines subscription plans by user type (coach, student, club, etc.)
    - Includes `ANNUAL` options and metadata

- `utils/financialYear.js`
  - **Responsibilities**:
    - Compute financial year start/end dates (1 Apr – 31 Mar)
    - Produce human-readable labels such as `2025-26`
  - **Used by** subscription and revenue logic to ensure consistent period alignment.

- `utils/razorpayCommission.js`
  - **Responsibilities**:
    - Given a gross amount, compute:
      - Razorpay commission (2.5% or configured rate)
      - Net amount after commission
      - Commission rate metadata
  - **Used in** revenue dashboard calculations and exports.

- `utils/emailService.js`
  - **Responsibilities**:
    - Centralized email sending: OTPs, resets, certificates, notifications
    - `sendSubscriptionRenewalReminderEmail` for subscription expiring soon
  - **Notes**:
    - Integration is typically SMTP or a transactional email provider.
    - Errors should be logged and surfaced to calling routes where appropriate.

- `jobs/subscriptionReminderScheduler.js`
  - **Responsibilities**:
    - Periodically scans for annual subscriptions expiring soon
    - Uses `getFinancialYearLabel` and expiry dates to send reminder emails at configured thresholds (e.g., 60/30/15/7/3/1 days)
  - **启动 (start)**:
    - Imported and invoked from `src/index.js` on application startup.

- `prisma/schema.prisma`
  - **Responsibilities**:
    - Defines all database models (User, Coach, Event, Registration, Payment, Certificate, etc.)
    - Source of truth for migrations

### 3.3 Auth & Account Status Logic

Key characteristics:
- JWT-based authentication; tokens commonly include user ID and role
- Middleware checks for:
  - Presence and validity of token
  - Role-based permissions (e.g., `requireAdmin`, `requireCoach`)
- Login & reset flows explicitly handle **unverified** users, enabling:
  - UI to show a "Resend & Verify" button when login fails due to non-verified status
  - Clear separation between wrong credentials vs. pending verification vs. locked accounts

### 3.4 Financial Year & Subscription Model

- Financial year defined as **1 April – 31 March**.
- `getFinancialYearDates` provides boundary dates for a given date.
- `getFinancialYearLabel` returns `YYYY-YY` style label (e.g., `2025-26`).
- Annual subscriptions expire at the end of a financial year regardless of join date, ensuring:
  - Alignment with business reporting cycles
  - Compatibility with the revenue dashboard’s financial-year breakdowns

### 3.5 Revenue Dashboard APIs

The admin revenue APIs provide:
- **Aggregate metrics**:
  - Total revenue across subscriptions and event fees
  - Total Razorpay commission and net revenue
- **Breakdowns**:
  - Subscription revenue per user (admin sees which user paid what)
  - Event fee revenue per coordinator
  - Event fee revenue per athlete
- **Event-wise details**:
  - For a given `eventId`, return list of payers (users) and their amounts
- **Export support**:
  - API payloads designed to support CSV export on the frontend

## 4. Frontend – Detailed Overview

### 4.1 Stack & Bootstrapping

- **Build tool**: Vite
- **View library**: React 18
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **HTTP**: Axios

Frontend configuration is mainly controlled via `.env`:

- `VITE_BACKEND_URL` – base URL for API (e.g., `http://localhost:3000` or production API domain)

### 4.2 Key Pages and Components

> Paths are relative to `frontend/src/`.

- `pages/AdminRevenue.jsx`
  - **Admin revenue dashboard UI**.
  - Presents cards summarizing:
    - Total revenue
    - Subscription revenue
    - Coordinator event fees
    - Athlete event fees
    - Razorpay commission (gross vs net)
  - Tabs:
    - **Individual Breakdowns** – per user/coordinator/athlete
    - **Event-Wise Revenue** – table of events with totals; clicking an event loads user-wise details
  - CSV export leverages backend payloads to output event-wise and user-wise data + Razorpay commission.

- `pages/dashboard/CoachDashboard.jsx`
  - **Coach/coordinator overview**.
  - Displays subscription info with correct **Annual** labeling based on updated payment plan logic.

- `pages/events/PublicEventDetails.jsx`
  - **Public-facing event page**.
  - Emphasizes readability and accessibility:
    - Solid background + high-contrast text in hero area
    - Safe formatter for multi-paragraph and list-style descriptions
  - Dedicated "About this event" section for fully formatted event description.

- `components/CategorySelector.jsx`
  - Admin-side **structured category builder**.
  - Allows:
    - Multiple category groups (e.g., Age Group, Stroke, Distance)
    - Multiple items per group
    - Quick-add presets and live preview
  - Replaces legacy free-form textarea to minimize data inconsistencies.

- `components/CategoryPicker.jsx`
  - Athlete-side **category selection experience**.
  - Dynamically renders admin-defined category groups.
  - Enforces completion of all required category dimensions before form submission.

- `components/EventCard.jsx`
  - Reusable card component for rendering events in lists.
  - `parseCategoryPreview` supports structured category format, ensuring consistent previews across the app.

- `components/AdminCertificateIssuance.jsx`
  - Admin panel for issuing certificates.
  - Tabs for:
    - Participation certificates (all participants)
    - Winner certificates (top placements)
  - Integrates with backend endpoints for:
    - Certificate generation
    - Email dispatch
    - Notification creation
  - Enhanced coordinator notification panel:
    - Preview of target recipients (name, email, already notified flag)
    - Idempotent sending behavior
    - Optional "force resend" with confirmation.

- `pages/dashboard/AdminEventsManagement.jsx`
  - Admin’s central panel for managing events.
  - Uses `CategorySelector` for editing `categoriesAvailable` in the new structured format.

### 4.3 Auth & Error Handling (Frontend)

- **Login layout** composes:
  - Email/password form
  - OTP & verification prompts (when server flags account as unverified)
- **Error popups**:
  - Use structured `parseLoginError` to interpret backend responses
  - Can surface actions such as:
    - "Resend & Verify" when login fails due to missing verification
    - Clear messages for invalid credentials vs locked accounts vs technical failures

### 4.4 Payments & Razorpay Integration (Frontend)

- Frontend creates Razorpay Checkout sessions using keys exposed via configuration.
- After payment:
  - Frontend calls backend `/verify` endpoints with Razorpay payment details.
  - Backend performs server-side verification and updates subscription/event registrations accordingly.

## 5. Environment & Configuration

### 5.1 Backend `.env` (Typical)

Key variables (not exhaustive):
- `DATABASE_URL` – DB connection string
- `JWT_SECRET` – signing secret for JWTs
- `PORT` – backend port (default 3000)
- `FRONTEND_URL` – origin used in CORS configuration
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` – payment gateway credentials
- Email/SMTP configuration (provider-specific)
- Feature toggles (e.g., enabling/disabling schedulers)

### 5.2 Frontend `.env`

- `VITE_BACKEND_URL` – base URL for all API calls
- `VITE_NODE_ENV` – environment label (`development`, `production`, etc.)

## 6. Local Development Workflow

### 6.1 Initial Setup

1. Clone repository and install dependencies in both `backend/` and `frontend/`.
2. Create `.env` files for backend and frontend from their respective examples.
3. Set up the database with Prisma migrations (`npx prisma migrate dev`).
4. Start backend (`npm run dev` in `backend/`) and frontend (`npm run dev` in `frontend/`).

### 6.2 Typical Change Cycle

1. **Model change** (data structure):
   - Modify `prisma/schema.prisma`.
   - Run `npx prisma migrate dev` and `npx prisma generate`.
2. **API change**:
   - Update route handlers in `backend/src/routes/...`.
   - Add tests where possible.
3. **UI change**:
   - Update React components/pages in `frontend/src/...`.
   - Verify via browser and, when relevant, E2E tests.

### 6.3 Testing

- **Backend unit/integration tests** (from `backend/`):
  ```bash
  npm test
  ```

- **Frontend E2E tests** (from project root or as configured):
  ```bash
  npm run test:e2e:headed
  npm run test:e2e:report
  ```

## 7. Deployment & Operations (High-Level)

Detailed step-by-step deployment instructions exist in the root-level `*DEPLOY*` and `*FIX*` documents. Below is the conceptual overview.

### 7.1 Backend Deployment

- Deploy Node/Express API behind a reverse proxy (Apache/Nginx or similar).
- Use **PM2** or a similar process manager to keep the app running.
- Configure environment variables via `.env` or platform secrets.
- Ensure:
  - Correct `FRONTEND_URL` for CORS
  - Valid `RAZORPAY_*` keys (live vs test)
  - Valid SMTP/email credentials
  - Schedulers like `startSubscriptionReminderScheduler` are enabled/disabled appropriately for the environment.

### 7.2 Frontend Deployment

- Build React app:
  ```bash
  cd frontend
  npm run build
  ```
- Serve `dist/` as static content via:
  - Nginx/Apache
  - CDN or static hosting
- Ensure `VITE_BACKEND_URL` points to the deployed backend API.

### 7.3 Logging & Monitoring

- **Backend**:
  - Log to stdout/stderr or files via PM2.
  - Monitor for:
    - 5xx errors
    - Email delivery failures
    - Payment verification errors
- **Frontend**:
  - Monitor browser console errors in QA/UAT.
  - Optionally integrate client-side error tracking (e.g., Sentry).

## 8. Troubleshooting Guide (Developer)

### 8.1 Common Issues

- **Login issues / no OTP emails**:
  - Check email service configuration and logs.
  - Use account-status endpoint (or admin tooling) to confirm user exists and see `isVerified` flag.
  - Verify network tab for API errors on login/reset.

- **Payment succeeds in Razorpay but not in app**:
  - Check backend `/verify` route logs.
  - Ensure Razorpay webhook or verification call is correctly configured.
  - Confirm that signature verification passes and DB is updated accordingly.

- **Revenue dashboard totals look incorrect**:
  - Recompute sample totals directly from DB using Prisma or raw SQL.
  - Check whether financial-year filters are applied as expected.
  - Validate Razorpay commission rate and rounding.

- **Certificates not delivered**:
  - Check certificate issuance endpoint responses (counts of created/emailed).
  - Inspect email logs for failures.
  - Confirm storage/access to generated certificate files.

### 8.2 Debugging Workflow

1. Reproduce the issue locally (if possible) with the same inputs.
2. Inspect frontend **Network** + **Console**.
3. Inspect backend logs for stack traces or warnings.
4. Validate relevant environment variables.
5. Inspect DB state with Prisma or direct SQL queries.
6. Add temporary structured logging around suspected problem areas.

## 9. Git & Collaboration Practices

- Use feature branches: `feature/...`, `fix/...` for isolated work.
- Write descriptive commit messages:
  - `feat: ...`, `fix: ...`, `refactor: ...`, `chore: ...`
- Before merging to main:
  - Run relevant tests.
  - Smoke test the key flows affected by your changes.

## 10. Handover Checklist for a New Developer

Use this checklist to confirm readiness to own the codebase:

- [ ] Able to run backend and frontend locally
- [ ] Understands main roles (student, coach, admin, etc.) and flows
- [ ] Has walked through:
  - [ ] User registration + verification
  - [ ] Login + forgot password
  - [ ] Event creation/editing with multi-category builder
  - [ ] Student registration and payment for an event
  - [ ] Revenue dashboard viewing + CSV export
  - [ ] Certificate issuance (participation + winners)
  - [ ] Coordinator notification flow with preview and force-resend
- [ ] Has access to production-like environment variables (without committing them)
- [ ] Knows where deployment and troubleshooting docs are located

Once all of the above are checked, the new developer should be fully equipped to maintain, extend, and operate STAIRS Talent Hub.

{
  "cells": [],
  "metadata": {
    "language_info": {
      "name": "python"
    }
  },
  "nbformat": 4,
  "nbformat_minor": 2
}