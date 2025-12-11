# Payment Use Cases Verification & Implementation Status

## Use Case 1: Event Fee Payment

### Specification
- **Entity**: Event
- **Who is paying**: Coordinator
- **Calculation/Rule**: Number of students participated × Rs 200 per student
- **Unit of measure**: Rs 200 per student
- **Trigger**: Click on the digital certificate
- **Output**: X × 200 (where X = number of students)
- **Controlled by Admin**: Shows "Event X - Per student fee is Y, Event A - per student fee is Z..."

### Current Implementation Status

#### ✅ Implemented:
1. **Payment Calculation**: 
   - Uses `perStudentBaseCharge` from `GlobalSettings` table
   - Formula: `perStudentBaseCharge × participantCount`
   - Location: `backend/src/routes/payment.js` (lines 197-219)
   - Admin can set this globally in Admin Dashboard

2. **Payment Flow**:
   - Endpoint: `/api/payment/create-order-events`
   - Supports both GLOBAL and EVENT fee modes
   - Creates Razorpay order
   - Payment verification implemented

3. **Admin Management**:
   - ✅ Global settings page: `/admin/settings/global-payments`
   - ✅ Quick edit in Events Management page
   - ✅ Per-event fee override in Events Fee Management table
   - ✅ Shows per-event fee breakdown

4. **Checkout Modal**: 
   - ✅ Integrated in `CoachDashboard.jsx`
   - Shows payment breakdown before Razorpay

#### ⚠️ Needs Update:
1. **Default Amount**: 
   - `perStudentBaseCharge` defaults to 0 in schema
   - **Action Required**: Admin should set to 200 (or desired amount) via UI
   - **Location**: Admin can set via Global Payment Settings

2. **Trigger Point**: 
   - Currently triggered from "Pay Event Fee" button in dashboard
   - **Spec Requirement**: Should be triggered on "Click on digital certificate"
   - **Action Required**: Add payment trigger when user clicks to view/download certificate
   - **Location**: `IssueCertificates.jsx` or certificate download/view component

---

## Use Case 2: Registration Payment

### 2.1 Coordinator Registration Payment

#### Specification
- **Who is paying**: Coordinator
- **Calculation**: Person (one-time registration fee)
- **Trigger**: Post successful account creation
- **Controlled by**: Admin

#### Current Implementation Status

#### ✅ Implemented:
1. **Global Setting Added**:
   - ✅ `coordinatorSubscriptionFee` field added to `GlobalSettings` table
   - ✅ Admin can set this globally in Global Payment Settings
   - ✅ Available in both AdminGlobalPayments and AdminEventsManagement pages

2. **Database Schema**:
   - ✅ Column added: `coordinatorSubscriptionFee` (Float, default 0)
   - ✅ Migration script created: `ADD_COORDINATOR_SUBSCRIPTION_FEE.sql`

3. **Backend API**:
   - ✅ Updated `/api/admin/settings/global-payments` PUT endpoint
   - ✅ Accepts `coordinatorSubscriptionFee` in request body
   - ✅ Returns updated settings including coordinator fee

4. **Frontend UI**:
   - ✅ AdminGlobalPayments.jsx - Full settings page with coordinator subscription fee field
   - ✅ AdminEventsManagement.jsx - Quick edit section includes coordinator subscription fee
   - ✅ Both pages allow real-time updates

#### ❌ Missing/Needs Implementation:
1. **Payment Integration**:
   - **Action Required**: Integrate coordinator subscription fee into registration flow
   - **Location**: `backend/src/routes/auth.js` - Coach/Coordinator registration endpoint
   - **Trigger**: After successful account creation, before returning success response
   - **Flow**: 
     - Check if coordinator subscription fee > 0
     - Create Razorpay order for subscription fee
     - Redirect to payment or return payment order details
     - Verify payment before completing registration

2. **Payment Verification**:
   - **Action Required**: Add payment verification endpoint for coordinator subscription
   - **Location**: `backend/src/routes/payment.js`
   - **Flow**: Verify payment and mark coordinator account as subscribed

---

### 2.2 Student Registration Payment

#### Specification
- **Who is paying**: Student
- **Calculation**: Person (one-time registration fee)
- **Trigger**: Connect to an event in student dashboard
- **Condition**: If event is created by admin then only
- **Controlled by**: Admin

#### Current Implementation Status

#### ✅ Partially Implemented:
1. **Event Registration**:
   - Students can register for events
   - Payment flow exists for event registrations

