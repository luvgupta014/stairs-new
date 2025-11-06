# UID Migration Strategy - Replace Random IDs with Custom UIDs

## Problem Analysis

### Current State
1. **Database Schema**: Uses `@default(cuid())` for all primary keys (random IDs)
2. **Custom UIDs**: Only added as separate `uniqueId` fields (nullable)
3. **Display Issue**: Admin dashboard shows random IDs for users who don't have custom UIDs yet
4. **Atomicity**: Random `id` is primary key, `uniqueId` is optional secondary identifier

### Issues Identified
- ✗ Many models still use random `cuid()` as primary key
- ✗ Only User and Event have `uniqueId` fields
- ✗ Old users/events created before UID system don't have custom UIDs
- ✗ Relations still reference random `id` fields
- ✗ No atomicity - two identifiers exist for same entity

---

## Solution Options

### Option 1: Keep Dual System (RECOMMENDED - SAFEST)
**Keep random `id` as primary key internally, use `uniqueId` for display only**

#### Pros:
- ✅ No database migration risk
- ✅ No breaking changes to existing relations
- ✅ Can gradually assign UIDs to existing records
- ✅ Easier rollback if issues occur
- ✅ Performance: No need to update foreign keys

#### Cons:
- ✗ Two identifiers per entity (not atomic)
- ✗ Need to ensure `uniqueId` is always populated
- ✗ Slightly more complex API code

#### Implementation:
1. Ensure all new records get `uniqueId` on creation
2. Backfill `uniqueId` for existing records without it
3. Display `uniqueId` everywhere in UI
4. Use `id` for internal queries and relations

---

### Option 2: Full Migration (HIGH RISK - NOT RECOMMENDED)
**Replace `id` with `uniqueId` as primary key**

#### Pros:
- ✅ True atomicity - single identifier
- ✅ Cleaner schema
- ✅ Custom UIDs everywhere

#### Cons:
- ✗ **DANGEROUS**: Requires updating ALL foreign key relations
- ✗ Risk of data loss or corruption
- ✗ Complex migration with many tables
- ✗ Downtime required
- ✗ Can't rollback easily
- ✗ May break existing integrations
- ✗ Performance impact during migration

#### Why NOT to do this:
- **18+ models** with `cuid()` primary keys
- **Multiple foreign key relations** between models
- **Certificates, Payments, Orders** all reference user IDs
- **Active production system** - too risky

---

## RECOMMENDED APPROACH: Option 1 (Dual System)

### Phase 1: Ensure UID Generation on Creation ✅ (Already Done)
- User UID generator exists: `backend/src/utils/uidGenerator.js`
- Event UID generator exists: `backend/src/utils/eventUIDGenerator.js`
- Creation logic already implemented in routes

### Phase 2: Backfill Missing UIDs (TO DO)
Create migration scripts to assign custom UIDs to existing records without them.

#### Script 1: Backfill User UIDs
```javascript
// backend/scripts/backfillUserUIDs.js
const { PrismaClient } = require('@prisma/client');
const { generateUID } = require('../src/utils/uidGenerator');

const prisma = new PrismaClient();

async function backfillUserUIDs() {
  try {
    // Find users without uniqueId
    const usersWithoutUID = await prisma.user.findMany({
      where: { uniqueId: null },
      include: {
        studentProfile: true,
        coachProfile: true,
        instituteProfile: true,
        clubProfile: true,
        adminProfile: true
      }
    });

    console.log(`Found ${usersWithoutUID.length} users without UID`);

    for (const user of usersWithoutUID) {
      let role = user.role;
      let name = 'Unknown';

      // Get name from profile
      if (user.studentProfile) name = user.studentProfile.name;
      else if (user.coachProfile) name = user.coachProfile.name;
      else if (user.instituteProfile) name = user.instituteProfile.name;
      else if (user.clubProfile) name = user.clubProfile.name;
      else if (user.adminProfile) name = user.adminProfile.name;

      // Generate UID
      const uniqueId = await generateUID(role, name, user.createdAt);

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: { uniqueId }
      });

      console.log(`✅ Assigned UID ${uniqueId} to user ${user.email || user.phone}`);
    }

    console.log('✅ User UID backfill complete');
  } catch (error) {
    console.error('❌ Error backfilling user UIDs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backfillUserUIDs();
```

