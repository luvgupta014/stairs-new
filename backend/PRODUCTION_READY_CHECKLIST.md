# Production Ready Checklist

## ✅ Database Setup
- [ ] Run migration SQL to add missing columns
- [ ] Verify columns exist: `coordinatorFee`, `feeMode`, `level`, `eventCategory`
- [ ] Verify tables exist: `event_assignments`, `event_permissions`, `global_settings`

## ✅ Backend Setup
- [ ] Prisma client regenerated: `npx prisma generate`
- [ ] Backend restarted: `pm2 restart backend`
- [ ] Check logs for errors: `pm2 logs backend --lines 100`
- [ ] Verify API endpoint works: `curl http://localhost:PORT/api/admin/events`

## ✅ Frontend Setup
- [ ] Frontend rebuilt: `npm run build`
- [ ] Frontend restarted/redeployed
- [ ] Check browser console for errors
- [ ] Test admin/events page loads

## ✅ Testing
- [ ] Admin can view events list
- [ ] Events display correctly with all fields
- [ ] Error messages display properly if API fails
- [ ] Filters work correctly
- [ ] Event assignment works
- [ ] Permissions setting works
- [ ] Global payment settings work

## ✅ Error Handling
- [ ] Backend handles missing columns gracefully
- [ ] Frontend shows user-friendly error messages
- [ ] Logs are clear and helpful for debugging
- [ ] No blank pages or crashes

