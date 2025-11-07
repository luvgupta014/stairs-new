# Certificate Production Issue - Root Cause & Fix

## Problem Summary
The certificate endpoint was returning **500 errors** on production while working on localhost.

**Error Message:**
```
Invalid `prisma.certificate.findMany()` invocation:
Error converting field "orderId" of expected non-nullable type "String", found incompatible value of "null".
```

## Root Cause
The production database had a **NOT NULL constraint** on the `orderId` column in the `certificates` table, but:
1. Some certificates have `NULL` values for `orderId` (certificates issued directly without orders)
2. The Prisma schema defines `orderId String?` (optional)
3. The generated Prisma client was treating `orderId` as required due to a mismatch between database schema and Prisma schema

### Why This Happened
During database sync, the `orderId` constraint wasn't properly aligned:
- Localhost: Likely has `orderId` as nullable (correct)
- Production: Had `orderId` as NOT NULL (incorrect)

## Solution Applied

### Step 1: Alter Database Column
```sql
ALTER TABLE certificates ALTER COLUMN "orderId" DROP NOT NULL;
```
This was executed via raw Prisma query on production.

### Step 2: Regenerate Prisma Client
```bash
npx prisma generate
```
This regenerated the Prisma client to properly reflect the nullable field.

### Step 3: Create Migration
Created migration file: `prisma/migrations/fix_orderId_nullable/migration.sql`

This ensures the change is tracked and can be applied during future deployments.

## Verification
After the fix, verified that:
✅ Certificate query succeeds: 1 certificate found
✅ Student enrichment works correctly
✅ No more 500 errors on certificate endpoint

## Deployment Steps
1. Pull latest code including migration file
2. Run `npx prisma generate` to ensure client is up to date
3. Run `npx prisma migrate deploy` to apply any pending migrations
4. Restart backend server
5. Test certificate endpoint: `GET /api/certificates/event/EVT-0001-FB-GJ-071125/issued`

## Prevention for Future
- Keep database schema and Prisma schema synchronized
- When syncing databases, verify nullable constraints match
- Run `npx prisma validate` after database changes
- Test certificate endpoints after any database sync operations
