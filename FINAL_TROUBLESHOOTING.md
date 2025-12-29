# ✅ Final Troubleshooting Guide

## Status: APIs Enabled ✅

You've confirmed these APIs are enabled:
- ✅ Places API
- ✅ Places API (New)
- ✅ Geocoding API
- ✅ Maps JavaScript API

Good! Now we need to verify the **API key configuration** and **restrictions**.

---

## 🔍 Step 1: Test Key Directly

Run this to see if the key itself is valid:

```bash
cd /root/stairs-new
bash test-key-final.sh
```

This will tell you:
- ✅ If key is valid → PM2 loading issue
- ❌ If key is expired → Need new key
- ❌ If key has wrong restrictions → Need to fix restrictions

---

## 🔑 Step 2: Check Key Restrictions in Google Cloud Console

**Critical:** The server key MUST have the correct restrictions.

### Go to: https://console.cloud.google.com/apis/credentials

Find your API key and verify:

1. **Application restrictions:**
   - ✅ Should be: **"IP addresses (web servers, cron jobs, etc.)"**
   - ❌ Should NOT be: "HTTP referrers (web sites)"
   - ✅ Should include: `160.187.22.41` (your server IP)

2. **API restrictions:**
   - ✅ Should be: **"Restrict key"**
   - ✅ Should include:
     - Places API
     - Geocoding API
     - (Maps JavaScript API is optional for backend)

---

## 🔧 Step 3: Common Issues & Fixes

### Issue 1: Key Has Referer Restrictions

**Symptom:** "API keys with referer restrictions cannot be used with this API"

**Fix:**
1. Edit the key in Google Cloud Console
2. Change "Application restrictions" from "HTTP referrers" to "IP addresses"
3. Add IP: `160.187.22.41`
4. Save

### Issue 2: Key is Expired

**Symptom:** "The provided API key is expired"

**Fix:**
1. Create a **new** API key
2. Set restrictions: IP addresses → `160.187.22.41`
3. Enable APIs: Places API, Geocoding API
4. Update backend: `bash quick-fix-server-key.sh`
5. Complete restart: `bash complete-pm2-restart.sh`

### Issue 3: Key is Valid but Backend Still Shows Errors

**Symptom:** Direct test shows OK, but backend shows expired

**Fix:**
- PM2 not loading `.env` correctly
- Run: `bash complete-pm2-restart.sh`

---

## 📋 Quick Checklist

- [ ] APIs enabled in Google Cloud Console ✅ (You confirmed this)
- [ ] Key has **IP restrictions** (NOT referer restrictions)
- [ ] IP `160.187.22.41` is in the allowed list
- [ ] Places API is enabled for this key
- [ ] Key is not expired
- [ ] Key is in `backend/.env` as `GOOGLE_MAPS_API_KEY=...`
- [ ] Backend restarted with `--update-env` or complete restart

---

## 🚀 Complete Fix Process

If key is expired or has wrong restrictions:

1. **Create/Fix Key in Google Cloud Console:**
   ```
   - Go to: APIs & Services → Credentials
   - Create new key OR edit existing
   - Restrictions: IP addresses → 160.187.22.41
   - APIs: Places API, Geocoding API
   ```

2. **Update Backend:**
   ```bash
   bash quick-fix-server-key.sh
   # Enter new key when prompted
   ```

3. **Complete Restart:**
   ```bash
   bash complete-pm2-restart.sh
   ```

4. **Verify:**
   ```bash
   curl "http://localhost:5000/api/maps/places/autocomplete?input=test"
   # Should return JSON with predictions
   ```

---

**Run `test-key-final.sh` to see the exact issue!**

