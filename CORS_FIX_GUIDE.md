# CORS Error Fix - Production Deployment

## Error Summary
```
Access to XMLHttpRequest at 'https://stairs-api.astroraag.com/api/auth/login' from origin 'https://stairs.astroraag.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause
The CORS error occurs because:

1. **Cross-Origin Request**: Frontend (`stairs.astroraag.com`) and API (`stairs-api.astroraag.com`) are on different subdomains
2. **Preflight Failure**: The browser sends an OPTIONS request first, and the backend wasn't responding with proper `Access-Control-Allow-Origin` headers for the production domain
3. **Missing Credentials Support**: The frontend needs `withCredentials: true` (already set) but the backend must allow specific origins

## Solution Applied

### 1. Created Frontend Production Environment File
**File**: `frontend/.env.production`
```properties
VITE_BACKEND_URL=https://stairs-api.astroraag.com
VITE_RAZORPAY_KEY_ID=rzp_test_R72yQ8cKrLWlkY
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD_crL09bZixZMgRrZrQDNwPvInhD2a13Y
```

This ensures the frontend uses the correct API URL when deployed to production.

### 2. Updated Backend CORS Configuration
**File**: `backend/src/index.js`

Changed from: Echo-based CORS (accepts any origin)
```javascript
res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
```

Changed to: Whitelist-based CORS (only specific origins)
```javascript
const allowedOrigins = [
  'http://localhost:5173',           // Local dev
  'http://localhost:3000',           // Local dev (alternative)
  'http://160.187.22.41:3008',       // Local server
  'https://stairs.astroraag.com',    // Production frontend
  'https://www.stairs.astroraag.com', // Production frontend with www
];

// Check if origin is in allowed list
if (allowedOrigins.includes(origin)) {
  res.header('Access-Control-Allow-Origin', origin);
}
```

## How It Works

### Request Flow (Preflight + Actual Request)

```
Browser (stairs.astroraag.com)
    |
    ├─ Step 1: Send OPTIONS (preflight)
    |          {
    |            Origin: https://stairs.astroraag.com
    |            Access-Control-Request-Method: POST
    |          }
    |
    └─> API Server (stairs-api.astroraag.com)
        |
        ├─ Check: Is origin in allowedOrigins? YES ✓
        |
        └─> Response:
            {
              Access-Control-Allow-Origin: https://stairs.astroraag.com
              Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
              Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With
            }

Browser
    |
    ├─ Step 2: Preflight passed ✓ - Now send actual POST request
    |
    └─> API Server
        |
        └─> Response: { data: ... }
```

## Environment Variable Setup

### Development (`.env`)
```
VITE_BACKEND_URL=http://localhost:5000
```
- Frontend and backend on same machine, different ports
- CORS whitelist includes `http://localhost:5173`

### Production (`.env.production`)
```
VITE_BACKEND_URL=https://stairs-api.astroraag.com
```
- Frontend and backend on different subdomains (same root domain)
- CORS whitelist includes `https://stairs.astroraag.com`

## Deployment Instructions

1. **Rebuild and Redeploy Frontend**
   ```bash
   npm run build  # Uses .env.production automatically
   ```

2. **Restart Backend with Updated Code**
   ```bash
   pm2 restart stairs-api
   # or
   npm run dev
   ```

3. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
   - Clear all cached data if still having issues

4. **Verify CORS Headers**
   ```bash
   # Test preflight request
   curl -X OPTIONS https://stairs-api.astroraag.com/api/auth/login \
     -H "Origin: https://stairs.astroraag.com" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```
   
   You should see:
   ```
   Access-Control-Allow-Origin: https://stairs.astroraag.com
   Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
   ```

## Troubleshooting

### Still getting CORS errors after fix?

1. **Check CORS headers are actually being sent**
   ```bash
   # In browser DevTools Console
   fetch('https://stairs-api.astroraag.com/health', {
     headers: {'Origin': 'https://stairs.astroraag.com'}
   })
   ```

2. **Verify frontend is using correct URL**
   ```javascript
   // In browser console
   import.meta.env.VITE_BACKEND_URL  // Should show: https://stairs-api.astroraag.com
   ```

3. **Check backend environment**
   ```bash
   # SSH to server
   ssh root@160.187.22.41
   
   # Check if backend is running
   pm2 list
   
   # Check backend logs
   pm2 logs stairs-api
   ```

4. **Verify domain DNS**
   ```bash
   # Test API domain resolves correctly
   curl -I https://stairs-api.astroraag.com/health
   
   # Test frontend domain
   curl -I https://stairs.astroraag.com
   ```

## Key Changes Summary

| Component | Before | After |
|-----------|--------|-------|
| Frontend `.env.production` | ❌ Missing | ✅ Created with `https://stairs-api.astroraag.com` |
| Backend CORS Strategy | ❌ Echo all origins | ✅ Whitelist specific origins |
| Allowed Origins | Any origin in dev | Explicit list including production domains |
| Credentials Header | `true` ✓ | `true` ✓ (unchanged) |
| Preflight Handling | Basic | ✅ Proper with origin validation |

## Security Notes

- ✅ Whitelisted approach is more secure than accepting all origins
- ✅ Production frontend domain is explicitly allowed
- ✅ Credentials are handled safely
- ✅ Different environments (dev/prod) are properly configured
- ⚠️ Never use `*` as origin with `credentials: true` (browser will reject it)

