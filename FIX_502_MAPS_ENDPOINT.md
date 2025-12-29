# Fix 502 Error on Maps Endpoint

## Situation
- ✅ Backend is running and healthy
- ✅ `/health` endpoint works (200 OK)
- ❌ `/api/maps/places/autocomplete` returns 502 Bad Gateway
- ❌ CORS headers not present

This suggests the **maps route itself** might be erroring, or there's a **proxy/Apache configuration issue**.

---

## ✅ Solution Steps

### Step 1: Test Maps Endpoint Directly

Run the test script:
```bash
cd /root/stairs-new
bash test-maps-endpoint.sh
```

This will test:
- Local endpoint (bypassing proxy)
- External endpoint (through Cloudflare)
- CORS headers
- OPTIONS preflight
- Backend logs

---

### Step 2: Check Backend Logs for Maps Route Errors

```bash
# Check recent logs
pm2 logs stairs-backend --lines 100 --nostream | grep -i -E "maps|places|autocomplete|error"

# Or watch logs in real-time
pm2 logs stairs-backend --lines 50
```

**Look for:**
- `Google Maps API key not configured` errors
- Database connection errors
- Route handler errors
- CORS errors

---

### Step 3: Test Maps Route Locally

```bash
# Test directly on server
curl -v "http://localhost:5000/api/maps/places/autocomplete?input=test"

# Should return JSON response or error message
```

If local works but external doesn't → **Proxy/Apache issue**
If local fails → **Backend route issue**

---

### Step 4: Verify Maps Route is Registered

```bash
# Check if route file exists
ls -la /root/stairs-new/backend/src/routes/maps.js

# Check if route is imported in index.js
grep -n "maps" /root/stairs-new/backend/src/index.js

# Should see something like:
# app.use('/api/maps', mapsRoutes);
```

---

### Step 5: Check Apache/Proxy Configuration

Since you're using Apache (httpd), check if the proxy is correctly forwarding `/api/maps/*` requests:

```bash
# Check Apache virtual host config
grep -r "ProxyPass.*api" /etc/apache2/sites-available/
# or
grep -r "ProxyPass.*api" /etc/httpd/conf.d/

# Look for something like:
# ProxyPass /api http://localhost:5000/api
# ProxyPassReverse /api http://localhost:5000/api
```

**Common issues:**
1. Proxy not forwarding `/api/maps/*` correctly
2. Proxy stripping CORS headers
3. Proxy timeout too short
4. Proxy not handling OPTIONS requests

---

### Step 6: Restart Backend (Ensure Latest Code)

```bash
cd /root/stairs-new/backend

# Pull latest code (if using git)
git pull

# Restart backend to ensure latest code is running
pm2 restart stairs-backend

# Check it's running
pm2 logs stairs-backend --lines 20
```

---

### Step 7: Verify Environment Variables

```bash
# Check GOOGLE_MAPS_API_KEY is set
grep "GOOGLE_MAPS_API_KEY" /root/stairs-new/backend/.env

# If missing or empty, that's the issue!
# The maps route requires this key
```

---

### Step 8: Test with Debug Mode

Temporarily add logging to maps route:

```bash
# Edit maps route
nano /root/stairs-new/backend/src/routes/maps.js

# Add at the start of the route handler:
router.get('/places/autocomplete', async (req, res) => {
  console.log('📍 Maps autocomplete called:', req.query);
  console.log('📍 Origin:', req.headers.origin);
  try {
    // ... rest of code
```

Then:
```bash
pm2 restart stairs-backend
pm2 logs stairs-backend --lines 0
# Try making a request and watch logs
```

---

## 🔍 Common Issues & Fixes

### Issue: Google Maps API Key Missing
**Symptom:** Route returns 503 or error message
**Fix:**
```bash
# Add to backend/.env
echo "GOOGLE_MAPS_API_KEY=your_key_here" >> /root/stairs-new/backend/.env
pm2 restart stairs-backend
```

### Issue: Apache Proxy Not Forwarding
**Symptom:** Local works, external returns 502
**Fix:** Check Apache proxy configuration (see Step 5)

### Issue: CORS Headers Stripped
**Symptom:** 200 OK but no CORS headers
**Fix:** Check Apache isn't stripping headers, ensure backend CORS middleware is running

### Issue: Route Not Registered
**Symptom:** 404 or route not found
**Fix:** Verify `app.use('/api/maps', mapsRoutes);` is in `backend/src/index.js`

---

## ✅ Quick Test Commands

```bash
# 1. Test local endpoint
curl "http://localhost:5000/api/maps/places/autocomplete?input=test"

# 2. Test external endpoint
curl "https://stairs-api.astroraag.com/api/maps/places/autocomplete?input=test"

# 3. Test CORS
curl -I -H "Origin: https://portal.stairs.org.in" \
  "https://stairs-api.astroraag.com/api/maps/places/autocomplete?input=test"

# 4. Check backend logs
pm2 logs stairs-backend --lines 50 | tail -20
```

---

## 📋 Verification Checklist

After fixes:
- [ ] Local endpoint works: `curl http://localhost:5000/api/maps/places/autocomplete?input=test`
- [ ] External endpoint works: `curl https://stairs-api.astroraag.com/api/maps/places/autocomplete?input=test`
- [ ] CORS headers present: `Access-Control-Allow-Origin: https://portal.stairs.org.in`
- [ ] No errors in backend logs
- [ ] Google Maps API key is set in `.env`
- [ ] Frontend can make requests (no CORS errors)
- [ ] Venue autocomplete works in UI

---

Run `test-maps-endpoint.sh` first to identify the exact issue!

