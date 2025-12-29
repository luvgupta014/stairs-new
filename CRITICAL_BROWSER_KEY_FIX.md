# 🚨 Critical: Browser Key Still Not Working

## Error Still Occurring

Even after setup, you're still getting:
```
Google Maps Platform rejected your request. 
This IP, site or mobile application is not authorized to use this API key.
Request received from IP address 2405:201:4004:f031:6170:d648:fea:1679, 
with referer: https://portal.stairs.org.in/events/...
```

---

## 🔍 Most Common Causes

### 1. Referer Checkboxes NOT Checked ⚠️ **MOST LIKELY**

In Google Cloud Console, the referers are **listed but NOT checked**.

**Fix:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your browser API key
3. Click Edit
4. Under "Website restrictions", **CHECK the checkbox** next to:
   - `https://portal.stairs.org.in/*`
   - `https://*.portal.stairs.org.in/*`
   - `https://www.portal.stairs.org.in/*`
5. Click **SAVE**
6. Wait 5 minutes

---

### 2. Frontend Not Rebuilt

The frontend still has the old key embedded in the built files.

**Fix:**
```bash
cd /root/stairs-new/frontend

# Verify .env has correct browser key
grep VITE_GOOGLE_MAPS_API_KEY .env

# Rebuild frontend
npm run build

# Verify new build
ls -la dist/
```

---

### 3. Browser Cache

Your browser is using cached JavaScript with the old key.

**Fix:**
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or clear browser cache completely
- Or test in incognito/private window

---

### 4. Still Using Server Key

The frontend `.env` still has the server key instead of browser key.

**Verify:**
```bash
# Check frontend key
grep VITE_GOOGLE_MAPS_API_KEY /root/stairs-new/frontend/.env

# Check backend key
grep GOOGLE_MAPS_API_KEY /root/stairs-new/backend/.env

# They should be DIFFERENT!
```

**Fix:**
```bash
bash update-browser-key.sh
```

---

## ✅ Step-by-Step Complete Fix

### Step 1: Verify Browser Key in Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your browser key (used in `VITE_GOOGLE_MAPS_API_KEY`)
3. Click Edit
4. **Check Application restrictions:**
   - Should be: **"HTTP referrers (web sites)"**
   - Should NOT be: "IP addresses"

5. **Check Website restrictions:**
   - ✅ **CHECK THE CHECKBOX** next to `https://portal.stairs.org.in/*`
   - ✅ **CHECK THE CHECKBOX** next to `https://*.portal.stairs.org.in/*`
   - ✅ **CHECK THE CHECKBOX** next to `https://www.portal.stairs.org.in/*`

6. **Verify API restrictions:**
   - ✅ Maps JavaScript API is enabled
   - ✅ Places API is enabled (optional)

7. Click **SAVE**

8. Wait 5-10 minutes for changes to propagate

---

### Step 2: Verify Frontend .env

```bash
cd /root/stairs-new/frontend

# Check key
grep VITE_GOOGLE_MAPS_API_KEY .env

# Should show the BROWSER key (different from server key)
```

If wrong, update it:
```bash
bash /root/stairs-new/update-browser-key.sh
```

---

### Step 3: Rebuild Frontend

```bash
cd /root/stairs-new/frontend

# Rebuild
npm run build

# Verify build time
ls -l dist/
```

---

### Step 4: Clear Cache & Test

1. **Hard refresh browser:** `Ctrl+Shift+R` or `Cmd+Shift+R`
2. **Or clear cache completely**
3. **Or test in incognito window**
4. Visit: https://portal.stairs.org.in/admin/event/create
5. Check console (F12) - should NOT see authorization errors

---

## 🔍 Debug Commands

Run this to check everything:

```bash
cd /root/stairs-new
bash verify-browser-key-final.sh
```

This will show:
- ✅ If keys are different
- ✅ If frontend is rebuilt
- ✅ If built files match .env
- ✅ What needs to be fixed

---

## 📋 Final Checklist

- [ ] Browser key exists and is DIFFERENT from server key
- [ ] Browser key has **HTTP referer** restrictions (NOT IP)
- [ ] **Checkboxes are CHECKED** in Google Cloud Console for referers
- [ ] Referer includes: `https://portal.stairs.org.in/*`
- [ ] Maps JavaScript API enabled for browser key
- [ ] `VITE_GOOGLE_MAPS_API_KEY` correct in `frontend/.env`
- [ ] Frontend rebuilt (`npm run build`)
- [ ] Browser cache cleared (hard refresh)
- [ ] Tested in incognito window
- [ ] Waited 5-10 minutes after saving Google Console changes

---

## 🆘 If Still Not Working

1. **Double-check checkboxes in Google Console** - this is the #1 issue
2. **Verify key is actually different:**
   ```bash
   echo "Browser: $(grep VITE_GOOGLE_MAPS_API_KEY frontend/.env)"
   echo "Server: $(grep GOOGLE_MAPS_API_KEY backend/.env)"
   ```
3. **Check if frontend is serving cached files** - check headers
4. **Try creating a completely new browser key** - sometimes keys get stuck

---

**Most likely issue: Checkboxes aren't checked in Google Cloud Console!**

