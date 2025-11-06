# Event UID Display Fix Summary

## Issues Fixed

### 1. ✅ Sequential Event UID Generation
**Problem:** Event UIDs used random numbers (e.g., `07-FB-EVT-DL-112025`) instead of sequential numbers.

**Solution:** Updated `backend/src/utils/eventUIDGenerator.js` to:
- Query database for the highest serial number for each sport-location-date combination
- Increment the serial sequentially (01, 02, 03, etc.)
- Example: First football event in Delhi for Nov 2025 = `01-FB-EVT-DL-112025`
- Second football event in Delhi for Nov 2025 = `02-FB-EVT-DL-112025`

**Code Changes:**
```javascript
// OLD: Random serial generation
serial = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');

// NEW: Sequential serial generation
const existingEvents = await prisma.$queryRaw`
  SELECT unique_id 
  FROM events 
  WHERE unique_id LIKE ${pattern}
  ORDER BY unique_id DESC 
  LIMIT 1
`;
// Extract last serial and increment
```

---

### 2. ✅ Event UID Display in All Routes
**Problem:** Frontend and admin panels showed the default `id` (cuid) instead of the custom `uniqueId`.

**Solution:** Updated all backend API responses to include `uniqueId` alongside `id`:

#### Files Updated:
1. **`backend/src/routes/coach.js`**
   - Coach event listings (dashboard, events list)
   - Event registrations view
   - Event orders
   - Event result files
   - Coach analytics/dashboard

2. **`backend/src/routes/admin.js`**
   - Admin dashboard recent events
   - Admin event listings
   - Pending events
   - Event participants
   - Event result files

3. **`backend/src/routes/student.js`**
   - Student event listings
   - Event details view
   - Student event registrations
   - Student dashboard

#### Example Response Format:
```json
{
  "event": {
    "id": "cm123abc...",           // Internal cuid (for database queries)
    "uniqueId": "01-FB-EVT-DL-112025",  // Custom UID (for display)
    "name": "Football Championship",
    "sport": "Football",
    ...
  }
}
```

---

### 3. ✅ Certificate Generation
**Problem:** Needed to verify certificates use event custom UID.

**Solution:** Confirmed `backend/src/routes/certificates.js` already uses:
```javascript
eventId: event.uniqueId, // Use custom formatted event UID
```

This means certificates will display the custom event UID (e.g., `01-FB-EVT-DL-112025`) instead of the internal ID.

---

## Frontend Display Strategy

### Recommended Approach:
1. **For User Display:** Use `event.uniqueId` (e.g., `01-FB-EVT-DL-112025`)
2. **For API Calls:** Use `event.id` (the internal cuid)
3. **For Certificates:** Use `event.uniqueId`

### Frontend Component Updates Needed:

#### Coach Dashboard (`frontend/src/pages/coach/CoachDashboard.jsx`)
```jsx
// Display event UID
<span>Event ID: {event.uniqueId || event.id}</span>
```

#### Admin Panel (`frontend/src/pages/admin/EventsManagement.jsx`)
```jsx
// Display event UID in table
<td>{event.uniqueId || event.id}</td>
```

#### Student Event View (`frontend/src/pages/student/EventDetails.jsx`)
```jsx
// Display event UID
<p>Event Code: {event.uniqueId || event.id}</p>
```

---

## Deployment Steps

### 1. Push Code to Server
```bash
cd ~/stairs-new
git pull origin main
```

### 2. Restart Backend
```bash
pm2 restart stairs-backend
pm2 logs stairs-backend --lines 20
```

### 3. Rebuild Frontend
```bash
cd frontend
npm run build
pm2 restart stairs-frontend
```

### 4. Verify Changes

#### Test Event UID Generation:
```bash
# SSH to server
ssh root@160.187.22.41

# Test event creation via API
curl -X POST http://localhost:5000/api/coach/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Event",
    "sport": "Football",
    "city": "Delhi",
    "startDate": "2025-11-15"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "id": "cm123abc...",
    "uniqueId": "01-FB-EVT-DL-112025",  // Sequential!
    ...
  }
}
```

#### Test API Responses:
```bash
# Coach events
curl http://localhost:5000/api/coach/events

# Admin events
curl http://localhost:5000/api/admin/events

# Student events
curl http://localhost:5000/api/student/events
```

All should include `uniqueId` field in event objects.

---

## Benefits

### 1. **Sequential Event IDs**
- Predictable and professional
- Easy to reference in conversations
- Clear event ordering

### 2. **Custom UID Display Everywhere**
- Consistent across all dashboards
- Better user experience
- Matches certificates

### 3. **Certificate Consistency**
- Event UID on certificate matches what users see in app
- No confusion between internal ID and display ID

---

## Migration for Existing Events

If you have existing events without `uniqueId` or with random serial numbers:

### Option 1: Regenerate All Event UIDs
```bash
cd ~/stairs-new/backend
node scripts/migrateEventUIDs.js
```

### Option 2: Manual SQL Update
```sql
-- Get all events without uniqueId
SELECT id, name, sport, city, "startDate" 
FROM events 
WHERE unique_id IS NULL;

-- You'll need to generate UIDs for these manually
-- or run the migration script
```

---

## Testing Checklist

- [ ] New events get sequential UIDs (01, 02, 03...)
- [ ] Coach dashboard shows event.uniqueId
- [ ] Admin panel shows event.uniqueId
- [ ] Student event list shows event.uniqueId
- [ ] Certificates display event.uniqueId
- [ ] API responses include both id and uniqueId
- [ ] No breaking changes (id still works for queries)

---

## Troubleshooting

### Event UID Not Showing in Frontend
- Check browser console for API response
- Verify backend is returning `uniqueId` field
- Clear browser cache (Ctrl+Shift+R)

### Still Getting Random Serial Numbers
- Backend code may not be deployed
- Restart backend: `pm2 restart stairs-backend`
- Check logs: `pm2 logs stairs-backend`

### Existing Events Show Old UIDs
- Run migration script to regenerate UIDs
- Or manually update using SQL

---

## Next Steps

1. **Deploy Changes** (see Deployment Steps above)
2. **Update Frontend Components** to display `uniqueId`
3. **Run Migration** for existing events (if needed)
4. **Test Thoroughly** across all user roles

---

## Summary

All backend routes now return `uniqueId` alongside `id` for events. The event UID generator uses sequential numbers instead of random. Certificates already use the custom UID. Frontend components should be updated to display `event.uniqueId` instead of `event.id` for a better user experience.

