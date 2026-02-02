# Coordinator Payment & Recent Registrations Fix

## Issues Fixed

### 1. ✅ Coordinator Payment - Monthly to Annual (Financial Year)
**Problem**: Coordinator payments showing as monthly instead of annual (April 1 to March 31).

**Root Cause**: 
- Backend code already sets `ANNUAL` for coaches during payment verification
- Existing coaches in database may have `MONTHLY` subscriptionType
- Display didn't clearly indicate financial year period

**Solution**:
- ✅ Backend already correctly sets `subscriptionType: 'ANNUAL'` and `subscriptionExpiresAt: getFinancialYearEnd()` for coaches
- ✅ Updated frontend display to show "Annual (Financial Year: Apr 1 - Mar 31)" instead of just "ANNUAL"
- ✅ Created migration script to update existing coaches from MONTHLY to ANNUAL

**Files Modified**:
- `frontend/src/pages/dashboard/AdminCoachProfile.jsx` - Updated subscription type display
- `backend/src/scripts/migrate-coach-subscriptions.js` - New migration script

**Migration Script Usage**:
```bash
cd backend
node src/scripts/migrate-coach-subscriptions.js
```

This will:
- Find all coaches with MONTHLY subscription or null subscriptionType
- Update them to ANNUAL with expiry date set to March 31 of current financial year
- Only updates coaches with paymentStatus = 'SUCCESS'

### 2. ✅ Recent Registrations Blank & Filters Not Working
**Problem**: Recent registrations section showing blank and filters not working.

**Root Cause**:
- Missing null/undefined checks in filter function
- Filters not resetting pagination to page 1
- No useEffect to handle filter changes

**Solution**:
- ✅ Added comprehensive null/undefined checks in `getFilteredRecentUsers()`
- ✅ Added array validation to ensure `recentUsers` is always an array
- ✅ Added `useEffect` to reset pagination to page 1 when filters change
- ✅ Fixed pagination calculation to handle edge cases
- ✅ Added debug logging to track data flow
- ✅ Updated filter change handler to reset pagination

**Files Modified**:
- `frontend/src/pages/dashboard/AdminDashboard.jsx` - Fixed filtering, pagination, and data validation

**Key Changes**:
1. **Null Safety**: Added checks for empty arrays and null users
2. **Pagination Reset**: Filters now automatically reset to page 1
3. **Data Validation**: Ensures `recentUsers` is always an array
4. **Better Error Handling**: Handles edge cases in pagination calculation

## Testing Checklist

### Coordinator Payment
- [ ] Run migration script: `node backend/src/scripts/migrate-coach-subscriptions.js`
- [ ] Verify existing coaches show "Annual (Financial Year: Apr 1 - Mar 31)"
- [ ] Register new coach and verify payment sets ANNUAL subscription
- [ ] Check subscription expiry date is March 31 of current financial year
- [ ] Verify admin coach profile shows correct subscription type

### Recent Registrations
- [ ] Login as admin and navigate to dashboard
- [ ] Verify Recent Registrations section shows users (not blank)
- [ ] Test Role filter (Athletes, Coaches, Coordinators, etc.)
- [ ] Test Status filter (Active, Pending)
- [ ] Test Search filter (by name, email, UID)
- [ ] Verify pagination works when more than 10 users
- [ ] Verify filters reset pagination to page 1
- [ ] Test "Clear Filters" button
- [ ] Verify empty state messages show correctly

## Verification Steps

1. **Check Recent Registrations Display**:
   - Admin Dashboard → Overview tab
   - Recent Registrations section should show list of users
   - Count should match total users displayed

2. **Test Filters**:
   - Select "Athletes" from Role dropdown → Should filter to STUDENT role only
   - Select "Coordinators" from Role dropdown → Should filter to COORDINATOR role only
   - Select "Active" from Status → Should show only active+verified users
   - Type in Search box → Should filter by name/email/UID

3. **Test Pagination**:
   - If more than 10 users, pagination controls should appear
   - Click "Next" → Should show next page
   - Click "Previous" → Should show previous page
   - Page counter should update correctly

4. **Check Coordinator Payment**:
   - Admin → Users → Find a coach/coordinator
   - View profile → Check "Subscription Type"
   - Should show "Annual (Financial Year: Apr 1 - Mar 31)"
   - Subscription Expires should show March 31 date

## Production Deployment

1. **Run Migration Script** (one-time):
   ```bash
   cd backend
   node src/scripts/migrate-coach-subscriptions.js
   ```

2. **Deploy Frontend Changes**:
   - Build and deploy updated frontend
   - Clear browser cache if needed

3. **Verify**:
   - Test admin dashboard loads correctly
   - Test recent registrations display
   - Test all filters work
   - Verify coordinator subscription display

## Notes

- Migration script is safe to run multiple times (idempotent)
- Only updates coaches with `paymentStatus = 'SUCCESS'`
- Frontend changes are backward compatible
- All existing functionality preserved
