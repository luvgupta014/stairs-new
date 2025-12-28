# Production Deployment Checklist - Social Media Link Previews

## ✅ Pre-Deployment Checklist

### 1. Environment Variables (Vercel Dashboard)
Ensure these are set in your Vercel project settings:

```
FRONTEND_URL=https://portal.stairs.org.in
NODE_ENV=production
```

**How to set:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `FRONTEND_URL` with value `https://portal.stairs.org.in`
3. Ensure `NODE_ENV=production` is set for production environment

### 2. Verify Files Are Present
- ✅ `middleware.js` at project root
- ✅ `vercel.json` with correct configuration
- ✅ `backend/src/routes/event.js` with preview endpoint
- ✅ `frontend/public/logo.png` exists (for preview images)

### 3. Test Preview Endpoint
After deployment, test directly:
```
https://portal.stairs.org.in/api/events/preview/EVT-0051-OT-DL-271225
```

Expected response: HTML with event-specific meta tags

### 4. Clear Cache After Deployment
Use these tools to clear cache and force refresh:

**LinkedIn:**
- Go to: https://www.linkedin.com/post-inspector/
- Enter event URL and click "Inspect"
- Click "Clear Cache" if available

**Facebook:**
- Go to: https://developers.facebook.com/tools/debug/
- Enter event URL and click "Debug"
- Click "Scrape Again" to force refresh

**Twitter:**
- Go to: https://cards-dev.twitter.com/validator
- Enter event URL and click "Preview card"

**WhatsApp:**
- Wait 24-48 hours for cache to expire, OR
- Share a NEW link (add `?v=2` to URL to bypass cache)

## 🚀 Deployment Steps

1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Production: Fix social media link previews for events"
   git push
   ```

2. **Deploy to Vercel:**
   - Push to main branch (auto-deploys), OR
   - Deploy manually from Vercel dashboard

3. **Verify Deployment:**
   - Check Vercel logs for any errors
   - Test preview endpoint manually
   - Check middleware is executing (look for bot redirects in logs)

4. **Test Link Preview:**
   - Share event link on WhatsApp
   - Check LinkedIn Post Inspector
   - Use Facebook Sharing Debugger

## 📋 Post-Deployment Verification

### ✅ Checklist:
- [ ] Preview endpoint returns HTML with event meta tags
- [ ] Logo image is accessible at `/logo.png`
- [ ] LinkedIn Post Inspector shows event details
- [ ] Facebook Sharing Debugger shows event details
- [ ] WhatsApp preview shows event name (may take 24-48h for first link)

## 🔧 Troubleshooting

### If previews still show generic content:

1. **Check Environment Variable:**
   ```bash
   # In Vercel dashboard, verify FRONTEND_URL is set correctly
   ```

2. **Test Preview Endpoint:**
   ```bash
   curl -H "User-Agent: facebookexternalhit/1.1" \
     https://portal.stairs.org.in/api/events/preview/EVT-XXXX-XX-XX-XXXXXX
   ```

3. **Check Vercel Logs:**
   - Look for: `🤖 Bot preview request for event:`
   - Look for: `✅ Event found:`
   - Check for any errors

4. **Verify Logo Access:**
   ```bash
   curl -I https://portal.stairs.org.in/logo.png
   # Should return 200 OK
   ```

5. **Clear Platform Cache:**
   - Use platform-specific debug tools listed above
   - Wait 24-48 hours for automatic cache refresh

## 📝 Important Notes

- **Cache Duration:** Social platforms cache previews for 24-48 hours
- **First Share:** First-time shares may take a few seconds to generate preview
- **HTTPS Required:** All URLs must use HTTPS for security
- **Logo Size:** Ensure logo.png is optimized (<300KB for WhatsApp)

## 🎯 Expected Result

When sharing an event link, you should see:
- ✅ Event name as title (not "STAIRS Talent Hub")
- ✅ Event description with details
- ✅ Sport, date, venue information
- ✅ STAIRS logo as preview image
- ✅ Proper branding and formatting

---

**Last Updated:** Production Ready
**Maintained By:** STAIRS Development Team

