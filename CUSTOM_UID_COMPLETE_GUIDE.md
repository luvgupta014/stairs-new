# Custom UID Implementation - Complete Guide

## Quick Summary

### Your Questions Answered:

**Q1: Remove random generated ID. I want only our custom formatted uid wherever we created.**
- **Answer:** We'll keep the random `id` as internal database key (required for relations) but DISPLAY only custom `uniqueId` to users. This is the safest approach.

**Q2: Why under system admin, it is showing some random id?**
- **Answer:** Some old users created before the UID system don't have `uniqueId` assigned yet. We'll fix this with backfill scripts.

**Q3: Can we replace id with our custom format uid wherever possible to maintain atomicity? (in our db too)**
- **Answer:** **NO, not recommended!** Replacing primary keys would require updating ALL foreign keys in 18+ tables. Very risky. Instead, we use the dual system: `id` for internal use, `uniqueId` for display. This is industry standard.

---

## Current Status

### ✅ Already Implemented:
- Custom UID generators for Users and Events
- UID generation on creation for new users/events
- Frontend displays `uniqueId` where implemented
- Certificates use custom event UID
- Admin dashboard shows `uniqueId` when available

### ⚠️ Issues:
- Old users/events don't have `uniqueId` (created before UID system)
- `uniqueId` field is nullable (can be null)
- Some users see random ID because their `uniqueId` is null

---

## Solution: Backfill + Make Required

### Step 1: Run Backfill Scripts (SAFE)

These scripts assign custom UIDs to all existing records that don't have one.

#### Option A: Run Both Scripts Together (Recommended)
```bash
cd backend
node scripts/backfillAllUIDs.js
```

#### Option B: Run Individually
```bash
cd backend

# First, backfill user UIDs
node scripts/backfillUserUIDs.js

# Then, backfill event UIDs
node scripts/backfillEventUIDs.js
```

**What these scripts do:**
- ✅ Find all users without `uniqueId`
- ✅ Generate custom UID for each based on their role/name
- ✅ Update user record with the UID
- ✅ Same for events
- ✅ Safe to run multiple times (skips users who already have UIDs)
- ✅ Shows progress and summary

### Step 2: Make uniqueId Required (After Backfill)

Once all users/events have UIDs, make the field required:

1. **Update Schema:**
Edit `backend/prisma/schema.prisma`:

```prisma
model User {
  id               String         @id @default(cuid())
  /// Custom UID for user, visible in admin and frontend
  uniqueId         String         @unique @map("unique_id")  // REMOVED the ?
  // ... rest of fields
}

model Event {
  id                  String              @id @default(cuid())
  /// Custom UID for event in format: <serial>-<sportCode>-EVT-<locationCode>-<MMYYYY>
  uniqueId            String              @unique @map("unique_id")  // REMOVED the ?
  // ... rest of fields
}
```

2. **Create Migration:**
```bash
cd backend
npx prisma migrate dev --name make_uniqueid_required
```

3. **Deploy to Production:**
```bash
npx prisma migrate deploy
```

---

## Understanding the Dual System

### Why Keep Both `id` and `uniqueId`?

#### The `id` Field (Random CUID)
- **Purpose:** Internal database primary key
- **Used For:** 
  - Foreign key relations between tables
  - Database indexing and performance
  - Internal API queries
  - React component `key` props
- **Never Display:** Users should never see this

#### The `uniqueId` Field (Custom UID)
- **Purpose:** User-facing identifier
- **Used For:**
  - Display in UI (admin panel, dashboards)
  - Certificates and documents
  - Public URLs (optional)
  - User communication
- **Always Display:** This is what users see

### Example:
```javascript
// Database record
{
  id: "clx1a2b3c4d5e6f7g8h9i0j1",  // Internal - never show users
  uniqueId: "STU-2024-ALEX-001",     // External - always show users
  name: "Alex Johnson",
  email: "alex@example.com"
}

// In Frontend
<div>
  User ID: {user.uniqueId}  ✅ Show this
  Email: {user.email}
</div>

// In API/Database queries (use internal id)
const user = await prisma.user.findUnique({
  where: { id: req.params.id }  ✅ Use internal id
});

// But send uniqueId in response
res.json({
  uniqueId: user.uniqueId,  ✅ Send this to frontend
  name: user.name,
  email: user.email
});
```

---

## Current UID Formats

### User UIDs
Format: `{ROLE}-{YYYY}-{NAME}-{SERIAL}`

Examples:
- Student: `STU-2024-JOHN-001`
- Coach: `COA-2024-SMITH-002`
- Admin: `ADM-2024-ADMIN-001`
- Institute: `INS-2024-HARVARD-001`
- Club: `CLU-2024-SPORTS-001`

### Event UIDs
Format: `{SERIAL}-{SPORT_CODE}-EVT-{CITY_CODE}-{MMYYYY}`

Examples:
- `01-FB-EVT-DEL-112024` (Football in Delhi, Nov 2024)
- `02-BK-EVT-MUM-112024` (Basketball in Mumbai, Nov 2024)
- `03-CR-EVT-BAN-112024` (Cricket in Bangalore, Nov 2024)

**Serial is sequential:** 01, 02, 03, etc. (not random)

---

## Verification Checklist

After running backfill scripts:

