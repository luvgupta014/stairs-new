# 🚨 URGENT: Production Fix Instructions - UPDATED

## Issues on Production
1. **Revenue Dashboard**: 500 error - Payment.status type mismatch ✅ FIXED
2. **Certificate History**: 500 error - Event/Student ID lookup issue ✅ FIXED

## ✅ Latest Changes (Commit: 04cd02f)
- Fixed certificate endpoint to handle both database ID and uniqueId
- Added comprehensive error handling and logging
- Certificates now look up events and students by both ID types
- Better fallback for missing student data

## 📋 Deployment Commands (Run on Production Server)

### Quick Deploy (One Command)
```bash
cd /var/www/stairs-api && git pull origin main && cd backend && npm install && npx prisma generate && pm2 restart stairs-api && pm2 logs stairs-api --lines 50
```

### Detailed Step-by-Step

1. **SSH to Production Server**
```bash
ssh user@stairs.astroraag.com
```

2. **Navigate to Project Directory**
```bash
cd /var/www/stairs-api
```

3. **Pull Latest Code**
```bash
git pull origin main
```

4. **Install Dependencies (if needed)**
```bash
cd backend
npm install
```

5. **Regenerate Prisma Client**
```bash
npx prisma generate
```

6. **Restart Backend Service**
```bash
pm2 restart stairs-api
```
OR if that doesn't work:
```bash
pm2 restart all
```

7. **Monitor Logs**
```bash
pm2 logs stairs-api --lines 100
```

## 🧪 Verify Fixes

### 1. Test Revenue Dashboard
Open: https://stairs.astroraag.com/admin/revenue
- Should load without errors
- Should show revenue data
- Check browser console for errors

### 2. Test Certificate History
Open: https://stairs.astroraag.com/admin/event/59-SW-EVT-GJ-102025/certificates
- Should load without 500 error
- Should show certificate history tab
- Should show eligible students

### 3. Check Backend Logs
```bash
pm2 logs stairs-api --lines 100
```
Look for:
- ✅ "Revenue dashboard data compiled successfully"
- ✅ "Certificates retrieved successfully"
- ❌ NO "operator does not exist: text = 'PaymentStatus'" errors

## 🔍 Additional Checks

### Verify Admin User Role
```bash
# Connect to PostgreSQL
psql -U postgres -d stairs_db

# Check admin user
SELECT id, email, role FROM users WHERE role = 'ADMIN';

# If admin doesn't exist or has wrong role:
UPDATE users SET role = 'ADMIN' WHERE email = 'your-admin-email@example.com';
```

## 📞 Support
If issues persist after deployment:
1. Check PM2 logs: `pm2 logs stairs-api`
2. Check PostgreSQL logs
3. Verify environment variables in `.env`
4. Ensure database connection is working

## 📝 Changes Made
- **File**: `backend/src/routes/admin.js`
- **Change**: Payment.status query from `status: 'SUCCESS'` to `status: { equals: 'SUCCESS' }`
- **Reason**: Handle string type comparison instead of enum
- **Commit**: 119aa4b "Add production deployment script"
