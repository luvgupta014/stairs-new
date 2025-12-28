# Fix CORS and Google Maps API Issues

## Issues Identified

1. **CORS Error**: Backend at `https://stairs-api.astroraag.com` not allowing requests from `https://portal.stairs.org.in`
2. **Google Maps API Error**: Domain `https://portal.stairs.org.in` not authorized in Google Cloud Console

---

## ✅ Solution 1: Fix CORS on Backend

The backend already includes `https://portal.stairs.org.in` in allowed origins, but we need to ensure it's working correctly.

### Option A: Update Backend Environment Variable (Recommended)

**On your backend server**, add to `.env`:

```bash
CORS_ORIGINS=https://portal.stairs.org.in,https://www.portal.stairs.org.in
```

**Then restart the backend:**
```bash
cd /root/stairs-new/backend
pm2 restart all
# or
systemctl restart your-backend-service
```

### Option B: Verify Backend is Responding to OPTIONS Requests

Test the CORS preflight:
```bash
curl -X OPTIONS https://stairs-api.astroraag.com/api/maps/places/autocomplete \
  -H "Origin: https://portal.stairs.org.in" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

You should see:
```
Access-Control-Allow-Origin: https://portal.stairs.org.in
```

---

## ✅ Solution 2: Fix Google Maps API Referer Restriction

### Steps:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/

2. **Navigate to APIs & Services → Credentials**

3. **Find your API Key** (the one used in `VITE_GOOGLE_MAPS_API_KEY`)

4. **Click Edit** (pencil icon)

5. **Under "Application restrictions"**, select **"HTTP referrers (web sites)"**

6. **Add these referrers:**
   ```
   https://portal.stairs.org.in/*
   https://www.portal.stairs.org.in/*
   https://*.portal.stairs.org.in/*
   http://localhost:*/*
   https://stairs.astroraag.com/*
   ```

7. **Under "API restrictions"**, ensure these APIs are enabled:
   - Maps JavaScript API
   - Places API
   - Geocoding API

8. **Click Save**

9. **Wait 5-10 minutes** for changes to propagate

10. **Test again** on `https://portal.stairs.org.in`

---

## 🔍 Debugging Steps

### 1. Check Backend Logs

```bash
# If using PM2
pm2 logs backend

# If using systemd
journalctl -u your-backend-service -f

# Look for CORS warnings:
# "⚠️ CORS blocked origin: ..."
```

### 2. Verify CORS Headers

```bash
# Test from command line
curl -I -H "Origin: https://portal.stairs.org.in" \
  https://stairs-api.astroraag.com/api/maps/places/autocomplete
```

Expected headers:
```
Access-Control-Allow-Origin: https://portal.stairs.org.in
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
```

### 3. Test Google Maps API Key

Visit this URL in your browser (replace `YOUR_API_KEY`):
```
https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places
```

If you see an error, the key/domain restriction is the issue.

---

## 🚀 Quick Fix Script

Create and run this on your backend server:

```bash
# Create fix script
cat > /tmp/fix-cors.sh << 'EOF'
#!/bin/bash
echo "🔧 Fixing CORS configuration..."

# Add CORS_ORIGINS to backend .env
BACKEND_ENV="/root/stairs-new/backend/.env"

if [ -f "$BACKEND_ENV" ]; then
    # Remove old CORS_ORIGINS line
    sed -i '/^CORS_ORIGINS=/d' "$BACKEND_ENV"
    
    # Add new CORS_ORIGINS
    echo "" >> "$BACKEND_ENV"
    echo "# CORS Origins" >> "$BACKEND_ENV"
    echo "CORS_ORIGINS=https://portal.stairs.org.in,https://www.portal.stairs.org.in" >> "$BACKEND_ENV"
    
    echo "✅ Updated $BACKEND_ENV"
    echo ""
    echo "📋 Restart your backend:"
    echo "   pm2 restart all"
    echo "   # or"
    echo "   systemctl restart your-backend-service"
else
    echo "❌ Backend .env not found at $BACKEND_ENV"
fi
EOF

chmod +x /tmp/fix-cors.sh
bash /tmp/fix-cors.sh
```

---

## ✅ Verification Checklist

After fixes:

- [ ] Backend `.env` has `CORS_ORIGINS` set
- [ ] Backend restarted
- [ ] Google Cloud Console has `https://portal.stairs.org.in/*` in API key restrictions
- [ ] Google Maps APIs enabled (Maps JS API, Places API)
- [ ] Test event creation page - no CORS errors
- [ ] Test venue search - autocomplete works
- [ ] Check browser console - no CORS or Maps API errors

---

## 📝 Notes

- **CORS changes** take effect immediately after backend restart
- **Google Maps API changes** can take 5-10 minutes to propagate
- If issues persist, check if there's a proxy/load balancer in front of your backend that might be stripping CORS headers

