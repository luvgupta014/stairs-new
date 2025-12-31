# Testing Guide: Athlete Registration Category Feature

## Step 1: Run Database Migration

### Option A: Using psql command line
```bash
# Connect to your database
psql -U your_username -d your_database_name

# Run the migration
\i manual_db_migration.sql

# Or copy-paste these queries:
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "categoriesAvailable" TEXT;
ALTER TABLE "event_registrations" ADD COLUMN IF NOT EXISTS "selectedCategory" TEXT;
```

### Option B: Using a database GUI (pgAdmin, DBeaver, etc.)
1. Open your database client
2. Connect to your PostgreSQL database
3. Open `manual_db_migration.sql` file
4. Execute the ALTER TABLE queries

### Verify migration
```sql
-- Check if columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'categoriesAvailable';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'event_registrations' AND column_name = 'selectedCategory';
```

---

## Step 2: Restart Backend and Frontend

### Backend
```bash
cd backend
# If using PM2
pm2 restart all

# Or if running directly
npm run dev
# or
node server.js
```

### Frontend
```bash
cd frontend
# Stop current process (Ctrl+C) and restart
npm run build
# or for development
npm run dev
```

---

## Step 3: Test Admin Side - Add Categories to Event

### 3.1 Login as Admin/Coach
1. Go to your application URL
2. Login as Admin or Coach (whoever creates events)

### 3.2 Create or Edit an Event
1. Navigate to **Events** → **Create Event** (or edit existing event)
2. Fill in event details (name, sport, dates, etc.)
3. **Scroll down to find the new "Categories Available" field**
4. Enter categories in this format:
   ```
   Age Groups: Group I (11-12), Group II (13-14), Group III (15-16)
   Strokes: Freestyle, Backstroke, Breaststroke, Butterfly
   Distances: 25m, 50m, 100m
   ```
5. Save the event

### 3.3 Verify Categories are Saved
1. View the event details page
2. You should see a **"Categories Available"** section displaying the categories you entered

---

## Step 4: Test Athlete Side - Register with Category

### 4.1 Login as Student/Athlete
1. Logout from admin account
2. Login as a Student/Athlete account

### 4.2 View Event Details
1. Navigate to **Events** page
2. Find the event you just created/edited (with categories)
3. Click on the event to view details

### 4.3 Verify Categories Display
1. On the event details page, you should see:
   - A **"Categories Available"** section showing the categories
   - A message: "Please select your category from the options above during registration"

### 4.4 Register for Event
1. Scroll to the **Registration Status** section (sidebar)
2. You should see a **"Selected Category"** input field (mandatory)
3. Enter your category selection, for example:
   ```
   Group II (13-14) | Freestyle | 50m
   ```
4. Click **"Register Now"** button
5. If payment is required, complete payment
6. Registration should complete successfully

### 4.5 Verify Registration
1. After registration, you should see "You're registered!" message
2. The registration status should update

---

## Step 5: Test Admin Side - View Participant Categories

### 5.1 Login as Admin/Coach
1. Login back as Admin or Coach

### 5.2 View Event Participants
1. Navigate to the event you created
2. Click **"Participants"** button (or navigate to event participants page)
3. You should see the participants list

### 5.3 Verify Category Display
1. For each participant who registered with a category, you should see:
   - A **"Selected Category"** section showing their category
   - Example: "Selected Category: Group II (13-14) | Freestyle | 50m"

### 5.4 Test Export Functionality
1. In the participants modal, click **"Export List"** button
2. A CSV file should download
3. Open the CSV file
4. Verify it contains a **"Selected Category"** column with the category data

---

## Step 6: Verify Database Storage

### Check Event Categories
```sql
SELECT id, name, "categoriesAvailable" 
FROM events 
WHERE "categoriesAvailable" IS NOT NULL;
```

### Check Participant Categories
```sql
SELECT 
  er.id,
  s.name as student_name,
  e.name as event_name,
  er."selectedCategory",
  er.status
FROM event_registrations er
JOIN students s ON er."studentId" = s.id
JOIN events e ON er."eventId" = e.id
WHERE er."selectedCategory" IS NOT NULL;
```

---

## Expected Results

### ✅ Success Indicators:

1. **Admin can add categories** when creating/editing events
2. **Categories display** on event details page for athletes
3. **Athletes see category input field** during registration
4. **Registration requires category** (if categories are set for event)
5. **Admin can see selected category** in participant list
6. **Export includes selected category** column
7. **Database stores** both `categoriesAvailable` and `selectedCategory`

### ❌ Common Issues:

1. **Category field not showing**: 
   - Check if database migration ran successfully
   - Restart backend server

2. **Registration fails**:
   - Check browser console for errors
   - Verify backend logs
   - Ensure category is entered if event has categories

3. **Category not saving**:
   - Check database columns exist
   - Verify backend API is receiving the data
   - Check network tab in browser dev tools

---

## Quick Test Checklist

- [ ] Database migration completed
- [ ] Backend restarted
- [ ] Frontend restarted
- [ ] Admin can add categories to event
- [ ] Categories display on event page
- [ ] Athlete sees category input field
- [ ] Athlete can register with category
- [ ] Admin can see category in participant list
- [ ] Export includes category column
- [ ] Database stores category data

---

## Testing with Sample Data

### Create a Swimming Event with Categories:
```
Event Name: STAIRS Winter Open Swimming Championship 2026
Sport: Swimming
Categories Available:
Age Groups: Group I (11-12), Group II (13-14), Group III (15-16)
Strokes: Freestyle, Backstroke, Breaststroke, Butterfly
Distances: 25m, 50m, 100m
```

### Register as Athlete with Category:
```
Selected Category: Group II (13-14) | Freestyle | 50m
```

---

## Need Help?

If something doesn't work:
1. Check browser console (F12) for errors
2. Check backend logs for errors
3. Verify database columns exist
4. Ensure all services are restarted
5. Clear browser cache and try again

