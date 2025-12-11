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

2. **Payment Flow**:
   - Endpoint: `/api/payment/create-order-events`
   - Supports both GLOBAL and EVENT fee modes
   - Creates Razorpay order
   - Payment verification implemented

3. **Checkout Modal**: 
   - ✅ Integrated in `CoachDashboard.jsx`
   - Shows payment breakdown before Razorpay

#### ❌ Missing/Needs Update:
1. **Default Amount**: 
   - `perStudentBaseCharge` defaults to 0 in schema
   - **Action Required**: Should default to 200 or be set by admin
   - **Location**: `backend/prisma/schema.prisma` line 284

2. **Trigger Point**: 
   - Currently triggered from "Pay Event Fee" button in dashboard
   - **Spec Requirement**: Should be triggered on "Click on digital certificate"
   - **Action Required**: Add payment trigger when user clicks to view/download certificate

3. **Admin Display**: 
   - Need to show per-event fee breakdown: "Event X - Per student fee is Y"
   - **Action Required**: Add admin dashboard view showing event fees

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
1. **Registration Flow**: 
   - Coordinator registration endpoint exists
   - Location: `backend/src/routes/auth.js` (lines 613-861)

2. **Payment Processing**: 
   - Payment endpoint exists: `/api/auth/coach/payment`
   - Location: `backend/src/routes/auth.js` (lines 1572-1678)
   - Updates coach status after payment

#### ❌ Missing/Needs Update:
1. **Automatic Trigger**: 
   - Payment is NOT automatically triggered after account creation
   - **Action Required**: Add payment flow after successful registration
   - Should redirect to payment page or show payment popup

2. **Checkout Modal**: 
   - **Action Required**: Integrate checkout modal for coordinator registration payment

---

### 2.2 Student Registration Payment

#### Specification
- **Who is paying**: Student
- **Calculation**: If event is created by admin then only
- **Trigger**: Connect to an event in student dashboard
- **Controlled by**: By event (should charge student)

#### Current Implementation Status

#### ✅ Implemented:
1. **Student Registration**: 
   - Endpoint: `/api/student/events/:eventId/register`
   - Location: `backend/src/routes/student.js` (lines 752-859)
   - Creates event registration record

2. **Bulk Registration with Payment**: 
   - Coach can register students with payment
   - Endpoint: `/api/coach/events/:eventId/registrations/bulk`
   - Location: `backend/src/routes/coach.js` (lines 2948-3139)
   - Creates `EventRegistrationOrder` with fee calculation

#### ❌ Missing/Needs Update:
1. **Payment Trigger for Student**: 
   - Student registration currently does NOT require payment
   - **Action Required**: Add payment requirement when:
     - Event is created by admin
     - Student connects to event in dashboard
   - Should check `event.createdBy` or similar field

2. **Checkout Modal**: 
   - **Action Required**: Integrate checkout modal for student registration payment
   - Currently only coach bulk registration has payment flow

3. **Event Creator Check**: 
   - Need to verify if event was created by admin
   - **Action Required**: Add logic to check event creator type

---

### 2.3 Institute Registration Payment

#### Specification
- **Who is paying**: Institute
- **Calculation**: Person (one-time registration fee)
- **Status**: ⚠️ **Details Incomplete in Spec**

#### Current Implementation Status
- Institute registration exists but payment flow unclear
- **Action Required**: Clarify requirements and implement

---

### 2.4 Company Registration Payment

#### Specification
- **Who is paying**: Company
- **Status**: ⚠️ **Details Incomplete in Spec**

#### Current Implementation Status
- Company registration not found in codebase
- **Action Required**: Clarify requirements and implement

---

### 2.5 Any Stakeholder Registration Payment

#### Specification
- **Status**: ⚠️ **Details Incomplete in Spec**

#### Current Implementation Status
- Generic stakeholder registration not found
- **Action Required**: Clarify requirements and implement

---

## Implementation Priority

### High Priority (Critical for Spec Compliance)

1. **Event Fee Payment - Certificate Click Trigger**
   - Add payment trigger when clicking digital certificate
   - Update checkout modal to show per-student breakdown

2. **Set Default perStudentBaseCharge to 200**
   - Update schema or ensure admin sets it to 200

3. **Student Registration Payment**
   - Add payment requirement when event created by admin
   - Integrate checkout modal

4. **Coordinator Registration Payment Auto-trigger**
   - Add payment flow after successful registration

### Medium Priority

5. **Admin Dashboard - Event Fee Display**
   - Show "Event X - Per student fee is Y" format

6. **Checkout Modal Integration**
   - Ensure all payment flows use checkout modal

### Low Priority

7. **Institute/Company/Stakeholder Payments**
   - Wait for complete specifications

---

## Files to Update

### Backend:
1. `backend/prisma/schema.prisma` - Set default perStudentBaseCharge
2. `backend/src/routes/payment.js` - Ensure 200 default
3. `backend/src/routes/auth.js` - Add payment trigger after registration
4. `backend/src/routes/student.js` - Add payment check for admin-created events

### Frontend:
1. Certificate viewing/download components - Add payment trigger
2. Student dashboard - Add payment flow for event connection
3. Coordinator registration flow - Add payment redirect
4. All payment flows - Ensure checkout modal integration

---

## Testing Checklist

- [ ] Event fee payment triggered from certificate click
- [ ] Event fee calculation: students × 200
- [ ] Coordinator registration redirects to payment
- [ ] Student registration requires payment for admin-created events
- [ ] Checkout modal shows in all payment flows
- [ ] Admin can see event fee breakdowns
- [ ] Payment verification works for all flows

