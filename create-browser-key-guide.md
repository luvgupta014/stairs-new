# 🔧 Create Separate Browser API Key

## Problem

You're using the **same API key** for both browser and server:
- ❌ This key has **IP restrictions** (for server)
- ❌ Browser requests come from user's IP, not your server IP
- ❌ Result: Authorization error

## ✅ Solution: Create Separate Browser Key

You need **TWO different keys**:

1. **Server Key** (Backend) - ✅ Already configured correctly
   - Key: `AIzaSyA_FO1QSKAfhM46...LQCdIKXpPQ`
   - Restrictions: IP addresses → `160.187.22.41`
   - Used in: `backend/.env` → `GOOGLE_MAPS_API_KEY`

2. **Browser Key** (Frontend) - ⚠️ **NEEDS TO BE CREATED**
   - Restrictions: HTTP referrers → `https://portal.stairs.org.in/*`
   - Used in: `frontend/.env` → `VITE_GOOGLE_MAPS_API_KEY`

---

## 📋 Step-by-Step: Create Browser Key

### Step 1: Create New Key in Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials

2. Click **"+ CREATE CREDENTIALS"** → **"API key"**

3. Name it: `STAIRS Browser Key` or `STAIRS Frontend Key`

4. **Click "Restrict key" tab:**

   **Application restrictions:**
   - ✅ Select **"HTTP referrers (web sites)"**
   - ❌ Do NOT select "IP addresses" (that's for server key)

   **Add referrers:**
   - Click **"+ Add"**
   - Add: `https://portal.stairs.org.in/*`
   - Add: `https://*.portal.stairs.org.in/*`
   - Add: `https://www.portal.stairs.org.in/*`
   - Add: `http://localhost:*/*` (for local development)

   **API restrictions:**
   - ✅ Select **"Restrict key"**
   - ✅ Enable:
     - **Maps JavaScript API** (required)
     - **Places API** (optional, for autocomplete)
     - **Geocoding API** (optional)

5. Click **"SAVE"**

6. **Copy the new browser key** (starts with `AIzaSy...`)

---

### Step 2: Update Frontend Environment

```bash
cd /root/stairs-new/frontend

# Backup .env
cp .env .env.backup

# Edit .env
nano .env

# Find the line:
# VITE_GOOGLE_MAPS_API_KEY=AIzaSyA_FO1QSKAfhM46...LQCdIKXpPQ

# Replace with the NEW browser key:
VITE_GOOGLE_MAPS_API_KEY=your_new_browser_key_here

# Save and exit (Ctrl+X, Y, Enter)
```

**Or via command line:**
```bash
cd /root/stairs-new/frontend

# Replace old key with new browser key
# Replace NEW_BROWSER_KEY_HERE with your actual new key
sed -i 's/^VITE_GOOGLE_MAPS_API_KEY=.*/VITE_GOOGLE_MAPS_API_KEY=NEW_BROWSER_KEY_HERE/' .env

# Verify
grep VITE_GOOGLE_MAPS_API_KEY .env
```

---

### Step 3: Rebuild Frontend

```bash
cd /root/stairs-new/frontend

# Rebuild with new browser key
npm run build

# Verify build succeeded
ls -la dist/
```

---

### Step 4: Restart Frontend (if using PM2)

```bash
# Find frontend process
pm2 list

# Restart it
pm2 restart b2c-frontend
# or whatever your frontend process is named
```

---

### Step 5: Clear Browser Cache & Test

1. **Clear browser cache** (Ctrl+Shift+Delete) or hard refresh (Ctrl+F5)

2. **Visit:** https://portal.stairs.org.in/admin/event/create

3. **Check browser console** (F12):
   - Should NOT see authorization errors
   - Should NOT see "not authorized" messages

4. **Test venue autocomplete:**
   - Click venue field
   - Type something
   - Should see Google Maps suggestions

---

## 📋 Summary: Two Keys

| Key Type | Variable | Restrictions | Use Case |
|----------|----------|--------------|----------|
| **Server Key** | `GOOGLE_MAPS_API_KEY` (backend) | IP: `160.187.22.41` | Backend API calls |
| **Browser Key** | `VITE_GOOGLE_MAPS_API_KEY` (frontend) | Referer: `portal.stairs.org.in/*` | Browser Maps JS |

---

## ✅ Verification Checklist

After creating browser key:

- [ ] ✅ New browser key created in Google Cloud Console
- [ ] ✅ Browser key has **HTTP referer** restrictions (NOT IP)
- [ ] ✅ Referer includes: `https://portal.stairs.org.in/*`
- [ ] ✅ Maps JavaScript API enabled for browser key
- [ ] ✅ `VITE_GOOGLE_MAPS_API_KEY` updated in `frontend/.env`
- [ ] ✅ Frontend rebuilt (`npm run build`)
- [ ] ✅ Frontend restarted/redeployed
- [ ] ✅ Browser cache cleared
- [ ] ✅ No authorization errors in browser console
- [ ] ✅ Venue autocomplete works

---

## 🔍 Verify Keys Are Different

```bash
# Check both keys
echo "Server Key:"
grep GOOGLE_MAPS_API_KEY /root/stairs-new/backend/.env

echo ""
echo "Browser Key:"
grep VITE_GOOGLE_MAPS_API_KEY /root/stairs-new/frontend/.env

# They should be DIFFERENT!
```

---

**Once you create the browser key and update frontend/.env, the authorization error will be resolved!**

