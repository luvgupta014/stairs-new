# 🔧 Final Fix: PM2 Environment Variable Reload

## Problem

PM2 didn't reload environment variables when you restarted. The warning said:
```
Use --update-env to update environment variables
```

This means the backend is still using the **old expired key** from memory, not the new one from `.env`.

---

## ✅ Solution: Restart with --update-env

### Quick Fix:

```bash
cd /root/stairs-new
bash fix-pm2-env-reload.sh
```

This will:
1. Verify the new key is in `.env`
2. Restart backend with `--update-env` flag
3. Test the endpoint
4. Check for expired errors

---

### Manual Fix:

```bash
# Restart with environment variable reload
pm2 restart stairs-backend --update-env

# Wait a few seconds
sleep 3

# Test endpoint
curl "http://localhost:5000/api/maps/places/autocomplete?input=test"

# Check logs
pm2 logs stairs-backend --lines 20 | grep -i "expired"
```

---

## 🔍 If Still Showing Expired

If after restarting with `--update-env` you still see expired errors:

### 1. Verify Key in .env

```bash
# Check what key is in .env
grep GOOGLE_MAPS_API_KEY /root/stairs-new/backend/.env

# Test the key directly
bash /tmp/test-key-direct.sh
```

### 2. Check Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your API key
3. Verify:
   - ✅ Key is **not expired**
   - ✅ Restrictions: **IP addresses** (NOT referrers)
   - ✅ APIs enabled: **Places API**, **Geocoding API**

### 3. Create Completely New Key

If the key is actually expired in Google Cloud Console:

1. Create a **brand new** API key
2. Set restrictions: **IP addresses** → `160.187.22.41`
3. Enable: **Places API**, **Geocoding API**
4. Update `.env` with new key
5. Restart: `pm2 restart stairs-backend --update-env`

---

## 📋 Verification Steps

After fixing:

```bash
# 1. Test endpoint
curl "http://localhost:5000/api/maps/places/autocomplete?input=test"

# Should return JSON with predictions, NOT expired error

# 2. Check logs
pm2 logs stairs-backend --lines 50 | grep -i "expired"

# Should show NO expired errors

# 3. Test frontend
# Go to: https://portal.stairs.org.in/admin/event/create
# Try venue autocomplete - should work!
```

---

## 🎯 Summary

**Issue:** PM2 didn't reload `.env` file
**Fix:** Restart with `--update-env` flag
**Command:** `pm2 restart stairs-backend --update-env`

**Run `fix-pm2-env-reload.sh` to fix it automatically!**

