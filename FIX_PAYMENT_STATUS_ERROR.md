# Fix Payment Status Field Type Error

## Problem
The coach dashboard API returns a 500 error with:
```
PostgresError { code: "42883", message: "operator does not exist: text = \"PaymentStatus\"" }
```

## Root Cause
The database schema is out of sync with the Prisma schema:
- **Prisma expects**: `payment.status` to be a `PaymentStatus` ENUM with values (PENDING, SUCCESS, FAILED, REFUNDED)
- **Database has**: `payment.status` as a TEXT column

When Prisma tries to query `where: { status: 'SUCCESS' }`, PostgreSQL doesn't know how to compare a text column to the enum type, causing the error.

## Solution

### Option 1: Run the Automated Fix Script (Recommended)

On your server:
```bash
cd ~/stairs-new
chmod +x fix_payment_status.sh
./fix_payment_status.sh
```

This will:
1. Create the PaymentStatus ENUM type in PostgreSQL
2. Convert the `payment.status` column from TEXT to ENUM
3. Convert the `event_payments.status` column from TEXT to ENUM
4. Display verification that the migration was successful

### Option 2: Manual SQL Fix

If the script fails, run this manually:

```bash
# SSH to your server
ssh root@160.187.22.41

# Connect to PostgreSQL
psql "$DATABASE_URL"
```

Then run this SQL:
```sql
-- Create the PaymentStatus ENUM type if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
  END IF;
END
$$;

-- Convert payment.status column
ALTER TABLE payments ADD COLUMN status_new "PaymentStatus" DEFAULT 'PENDING';

UPDATE payments 
SET status_new = CASE 
  WHEN status = 'PENDING' THEN 'PENDING'::PaymentStatus
  WHEN status = 'SUCCESS' THEN 'SUCCESS'::PaymentStatus
  WHEN status = 'FAILED' THEN 'FAILED'::PaymentStatus
  WHEN status = 'REFUNDED' THEN 'REFUNDED'::PaymentStatus
  ELSE 'PENDING'::PaymentStatus
END;

ALTER TABLE payments DROP COLUMN status;
ALTER TABLE payments RENAME COLUMN status_new TO status;
ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'PENDING'::PaymentStatus;

-- Convert event_payments.status column
ALTER TABLE event_payments ADD COLUMN status_new "PaymentStatus" DEFAULT 'PENDING';

UPDATE event_payments 
SET status_new = CASE 
  WHEN status = 'PENDING' THEN 'PENDING'::PaymentStatus
  WHEN status = 'SUCCESS' THEN 'SUCCESS'::PaymentStatus
  WHEN status = 'FAILED' THEN 'FAILED'::PaymentStatus
  WHEN status = 'REFUNDED' THEN 'REFUNDED'::PaymentStatus
  ELSE 'PENDING'::PaymentStatus
END;

ALTER TABLE event_payments DROP COLUMN status;
ALTER TABLE event_payments RENAME COLUMN status_new TO status;
ALTER TABLE event_payments ALTER COLUMN status SET DEFAULT 'PENDING'::PaymentStatus;

-- Type \q to exit psql
```

### Step 3: Restart Backend

After the migration:
```bash
pm2 restart stairs-backend
```

### Step 4: Verify the Fix

Check that the backend logs show successful startup:
```bash
pm2 logs stairs-backend --lines 20
```

Test the health endpoint:
```bash
curl http://localhost:5000/health
```

Test the dashboard API:
```bash
curl http://localhost:5000/api/coach/dashboard
```

Or test from your browser by logging in and accessing the coach dashboard.

## Why This Happened

This is a **database migration issue**. When you:
1. Updated your Prisma schema to define `status` as a `PaymentStatus` ENUM
2. Created records via the old schema (when `status` was just TEXT)
3. Now the database still has TEXT columns while Prisma expects ENUM types

The fix converts the existing TEXT data to proper ENUM columns so Prisma queries work correctly.

## Prevention for Future Deployments

1. Always run Prisma migrations on the server after code updates:
   ```bash
   cd ~/stairs-new/backend
   npx prisma migrate deploy
   # or
   npx prisma db push
   ```

2. Include this in your deployment script (`deploy.sh`):
   ```bash
   # Backend deployment
   cd backend
   npm install
   npx prisma generate
   npx prisma migrate deploy  # Always run migrations
   ```

3. Never modify Prisma schema without running migrations.

## Troubleshooting

### Error: "type does not exist"
- The PaymentStatus ENUM type wasn't created properly
- Solution: Create it manually:
  ```sql
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
  ```

### Error: "column already exists"
- The temporary column wasn't cleaned up from a previous attempt
- Solution: Drop it manually:
  ```sql
  ALTER TABLE payments DROP COLUMN IF EXISTS status_new;
  ALTER TABLE event_payments DROP COLUMN IF EXISTS status_new;
  ```

### Dashboard still returns 500 error after migration
- The backend might not have restarted properly
- Solution:
  ```bash
  pm2 stop stairs-backend
  sleep 2
  pm2 start stairs-backend
  pm2 logs stairs-backend --lines 50
  ```

### Cannot connect to database
- Check your DATABASE_URL in `.env`:
  ```bash
  cat ~/stairs-new/backend/.env | grep DATABASE_URL
  ```
- Make sure psql is installed:
  ```bash
  apt-get update
  apt-get install -y postgresql-client
  ```

