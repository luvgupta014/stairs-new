# 🚨 URGENT FIX - Two Issues to Resolve

## Issue 1: Google Maps API - Checkboxes NOT Checked ✅

**Your Google Cloud Console shows the URLs are listed BUT the checkboxes are UNCHECKED!**

### Fix Steps:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/apis/credentials
2. **Find your API key** ("API key 2" in your screenshot)
3. **Click Edit** (pencil icon)
4. **In "Website restrictions" section**:
   - ✅ **CHECK the checkbox** for: `https://portal.stairs.org.in/*`
   - ✅ **CHECK the checkbox** for: `https://*.portal.stairs.org.in/*`
   - ✅ **CHECK the checkbox** for: `https://www.portal.stairs.org.in/*`
   - ✅ **CHECK the checkbox** for: `https://stairs.astroraag.com/*`
   - ❌ You can **REMOVE** the specific path: `https://portal.stairs.org.in/admin/event/create` (the wildcard `/*` covers all paths)

5. **Click "SAVE"** at the bottom
6. **Wait 5-10 minutes** for changes to propagate

---

## Issue 2: Backend 502 Errors & CORS ❌

The console shows:
- `502 Bad Gateway` errors
- CORS errors: `No 'Access-Control-Allow-Origin' header`

This means:
1. **Backend might be down** or unreachable
2. **CORS headers not being sent** (backend needs restart)

### Fix Steps:

#### A. Check Backend Status

```bash
# SSH to your backend server
ssh root@your-backend-server

# Check if backend is running
pm2 list
# or
systemctl status your-backend-service

# Check backend logs
pm2 logs backend
# or
journalctl -u your-backend-service -f
```

#### B. Restart Backend with CORS Fix

```bash
cd /root/stairs-new/backend

# Ensure .env has CORS_ORIGINS
echo "CORS_ORIGINS=https://portal.stairs.org.in,https://www.portal.stairs.org.in" >> .env

# Restart backend
pm2 restart all
# or
systemctl restart your-backend-service
```

#### C. Verify Backend is Responding

```bash
# Test backend health
curl https://stairs-api.astroraag.com/health

# Test CORS headers
curl -I -H "Origin: https://portal.stairs.org.in" \
  https://stairs-api.astroraag.com/api/maps/places/autocomplete

# Should see:
# Access-Control-Allow-Origin: https://portal.stairs.org.in
```

#### D. Check Nginx/Apache Proxy (if used)

If you have a reverse proxy in front of your backend:

```bash
# Check proxy configuration
cat /etc/nginx/sites-available/your-backend
# or
cat /etc/apache2/sites-available/your-backend.conf

# Restart proxy
sudo systemctl restart nginx
# or
sudo systemctl restart apache2
```

---

## ✅ Verification Checklist

After fixes:

### 1. Google Maps API
- [ ] Checkboxes checked in Google Cloud Console
- [ ] Saved changes
- [ ] Waited 10 minutes
- [ ] Test: Refresh `https://portal.stairs.org.in/admin/event/create`
- [ ] No `RefererNotAllowedMapError` in console

### 2. Backend & CORS
- [ ] Backend is running (`pm2 list` shows online)
- [ ] Backend logs show no errors
- [ ] `curl https://stairs-api.astroraag.com/health` returns 200
- [ ] CORS headers present in response
- [ ] No 502 errors in browser console
- [ ] Venue autocomplete works

---

## 🔍 Quick Diagnostic Commands

Run these to diagnose:

```bash
# 1. Check backend health
curl -v https://stairs-api.astroraag.com/health

# 2. Test CORS preflight
curl -X OPTIONS https://stairs-api.astroraag.com/api/maps/places/autocomplete \
  -H "Origin: https://portal.stairs.org.in" \
  -H "Access-Control-Request-Method: GET" \
  -v

# 3. Test actual request
curl -v "https://stairs-api.astroraag.com/api/maps/places/autocomplete?input=test" \
  -H "Origin: https://portal.stairs.org.in"
```

---

## 📝 Summary

**Most Important Actions:**

1. ✅ **Check those checkboxes in Google Cloud Console!** (This is why you're getting RefererNotAllowedMapError)
2. ✅ **Restart backend** after adding CORS_ORIGINS to .env
3. ✅ **Verify backend is running** and responding to requests
4. ✅ **Wait 10 minutes** after Google Console changes
5. ✅ **Test again** on the event creation page

The 502 errors suggest your backend might be down or the reverse proxy isn't configured correctly. Check backend status first!

