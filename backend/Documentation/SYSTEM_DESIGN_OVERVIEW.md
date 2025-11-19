# STAIRS Platform - System Design Overview (Non-Technical)

This document explains how the main modules of the STAIRS platform interact, using simple language and diagrams for non-technical stakeholders.

---

## Key Modules

1. **Frontend (Website/App)**
   - What users see and use: dashboards, forms, event pages, certificates
   - Accessible by students, coaches, institutes, clubs, and admins

2. **Backend (Server)**
   - Handles all requests from the website/app
   - Processes registrations, event management, payments, certificate generation

3. **Database**
   - Stores all information: users, events, registrations, certificates, payments

4. **External Services**
   - Payment Gateway (Razorpay): For online payments
   - Email Service: For notifications and OTPs
   - Google Maps: For event locations

---

## How Modules Interact

### 1. User Actions
- Users (students, coaches, etc.) use the website/app to:
  - Register and log in
  - Browse and register for events
  - Connect with coaches
  - Make payments
  - Download certificates

### 2. Frontend to Backend
- When a user clicks a button or submits a form, the website/app sends a request to the backend server.
- Example: Student registers for an event → Website sends registration details to backend.

### 3. Backend Processing
- The backend checks the request, processes it, and updates the database.
- Example: Backend saves the event registration in the database and sends a confirmation email.

### 4. Database Storage
- All user actions and platform data are stored securely in the database.
- Example: User profiles, event details, payment records, certificates.

### 5. External Services
- For payments, the backend connects to Razorpay to process transactions.
- For emails, the backend sends notifications (like OTPs, confirmations).
- For event locations, the frontend uses Google Maps to help users find venues.

---

## Simple Interaction Flow

```
[User] → [Frontend] → [Backend] → [Database]
                ↓           ↓
         [Google Maps]  [Razorpay]
                ↓           ↓
            [Email Service]
```

- **User** interacts with the website/app (Frontend)
- **Frontend** sends requests to the **Backend**
- **Backend** updates the **Database** and connects to **External Services**
- **External Services** (Razorpay, Email, Maps) help with payments, notifications, and locations

---

## Example Scenarios

### Event Registration
1. Student browses events on the website
2. Clicks "Register" for an event
3. Website sends registration info to backend
4. Backend saves registration in database
5. Confirmation email sent to student

### Certificate Download
1. Student completes an event
2. Coach uploads results
3. Admin approves and issues certificates
4. Student receives email notification
5. Student downloads certificate from dashboard

### Payment for Subscription
1. Coach chooses subscription plan
2. Website opens Razorpay payment window
3. Coach completes payment
4. Backend verifies payment and updates database
5. Confirmation email sent to coach

---

## Visual Diagram (Simple)

```
┌────────────┐      ┌────────────┐      ┌────────────┐
│   User     │ ---> │  Website   │ ---> │  Server    │
└────────────┘      └────────────┘      └────────────┘
                                         │
                                         ▼
                                 ┌────────────┐
                                 │ Database   │
                                 └────────────┘
                                         │
                                         ▼
                          ┌────────────┬────────────┐
                          │ Razorpay   │ Email      │
                          └────────────┴────────────┘
                                         │
                                         ▼
                                 ┌────────────┐
                                 │ Google Maps│
                                 └────────────┘
```

---

## Summary
- STAIRS modules work together to provide a smooth experience for all users
- Website/app is the main entry point
- Backend server manages all logic and data
- Database stores everything securely
- External services handle payments, emails, and maps

**This overview is designed for non-technical readers to understand how STAIRS works behind the scenes.**

---

**Last Updated:** November 2025
