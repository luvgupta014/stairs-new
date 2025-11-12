# STAIRS Talent Hub - Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Module Architecture](#module-architecture)
4. [Database Schema](#database-schema)
5. [API Routes](#api-routes)
6. [Services](#services)
7. [Authentication & Authorization](#authentication--authorization)
8. [Dashboard Features](#dashboard-features)
9. [Integration Flow](#integration-flow)

---

## System Overview

STAIRS (Sports Talent Assessment & Information Reporting System) is a comprehensive platform for managing sports events, student-coach connections, certificates, and tournament orders in India.

### Key Stakeholders
- **Students**: Register for events, connect with coaches, receive certificates
- **Coaches**: Create events, manage students, order certificates/medals
- **Institutes**: Manage institutional events and students
- **Clubs**: Organize club-level events and memberships
- **Admins**: Moderate events, manage users, oversee platform operations

---

## Technology Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Email**: Nodemailer
- **Payment**: Razorpay
- **Certificate Generation**: Puppeteer (HTML to PDF)

### Frontend
- **Framework**: React.js
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **HTTP Client**: Axios
- **Maps**: Google Maps API

---

## Module Architecture

### 1. Authentication Module (`/src/routes/auth.js`)

**Purpose**: Handle user registration, login, OTP verification, and password management.

#### Sub-modules:
- **Registration**
  - Student Registration
  - Coach Registration (requires payment)
  - Institute Registration
  - Club Registration
  
- **Login**
  - Email/Phone-based login
  - Role-based authentication
  - JWT token generation

- **OTP Management**
  - Send OTP (registration, login, password reset)
  - Verify OTP
  - OTP expiration handling

- **Password Management**
  - Password reset via OTP
  - Password change for authenticated users

#### Key Features:
- Multi-role registration support
- Unique ID generation for each user type
- Profile completion tracking
- Payment verification for coaches
- Email/SMS OTP delivery

---

### 2. Coach Module (`/src/routes/coach.js`)

**Purpose**: Manage coach-specific operations including events, students, and orders.

#### Sub-modules:

##### 2.1 Profile Management
- Get coach profile
- Update coach profile
- Payment status tracking
- Subscription management (Monthly/Annual)

##### 2.2 Event Management
- **Create Events**
  - IST timezone handling
  - Automatic UID generation (EVT-XXXX-SPORT-STATE-MMYYYY)
  - Admin approval required
  
- **Update Events**
  - Date/time modification (IST)
  - Participant limits
  - Venue/location updates
  
- **Delete/Cancel Events**
  - Soft delete with status change
  - Participant notifications

- **View Events**
  - Dynamic status computation (upcoming/ongoing/ended)
  - Registration statistics

##### 2.3 Student Management
- View connected students
- Accept/reject connection requests
- Bulk student upload via CSV
- Manual student addition
- Student profile completion tracking

##### 2.4 Order Management
- Create certificate/medal/trophy orders
- View order history
- Track order status (pending → priced → paid → completed)
- Payment integration with Razorpay

##### 2.5 Dashboard Analytics
- Total students count
- Events statistics
- Upcoming events
- Recent registrations
- Payment status
- Subscription expiry tracking

#### Key Routes:
```
GET    /api/coach/profile
PUT    /api/coach/profile
GET    /api/coach/dashboard
GET    /api/coach/events
POST   /api/coach/events
PUT    /api/coach/events/:eventId
DELETE /api/coach/events/:eventId
GET    /api/coach/students
POST   /api/coach/students/add
POST   /api/coach/students/bulk-upload
GET    /api/coach/connection-requests
PUT    /api/coach/connection-requests/:connectionId
POST   /api/coach/events/:eventId/orders
GET    /api/coach/events/:eventId/orders
POST   /api/coach/create-payment-order
POST   /api/coach/verify-payment
```

---

### 3. Student Module (`/src/routes/student.js`)

**Purpose**: Manage student-specific operations including event registration and coach connections.

#### Sub-modules:

##### 3.1 Profile Management
- Get student profile
- Update student profile
- Profile completion percentage
- Sport preferences (primary, secondary, tertiary)

##### 3.2 Event Registration
- Browse available events (APPROVED/ACTIVE only)
- Register for events
- Unregister from events
- View registration history
- Event status tracking

##### 3.3 Coach Connections
- Browse available coaches
- Send connection requests
- View connected coaches
- Connection status (pending/accepted/rejected)

##### 3.4 Certificate Management
- View earned certificates
- Download certificates
- Certificate verification via UID

##### 3.5 Dashboard
- Profile completion status
- Upcoming registered events
- Connected coaches count
- Recent certificates
- Registration statistics

#### Key Routes:
```
GET    /api/student/profile
PUT    /api/student/profile
GET    /api/student/dashboard
GET    /api/student/events
POST   /api/student/events/:eventId/register
DELETE /api/student/events/:eventId/register
GET    /api/student/coaches
POST   /api/student/coaches/:coachId/connect
GET    /api/student/certificates
```

---

### 4. Admin Module (`/src/routes/admin.js`)

**Purpose**: Platform administration, moderation, and oversight.

#### Sub-modules:

##### 4.1 Event Moderation
- View all events
- Approve events
- Reject events with notes
- Suspend events
- Restart suspended events
- View event participants

##### 4.2 Order Management
- View all orders
- Set pricing for certificates/medals/trophies
- Track payment status
- Mark orders as completed
- View order details

##### 4.3 Certificate Management
- Issue certificates to students
- Bulk certificate issuance
- Certificate verification
- Regenerate certificates
- View certificate history

##### 4.4 User Management
- View all users (students, coaches, institutes, clubs)
- User statistics
- Profile verification
- Account activation/deactivation

##### 4.5 Dashboard Analytics
- Total users by role
- Events statistics (pending/approved/rejected)
- Revenue tracking
- Recent activities
- System health metrics

##### 4.6 Notifications
- System-wide announcements
- Event approval notifications
- Order status updates
- Payment confirmations

#### Key Routes:
```
GET    /api/admin/dashboard
GET    /api/admin/profile
GET    /api/admin/events
PUT    /api/admin/events/:eventId/moderate
GET    /api/admin/events/:eventId/participants
GET    /api/admin/orders
PUT    /api/admin/orders/:orderId/price
PUT    /api/admin/orders/:orderId/complete
POST   /api/admin/certificates/issue
GET    /api/admin/users
GET    /api/admin/notifications
```

---

## Date/Time Handling

### IST (Indian Standard Time) Strategy

**Problem**: Database stores UTC, users expect IST (UTC+5:30)

**Solution**:
1. **Frontend Input**: User enters IST time (e.g., 10:00 AM)
2. **Backend Parsing**: Append `+05:30` to indicate IST before storing
3. **Database Storage**: Stores as UTC (e.g., 4:30 AM UTC)
4. **Backend Retrieval**: Convert UTC to IST before sending to frontend
5. **Frontend Display**: Show IST time (e.g., 10:00 AM)

**Implementation**:
```javascript
// Backend: Parse IST input
const parseAsIST = (dateString) => {
  if (!dateString.includes('+') && !dateString.includes('Z')) {
    return new Date(dateString + '+05:30');
  }
  return new Date(dateString);
};

// Backend: Format to IST for response
const formatDateAsIST = (date) => {
  const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  return istDate.toISOString().substring(0, 19);
};
```

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { },
  "message": "Operation successful",
  "statusCode": 200
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [],
  "statusCode": 400
}
```

---

## Security Measures

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Tokens**: Secure, expiring tokens
3. **Input Validation**: Request validation middleware
4. **SQL Injection Prevention**: Prisma ORM parameterized queries
5. **XSS Prevention**: Input sanitization
6. **CORS**: Configured allowed origins
7. **Rate Limiting**: API request limits
8. **File Upload Validation**: Type and size restrictions
9. **Payment Security**: Razorpay signature verification
10. **Environment Variables**: Sensitive data protection

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Maintained By**: STAIRS Development Team
