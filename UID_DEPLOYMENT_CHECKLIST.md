# UID Implementation - Deployment Checklist

Use this checklist to ensure proper deployment of the UID system.

## Pre-Deployment

### ✅ Code Review
- [ ] Review `backend/src/utils/uidGenerator.js` - UID generator implementation
- [ ] Review `backend/src/routes/auth.js` - Registration route updates
- [ ] Review `backend/prisma/schema.prisma` - Schema changes
- [ ] Review `frontend/src/utils/stateCodes.js` - Frontend utilities

### ✅ Database Preparation
- [ ] Backup existing database
- [ ] Review migration SQL: `backend/migrations/add_uid_column.sql`
- [ ] Test migration on staging environment first (if available)

### ✅ Testing
- [ ] Run UID generator tests: `npm run test:uid`
- [ ] Test student registration locally
- [ ] Test coach registration locally
- [ ] Test institute registration locally
- [ ] Test club registration locally
- [ ] Verify UIDs are sequential
- [ ] Verify different states get different codes

## Deployment Steps

### Step 1: Backend Preparation
```bash
cd backend
```

- [ ] Pull latest code from repository
- [ ] Install dependencies: `npm install`
- [ ] Generate Prisma client: `npx prisma generate`

### Step 2: Database Migration
```bash
# Option A: Using psql directly
psql -U your_username -d your_database -f migrations/add_uid_column.sql

# Option B: Using Prisma migrate (if schema is clean)
npx prisma migrate deploy
```

- [ ] Migration executed successfully
- [ ] Verify `uid` column exists in `users` table
- [ ] Verify unique constraint on `uid` column

### Step 3: Existing User Migration
```bash
npm run migrate:uid
```

- [ ] Migration script completed
- [ ] Check how many users were migrated
- [ ] Review any errors or warnings
- [ ] Verify random sampling of users have UIDs
- [ ] Note any users without state information

### Step 4: Backend Deployment
- [ ] Deploy backend code to production server
- [ ] Restart backend services
- [ ] Check logs for startup errors
- [ ] Verify environment variables are set
- [ ] Test health check endpoint

### Step 5: Frontend Deployment
```bash
cd frontend
npm run build
```

- [ ] Build completed successfully
- [ ] Deploy build to hosting (Vercel/Netlify/etc.)
- [ ] Clear CDN cache if applicable
- [ ] Verify deployment successful

## Post-Deployment Testing

### Registration Tests
- [ ] Register new student account
  - [ ] Receives UID in response
  - [ ] UID starts with 'a'
  - [ ] UID contains correct state code
  - [ ] UID stored in database

- [ ] Register new coach account
  - [ ] Receives UID in response
  - [ ] UID starts with 'c'
  - [ ] UID contains correct state code

- [ ] Register from different states
  - [ ] Different state codes in UIDs
  - [ ] Sequences are independent

- [ ] Register multiple users sequentially
  - [ ] Sequence numbers increment (00001, 00002, 00003)

### API Tests
- [ ] Login with existing user
  - [ ] UID included in response
  
- [ ] Verify OTP
  - [ ] UID included in response

- [ ] Get user profile
  - [ ] UID displayed

### Frontend Tests
- [ ] State dropdown works
- [ ] All states visible in dropdown
- [ ] Registration form submits correctly
- [ ] UID displayed in user dashboard
- [ ] UID visible in profile page

## Rollback Plan (If Needed)

### If Critical Issues Found

1. **Immediate Actions**
   ```bash
   # Revert code deployment
   git revert <commit-hash>
   
   # Redeploy previous version
   npm run deploy
   ```

2. **Database Rollback** (Optional)
   ```sql
   -- Only if absolutely necessary
   ALTER TABLE users DROP COLUMN uid;
   ```

3. **Monitor**
   - [ ] Check error logs
   - [ ] Verify old system working
   - [ ] Document issues found

## Monitoring

### First 24 Hours
- [ ] Monitor error logs every hour
- [ ] Check UID generation logs
- [ ] Watch for duplicate UID errors
- [ ] Track registration success rate
- [ ] Monitor database performance

### First Week
- [ ] Daily log review
- [ ] Check UID sequence patterns
- [ ] Verify no data integrity issues
- [ ] Collect user feedback
- [ ] Document any issues

## Common Issues & Solutions

### Issue: UID generation fails
**Check:**
- [ ] State field provided in registration
- [ ] Database connection working
- [ ] Prisma client generated correctly

### Issue: Duplicate UIDs
**Check:**
- [ ] Unique constraint in database
- [ ] Retry logic working
- [ ] No race conditions in concurrent requests

### Issue: Wrong state codes
**Check:**
- [ ] State name matches exactly
- [ ] Case sensitivity
- [ ] STATE_CODES mapping in uidGenerator.js

### Issue: Migration script fails
**Check:**
- [ ] Users have state in their profiles
- [ ] Database connection
- [ ] Permissions for database updates

## Success Criteria

All items below should be ✅ before marking deployment complete:

- [ ] Database migration successful
- [ ] All existing users have UIDs (or documented exceptions)
- [ ] New registrations generate UIDs
- [ ] UIDs follow correct format
- [ ] Sequence numbers increment correctly
- [ ] State codes are accurate
- [ ] No duplicate UIDs
- [ ] Frontend displays UIDs
- [ ] API responses include UIDs
- [ ] No critical errors in logs
- [ ] Performance is acceptable
- [ ] User registration flow works end-to-end

## Sign-Off

**Deployment Date:** _______________

**Deployed By:** _______________

**Verified By:** _______________

**Database Records Updated:** _______________

**Issues Found:** _______________

**Status:** 
- [ ] ✅ Successfully Deployed
- [ ] ⚠️ Deployed with Minor Issues (documented above)
- [ ] ❌ Rolled Back (reason: _______________)

## Support Contacts

**Technical Issues:**
- Backend: _______________
- Database: _______________
- Frontend: _______________

**Documentation:**
- Full Guide: `UID_IMPLEMENTATION.md`
- Quick Start: `UID_QUICK_START.md`
- Summary: `UID_IMPLEMENTATION_SUMMARY.md`

---

**Last Updated:** November 2, 2025  
**Version:** 1.0
