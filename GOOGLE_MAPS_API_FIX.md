# Google Maps API Configuration Fix

## Issue
You're seeing the error: `RefererNotAllowedMapError` when accessing Google Maps API from `https://portal.stairs.org.in/admin/event/create`.

## Solution

You need to add your production domain to the allowed referrers in Google Cloud Console.

### Steps to Fix:

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/
   - Select your project

2. **Open APIs & Services > Credentials**
   - Go to: APIs & Services → Credentials
   - Find your Google Maps API key (the one used in `VITE_GOOGLE_MAPS_API_KEY`)

3. **Edit the API Key**
   - Click on your API key to edit it
   - Scroll down to "Application restrictions"
   - Select "HTTP referrers (web sites)"

4. **Add Allowed Referrers**
   Add the following referrers (one per line):
   ```
   https://portal.stairs.org.in/*
   https://www.portal.stairs.org.in/*
   https://stairs.astroraag.com/*
   https://www.stairs.astroraag.com/*
   http://localhost:*
   ```
   
   **Important Notes:**
   - Use `/*` at the end to allow all paths on that domain
   - Include both `www` and non-`www` versions if you use both
   - Include localhost for development

5. **Save Changes**
   - Click "Save"
   - Wait a few minutes for changes to propagate (usually 1-5 minutes)

6. **Verify**
   - Clear your browser cache
   - Try accessing the event creation page again
   - The Google Maps API should now work without the RefererNotAllowedMapError

## Additional Notes

- If you're using a different Google Maps API key for the backend (server-side), make sure that key has **no restrictions** or is restricted to **IP addresses** (not HTTP referrers), since server-side requests don't have referrers.

- The backend API key (`GOOGLE_MAPS_API_KEY` in backend `.env`) is used for server-side requests to Google Places API, so it should either:
  - Have no restrictions, OR
  - Be restricted to IP addresses of your backend server

- The frontend API key (`VITE_GOOGLE_MAPS_API_KEY` in frontend `.env`) is used for client-side Google Maps JavaScript API, so it must be restricted to HTTP referrers as described above.

## Testing

After making changes:
1. Wait 2-5 minutes for Google's changes to propagate
2. Clear browser cache or use incognito mode
3. Visit: https://portal.stairs.org.in/admin/event/create
4. Try typing in the venue field
5. You should see Google Maps autocomplete suggestions without errors

