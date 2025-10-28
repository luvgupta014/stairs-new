# 🚨 QUICK FIX: Google Maps Not Working on Production

## Your Current Issue
✅ Works on: `localhost`  
❌ Fails on: Your public domain (e.g., `yoursite.vercel.app` or `yourdomain.com`)

## Root Cause
Your Google Maps API key is **restricted to localhost only**. You need to add your production domain.

---

## ⚡ 5-Minute Fix

### 1️⃣ Open Google Cloud Console
Go to: https://console.cloud.google.com/apis/credentials

### 2️⃣ Find Your API Key
Click on your Google Maps API key name

### 3️⃣ Add Your Domain
Under **"Application restrictions"** → **"Website restrictions"**

Click **"+ ADD AN ITEM"** and add:

```
https://your-actual-domain.com/*
```

**Examples:**
- `https://stairs-app.vercel.app/*`
- `https://myapp.netlify.app/*`  
- `https://www.mywebsite.com/*`
- `https://mywebsite.com/*` (both with and without www)

⚠️ **Don't forget the `/*` at the end!**

### 4️⃣ Save
Click **"SAVE"** at the bottom

### 5️⃣ Wait & Test
- Wait 2-5 minutes
- Clear browser cache (or use incognito)
- Test on your production site
- Check browser console (F12)

---

## 🔍 How to Find Your Exact Domain

1. Open your production site
2. Press **F12** (Developer Tools)
3. Go to **Console** tab
4. Look for this message:

```
Current domain: your-app.vercel.app
Add this referrer: https://your-app.vercel.app/*
```

5. Copy that exact line and add it to Google Cloud Console!

---

## ✅ Verification

After adding the domain, you should see in console:
- ✅ "Autocomplete initialized successfully"
- ✅ Green map marker icon appears
- ✅ Suggestions appear when typing venue names

If you still see errors:
- ❌ "RefererNotAllowedMapError" → Domain not added correctly
- ❌ "ApiNotActivatedMapError" → Enable Places API in Google Cloud

---

## 🆘 Still Not Working?

### Check These:

1. **Is Places API enabled?**
   - Go to: https://console.cloud.google.com/apis/library
   - Search: "Places API"
   - Status should be: **ENABLED**

2. **Is billing enabled?**
   - Go to: https://console.cloud.google.com/billing
   - Make sure a billing account is linked
   - (You get $200 free credit/month - usually enough!)

3. **Correct domain format?**
   - ✅ Correct: `https://mysite.com/*`
   - ❌ Wrong: `mysite.com` (missing https and /*)
   - ❌ Wrong: `https://mysite.com` (missing /*)
   - ❌ Wrong: `http://mysite.com/*` (should be https for production)

4. **Both www and non-www?**
   - Add both if your site uses both:
     ```
     https://example.com/*
     https://www.example.com/*
     ```

---

## 📱 Current App Behavior

**Don't worry!** Even if Google Maps isn't working:

✅ **The app still works completely**  
✅ Users can enter venue details manually  
✅ All form functionality is available  
✅ Shows clear message: "Manual Input Mode"

The only difference: No autocomplete suggestions (but everything else works!)

---

## 🔐 Your Current Environment Check

Open your `.env` file (or `.env.production`) and verify:

```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxx
```

If it says `your_google_maps_api_key_here`, you need to replace it with your actual API key from Google Cloud Console.

After changing `.env`:
```bash
# Rebuild the app
npm run build

# Or restart dev server
npm run dev
```

---

## 📞 Need More Help?

Read the full guide: `GOOGLE_MAPS_SETUP.md`

Or check browser console - it now shows detailed error messages with solutions!
