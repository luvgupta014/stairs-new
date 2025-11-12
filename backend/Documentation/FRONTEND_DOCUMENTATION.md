# STAIRS Platform - Frontend Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Pages & Components](#pages--components)
5. [Routing](#routing)
6. [State Management](#state-management)
7. [API Integration](#api-integration)
8. [Authentication Flow](#authentication-flow)
9. [Key Features](#key-features)

---

## Overview

The STAIRS frontend is a React-based single-page application (SPA) built with Vite, providing an intuitive interface for students, coaches, institutes, clubs, and admins to interact with the sports event management platform.

---

## Technology Stack

- **Framework**: React 18
- **Build Tool**: Vite 7.x
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Maps**: Google Maps JavaScript API
- **Payment**: Razorpay SDK
- **State Management**: React Context API
- **Form Handling**: Native React state + controlled components

---

## Project Structure

```
frontend/src/
├── api.js                          # Axios instance & API configuration
├── App.jsx                         # Main app component & routing
├── main.jsx                        # Entry point
├── components/                     # Reusable UI components
│   ├── Header.jsx                  # Navigation header
│   ├── Footer.jsx                  # Footer component
│   ├── ProtectedRoute.jsx          # Auth route wrapper
│   ├── EventCard.jsx               # Event display card
│   ├── EventForm.jsx               # Event create/edit form
│   ├── Modal.jsx                   # Generic modal component
│   ├── Payment.jsx                 # Payment interface
│   ├── Spinner.jsx                 # Loading spinner
│   └── ...                         # Other reusable components
├── pages/                          # Page components
│   ├── Landing.jsx                 # Landing page
│   ├── auth/                       # Authentication pages
│   │   ├── StudentLogin.jsx
│   │   ├── CoachLogin.jsx
│   │   ├── AdminLogin.jsx
│   │   ├── ForgotPassword.jsx
│   │   └── VerifyOtp.jsx
│   ├── dashboard/                  # Dashboard pages
│   │   ├── StudentDashboard.jsx
│   │   ├── CoachDashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── InstituteDashboard.jsx
│   │   └── ClubDashboard.jsx
│   ├── events/                     # Event management pages
│   │   ├── Events.jsx              # Event listing
│   │   ├── EventDetails.jsx        # Event details view
│   │   ├── EventCreate.jsx         # Create new event
│   │   ├── EventEdit.jsx           # Edit existing event
│   │   ├── EventOrders.jsx         # Order management
│   │   └── EventResultUpload.jsx   # Upload results
│   ├── StudentRegister.jsx         # Student registration
│   ├── CoachRegister.jsx           # Coach registration
│   ├── StudentProfile.jsx          # Student profile
│   ├── CoachProfile.jsx            # Coach profile
│   └── ...                         # Other pages
├── contexts/                       # React Context providers
│   ├── AuthContext.jsx             # Authentication context
│   └── SimpleAuthContext.jsx       # Simplified auth state
├── hooks/                          # Custom React hooks
│   └── usePaymentStatus.js         # Payment status hook
├── utils/                          # Utility functions
│   ├── errorUtils.js               # Error handling
│   └── stateCodes.js               # Indian state codes
└── config/                         # Configuration files
```

---

## Pages & Components

### 1. Authentication Pages (`pages/auth/`)

#### StudentLogin.jsx
- **Purpose**: Student login interface
- **Features**:
  - Email/phone login
  - OTP verification flow
  - Password reset link
- **API Calls**: 
  - `POST /api/auth/login`
  - `POST /api/auth/send-otp`
  - `POST /api/auth/verify-otp`

#### CoachLogin.jsx
- **Purpose**: Coach login interface
- **Features**:
  - Email/phone login
  - Payment status check
  - Subscription expiry warning
- **API Calls**: `POST /api/auth/login`

#### AdminLogin.jsx
- **Purpose**: Admin login interface
- **Features**: Secure admin-only authentication
- **API Calls**: `POST /api/auth/login`

#### VerifyOtp.jsx
- **Purpose**: OTP verification page
- **Features**:
  - 6-digit OTP input
  - Resend OTP functionality
  - Timer countdown
- **API Calls**: 
  - `POST /api/auth/verify-otp`
  - `POST /api/auth/send-otp` (resend)

#### ForgotPassword.jsx
- **Purpose**: Password reset request
- **Features**:
  - Email/phone input
  - OTP generation
  - New password setup
- **API Calls**:
  - `POST /api/auth/send-otp`
  - `POST /api/auth/reset-password`

---

### 2. Registration Pages

#### StudentRegister.jsx
- **Purpose**: Student registration form
- **Features**:
  - Personal details (name, DOB, Aadhaar)
  - School/club affiliation
  - Sport preferences (primary, secondary, tertiary)
  - Email verification
  - Profile completion tracking
- **Form Fields**:
  - Name, Email, Phone
  - Date of Birth
  - Aadhaar Number
  - School Name
  - State, City, Pincode
  - Primary/Secondary/Tertiary Sports
- **API Calls**: `POST /api/auth/register`

#### CoachRegister.jsx
- **Purpose**: Coach registration with payment
- **Features**:
  - Professional details
  - Specialization & experience
  - Payment integration (Razorpay)
  - Subscription selection (Monthly/Annual)
- **Form Fields**:
  - Name, Email, Phone
  - Specialization
  - Experience (years)
  - State, City
  - Subscription Type
- **Payment Flow**:
  1. Fill registration form
  2. Choose subscription (₹2,000/month or ₹20,000/year)
  3. Razorpay payment modal
  4. Payment verification
  5. Account activation
- **API Calls**: 
  - `POST /api/auth/register`
  - `POST /api/payment/create-order`
  - `POST /api/payment/verify-payment`

#### InstituteRegister.jsx
- **Purpose**: Institute registration
- **Features**: Institution-specific fields, accreditation info
- **API Calls**: `POST /api/auth/register`

#### ClubRegister.jsx
- **Purpose**: Club registration
- **Features**: Club details, membership info
- **API Calls**: `POST /api/auth/register`

---

### 3. Dashboard Pages (`pages/dashboard/`)

#### StudentDashboard.jsx
- **Purpose**: Student home dashboard
- **Layout**:
  ```
  ┌─────────────────────────────────────┐
  │  Profile Completion: 85%            │
  │  [Complete Profile Button]          │
  ├─────────────────────────────────────┤
  │  My Events (3)                      │
  │  ┌─────────┐ ┌─────────┐           │
  │  │ Event 1 │ │ Event 2 │           │
  │  └─────────┘ └─────────┘           │
  ├─────────────────────────────────────┤
  │  My Coaches (2)                     │
  │  My Certificates (5)                │
  └─────────────────────────────────────┘
  ```
- **Sections**:
  - Profile completion status
  - Upcoming registered events
  - Connected coaches
  - Recent certificates
  - Quick actions (browse events, find coaches)
- **API Calls**: `GET /api/student/dashboard`

#### CoachDashboard.jsx
- **Purpose**: Coach control panel
- **Layout**:
  ```
  ┌─────────────────────────────────────┐
  │  Payment Status: Active             │
  │  Subscription Expires: 30 Jan 2026  │
  ├─────────────────────────────────────┤
  │  My Events (12)                     │
  │  [Create Event] [View All]          │
  │  ┌─────────┐ ┌─────────┐           │
  │  │Upcoming │ │ Ongoing │           │
  │  │Events(5)│ │Events(2)│           │
  │  └─────────┘ └─────────┘           │
  ├─────────────────────────────────────┤
  │  My Students (45)                   │
  │  Connection Requests (3)            │
  │  Recent Orders (2)                  │
  └─────────────────────────────────────┘
  ```
- **Sections**:
  - Payment & subscription status
  - Event statistics (upcoming/ongoing/completed)
  - Student management
  - Connection requests
  - Orders & payments
  - Revenue tracking
- **API Calls**: `GET /api/coach/dashboard`

#### AdminDashboard.jsx
- **Purpose**: Admin control center
- **Layout**:
  ```
  ┌─────────────────────────────────────┐
  │  Platform Statistics                │
  │  ┌────────┐ ┌────────┐ ┌────────┐  │
  │  │Students│ │Coaches │ │ Events │  │
  │  │  1,234 │ │   156  │ │   345  │  │
  │  └────────┘ └────────┘ └────────┘  │
  ├─────────────────────────────────────┤
  │  Pending Actions                    │
  │  • Events awaiting approval (12)    │
  │  • Orders pending pricing (5)       │
  │  • Certificates to issue (8)        │
  ├─────────────────────────────────────┤
  │  Revenue Dashboard                  │
  │  Today: ₹15,000 | Month: ₹4,50,000 │
  └─────────────────────────────────────┘
  ```
- **Sections**:
  - User statistics (all roles)
  - Events pending approval
  - Orders management
  - Revenue analytics
  - Certificate issuance
  - System notifications
- **API Calls**: `GET /api/admin/dashboard`

#### InstituteDashboard.jsx
- **Purpose**: Institute dashboard
- **Features**: Institutional event management, student tracking
- **API Calls**: `GET /api/institute/dashboard`

#### ClubDashboard.jsx
- **Purpose**: Club dashboard
- **Features**: Club event management, membership tracking
- **API Calls**: `GET /api/club/dashboard`

---

### 4. Event Pages (`pages/events/`)

#### Events.jsx
- **Purpose**: Event listing & search
- **Features**:
  - Filter by sport, location, date
  - Search functionality
  - Pagination
  - Event status badges
  - Quick registration
- **Layout**:
  ```
  ┌─────────────────────────────────────┐
  │  [Search] [Sport▼] [State▼] [Date▼]│
  ├─────────────────────────────────────┤
  │  ┌─────────────────────────────┐   │
  │  │ Cricket Tournament           │   │
  │  │ 📍 Mumbai, Maharashtra       │   │
  │  │ 📅 15 Dec 2025               │   │
  │  │ [Register] [View Details]    │   │
  │  └─────────────────────────────┘   │
  │  ┌─────────────────────────────┐   │
  │  │ Football Championship        │   │
  │  │ ...                          │   │
  │  └─────────────────────────────┘   │
  └─────────────────────────────────────┘
  ```
- **API Calls**: `GET /api/events`

#### EventDetails.jsx
- **Purpose**: Detailed event view
- **Features**:
  - Complete event information
  - Organizer details
  - Participant list
  - Location map (Google Maps)
  - Registration button
  - Result files download
- **Sections**:
  - Event name & sport
  - Date & time (IST)
  - Venue with map
  - Description
  - Participant limit & current count
  - Organizer profile
  - Registration status
  - Event results (if available)
- **API Calls**: 
  - `GET /api/events/:eventId`
  - `POST /api/events/:eventId/register`
  - `DELETE /api/events/:eventId/register`

#### EventCreate.jsx
- **Purpose**: Create new event
- **User Roles**: Coach, Institute, Club
- **Features**:
  - Event details form
  - Date/time picker (IST handling)
  - Google Maps venue search
  - Participant limit setting
  - Sport selection
- **Form Fields**:
  - Event Name
  - Sport Type
  - Start Date & Time (IST)
  - End Date & Time (IST)
  - Venue (with Google Maps autocomplete)
  - Description
  - Participant Limit
  - State, City
- **IST Date Handling**:
  ```javascript
  // User enters: 15 Dec 2025, 10:00 AM
  // Stored in DB: 2025-12-15T04:30:00.000Z (UTC)
  // Display: 2025-12-15T10:00 (IST)
  ```
- **API Calls**: `POST /api/coach/events`

#### EventEdit.jsx
- **Purpose**: Edit existing event
- **Features**:
  - Pre-populated form with existing data
  - IST date/time preservation
  - Update participant limit
  - Change venue
- **Important**: 
  - Uses `substring(0, 16)` for datetime-local inputs
  - Preserves IST timezone without conversion
- **API Calls**: 
  - `GET /api/coach/events/:eventId`
  - `PUT /api/coach/events/:eventId`

#### EventOrders.jsx
- **Purpose**: Manage event orders
- **Features**:
  - Create new order (certificates, medals, trophies)
  - View order status
  - Payment initiation
  - Order history
- **Order Flow**:
  1. Coach creates order with quantities
  2. Admin sets pricing
  3. Coach initiates payment
  4. Payment verification
  5. Order completion
- **API Calls**:
  - `GET /api/coach/events/:eventId/orders`
  - `POST /api/coach/events/:eventId/orders`
  - `POST /api/coach/create-payment-order`
  - `POST /api/coach/verify-payment`

#### EventResultUpload.jsx
- **Purpose**: Upload event results
- **Features**:
  - Multiple file upload (PDF, Excel, CSV)
  - File preview
  - Description/notes
  - Upload progress
- **API Calls**: `POST /api/events/:eventId/results`

---

### 5. Profile Pages

#### StudentProfile.jsx
- **Purpose**: View & edit student profile
- **Features**:
  - Personal information
  - Sport preferences
  - School/club details
  - Profile completion percentage
  - Unique ID display
- **Editable Fields**:
  - Name, Phone
  - School Name
  - Sports (Primary, Secondary, Tertiary)
  - Address (State, City, Pincode)
- **API Calls**:
  - `GET /api/student/profile`
  - `PUT /api/student/profile`

#### CoachProfile.jsx
- **Purpose**: View & edit coach profile
- **Features**:
  - Professional details
  - Specialization & experience
  - Payment & subscription status
  - Unique ID
  - Renewal option
- **Editable Fields**:
  - Name, Phone
  - Specialization
  - Experience
  - Address
- **API Calls**:
  - `GET /api/coach/profile`
  - `PUT /api/coach/profile`

---

### 6. Admin Pages

#### AdminEventsManagement.jsx
- **Purpose**: Moderate all events
- **Features**:
  - View pending events
  - Approve events
  - Reject events with notes
  - View all events (approved, rejected, suspended)
  - Event participant list
- **Actions**:
  - Approve
  - Reject (with reason)
  - Suspend
  - Restart
  - View Participants
- **API Calls**:
  - `GET /api/admin/events`
  - `PUT /api/admin/events/:eventId/moderate`
  - `GET /api/admin/events/:eventId/participants`

#### IssueCertificates.jsx
- **Purpose**: Issue certificates to event participants
- **Features**:
  - Select event
  - Select students (bulk or individual)
  - Generate certificates
  - View issuance history
- **Process**:
  1. Select event (with uploaded results)
  2. Select participants
  3. Issue certificates
  4. System generates PDFs
  5. Students receive notifications
- **API Calls**: 
  - `GET /api/admin/events` (events with results)
  - `POST /api/admin/certificates/issue`

#### AdminRevenue.jsx
- **Purpose**: Revenue analytics dashboard
- **Features**:
  - Total revenue
  - Revenue by subscription type
  - Revenue by orders
  - Date range filtering
  - Export reports
- **API Calls**: `GET /api/admin/revenue`

#### AllUsers.jsx
- **Purpose**: View all platform users
- **Features**:
  - Filter by role
  - Search users
  - View user profiles
  - User statistics
- **API Calls**: `GET /api/admin/users`

---

### 7. Student-Specific Pages (`pages/student/`)

#### BrowseCoaches.jsx
- **Purpose**: Discover and connect with coaches
- **Features**:
  - Coach profiles list
  - Filter by sport & location
  - Send connection request
  - View connected coaches
- **API Calls**:
  - `GET /api/student/coaches`
  - `POST /api/student/coaches/:coachId/connect`

#### StudentEvents.jsx
- **Purpose**: Student event management
- **Features**:
  - Registered events
  - Available events
  - Event history
  - Unregister option
- **API Calls**: `GET /api/student/events`

---

## Core Components (`components/`)

### EventCard.jsx
- **Purpose**: Reusable event display card
- **Props**:
  - `event`: Event object
  - `onRegister`: Registration handler
  - `onViewDetails`: Details handler
  - `showActions`: Boolean for action buttons
- **Display**:
  - Event name & sport
  - Date & time
  - Venue & location
  - Status badge (Upcoming/Ongoing/Ended)
  - Participant count
  - Action buttons

### EventForm.jsx
- **Purpose**: Reusable event create/edit form
- **Props**:
  - `initialData`: Pre-populated data (for edit)
  - `onSubmit`: Form submission handler
  - `isEdit`: Boolean for edit mode
- **Features**:
  - Controlled form inputs
  - Date/time pickers (IST)
  - Google Maps venue search
  - Form validation
  - Error handling

### Payment.jsx
- **Purpose**: Razorpay payment integration
- **Props**:
  - `amount`: Payment amount
  - `orderId`: Razorpay order ID
  - `onSuccess`: Success callback
  - `onFailure`: Failure callback
- **Process**:
  1. Load Razorpay script
  2. Create payment options
  3. Open Razorpay modal
  4. Handle payment response
  5. Verify payment signature

### Modal.jsx
- **Purpose**: Generic modal component
- **Props**:
  - `isOpen`: Boolean
  - `onClose`: Close handler
  - `title`: Modal title
  - `children`: Modal content
- **Features**:
  - Overlay backdrop
  - Close on outside click
  - ESC key support
  - Responsive design

### GoogleMapsPlacesAutocomplete.jsx
- **Purpose**: Venue search with Google Maps
- **Props**:
  - `onPlaceSelect`: Place selection handler
  - `initialValue`: Pre-filled value
- **Features**:
  - Autocomplete suggestions
  - Place details retrieval
  - Latitude/longitude extraction
  - Address formatting

### ProtectedRoute.jsx
- **Purpose**: Authentication route wrapper
- **Props**:
  - `allowedRoles`: Array of allowed roles
  - `children`: Protected component
- **Logic**:
  ```javascript
  if (!isAuthenticated) {
    redirect to login
  } else if (!allowedRoles.includes(userRole)) {
    show unauthorized message
  } else {
    render children
  }
  ```

### Header.jsx
- **Purpose**: Navigation header
- **Features**:
  - Logo & branding
  - Role-based navigation links
  - User profile dropdown
  - Logout button
  - Mobile responsive menu

### Footer.jsx
- **Purpose**: Site footer
- **Features**:
  - Copyright notice
  - Quick links
  - Social media links
  - Contact information

---

## State Management

### AuthContext (`contexts/AuthContext.jsx`)
- **Purpose**: Global authentication state
- **Provided Values**:
  - `user`: Current user object
  - `role`: User role (STUDENT/COACH/ADMIN/etc.)
  - `isAuthenticated`: Boolean
  - `token`: JWT token
  - `login`: Login function
  - `logout`: Logout function
  - `updateUser`: Update user data
- **Usage**:
  ```javascript
  import { useAuth } from './contexts/AuthContext';
  
  function Component() {
    const { user, role, isAuthenticated, logout } = useAuth();
    // Use auth state
  }
  ```

### SimpleAuthContext (`contexts/SimpleAuthContext.jsx`)
- **Purpose**: Simplified auth state for components
- **Features**: Lightweight alternative to AuthContext

---

## API Integration (`api.js`)

### Axios Instance Configuration
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Routing (`App.jsx`)

### Route Structure
```javascript
<BrowserRouter>
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<Landing />} />
    <Route path="/student/login" element={<StudentLogin />} />
    <Route path="/coach/login" element={<CoachLogin />} />
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/student/register" element={<StudentRegister />} />
    <Route path="/coach/register" element={<CoachRegister />} />
    
    {/* Protected Routes - Student */}
    <Route path="/student/dashboard" element={
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <StudentDashboard />
      </ProtectedRoute>
    } />
    
    {/* Protected Routes - Coach */}
    <Route path="/coach/dashboard" element={
      <ProtectedRoute allowedRoles={['COACH']}>
        <CoachDashboard />
      </ProtectedRoute>
    } />
    
    {/* Protected Routes - Admin */}
    <Route path="/admin/dashboard" element={
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminDashboard />
      </ProtectedRoute>
    } />
    
    {/* Shared Protected Routes */}
    <Route path="/events" element={
      <ProtectedRoute allowedRoles={['STUDENT', 'COACH', 'INSTITUTE', 'CLUB', 'ADMIN']}>
        <Events />
      </ProtectedRoute>
    } />
  </Routes>
</BrowserRouter>
```

---

## Key Features

### 1. IST Date/Time Handling
- **Challenge**: Database stores UTC, users work in IST
- **Solution**: 
  - Frontend sends IST times as-is
  - Backend appends `+05:30` before storing
  - Backend converts UTC to IST before sending
  - Frontend displays IST using `substring(0, 16)` for datetime-local inputs

### 2. Payment Integration
- **Razorpay SDK**: Loaded dynamically
- **Payment Flow**:
  1. Create order on backend
  2. Open Razorpay modal
  3. User completes payment
  4. Verify signature on backend
  5. Update status

### 3. Google Maps Integration
- **Autocomplete**: Venue search with suggestions
- **Place Details**: Extract coordinates & formatted address
- **Map Display**: Show event location on details page

### 4. File Upload
- **Multipart/form-data**: For results & certificates
- **Progress Tracking**: Upload progress indicator
- **File Validation**: Client-side type & size checks

### 5. Responsive Design
- **Tailwind CSS**: Utility-first responsive classes
- **Mobile-First**: Designed for mobile, enhanced for desktop
- **Breakpoints**: `sm:`, `md:`, `lg:`, `xl:` for different screen sizes

---

## Environment Variables

Create `.env` file in frontend root:
```
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
VITE_GOOGLE_MAPS_API_KEY=AIzaSyxxxxx
```

---

## Development

### Start Development Server
```bash
cd frontend
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

---

## Best Practices

1. **Component Reusability**: Extract common UI into reusable components
2. **Error Handling**: Use try-catch with user-friendly error messages
3. **Loading States**: Show spinners during API calls
4. **Form Validation**: Client-side validation before submission
5. **Code Splitting**: Lazy load routes for better performance
6. **Accessibility**: Use semantic HTML and ARIA labels
7. **Security**: Never store sensitive data in localStorage without encryption

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Maintained By**: STAIRS Development Team
