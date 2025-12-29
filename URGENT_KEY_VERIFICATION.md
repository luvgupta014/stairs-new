# 🚨 Urgent: API Key Verification

The backend is still showing expired errors. Let's verify if the key itself is expired in Google's system or if it's a PM2 loading issue.

---

## ✅ Step 1: Verify Key Directly

Run this comprehensive verification:

```bash
cd /root/stairs-new
bash verify-api-key.sh
```

This will:
- ✅ Read the key from `.env`
- ✅ Test the key DIRECTLY with Google API (bypasses backend)
- ✅ Check if backend is using the correct key
- ✅ Give you specific error messages

**This tells us if the key is actually expired in Google's system or if it's a PM2 issue.**

---

## 🔄 Step 2: Complete PM2 Restart (If Needed)

If the key is valid but PM2 isn't loading it:

```bash
cd /root/stairs-new
bash complete-pm2-restart.sh
```

This will:
- Delete the PM2 process completely
- Recreate it fresh (forces reload of `.env`)
- Test the endpoint
- Show you the results

---

## 🔴 Step 3: If Key IS Expired

If `verify-api-key.sh` confirms the key is expired in Google's system:

### Action Required:

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com/apis/credentials

2. **Find your API key** (the one currently in `.env`)

3. **Check its status:**
   - Does it show as "Expired" or "Invalid"?
   - When was it created?
   - What restrictions does it have?

4. **Create a COMPLETELY NEW key:**
   - Click "+ CREATE CREDENTIALS" → "API key"
   - Name: `STAIRS Backend Server Key`
   - Restrictions:
     - **Application:** IP addresses → `160.187.22.41`
     - **API:** Restrict key → Enable: Places API, Geocoding API
   - Click SAVE
   - **Copy the new key immediately**

5. **Update backend:**
   ```bash
   cd /root/stairs-new
   bash quick-fix-server-key.sh
   # Enter the new key when prompted
   ```

6. **Complete restart:**
   ```bash
   bash complete-pm2-restart.sh
   ```

---

## 📋 Common Scenarios

### Scenario 1: Key is Valid in Google but Backend Shows Expired
- **Cause:** PM2 not reloading `.env`
- **Fix:** Run `complete-pm2-restart.sh`

### Scenario 2: Key IS Expired in Google Cloud Console
- **Cause:** Key actually expired
- **Fix:** Create new key in Google Cloud Console

### Scenario 3: Key Has Wrong Restrictions
- **Cause:** Key has referer restrictions (can't use for server-side)
- **Fix:** Create new key with IP restrictions OR edit existing key

---

## 🔍 Quick Diagnostic

```bash
# Test key directly (bypasses backend)
KEY=$(grep "^GOOGLE_MAPS_API_KEY=" /root/stairs-new/backend/.env | cut -d'=' -f2)
curl -s "https://maps.googleapis.com/maps/api/place/autocomplete/json?input=test&key=$KEY" | grep -o '"error_message":"[^"]*"'

# If this shows "expired" → Key is expired in Google
# If this shows "OK" → Key is valid, PM2 issue
```

---

**Run `verify-api-key.sh` first to identify the exact issue!**

