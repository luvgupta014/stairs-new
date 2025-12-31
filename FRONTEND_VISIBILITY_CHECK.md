# Frontend Visibility Check - Step by Step Guide

## ✅ Quick Verification Steps

### Step 1: Rebuild Frontend (CRITICAL)
```bash
cd frontend
npm run build
# OR for development
npm run dev
```

### Step 2: Clear Browser Cache
- **Windows/Linux**: Press `Ctrl + Shift + R` (hard refresh)
- **Mac**: Press `Cmd + Shift + R` (hard refresh)
- **Or**: Open DevTools (F12) → Application → Clear Storage → Clear site data

### Step 3: Verify Changes Are Visible

---

## 📍 Where to Find Each Feature

### 1. Categories Available Field (Admin Side)

#### Location A: Create Event Page
1. Login as **Admin** or **Coach**
2. Navigate to: **Events** → **Create Event**
3. Fill in event details
4. **Scroll down** past "End Date & Time"
5. **Look for**: "Categories Available (Optional)" textarea field
6. **Should appear**: Right before "Create Event" button

#### Location B: Edit Event Page
1. Login as **Admin** or **Coach**
2. Go to any event → Click **"Edit"**
3. **Scroll down** past "End Date & Time"
4. **Look for**: "Categories Available (Optional)" textarea field
5. **Should appear**: Right before "Update Event" button

#### What You Should See:
```
┌─────────────────────────────────────────┐
│ Categories Available (Optional)         │
├─────────────────────────────────────────┤
│ [Textarea with placeholder text]        │
│                                         │
│ This information will be displayed to   │
│ athletes during registration...         │
└─────────────────────────────────────────┘
```

---

### 2. Categories Display (Event Details Page)

#### Location: Event Details Page
1. View any event (as any user)
2. **Look for**: "Categories Available" section
3. **Should appear**: After "Event Details" section, before "Organized By"
4. **Only shows**: If event has `categoriesAvailable` set

#### What You Should See:
```
┌─────────────────────────────────────────┐
│ Categories Available                    │
├─────────────────────────────────────────┤
│ [Gray box with category text]           │
│                                         │
│ Please select your category from the    │
│ options above during registration.      │
└─────────────────────────────────────────┘
```

---

### 3. Selected Category Field (Athlete Registration)

#### Location: Event Details Page - Registration Section
1. Login as **Student/Athlete**
2. Go to event details page
3. **Look at**: Right sidebar → "Registration Status" section
4. **Should see**: "Selected Category *" input field
5. **Only shows**: If event has `categoriesAvailable` set
6. **Appears**: Above "Register Now" button

#### What You Should See:
```
┌─────────────────────────────────────────┐
│ Registration Status                     │
├─────────────────────────────────────────┤
│ Registered: 0/194                       │
│                                         │
│ Selected Category *                     │
│ [Input field]                           │
│ e.g., Group II (13-14) | Freestyle | 50m│
│                                         │
│ [View Categories] link                   │
│                                         │
│ [Register Now] button                   │
└─────────────────────────────────────────┘
```

**Important**: 
- Field is **mandatory** (red asterisk *)
- Button is **disabled** if field is empty
- "View Categories" link opens modal with categories

---

### 4. Selected Category in Admin Panel

#### Location: Participants Modal
1. Login as **Admin** or **Coach**
2. Go to event → Click **"Participants"**
3. **Look at**: Each participant card
4. **Should see**: "Selected Category" section (if participant entered one)

#### What You Should See:
```
┌─────────────────────────────────────────┐
│ [Participant Name]                      │
│ Registered on [date]                     │
├─────────────────────────────────────────┤
│ [Contact info, sports info, etc.]       │
│                                         │
│ ─────────────────────────────────────   │
│ 🏅 Selected Category:                    │
│    Group II (13-14) | Freestyle | 50m   │
└─────────────────────────────────────────┘
```

---

### 5. Selected Category in Export

