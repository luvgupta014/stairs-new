# 🔧 Fix: Google Maps Server Key Issue

## Problem Identified ✅

**Error:** `"API keys with referer restrictions cannot be used with this API."`

**Root Cause:** Your backend is using a **referer-restricted** Google Maps API key for **server-side** API calls. Google Places API does NOT allow referer-restricted keys for server-side requests.

---

## ✅ Solution: Create Separate Server Key

You need **TWO different API keys**:

1. **Browser Key** (for frontend) - Can have referer restrictions
   - Used in: `VITE_GOOGLE_MAPS_API_KEY`
   - Restrictions: HTTP referrers (websites)

2. **Server Key** (for backend) - CANNOT have referer restrictions
   - Used in: `GOOGLE_MAPS_API_KEY` (backend `.env`)
   - Restrictions: Either **no restrictions** OR **IP address** restrictions

---

## 📋 Step-by-Step Fix

### Step 1: Create New Server Key in Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials

2. Click **"+ CREATE CREDENTIALS"** → **"API key"**

3. Name it: `STAIRS Backend Server Key` (or similar)

4. Click **"Restrict key"** tab:

   **Application restrictions:**
   - Select **"IP addresses (web servers, cron jobs, etc.)"**
   - Add your server's IP address(es):
     - `160.187.22.41` (your server IP)
     - Or if using Cloudflare, add Cloudflare IP ranges (see below)

   **API restrictions:**
   - Select **"Restrict key"**
   - Select these APIs:
     - ✅ Places API
     - ✅ Geocoding API
     - ✅ Maps JavaScript API (if needed)
     - ❌ **Do NOT** restrict to Maps JavaScript API only

5. Click **"SAVE"**

6. **Copy the new API key**

---

### Step 2: Update Backend Environment

```bash
cd /root/stairs-new/backend

# Edit .env file
nano .env
# or
vi .env

# Find the line:
# GOOGLE_MAPS_API_KEY=old_key_here

# Replace with new server key:
GOOGLE_MAPS_API_KEY=YOUR_NEW_SERVER_KEY_HERE
```

**Or via command line:**
```bash
# Backup .env first
cp /root/stairs-new/backend/.env /root/stairs-new/backend/.env.backup

# Replace the key (edit this command with your new key)
sed -i 's/^GOOGLE_MAPS_API_KEY=.*/GOOGLE_MAPS_API_KEY=YOUR_NEW_SERVER_KEY_HERE/' /root/stairs-new/backend/.env

# Verify
grep GOOGLE_MAPS_API_KEY /root/stairs-new/backend/.env
```

---

### Step 3: Restart Backend

```bash
pm2 restart stairs-backend

# Verify it's running
pm2 logs stairs-backend --lines 20
```

---

### Step 4: Test

```bash
# Test local endpoint
curl "http://localhost:5000/api/maps/places/autocomplete?input=test"

# Should return JSON with predictions, NOT error
```

---

## 🌐 Cloudflare IP Ranges (If Using Cloudflare Proxy)

If your backend is behind Cloudflare, you might need to allow Cloudflare IPs:

1. Get Cloudflare IP ranges: https://www.cloudflare.com/ips/
2. Add them to IP restrictions in Google Cloud Console

**However**, for server-side calls from your backend (localhost:5000), you should use your **server's actual IP address**, not Cloudflare IPs.

**Only add Cloudflare IPs if:**
- Your backend makes API calls through Cloudflare proxy (unlikely)
- Or Google sees Cloudflare IPs in requests (check logs)

---

## 📝 Key Configuration Summary

### Browser Key (Frontend)
- **Location:** `frontend/.env` → `VITE_GOOGLE_MAPS_API_KEY`
- **Usage:** Browser-based Maps JavaScript API
- **Restrictions:** ✅ HTTP referrers (websites) - REQUIRED
- **Example:** `https://portal.stairs.org.in/*`

### Server Key (Backend)
- **Location:** `backend/.env` → `GOOGLE_MAPS_API_KEY`
- **Usage:** Server-side Places API, Geocoding API
- **Restrictions:** ❌ NO referer restrictions
- **Options:** 
  - No restrictions (easiest, less secure)
  - IP address restrictions (recommended for production)
- **Example IP:** `160.187.22.41`

---

## ✅ Verification Checklist

After setting up the server key:

- [ ] New API key created in Google Cloud Console
- [ ] Server key has **IP address** restrictions (NOT referer restrictions)
- [ ] Server key has **Places API** enabled
- [ ] `GOOGLE_MAPS_API_KEY` updated in `backend/.env`
- [ ] Backend restarted (`pm2 restart stairs-backend`)
- [ ] Test endpoint works: `curl http://localhost:5000/api/maps/places/autocomplete?input=test`
- [ ] No more "REQUEST_DENIED" errors in logs
- [ ] Frontend venue autocomplete works

---

## 🔒 Security Best Practices

1. **Use IP restrictions** for server key (not "No restrictions")
2. **Rotate keys** if compromised
3. **Monitor usage** in Google Cloud Console
4. **Set up billing alerts** to prevent unexpected charges
5. **Use separate keys** for development and production

---

## 🆘 If Still Not Working

### Check API Key Configuration:
```bash
# Verify key is set
grep GOOGLE_MAPS_API_KEY /root/stairs-new/backend/.env

# Check backend logs
pm2 logs stairs-backend --lines 50 | grep -i "maps\|places\|api"
```

### Common Issues:

1. **Key not restricted to Places API**
   - Fix: Enable Places API in API restrictions

2. **IP address incorrect**
   - Fix: Check your server's actual IP: `curl ifconfig.me`

3. **Billing not enabled**
   - Fix: Enable billing in Google Cloud Console for Maps Platform

4. **API not enabled**
   - Fix: Enable Places API in Google Cloud Console → APIs & Services → Library

---

**Once you create the server key and update the backend, the 502 errors should be resolved!**