#### ❌ Missing/Needs Implementation:
1. **Condition Check**:
   - **Action Required**: Check if event is created by admin
   - **Location**: Event registration endpoint
   - **Logic**: Only charge registration fee if `event.createdBy === 'ADMIN'` or similar flag

2. **Registration Fee**:
   - **Action Required**: Add student registration fee to global settings
   - **Action Required**: Charge student when connecting to admin-created events
   - **Location**: Student event registration flow

---

### 2.3 Institute Registration Payment

#### Specification
- **Who is paying**: Institute
- **Calculation**: Person (one-time registration fee)
- **Trigger**: Post successful account creation
- **Controlled by**: Admin

#### Current Implementation Status

#### ❌ Not Implemented:
1. **Action Required**: Add institute subscription fee to global settings
2. **Action Required**: Integrate into institute registration flow
3. **Action Required**: Create payment order after account creation

---

### 2.4 Company Registration Payment

#### Specification
- **Who is paying**: Company
- **Calculation**: Person (one-time registration fee)
- **Trigger**: Post successful account creation
- **Controlled by**: Admin

#### Current Implementation Status

#### ❌ Not Implemented:
1. **Action Required**: Add company subscription fee to global settings
2. **Action Required**: Integrate into company registration flow
3. **Action Required**: Create payment order after account creation

---

### 2.5 Any Stakeholder Registration Payment

#### Specification
- **Who is paying**: Any stakeholder
- **Calculation**: Person (one-time registration fee)
- **Trigger**: Post successful account creation
- **Controlled by**: Admin

#### Current Implementation Status

#### ❌ Not Implemented:
1. **Action Required**: Add stakeholder-specific subscription fees
2. **Action Required**: Generic registration payment flow
3. **Action Required**: Role-based fee assignment

---

## Summary of Changes Made

### ✅ Completed:
1. **Schema Update**: Added `coordinatorSubscriptionFee` to `GlobalSettings` model
2. **Backend API**: Updated global payment settings endpoint to handle coordinator fee
3. **Frontend - AdminGlobalPayments**: Added coordinator subscription fee input field
4. **Frontend - AdminEventsManagement**: Added coordinator subscription fee to quick edit section
5. **Migration Script**: Created `ADD_COORDINATOR_SUBSCRIPTION_FEE.sql` for database migration

### ⚠️ Pending Implementation:
1. **Coordinator Registration Payment Flow**: Integrate subscription fee into registration process
2. **Payment Verification**: Add verification endpoint for coordinator subscription payments
3. **Student Registration Fee**: Add to global settings and integrate into event registration
4. **Other Entity Fees**: Institute, Company, and other stakeholder fees
5. **Certificate Trigger**: Move event fee payment trigger to certificate click

---

## Next Steps

1. **Run Migration**:
   ```bash
   psql $DATABASE_URL -f backend/ADD_COORDINATOR_SUBSCRIPTION_FEE.sql
   ```

2. **Test Global Settings**:
   - Navigate to Admin Dashboard → Global Payment Settings
   - Set Coordinator Subscription Fee
   - Verify it saves and persists

3. **Implement Registration Payment Flow**:
   - Update registration endpoints to check for subscription fees
   - Create Razorpay orders for subscription payments
   - Add payment verification

4. **Add Certificate Payment Trigger**:
   - Update certificate view/download component
   - Trigger payment flow when certificate is accessed
   - Show payment modal before certificate display

---

## Files Modified

### Backend:
- `backend/prisma/schema.prisma` - Added `coordinatorSubscriptionFee` field
- `backend/src/routes/admin.js` - Updated global payment settings endpoint
- `backend/ADD_COORDINATOR_SUBSCRIPTION_FEE.sql` - Migration script

### Frontend:
- `frontend/src/pages/dashboard/AdminGlobalPayments.jsx` - Added coordinator fee field
- `frontend/src/pages/dashboard/AdminEventsManagement.jsx` - Added coordinator fee to quick edit

---

## Testing Checklist

- [ ] Run database migration
- [ ] Verify coordinator subscription fee field appears in Admin Global Payment Settings
- [ ] Set coordinator subscription fee value
- [ ] Verify value persists after page refresh
- [ ] Test coordinator registration flow (pending implementation)
- [ ] Test payment order creation for coordinator subscription
- [ ] Test payment verification for coordinator subscription
- [ ] Verify event fee calculation uses perStudentBaseCharge
- [ ] Test certificate payment trigger (pending implementation)
