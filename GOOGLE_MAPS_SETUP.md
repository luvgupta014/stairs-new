# Google Maps API Setup Guide

## Problem: Google Maps Works on Localhost but Not on Public Domain

This is a **domain authorization issue**. Google Maps API keys have security restrictions that only allow specific domains to use them.

## Quick Fix (5 minutes)

### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one if you don't have it)
3. Make sure **Places API** is enabled:
   - Go to **APIs & Services** → **Library**
   - Search for "Places API"
   - Click **Enable** if not already enabled

### Step 2: Configure API Key
1. Navigate to **APIs & Services** → **Credentials**
2. Find your API key (or create new one if needed)
3. Click on the API key name to edit

### Step 3: Add Your Domains

Under **Application restrictions**:
- Select: ✅ **HTTP referrers (websites)**

Under **Website restrictions**, add these referrers:

```
# For local development
http://localhost:*
http://127.0.0.1:*
https://localhost:*
https://127.0.0.1:*

# For your production domain
https://your-domain.com/*
https://*.your-domain.com/*

# If using Vercel
https://your-project.vercel.app/*
https://*.vercel.app/*

# If using Netlify
https://your-project.netlify.app/*
https://*.netlify.app/*

# If using custom domain on hosting
https://yourdomain.com/*
https://*.yourdomain.com/*
```

⚠️ **Replace** `your-domain.com`, `your-project.vercel.app`, etc. with your **actual domain names**!

### Step 4: Restrict API Access (Optional but Recommended)

Under **API restrictions**:
- Select: ✅ **Restrict key**
- Choose only the APIs you need:
  - ✅ Places API
  - ✅ Maps JavaScript API
  - ✅ Geocoding API (if you use it)

### Step 5: Save and Test

1. Click **Save**
2. Wait 1-2 minutes for changes to propagate
3. Clear your browser cache or open incognito window
4. Test your public domain
5. Check browser console for any remaining errors

## Common Issues & Solutions

### Issue 1: "RefererNotAllowedMapError"
**Cause**: Your domain is not in the allowed referrers list.

**Solution**: 
- Add your domain to the HTTP referrers list (Step 3 above)
- Make sure to include the `/*` at the end
- Use `https://` for production domains

### Issue 2: "ApiNotActivatedMapError"
**Cause**: Places API is not enabled for your project.

**Solution**:
- Go to **APIs & Services** → **Library**
- Search for "Places API"
- Click **Enable**

### Issue 3: Still Not Working After Adding Domain
**Possible causes**:
1. **Wait time**: Changes can take 1-5 minutes to propagate
2. **Browser cache**: Clear cache or use incognito mode
3. **Wrong domain format**: Make sure you're using the exact domain format
4. **HTTPS vs HTTP**: Production should use HTTPS
5. **Billing**: Make sure billing is enabled on your Google Cloud project

### Issue 4: Works on www but not without www (or vice versa)
**Solution**: Add both variations:
```
https://example.com/*
https://www.example.com/*
```

## Verifying Your Setup

### Check Browser Console
Open Developer Tools (F12) and look for these messages:

✅ **Good signs:**
- "Google Maps already available"
- "Autocomplete initialized successfully"

❌ **Bad signs:**
- "RefererNotAllowedMapError"
- "ApiNotActivatedMapError"
- "Google Maps API authentication failed"

### Current Domain Detection
The app now shows helpful error messages in the console:
```
Current domain: your-domain.com
Add this referrer: https://your-domain.com/*
```

Copy the suggested referrer and add it to your Google Cloud Console.

## Manual Input Fallback

Don't worry! Even if Google Maps doesn't work, the app **automatically switches to manual input mode**. Users can still enter venue details manually.

The component shows:
- 🟢 Green map marker: Google Maps working
- 🟡 Manual input mode: Still fully functional, just no autocomplete

## Environment Variables

Make sure your `.env` file has the API key:

```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **Important**: After changing `.env`, you must rebuild the frontend:
```bash
cd frontend
npm run build
```

For Vite dev mode, restart the dev server:
```bash
npm run dev
```

## Security Best Practices

1. ✅ **Always restrict your API key** to specific domains
2. ✅ **Never commit API keys** to version control
3. ✅ **Use environment variables** for different environments
4. ✅ **Enable billing alerts** on Google Cloud to monitor usage
5. ✅ **Restrict APIs** to only what you need (Places API, not all Google APIs)

## Cost Management

Google Maps offers **$200 free credit per month**, which includes:
- ~28,000 autocomplete requests
- ~40,000 geocoding requests

For most applications, this is **completely free**!

To monitor usage:
1. Go to Google Cloud Console
2. Navigate to **Billing** → **Reports**
3. Filter by **Places API**
4. Set up billing alerts

## Testing Checklist

- [ ] Added domain to HTTP referrers in Google Cloud Console
- [ ] Enabled Places API for the project
- [ ] Waited 2-5 minutes for changes to propagate
- [ ] Cleared browser cache
- [ ] Tested on production domain
- [ ] Checked browser console for errors
- [ ] Verified API key is in `.env` file
- [ ] Rebuilt the application after `.env` changes

## Getting Help

If you're still stuck:

1. **Check the browser console** - it now shows detailed error messages
2. **Verify the domain** - make sure you added the exact domain
3. **Check Google Cloud Console** - verify Places API is enabled and billing is set up
4. **Wait longer** - sometimes takes up to 5 minutes
5. **Try incognito mode** - eliminates caching issues

## Support

The app gracefully handles Google Maps failures:
- ✅ Automatic fallback to manual input
- ✅ Clear error messages in console
- ✅ No impact on user's ability to create events
- ✅ All functionality remains available

Your users can **always** complete the form, even without Google Maps!
