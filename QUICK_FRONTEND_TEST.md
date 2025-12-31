# Quick Frontend Test - Make Sure Changes Show

## 🚀 Immediate Steps (Do This First!)

### 1. Rebuild Frontend
```bash
cd frontend
npm run build
```

### 2. Hard Refresh Browser
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

### 3. Check These 3 Locations

---

## ✅ Location 1: Create Event Form

**Path**: Login as Admin → Events → Create Event

**What to Look For:**
- Scroll down past "End Date & Time"
- **MUST SEE**: "Categories Available (Optional)" textarea
- **Location**: Right before "Create Event" button

**If NOT visible:**
```bash
# Clear Vite cache
cd frontend
rm -rf node_modules/.vite
rm -rf dist
npm run build
```

---

## ✅ Location 2: Event Details Page (Athlete View)

**Path**: Login as Student → Events → Click any event

**What to Look For:**
1. **Categories Section** (if event has categories):
   - After "Event Details" section
   - Gray box showing categories

2. **Registration Section** (right sidebar):
   - "Selected Category *" input field
   - Above "Register Now" button
   - **ONLY shows if event has categories**

**If NOT visible:**
- Check if event has `categoriesAvailable` in database
- Check browser console (F12) for errors
- Verify API response includes `categoriesAvailable`

---

## ✅ Location 3: Participants Modal (Admin View)

**Path**: Login as Admin → Event → Participants

**What to Look For:**
- Each participant card shows "Selected Category" section
- "Export List" button includes category in CSV

**If NOT visible:**
- Check if participants have `selectedCategory` in database
- Verify API response includes `selectedCategory`

---

## 🔧 Quick Fix Commands

### If changes still don't show:

```bash
# 1. Stop all servers
# Ctrl+C in all terminal windows

# 2. Clear all caches
cd frontend
rm -rf node_modules/.vite
rm -rf dist
rm -rf .vite

# 3. Rebuild
npm run build

# 4. Restart
npm run dev  # or your production command
```

### Clear Browser Completely:
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

---

## 🎯 Visual Verification

### Create Event Form Should Show:
```
┌─────────────────────────────────────┐
│ End Date & Time                    │
│ [Date picker]                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Categories Available (Optional)     │
│ [Textarea - 4 rows]                 │
│                                     │
│ This information will be displayed │
│ to athletes during registration...  │
└─────────────────────────────────────┘

[Create Event Button]
```

### Event Details Page Should Show:
```
┌─────────────────────────────────────┐
│ Event Details                       │
│ ...                                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Categories Available                │
│ [Gray box with category text]      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Registration Status                 │
│                                     │
│ Selected Category *                 │
│ [Input field]                       │
│                                     │
│ [Register Now]                      │
└─────────────────────────────────────┘
```

---

## ✅ Final Checklist

Run through this checklist:

- [ ] Frontend rebuilt (`npm run build`)
- [ ] Browser cache cleared (Ctrl+Shift+R)
- [ ] "Categories Available" field visible in Create Event
- [ ] "Categories Available" field visible in Edit Event
- [ ] Categories display on Event Details page (if set)
- [ ] "Selected Category" field visible in registration (if event has categories)
- [ ] Registration button disabled when category empty
- [ ] Category visible in Participants Modal
- [ ] Category included in CSV export

**If all checked ✅ → Changes are visible!**

**If any unchecked ❌ → Follow troubleshooting steps above**

