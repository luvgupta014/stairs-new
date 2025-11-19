# STAIRS Platform - Design Document

## 1. Overview
STAIRS is a web-based platform for managing sports events, registrations, certificates, and payments. It supports multiple user roles: students, coaches, institutes, clubs, and admins.

---

## 2. High-Level Architecture

- **Frontend (React + Vite):** User interface for all roles. Handles dashboards, forms, event browsing, payments, and certificate downloads.
- **Backend (Node.js + Express):** API server for business logic, authentication, event management, payments, and certificate generation.
- **Database (PostgreSQL):** Stores all persistent data: users, events, registrations, orders, certificates, payments.
- **External Services:**
  - **Razorpay:** Payment gateway for subscriptions and orders
  - **Email Service:** Sends notifications, OTPs, and certificates
  - **Google Maps API:** Venue search and location display

---

## 3. Module Breakdown

### Frontend Modules
- **Auth Pages:** Login, registration, OTP verification, password reset
- **Dashboards:** Student, Coach, Institute, Club, Admin
- **Event Management:** Create, edit, view, register, upload results
- **Order & Payment:** Place orders, make payments, view history
- **Certificate Management:** Download, verify certificates
- **Profile Management:** Update personal and sports info
- **Google Maps Integration:** Venue search and display

### Backend Modules
- **Authentication:** JWT-based login, registration, OTP, password reset
- **Event Management:** CRUD for events, approval workflow, participant management
- **Order & Payment:** Order creation, pricing, payment verification
- **Certificate Generation:** PDF creation, UID assignment, download, verification
- **User Management:** CRUD for all user types, profile updates
- **Email Notifications:** OTP, registration, event updates, certificate issuance
- **IST Date/Time Handling:** All dates/times stored in UTC, displayed in IST

---

## 4. Data Flow Example

1. User logs in via frontend
2. Frontend sends login request to backend
3. Backend verifies credentials, returns JWT
4. User browses events, registers for one
5. Registration sent to backend, saved in database
6. Confirmation email sent to user
7. Coach creates event, submits for admin approval
8. Admin reviews and approves event
9. Coach uploads results, admin issues certificates
10. Students download certificates from dashboard

---

## 5. Security
- All sensitive data stored securely
- Payments handled via trusted gateway (Razorpay)
- Email verification and OTP for account protection
- Role-based access control for features

---

## 6. Visual Diagram

```
User (Student/Coach/Admin)
        │
        ▼
STAIRS Website (Dashboard, Forms, Maps)
        │
        ▼
Server (Processes requests, manages data)
        │
        ▼
Database (Stores info)
        │
        ├── Razorpay (Payments)
        ├── Email Service (Notifications)
        └── Google Maps (Venues)
```

---

_Last updated: November 2025_