#### Location: Participants Modal → Export Button
1. Login as **Admin** or **Coach**
2. Open Participants Modal
3. Click **"Export List"** button (top right)
4. Open downloaded CSV file
5. **Look for**: "Selected Category" column

#### CSV Format:
```csv
Name,Email,Phone,UID,Status,Selected Category,Registered Date
"John Doe","john@example.com","1234567890","STU-001","REGISTERED","Group II (13-14) | Freestyle | 50m","01/01/2026"
```

---

## 🔍 Troubleshooting: If Changes Don't Show

### Issue 1: Field Not Visible in Create/Edit Form

**Check:**
1. ✅ Did you rebuild frontend? (`npm run build`)
2. ✅ Did you clear browser cache? (Ctrl+Shift+R)
3. ✅ Are you on the correct page? (Create Event or Edit Event)
4. ✅ Did you scroll down? (Field is near the bottom)

**Solution:**
```bash
# Stop frontend server
# Clear node_modules cache
cd frontend
rm -rf node_modules/.vite
npm run build
# Restart server
```

### Issue 2: Categories Not Showing on Event Page

**Check:**
1. ✅ Did admin add categories to the event?
2. ✅ Is `categoriesAvailable` saved in database?
3. ✅ Is backend returning `categoriesAvailable` in API response?

**Verify in Browser Console (F12):**
```javascript
// Check if event has categories
console.log(event.categoriesAvailable);
```

### Issue 3: Registration Field Not Showing

**Check:**
1. ✅ Are you logged in as Student?
2. ✅ Does the event have `categoriesAvailable`?
3. ✅ Is the event in APPROVED/ACTIVE status?

**Verify:**
- Check browser console for errors
- Check Network tab → Event details API response
- Should include: `"categoriesAvailable": "..."`

### Issue 4: Category Not Saving

**Check:**
1. ✅ Did you enter category before clicking Register?
2. ✅ Is registration button enabled? (should be disabled if empty)
3. ✅ Check browser console for errors
4. ✅ Check Network tab → Registration API request
- Should include: `"selectedCategory": "..."`

**Verify in Database:**
```sql
SELECT "selectedCategory" 
FROM event_registrations 
WHERE "eventId" = 'your-event-id';
```

---

## ✅ Complete Test Flow

### Test 1: Admin Adds Categories
1. Login as Admin
2. Create new event OR edit existing event
3. Scroll to "Categories Available" field
4. Enter:
   ```
   Age Groups: Group I (11-12), Group II (13-14)
   Strokes: Freestyle, Backstroke
   Distances: 25m, 50m
   ```
5. Save event
6. ✅ **Verify**: Categories appear on event details page

### Test 2: Athlete Registers with Category
1. Login as Student
2. Go to event details page
3. ✅ **Verify**: "Categories Available" section visible
4. ✅ **Verify**: "Selected Category" field in registration section
5. Enter: `Group II (13-14) | Freestyle | 50m`
6. ✅ **Verify**: "Register Now" button becomes enabled
7. Click Register
8. ✅ **Verify**: Registration succeeds

### Test 3: Admin Views Category
1. Login as Admin
2. Go to event → Participants
3. ✅ **Verify**: Participant shows "Selected Category" section
4. Click "Export List"
5. ✅ **Verify**: CSV includes "Selected Category" column with data

---

## 🎯 Quick Visual Checklist

- [ ] "Categories Available" field in Create Event form
- [ ] "Categories Available" field in Edit Event form
- [ ] "Categories Available" section on Event Details page
- [ ] "Selected Category" field in registration (athlete side)
- [ ] "Selected Category" visible in Participants Modal
- [ ] "Selected Category" in CSV export

---

## 📞 Still Not Working?

1. **Check Browser Console** (F12) for errors
2. **Check Network Tab** - Verify API responses include fields
3. **Check Database** - Verify columns exist and data is saved
4. **Restart Everything**:
   ```bash
   # Backend
   cd backend
   pm2 restart all
   
   # Frontend
   cd frontend
   npm run build
   ```

All code changes are in place. If you don't see them, it's likely a caching or build issue. Follow the troubleshooting steps above.