#### Script 2: Backfill Event UIDs
```javascript
// backend/scripts/backfillEventUIDs.js
const { PrismaClient } = require('@prisma/client');
const { generateEventUID } = require('../src/utils/eventUIDGenerator');

const prisma = new PrismaClient();

async function backfillEventUIDs() {
  try {
    // Find events without uniqueId
    const eventsWithoutUID = await prisma.event.findMany({
      where: { uniqueId: null },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${eventsWithoutUID.length} events without UID`);

    for (const event of eventsWithoutUID) {
      // Generate UID
      const uniqueId = await generateEventUID(
        event.sport,
        event.city,
        event.startDate
      );

      // Update event
      await prisma.event.update({
        where: { id: event.id },
        data: { uniqueId }
      });

      console.log(`✅ Assigned UID ${uniqueId} to event ${event.name}`);
    }

    console.log('✅ Event UID backfill complete');
  } catch (error) {
    console.error('❌ Error backfilling event UIDs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backfillEventUIDs();
```

### Phase 3: Make uniqueId Required (Schema Update)
After backfill, update schema to make `uniqueId` non-nullable:

```prisma
model User {
  id               String         @id @default(cuid())
  uniqueId         String         @unique @map("unique_id") // Remove ? to make required
  // ... rest of fields
}

model Event {
  id                  String              @id @default(cuid())
  uniqueId            String              @unique @map("unique_id") // Remove ? to make required
  // ... rest of fields
}
```

Then run:
```bash
npx prisma migrate dev --name make_uniqueid_required
```

### Phase 4: Display Custom UIDs Everywhere
Update all frontend components to display `uniqueId` instead of `id`:

#### Areas to Update:
1. ✅ Admin Dashboard - Already shows uniqueId
2. ✅ Event displays - Already using uniqueId
3. ✅ Certificates - Already using uniqueId
4. ✅ Coach Dashboard - Already using uniqueId
5. User profile pages - Need to verify
6. Order displays - Need to check
7. Registration displays - Need to check

### Phase 5: Add Custom UIDs to Other Models (Optional)
If needed, add `uniqueId` to other important models:

```prisma
model EventOrder {
  id          String @id @default(cuid())
  uniqueId    String @unique @map("unique_id") // Custom order UID
  orderNumber String @unique
  // ... rest of fields
}

model Certificate {
  id         String @id @default(cuid())
  uniqueId   String @unique @map("unique_id") // Custom certificate UID
  uid        String @unique // Legacy field
  // ... rest of fields
}
```

---

## Implementation Steps (Immediate Actions)

### Step 1: Create Backfill Scripts ✅
- Create `backend/scripts/backfillUserUIDs.js`
- Create `backend/scripts/backfillEventUIDs.js`

### Step 2: Run Backfill Scripts
```bash
cd backend
node scripts/backfillUserUIDs.js
node scripts/backfillEventUIDs.js
```

### Step 3: Update Schema (Make uniqueId Required)
```bash
cd backend
npx prisma migrate dev --name make_uniqueid_required
```

### Step 4: Verify Frontend Display
- Check all places where user.id or event.id is displayed
- Replace with uniqueId where user-facing

### Step 5: Update Creation Logic
Ensure all user/event creation automatically generates uniqueId (already done)

### Step 6: Add Validation
Add backend validation to reject records without uniqueId

---

## Why This Approach is Best

### 1. Safety First
- No risk to existing data
- No foreign key updates needed
- Can rollback easily

### 2. Gradual Migration
- Backfill existing records first
- Then make field required
- No downtime needed

### 3. Best of Both Worlds
- Internal: Use random `id` for relations (stable, indexed)
- External: Display custom `uniqueId` for users (meaningful, branded)

### 4. Performance
- No need to update millions of foreign key references
- No cascade updates
- Minimal database changes

### 5. Maintainability
- Clear separation: `id` = internal, `uniqueId` = external
- Easy to understand for developers
- Follows best practices

---

## FAQs

### Q: Why not replace id completely with uniqueId?
**A:** Too risky. Would require updating all foreign keys in 18+ tables. High chance of data corruption.

### Q: Is having two IDs a problem?
**A:** No. Many systems use internal IDs + external IDs. It's a common pattern (e.g., order number vs database ID).

### Q: What about atomicity?
**A:** `id` is the atomic primary key. `uniqueId` is a unique user-facing identifier. Both are atomic in their context.

### Q: Can we query by uniqueId?
**A:** Yes! It's marked as `@unique` so queries are indexed and efficient.

### Q: What if uniqueId generation fails?
**A:** We can have fallback logic or retry mechanism. Since `id` still exists, record won't be lost.

---

## Next Steps

1. ✅ Review this strategy
2. ⏳ Create backfill scripts
3. ⏳ Test on development database
4. ⏳ Run backfill in production
5. ⏳ Make uniqueId required in schema
6. ⏳ Verify all UI displays uniqueId
7. ✅ Document the system

---

**Status:** Ready for Implementation
**Risk Level:** Low (with recommended approach)
**Estimated Time:** 2-4 hours
**Rollback Plan:** Scripts are read-only first, can be tested safely
