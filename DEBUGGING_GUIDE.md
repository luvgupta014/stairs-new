# Debugging Guide - Social Media Link Previews

## 🎯 Goal
Get bots/crawlers to see event-specific meta tags instead of generic static HTML.

## 📊 Current Status
Based on screenshots, bots are getting static HTML (generic "STAIRS Talent Hub" title), which means routing isn't working.

## ✅ Implementation Status

### Files Created/Modified:
1. ✅ `middleware.js` - Edge middleware for bot detection
2. ✅ `backend/src/routes/event.js` - Preview endpoint with meta tags
3. ✅ `vercel.json` - Routing configuration
4. ✅ `frontend/public/logo.png` - Logo for preview images

## 🔍 Step-by-Step Debugging

### Test 1: Verify Preview Endpoint Works
**Action:** Open in browser:
```
https://portal.stairs.org.in/api/events/preview/EVT-0051-OT-DL-271225
```

**Expected:** HTML page with:
- `<title>EVENT_NAME | STAIRS Talent Hub</title>`
- `<meta property="og:title" content="EVENT_NAME" />`
- Full meta tags in `<head>`

**If 404 or error:**
- Backend route not working
- Fix backend first before routing

### Test 2: Check Environment Variable
**Action:** In Vercel Dashboard → Settings → Environment Variables

**Required:**
```
FRONTEND_URL=https://portal.stairs.org.in
```

**If missing:** Add it and redeploy

### Test 3: Test Bot Redirect
**Action:** Run in terminal:
```bash
curl -v -H "User-Agent: facebookexternalhit/1.1" \
  https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225 2>&1 | grep -i location
```

**Expected:** `Location: /api/events/preview/EVT-0051-OT-DL-271225`

**If not redirecting:**
- Middleware not running OR
- Rewrites not matching

### Test 4: Check Vercel Logs
**Action:** Vercel Dashboard → Functions → Logs

**Look for:**
- `🤖 Bot preview request for event:`
- `✅ Event found:`

**If no logs:**
- Preview endpoint not being hit
- Routing not working

## 🚨 Most Likely Issues

### Issue 1: Middleware Not Running
**Symptom:** Bots get static HTML, no redirect

**Solutions:**
1. Verify `middleware.js` is at project root (not in a subfolder)
2. Check Vercel deployment logs for middleware errors
3. Remove `functions.middleware.js` from vercel.json (Vercel auto-detects it)
4. Redeploy

### Issue 2: Preview Endpoint Returns 404
**Symptom:** Test 1 fails

**Solutions:**
1. Check backend route registration
2. Verify event uniqueId exists
3. Check backend deployment logs
4. Test locally first

### Issue 3: Environment Variable Not Set
**Symptom:** Logo URL wrong, URLs incorrect

**Solution:**
1. Set `FRONTEND_URL` in Vercel
2. Redeploy

## 📝 Next Steps

1. **Test preview endpoint directly** (Test 1 above)
2. **If preview works:** Issue is routing - check middleware/rewrites
3. **If preview fails:** Fix backend endpoint first
4. **After fix:** Clear platform cache using debug tools

## 🔧 Quick Fix If Routing Still Doesn't Work

If middleware/rewrites still don't work after all checks:

1. **Test preview endpoint URL manually:**
   - If it works, the backend is fine
   - Share the preview URL directly to test meta tags

2. **Check Vercel deployment:**
   - Ensure all files committed
   - Check deployment succeeded
   - Review deployment logs

3. **Alternative:** Use server-side rendering (SSR) or Next.js for proper meta tag support

---

**Status:** Ready for testing and debugging
**Priority:** Test preview endpoint first, then debug routing