### 1. Check Database
```sql
-- Users without UID (should be 0)
SELECT COUNT(*) FROM users WHERE unique_id IS NULL;

-- Events without UID (should be 0)
SELECT COUNT(*) FROM events WHERE unique_id IS NULL;

-- Sample users with UIDs
SELECT id, unique_id, email, role FROM users LIMIT 10;

-- Sample events with UIDs
SELECT id, unique_id, name, sport FROM events LIMIT 10;
```

### 2. Check Admin Dashboard
- Login as admin
- View "Recent Users" section
- Verify all users show custom UID (e.g., `STU-2024-JOHN-001`)
- No random IDs like `clx1a2b3c4d5e6f7g8h9i0j1` should be visible

### 3. Check Events
- View events in admin dashboard
- Verify all events show custom UID (e.g., `01-FB-EVT-DEL-112024`)
- Check event details
- Verify sequential numbering (01, 02, 03...)

### 4. Check Certificates
- Generate a test certificate
- Verify it shows event UID (not random ID)
- Verify it shows student UID (not random ID)

---

## Troubleshooting

### Issue: Script fails with "generateUID is not a function"
**Solution:** Check that `backend/src/utils/uidGenerator.js` exports the function correctly:
```javascript
module.exports = { generateUID };
```

### Issue: Some users still show random ID
**Solution:** 
1. Run backfill script again (it's safe)
2. Check if user actually has a profile (studentProfile, coachProfile, etc.)
3. Check database directly to confirm uniqueId exists

### Issue: Duplicate UID error
**Solution:** This shouldn't happen with our sequential system, but if it does:
1. Check the UID generator logic
2. Make sure the serial counter is working
3. May need to adjust the algorithm

### Issue: Migration fails "uniqueId cannot be null"
**Solution:** 
1. You tried to make field required BEFORE running backfill
2. Rollback migration: `npx prisma migrate reset`
3. Run backfill first, THEN make field required

---

## Best Practices

### 1. Always Use uniqueId for Display
```javascript
// ❌ Wrong - showing internal ID
<div>User ID: {user.id}</div>

// ✅ Correct - showing custom UID
<div>User ID: {user.uniqueId}</div>
```

### 2. Use id for Queries and Relations
```javascript
// ✅ Correct - use internal id for queries
const event = await prisma.event.findUnique({
  where: { id: eventId },
  include: { coach: true }
});

// ✅ Also correct - can query by uniqueId
const event = await prisma.event.findUnique({
  where: { uniqueId: eventUniqueId }
});
```

### 3. Always Include uniqueId in API Responses
```javascript
// ❌ Wrong - missing uniqueId
res.json({
  id: user.id,
  name: user.name
});

// ✅ Correct - include uniqueId
res.json({
  id: user.id,  // For internal use
  uniqueId: user.uniqueId,  // For display
  name: user.name
});
```

### 4. React Keys Should Use Internal id
```javascript
// ✅ Correct - use internal id for React keys (stable)
{users.map(user => (
  <div key={user.id}>
    <span>UID: {user.uniqueId}</span>
    <span>{user.name}</span>
  </div>
))}
```

---

## Why Not Replace Primary Keys?

### Risks of Replacing `id` with `uniqueId`:

1. **18+ Tables Affected:**
   - User, Student, Coach, Admin, Institute, Club
   - Event, EventRegistration, EventOrder
   - Payment, Certificate, Notification
   - And all relation tables

2. **Foreign Key Updates Required:**
   ```
   Student.userId → references User.id
   Event.coachId → references Coach.id
   Certificate.studentId → references Student.id
   EventOrder.coachId → references Coach.id
   EventOrder.eventId → references Event.id
   ... and many more
   ```

3. **Migration Complexity:**
   - Must update ALL foreign keys
   - Must maintain data integrity
   - Risk of orphaned records
   - Cannot rollback easily
   - Requires significant downtime

4. **Performance Impact:**
   - String UIDs are larger than CUIDs
   - Index updates required
   - Slower lookups on larger strings

5. **Breaking Changes:**
   - All existing API endpoints affected
   - Frontend needs complete rewrite
   - Mobile apps need updates
   - Third-party integrations break

### Industry Standard: Dual System
Major platforms use this approach:
- **Amazon:** Order number (B087XYZ123) + internal ID
- **GitHub:** Username + internal ID
- **Stripe:** Customer ID (cus_xyz) + internal ID
- **Shopify:** Store name + internal ID

---

## Summary

### What We're Doing: ✅
- Keep `id` as primary key (internal use only)
- Add/populate `uniqueId` for all records
- Display `uniqueId` everywhere users see it
- Use `id` for database relations and queries

### What We're NOT Doing: ❌
- Not replacing primary keys
- Not updating foreign keys
- Not breaking existing functionality
- Not risking data integrity

### Next Steps:
1. ✅ Run backfill scripts: `node scripts/backfillAllUIDs.js`
2. ✅ Verify all users/events have UIDs
3. ✅ Make `uniqueId` required in schema
4. ✅ Update any remaining frontend displays
5. ✅ Test thoroughly
6. ✅ Deploy to production

---

**Status:** Ready to Execute
**Risk:** Low (scripts are safe and reversible)
**Time:** 30 minutes - 1 hour
**Priority:** High (fixes user-facing display issue)
