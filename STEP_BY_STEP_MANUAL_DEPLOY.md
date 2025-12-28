# 📝 Step-by-Step Manual Deployment Guide

## What You Need to Do

Upload 2 files to your website using cPanel File Manager.

---

## ✅ Step 1: Open cPanel File Manager

1. Log into cPanel
2. Open **File Manager**
3. Navigate to: `public_html/portal.stairs.org.in`
   - This is where your `index.html` file is located

---

## ✅ Step 2: Upload `event-preview.php`

1. **In File Manager**, make sure you're in `public_html/portal.stairs.org.in`
2. Click **"↑ Upload"** button (top action bar)
3. Click **"Select File"** or drag and drop
4. Select `event-preview.php` from your local computer
5. Wait for upload to complete
6. **Verify** - you should see `event-preview.php` in the file list

---

## ✅ Step 3: Replace `.htaccess` File

1. **In File Manager**, you should see `.htaccess` file (it's already there)
2. **Right-click** on `.htaccess` → Select **"Edit"**
3. **Copy ALL the content** from the new `.htaccess` file in your project
4. **Paste** it into the editor (replace everything)
5. Click **"Save Changes"**
6. Close the editor

**OR** (if you prefer to upload):
1. **Delete** the old `.htaccess` file first
2. **Upload** the new `.htaccess` file (same as Step 2)

---

## ✅ Step 4: Upload `debug-preview.php` (Optional but Recommended)

1. Click **"↑ Upload"** again
2. Upload `debug-preview.php`
3. This helps you test and debug if something goes wrong

---

## ✅ Step 5: Verify Files Are There

Check that these files are in `public_html/portal.stairs.org.in`:
- ✅ `.htaccess` (should be 1.84 KB or similar)
- ✅ `event-preview.php` (should be ~4 KB)
- ✅ `debug-preview.php` (optional, ~5 KB)
- ✅ `index.html` (already there)
- ✅ `logo.png` (already there)

---

## ✅ Step 6: Test It Works

### Test 1: Check PHP File Directly

Open in browser:
```
https://portal.stairs.org.in/event-preview.php?id=TEST
```

**Expected:** Should show HTML (even if event not found, it should show HTML, not 404)

---

### Test 2: Check Debug Script

Open in browser:
```
https://portal.stairs.org.in/debug-preview.php
```

**Expected:** Should show a diagnostic report with:
- ✅ Files exist
- ✅ Backend connection status
- ✅ Any errors

---

### Test 3: Test Bot Detection

Run this command (or use Postman/curl):
```bash
curl -I -H "User-Agent: LinkedInBot/1.0" \
  "https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225"
```

**Expected:** Should return `200 OK` with HTML content

---

## ✅ Step 7: Verify Backend is Running

From your terminal (where PM2 is running):

```bash
# Check if backend is running
pm2 list

# Should show stairs-backend as "online"
# If not running, start it:
cd ~/stairs-new/backend
pm2 start src/index.js --name stairs-backend
```

---

## ✅ Step 8: Test with Real Event

1. Go to: **Facebook Sharing Debugger**
   - https://developers.facebook.com/tools/debug/

2. Enter URL:
   ```
   https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225
   ```

3. Click **"Debug"**

4. Click **"Scrape Again"** (to force fresh fetch)

5. **Expected Result:** Should show event name and description in preview

---

## ✅ Step 9: Test with LinkedIn

1. Go to: **LinkedIn Post Inspector**
   - https://www.linkedin.com/post-inspector/

2. Enter the same URL

3. Click **"Inspect"**

4. **Expected:** Should show preview (not 404 error)

---

## 🔧 Troubleshooting

### Problem: PHP file shows 404

**Fix:**
- Make sure `event-preview.php` is in the **exact same folder** as `index.html`
- Check file name is exactly `event-preview.php` (case-sensitive)
- Verify file uploaded successfully

---

### Problem: Still getting React HTML for bots

**Fix:**
1. Check `.htaccess` was saved correctly
2. Clear browser cache
3. Test with: `curl -I -H "User-Agent: LinkedInBot/1.0" https://portal.stairs.org.in/event/TEST`

---

### Problem: Backend connection error

**Fix:**
1. Verify backend is running: `pm2 list`
2. Test backend directly: `curl http://localhost:5000/api/events/preview/EVT-0051-OT-DL-271225`
3. If backend URL is different, edit `event-preview.php` line 33:
   ```php
   $backendUrl = 'http://localhost:5000';  // Change if needed
   ```

---

### Problem: Debug script shows errors

**Check:**
- Are all files uploaded?
- Is backend running?
- Check Apache error logs in cPanel

---

## 📋 Quick Checklist

Before testing, verify:
- [ ] `event-preview.php` is in `public_html/portal.stairs.org.in/`
- [ ] `.htaccess` is updated in the same folder
- [ ] `debug-preview.php` is uploaded (optional)
- [ ] Backend is running (`pm2 list` shows stairs-backend online)
- [ ] All files have correct permissions (644)

---

## 🎯 Success Indicators

✅ **Working correctly if:**
- `event-preview.php?id=TEST` returns HTML (not 404)
- `debug-preview.php` shows all green checkmarks
- Bot test returns 200 OK
- Facebook/LinkedIn debuggers show preview (not 404)

---

## 🆘 Still Not Working?

Run the debug script and share the output:
```
https://portal.stairs.org.in/debug-preview.php
```

This will show exactly what's wrong!

---

## 📁 Files You Need to Upload

From your local project, upload these files:
1. **`event-preview.php`** ← **REQUIRED**
2. **`.htaccess`** ← **REQUIRED** (replace existing)
3. **`debug-preview.php`** ← Optional but helpful

All files should go to: `public_html/portal.stairs.org.in/`

