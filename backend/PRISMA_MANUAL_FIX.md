# Manual Prisma Fix Guide

## Problem
Prisma client doesn't recognize `coordinatorFee` column even though it exists in the database.

## Step-by-Step Manual Fix

### Step 1: Verify Database Has the Column
```sql
-- Connect to your database and run:
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('coordinatorFee', 'feeMode', 'level', 'eventCategory')
ORDER BY column_name;
```

**Expected Output:**
```
   column_name    |     data_type      | column_default 
-----------------+--------------------+----------------
 coordinatorFee  | double precision   | 0
 eventCategory   | text               | 
 feeMode         | text               | 'GLOBAL'::text
 level           | text               | 'DISTRICT'::text
```

If any are missing, run the SQL from `URGENT_FIX.sql` first.

---

### Step 2: Verify Schema File on Server
```bash
cd /root/stairs-new/backend

# Check if coordinatorFee exists in schema
grep -A 2 "eventFee" prisma/schema.prisma
```

**Expected Output:**
```
  eventFee            Float               @default(0)
  coordinatorFee      Float               @default(0)
  eventCategory       String?             // optional custom category for fee calc
  feeMode             EventFeeMode        @default(GLOBAL)
  level               EventLevel          @default(DISTRICT)
```

**If coordinatorFee is MISSING from schema.prisma**, add it manually:

```bash
# Edit the schema file
nano prisma/schema.prisma
# OR
vi prisma/schema.prisma
```

Find the Event model (around line 241) and make sure it looks like this:
```prisma
model Event {
  id                  String              @id @default(cuid())
  name                String
  description         String?
  sport               String
  venue               String
  address             String?
  city                String
  state               String
  latitude            Float?
  longitude           Float?
  startDate           DateTime
  endDate             DateTime?
  maxParticipants     Int                 @default(50)
  currentParticipants Int                 @default(0)
  eventFee            Float               @default(0)
  coordinatorFee      Float               @default(0)          // ADD THIS LINE
  eventCategory       String?                                  // ADD THIS LINE
  feeMode             EventFeeMode        @default(GLOBAL)     // ADD THIS LINE
  level               EventLevel          @default(DISTRICT)    // ADD THIS LINE
  status              EventStatus         @default(PENDING)
  adminNotes          String?
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
  coachId             String
  uniqueId            String?             @unique @map("unique_id") @db.VarChar(255)
  // ... rest of relations
}
```

Also verify these enums exist:
```prisma
enum EventFeeMode {
  GLOBAL
  EVENT
  DISABLED
}

enum EventLevel {
  DISTRICT
  STATE
  NATIONAL
  SCHOOL
}
```

---

### Step 3: Stop Backend Server
```bash
pm2 stop backend
# OR
pkill -f "node.*backend"
# Wait a few seconds
sleep 3
```

---

### Step 4: Clear Prisma Cache (CRITICAL)
```bash
cd /root/stairs-new/backend

# Remove all Prisma cache
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma
rm -rf .prisma

# Verify they're gone
ls -la node_modules/.prisma 2>&1 | grep "No such file" && echo "✅ Cache cleared"
```

---

### Step 5: Format Schema (Validates it)
```bash
cd /root/stairs-new/backend
npx prisma format
```

**Expected Output:**
```
✔ Generated Prisma Client (validate was skipped)
```

If you see errors, fix them before proceeding.

---

### Step 6: Generate Prisma Client
```bash
cd /root/stairs-new/backend
npx prisma generate --force
```

**Expected Output:**
```
✔ Generated Prisma Client (v6.19.0) to ./node_modules/@prisma/client in XXXms
```

---

### Step 7: Verify Prisma Client Has coordinatorFee
```bash
cd /root/stairs-new/backend

# Check if coordinatorFee is in the generated client
grep -r "coordinatorFee" node_modules/@prisma/client/ | head -5
```

**Expected Output:**
```
node_modules/@prisma/client/index.d.ts:    coordinatorFee?: number | null;
node_modules/@prisma/client/index.js:    coordinatorFee: "coordinatorFee",
```

If you see NO output, the generation failed. Go back to Step 2.

---

### Step 8: Restart Backend
```bash
pm2 restart backend
# OR
pm2 start backend
```

---

### Step 9: Check Backend Logs
```bash
pm2 logs backend --lines 50
```

Look for the error. It should be gone now.

---

## Alternative: Manual Prisma Client Verification

If you want to test if Prisma client works:

```bash
cd /root/stairs-new/backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.event.findFirst().then(event => {
  console.log('Event fields:', Object.keys(event || {}));
  console.log('Has coordinatorFee:', event && 'coordinatorFee' in event ? 'YES' : 'NO');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
"
```

---

## Troubleshooting

### Issue: "coordinatorFee not found" after generation
**Solution:** 
1. Check schema.prisma has the field
2. Run `npx prisma format` to validate
3. Clear cache again: `rm -rf node_modules/.prisma node_modules/@prisma`
4. Regenerate: `npx prisma generate --force`

### Issue: Schema file is different on server
**Solution:**
1. Copy schema from your local machine:
   ```bash
   # On your local machine
   scp backend/prisma/schema.prisma user@your-server:/root/stairs-new/backend/prisma/
   ```
2. Then regenerate Prisma client on server

### Issue: Backend still shows error after restart
**Solution:**
1. Make sure backend is completely stopped: `pm2 stop backend && sleep 5`
2. Verify Prisma client: `grep -r "coordinatorFee" node_modules/@prisma/client/`
3. If still missing, check schema file again
4. Restart: `pm2 restart backend`

---

## Quick Checklist

- [ ] Database has `coordinatorFee` column (Step 1)
- [ ] Schema file has `coordinatorFee` field (Step 2)
- [ ] Backend is stopped (Step 3)
- [ ] Prisma cache cleared (Step 4)
- [ ] Schema formatted successfully (Step 5)
- [ ] Prisma client generated (Step 6)
- [ ] coordinatorFee found in generated client (Step 7)
- [ ] Backend restarted (Step 8)
- [ ] No errors in logs (Step 9)

---

## Manual SQL Backup (if needed)

If you need to add the column again:
```sql
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "coordinatorFee" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "eventCategory" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "feeMode" TEXT NOT NULL DEFAULT 'GLOBAL';
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "level" TEXT NOT NULL DEFAULT 'DISTRICT';
```

