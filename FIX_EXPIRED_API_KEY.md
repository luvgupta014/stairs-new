# 🚨 Fix: Expired Google Maps API Key

## Problem

**Error:** `"The provided API key is expired."`

Your Google Maps API server key has expired and needs to be renewed or replaced.

---

## ✅ Solution: Create New API Key

### Step 1: Check Current Key Status

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your server API key (`STAIRS Backend Server Key` or similar)
3. Check if it shows as "Expired" or "Invalid"

---

### Step 2: Create New Server API Key

1. **In Google Cloud Console:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click **"+ CREATE CREDENTIALS"** → **"API key"**

2. **Name it:** `STAIRS Backend Server Key v2` (or with current date)

3. **Click "Restrict key" tab:**

   **Application restrictions:**
   - Select **"IP addresses (web servers, cron jobs, etc.)"**
   - Add your server IP: `160.187.22.41`
   - Or add Cloudflare IP ranges if needed

   **API restrictions:**
   - Select **"Restrict key"**
   - Enable these APIs:
     - ✅ **Places API**
     - ✅ **Geocoding API**
     - ✅ **Maps JavaScript API** (optional, for backend if needed)

4. **Click "SAVE"**

5. **Copy the new API key**

---

### Step 3: Update Backend Environment

**Option A: Use helper script:**
```bash
cd /root/stairs-new
bash quick-fix-server-key.sh
```
Enter your new API key when prompted.

**Option B: Manual update:**
```bash
cd /root/stairs-new/backend

# Backup .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Edit .env
nano .env

# Find the line:
# GOOGLE_MAPS_API_KEY=old_expired_key

# Replace with:
GOOGLE_MAPS_API_KEY=YOUR_NEW_KEY_HERE

# Save and exit (Ctrl+X, Y, Enter)
```

**Option C: Quick command line:**
```bash
# Replace OLD_KEY with your expired key, NEW_KEY with new key
cd /root/stairs-new/backend
sed -i 's/^GOOGLE_MAPS_API_KEY=.*/GOOGLE_MAPS_API_KEY=YOUR_NEW_KEY_HERE/' .env

# Verify
grep GOOGLE_MAPS_API_KEY .env
```

---

### Step 4: Restart Backend

```bash
pm2 restart stairs-backend

# Verify it's running
pm2 logs stairs-backend --lines 20
```

---

### Step 5: Test

```bash
# Test local endpoint
curl "http://localhost:5000/api/maps/places/autocomplete?input=test"

# Should return JSON with predictions, NOT expired error
```

---

### Step 6: Verify No More Errors

```bash
# Check logs for expired errors
pm2 logs stairs-backend --lines 50 | grep -i "expired\|denied"

# Should show no results
```

---

## 🔍 Why Keys Expire

Google Maps API keys can expire if:
1. **Billing issue** - Payment method expired or insufficient funds
2. **Key rotation** - Google requires periodic key rotation
3. **Account suspension** - Billing or policy violation
4. **Project disabled** - Project paused or disabled

---

## ✅ Prevent Future Expiration

1. **Enable billing alerts:**
   - Go to Google Cloud Console → Billing → Budgets & alerts
   - Set up alerts for API usage

2. **Monitor API usage:**
   - Go to APIs & Services → Dashboard
   - Check usage and quotas regularly

3. **Keep payment method current:**
   - Ensure credit card/billing account is active

4. **Document your keys:**
   - Keep track of which keys are used where
   - Have backup/recovery plan

---

## 📋 Quick Checklist

- [ ] Create new API key in Google Cloud Console
- [ ] Set IP restrictions (NOT referer restrictions)
- [ ] Enable Places API and Geocoding API
- [ ] Update `GOOGLE_MAPS_API_KEY` in `backend/.env`
- [ ] Restart backend: `pm2 restart stairs-backend`
- [ ] Test endpoint: `curl http://localhost:5000/api/maps/places/autocomplete?input=test`
- [ ] Verify no expired errors in logs
- [ ] Test frontend venue autocomplete

---

## 🆘 If Still Not Working

### Check API Key Status:
1. Verify key is **not restricted** to referrers (must be IP or no restrictions)
2. Verify **Places API is enabled** in API restrictions
3. Verify **billing is enabled** for Google Cloud project
4. Verify **quota hasn't been exceeded**

### Check Backend Logs:
```bash
pm2 logs stairs-backend --lines 100 | grep -i "google\|places\|api\|error"
```

---

**Once you create the new key and update the backend, the expired errors should be resolved!**

