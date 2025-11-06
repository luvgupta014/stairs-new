# Production Fix Guide - November 7, 2025

## Issues Fixed

### 1. Revenue Dashboard 500 Error
**Problem**: PostgreSQL type mismatch when comparing `Payment.status` (text) with enum values
**Error**: `operator does not exist: text = "PaymentStatus"`

**Solution**: Changed Prisma query to use `{ equals: 'SUCCESS' }` instead of direct comparison

**File Modified**: `backend/src/routes/admin.js` (line ~3163)

### 2. Certificate History 500 Error
**Problem**: Admin authentication required but route uses `requireAdmin` middleware
**Solution**: Routes already use `requireAdmin` - verify admin user has proper role

## Deployment Steps

### Step 1: Pull Latest Code
```bash
cd /var/www/stairs-api
git pull origin main
```

### Step 2: Install Dependencies (if needed)
```bash
cd backend
npm install
```

### Step 3: Regenerate Prisma Client
```bash
cd backend
npx prisma generate
```

### Step 4: Restart Backend Service
```bash
pm2 restart stairs-api
# OR
pm2 restart all
```

### Step 5: Verify Fixes
1. Check revenue dashboard: https://stairs.astroraag.com/admin/revenue
2. Check certificate history: https://stairs.astroraag.com/admin/event/{eventId}/certificates

### Step 6: Monitor Logs
```bash
pm2 logs stairs-api --lines 100
```

## Additional Notes

### Payment Status Type
- The `Payment` model has `status` as `String` type (not enum)
- All queries must use string comparison, not enum comparison
- Changed query from: `status: 'SUCCESS'`
- To: `status: { equals: 'SUCCESS' }`

### Certificate Routes
- `/api/certificates/event/:eventId/issued` - Uses `requireAdmin` middleware
- `/api/certificates/event/:eventId/eligible-students` - Uses `requireAdmin` middleware
- Admin user must have `role: 'ADMIN'` in the database

### Verify Admin User
Run this query in production database to verify admin user:
```sql
SELECT id, email, role FROM users WHERE role = 'ADMIN';
```

If admin user doesn't exist or has wrong role, update:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-admin-email@domain.com';
```

## Testing Checklist

- [ ] Revenue dashboard loads without errors
- [ ] Certificate history loads for events
- [ ] Eligible students list appears
- [ ] Certificate issuance works
- [ ] No 500 errors in browser console
- [ ] Backend logs show no errors

## Rollback Plan

If issues persist:
```bash
git log --oneline -5
git revert <commit-hash>
pm2 restart stairs-api
```
