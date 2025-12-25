# CORS and Google Maps API Fix Summary

## Issues Fixed

### 1. CORS Error
**Error:** `Access to XMLHttpRequest at 'https://stairs-api.astroraag.com/api/maps/places/autocomplete?input=...' from origin 'https://portal.stairs.org.in' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`

**Fix Applied:**
- Enhanced CORS middleware in `backend/src/index.js` to better handle origin matching
- Added subdomain pattern matching for more flexible origin validation
- Added logging for debugging blocked origins in production

**Action Required:**
1. **Restart your backend server** for the CORS changes to take effect:
   ```bash
   # If using PM2:
   pm2 restart backend
   
   # If using npm:
   cd backend && npm restart
   
   # Or if running directly:
   # Stop the server (Ctrl+C) and restart it
   ```

2. **Verify CORS is working:**
   - Check backend logs for any CORS warnings
   - Test the API endpoint from the frontend
   - The origin `https://portal.stairs.org.in` should now be properly allowed

### 2. Google Maps API Referer Error
**Error:** `RefererNotAllowedMapError - Your site URL to be authorized: https://portal.stairs.org.in/admin/event/create`

**Fix Required:**
This needs to be fixed in Google Cloud Console. See `GOOGLE_MAPS_API_FIX.md` for detailed instructions.

**Quick Steps:**
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Edit your Google Maps API key (the one in `VITE_GOOGLE_MAPS_API_KEY`)
3. Under "Application restrictions" → "HTTP referrers (web sites)"
4. Add: `https://portal.stairs.org.in/*`
5. Save and wait 2-5 minutes for changes to propagate

## Testing Checklist

After applying both fixes:

- [ ] Backend server restarted
- [ ] Google Maps API key updated in Google Cloud Console
- [ ] Waited 2-5 minutes for Google changes to propagate
- [ ] Cleared browser cache or used incognito mode
- [ ] Tested venue autocomplete on event creation page
- [ ] Verified no CORS errors in browser console
- [ ] Verified no Google Maps API errors

## Verification

1. **Check CORS:**
   - Open browser DevTools → Network tab
   - Make a request to `/api/maps/places/autocomplete`
   - Check response headers for `Access-Control-Allow-Origin: https://portal.stairs.org.in`

2. **Check Google Maps:**
   - Open browser DevTools → Console
   - Navigate to event creation page
   - Type in venue field
   - Should see autocomplete suggestions without errors

## Additional Notes

- The backend CORS configuration now includes better pattern matching for subdomains
- Both `https://portal.stairs.org.in` and `https://www.portal.stairs.org.in` are allowed
- The CORS middleware logs blocked origins in production for debugging

