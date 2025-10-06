# STAIRS Talent Hub MVP - Complete Frontend Scaffold

## 🚀 Project Overview

A complete React frontend application for the STAIRS Talent Hub MVP with role-based authentication and dashboards for Students, Coaches, Clubs, and Institutes.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── main.jsx                    # React entry point
│   ├── App.jsx                     # Main app with routing
│   ├── api.js                      # Axios API helper
│   ├── index.css                   # Global styles (with basic utility classes)
│   ├── pages/
│   │   ├── auth/                   # Authentication pages
│   │   │   ├── StudentLogin.jsx    # Student OTP-based login
│   │   │   ├── CoachLogin.jsx      # Coach email/password login
│   │   │   ├── ClubLogin.jsx       # Club email/password login
│   │   │   └── InstituteLogin.jsx  # Institute email/password login
│   │   ├── dashboard/              # Role-specific dashboards
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── CoachDashboard.jsx
│   │   │   ├── ClubDashboard.jsx
│   │   │   └── InstituteDashboard.jsx
│   │   ├── EventCreate.jsx         # Event creation page (Coach)
│   │   └── BulkUpload.jsx          # Bulk student upload (Institute)
│   └── components/                 # Reusable components
│       ├── Header.jsx              # Navigation header
│       ├── Footer.jsx              # Site footer
│       ├── Modal.jsx               # Modal component
│       ├── Spinner.jsx             # Loading spinner
│       ├── StudentCard.jsx         # Student profile card
│       └── CoachCard.jsx           # Coach profile card
├── package.json                    # Dependencies and scripts
├── .env                           # Environment variables
├── tailwind.config.js             # TailwindCSS configuration
├── postcss.config.js              # PostCSS configuration
└── vite.config.js                 # Vite configuration
```

## 🛠 Tech Stack

- **React 19.x** with Vite
- **React Router DOM** for navigation
- **Axios** for API calls
- **TailwindCSS** for styling (configured but currently using basic CSS)
- **JavaScript** (ES6+)

## 🔐 Authentication System

### Student Login
- Phone/Email + OTP verification
- Two-step authentication process
- Auto-redirect to student dashboard

### Coach/Club/Institute Login
- Email + Password authentication
- Remember me functionality
- Forgot password links
- Role-specific redirects

## 📱 Dashboard Features

### Student Dashboard
- Connected coaches overview
- Event registrations
- Coach discovery modal
- Quick stats and profile completion

### Coach Dashboard
- Student management
- Event creation tools
- Performance stats
- Quick action buttons

### Club Dashboard
- Member management
- Activity tracking
- Program overview
- Announcements system

### Institute Dashboard
- Bulk student uploads
- Upload history and reports
- System status monitoring
- Storage management

## 🌐 Routing Structure

```
/                           → Redirects to /login/student
/login/student              → Student OTP login
/login/coach                → Coach email/password login
/login/club                 → Club email/password login
/login/institute            → Institute email/password login
/dashboard/student          → Student dashboard
/dashboard/coach            → Coach dashboard
/dashboard/club             → Club dashboard
/dashboard/institute        → Institute dashboard
/events/create              → Event creation (Coach only)
/bulk-upload                → Bulk student upload (Institute only)
```

## 🔧 API Integration

### API Helper (`api.js`)
- Axios instance with interceptors
- Automatic token management
- Error handling and redirects
- Environment-based configuration

### Available API Functions

#### Authentication
- `sendOtp(data)` - Send OTP to student
- `verifyOtp(data)` - Verify student OTP
- `login(data, role)` - Role-based login

#### Student APIs
- `getCoaches()` - Get available coaches
- `connectCoach(coachId)` - Connect with coach
- `getStudentDashboard()` - Dashboard data

#### Coach APIs
- `registerCoach(data)` - Coach registration
- `createEvent(data)` - Create new event
- `getCoachDashboard()` - Dashboard data

#### Club APIs
- `getClubDashboard()` - Dashboard data
- `getClubMembers()` - Member list

#### Institute APIs
- `getInstituteDashboard()` - Dashboard data
- `uploadStudents(data)` - Bulk upload

## 🎨 Component Library

### Shared Components
- **Header**: Navigation with role-based menu
- **Footer**: Site information and links
- **Modal**: Reusable modal dialog
- **Spinner**: Loading indicator
- **StudentCard**: Student profile display
- **CoachCard**: Coach profile display

### Features
- Responsive design
- Accessible components
- Consistent styling
- Loading states
- Error handling

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev
```
Server runs on: `http://localhost:5173` (or next available port)

### Build
```bash
npm run build
```

## 🔒 Environment Variables

Create `.env` file with:
```
VITE_BACKEND_URL=http://localhost:5000
```

## 📄 Key Features Implemented

### ✅ Multi-Role Authentication
- Student (OTP-based)
- Coach (Email/Password)
- Club (Email/Password)
- Institute (Email/Password)

### ✅ Role-Based Dashboards
- Personalized content per role
- Role-specific functionality
- Quick action buttons
- Statistics and metrics

### ✅ Complete Routing
- Protected routes
- Role-based redirects
- Clean URL structure
- 404 handling

### ✅ Component Architecture
- Reusable components
- Consistent styling
- Responsive design
- Loading states

### ✅ API Integration Ready
- Axios configuration
- Token management
- Error handling
- Mock data for demo

## 🔄 Current Status

- ✅ Complete project structure
- ✅ All routes and pages created
- ✅ Component library built
- ✅ API integration ready
- ✅ Authentication flows
- ✅ Dashboard layouts
- ⏳ TailwindCSS configuration (basic CSS fallback in place)
- ⏳ Backend integration

## 🎯 Next Steps

1. **Complete TailwindCSS Setup**
   - Fix PostCSS configuration
   - Apply full Tailwind styling

2. **Backend Integration**
   - Connect to actual API endpoints
   - Implement real authentication
   - Add data persistence

3. **Enhanced Features**
   - Form validation
   - File upload functionality
   - Real-time notifications
   - Search and filtering

4. **Testing & Optimization**
   - Unit tests
   - Integration tests
   - Performance optimization
   - SEO improvements

## 💡 Demo Features

All pages include mock data and functionality for demonstration:
- Login flows work with mock API calls
- Dashboards show sample data
- Navigation between all routes
- Component interactions

## 🌟 Architecture Highlights

- **Modular Structure**: Clear separation of concerns
- **Scalable Routing**: Easy to add new routes and features
- **Reusable Components**: Consistent UI patterns
- **API Abstraction**: Clean API integration layer
- **Responsive Design**: Works on all device sizes
- **Role-Based Access**: Secure authentication patterns

The frontend is now completely scaffolded and ready for backend integration and further development!