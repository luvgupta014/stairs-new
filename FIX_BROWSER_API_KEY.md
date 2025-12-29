# 🔧 Fix: Browser API Key Authorization Error

## Problem

**Error:** "This IP, site or mobile application is not authorized to use this API key"

This is happening because the **browser-side API key** (used in frontend) needs **HTTP referer restrictions** for your domain.

---

## ✅ Solution: Configure Browser Key with Referer Restrictions

You need **TWO different keys**:

1. **Server Key** (Backend) - ✅ Already configured
   - IP restrictions: `160.187.22.41`
   - Used in: `backend/.env` → `GOOGLE_MAPS_API_KEY`

2. **Browser Key** (Frontend) - ⚠️ Needs fixing
   - HTTP referer restrictions: `https://portal.stairs.org.in/*`
   - Used in: `frontend/.env` → `VITE_GOOGLE_MAPS_API_KEY`

---

## 📋 Step-by-Step Fix

### Step 1: Create or Find Browser Key in Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials

2. **Check if you already have a browser key:**
   - Look for a key with HTTP referer restrictions
   - Or create a new one for browser use

3. **Create New Browser Key (if needed):**
   - Click "+ CREATE CREDENTIALS" → "API key"
   - Name it: `STAIRS Browser Key` or `STAIRS Frontend Key`

---

### Step 2: Configure Browser Key Restrictions

**Application restrictions:**
- Select **"HTTP referrers (web sites)"**
- **Do NOT** use IP addresses (that's for server keys)
- Add these referrers:
  ```
  https://portal.stairs.org.in/*
  https://*.portal.stairs.org.in/*
  https://www.portal.stairs.org.in/*
  http://localhost:*/*
  ```

**API restrictions:**
- Select **"Restrict key"**
- Enable:
  - ✅ **Maps JavaScript API**
  - ✅ **Places API** (optional, for autocomplete)
  - ✅ **Geocoding API** (optional)

4. Click **"SAVE"**

5. **Copy the key**

---

### Step 3: Update Frontend Environment

**On your frontend server:**

```bash
cd /root/stairs-new/frontend

# Check if .env exists
ls -la .env

# Edit .env file
nano .env
# or
vi .env

# Find or add:
VITE_GOOGLE_MAPS_API_KEY=your_browser_key_here

# Save and exit
```

**Or via command line:**
```bash
# Backup first
cp .env .env.backup 2>/dev/null || true

# Add/update the key
echo "" >> .env
echo "# Google Maps API Key (Browser/Frontend)" >> .env
echo "VITE_GOOGLE_MAPS_API_KEY=your_browser_key_here" >> .env

# Replace 'your_browser_key_here' with actual key
```

---

### Step 4: Rebuild Frontend

```bash
cd /root/stairs-new/frontend

# Rebuild with new key
npm run build

# If using PM2 for frontend, restart it
pm2 restart b2c-frontend
# or whatever your frontend process is named
```

---

### Step 5: Verify

1. **Clear browser cache** (important!)
2. **Visit:** https://portal.stairs.org.in/events/...
3. **Check browser console** - should not see authorization errors
4. **Test venue autocomplete** - should work

---

## 🔍 Quick Diagnostic

Check what key is currently in frontend:

```bash
# On server
grep VITE_GOOGLE_MAPS_API_KEY /root/stairs-new/frontend/.env

# Or check in built files (if key is exposed)
grep -r "maps.googleapis.com" /root/stairs-new/frontend/dist/ | head -5
```

---

## 📋 Summary: Two Keys Configuration

### Server Key (Backend)
- **File:** `backend/.env`
- **Variable:** `GOOGLE_MAPS_API_KEY`
- **Restrictions:** IP addresses → `160.187.22.41`
- **APIs:** Places API, Geocoding API
- **Used for:** Server-side API calls

### Browser Key (Frontend)
- **File:** `frontend/.env`
- **Variable:** `VITE_GOOGLE_MAPS_API_KEY`
- **Restrictions:** HTTP referrers → `https://portal.stairs.org.in/*`
- **APIs:** Maps JavaScript API, Places API
- **Used for:** Browser-side Maps JavaScript API

---

## ✅ Checklist

- [ ] Browser key created in Google Cloud Console
- [ ] Browser key has **HTTP referer** restrictions (NOT IP)
- [ ] Referer includes: `https://portal.stairs.org.in/*`
- [ ] Maps JavaScript API enabled for browser key
- [ ] `VITE_GOOGLE_MAPS_API_KEY` set in `frontend/.env`
- [ ] Frontend rebuilt (`npm run build`)
- [ ] Frontend restarted/redeployed
- [ ] Browser cache cleared
- [ ] Test on https://portal.stairs.org.in

---

**The key difference:** Browser keys use **referers**, server keys use **IP addresses**!

