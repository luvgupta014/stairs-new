# Certificate Issuance - Admin Change Summary

## Overview
Changed certificate issuance functionality from **Coach** to **Admin** role.

---

## Changes Made

### Backend Changes (`backend/src/routes/certificates.js`)

#### 1. Updated Middleware
- **Changed:** `requireCoach` → `requireAdmin`
- **Import:** Added `requireAdmin` to imports from `authMiddleware`

#### 2. POST `/api/certificates/issue` Route
- **Access:** Coach → Admin only
- **Removed:** `coachId` verification logic
- **Updated:** Event verification no longer checks coach ownership
- **Updated:** Order verification no longer filters by `coachId`
- **Comments:** Updated to reflect Admin access

#### 3. GET `/api/certificates/event/:eventId/issued` Route
- **Access:** Coach → Admin only
- **Removed:** `coachId` verification logic
- **Updated:** Event verification simplified (no ownership check)
- **Comments:** Updated to reflect Admin access

#### 4. GET `/api/certificates/event/:eventId/eligible-students` Route
- **Access:** Coach → Admin only
- **Removed:** `coachId` verification logic
- **Updated:** Event and order verification no longer check coach ownership
- **Comments:** Updated to reflect Admin access

---

### Frontend Changes

#### 1. Route Update (`frontend/src/App.jsx`)
```jsx
// Before
path="/coach/event/:eventId/certificates"
role="COACH"

// After
path="/admin/event/:eventId/certificates"
role="ADMIN"
```

#### 2. Admin Dashboard (`frontend/src/pages/dashboard/AdminDashboard.jsx`)
- **Added:** Certificate button for COMPLETED events
- **Location:** In the active events table, after Participants button
- **Button:** Links to `/admin/event/{eventId}/certificates`
- **Icon:** 🎓 Certificates
- **Condition:** Only shows for events with `status === 'COMPLETED'`

#### 3. Coach Dashboard (`frontend/src/pages/dashboard/CoachDashboard.jsx`)
- **Removed:** Certificate issuance button completely
- **Reason:** Certificate issuance is now an admin-only function

#### 4. Issue Certificates Page (`frontend/src/pages/IssueCertificates.jsx`)
- **Updated:** "No orders" link now points to `/admin/orders` instead of `/coach/event/${eventId}/orders`
- **Text:** Changed from "Place an Order →" to "View Orders →"

---

## Workflow After Changes

### For Admins
1. Navigate to Admin Dashboard
2. View completed events in the events list
3. Click "🎓 Certificates" button for completed events
4. Select an order from the dropdown
5. Select students to receive certificates
6. Click "Issue Certificates" to generate and issue

### For Coaches
- **Certificate issuance removed** from coach capabilities
- Coaches can still:
  - Create events
  - Upload results
  - Place certificate orders
  - View event details
- Coaches **cannot** issue certificates anymore

---

## Testing Checklist

- [ ] Admin can access `/admin/event/{eventId}/certificates` route
- [ ] Coach cannot access certificate issuance routes (should get 403)
- [ ] Certificate button appears only for COMPLETED events in Admin Dashboard
- [ ] Certificate button removed from Coach Dashboard
- [ ] Certificate issuance workflow works end-to-end for admins
- [ ] "No orders" link in IssueCertificates redirects to admin orders page
- [ ] Backend validates admin role correctly
- [ ] Existing issued certificates still accessible to students

---

## API Endpoints Changed

| Endpoint | Old Access | New Access |
|----------|-----------|------------|
| `POST /api/certificates/issue` | Coach | Admin |
| `GET /api/certificates/event/:eventId/issued` | Coach | Admin |
| `GET /api/certificates/event/:eventId/eligible-students` | Coach | Admin |

---

## Security Improvements

1. **Centralized Control:** Only admins can issue certificates, preventing unauthorized issuance
2. **Removed Coach Filtering:** Backend no longer needs to verify coach ownership for certificate operations
3. **Role-Based Access:** Clear separation of duties between coaches and admins

---

## Next Steps

1. Test the changes thoroughly with both admin and coach accounts
2. Update any documentation or user guides
3. Notify coaches about the workflow change
4. Monitor for any issues after deployment
5. Consider adding bulk certificate issuance for admins across multiple events

---

**Date:** November 6, 2025
**Status:** ✅ Changes Complete
