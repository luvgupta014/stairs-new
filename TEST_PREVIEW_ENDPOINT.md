# Quick Test Guide - Verify Preview Endpoint

## Step 1: Test Preview Endpoint Directly

Test the preview endpoint to ensure it returns HTML with meta tags:

```bash
# Test with curl (simulating a bot)
curl -H "User-Agent: facebookexternalhit/1.1" \
  https://portal.stairs.org.in/api/events/preview/EVT-0051-OT-DL-271225

# Or test in browser (will show HTML)
# Navigate to: https://portal.stairs.org.in/api/events/preview/EVT-0051-OT-DL-271225
```

**Expected Result:** You should see HTML with:
- `<title>Event Name | STAIRS Talent Hub</title>`
- `<meta property="og:title" content="Event Name" />`
- `<meta property="og:description" content="..." />`
- `<meta property="og:image" content="..." />`

## Step 2: Verify Logo is Accessible

```bash
curl -I https://portal.stairs.org.in/logo.png
```

**Expected Result:** `200 OK` with `Content-Type: image/png`

## Step 3: Test Bot Redirect

```bash
# This should redirect to preview endpoint
curl -I -H "User-Agent: facebookexternalhit/1.1" \
  https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225

# Look for: Location: /api/events/preview/EVT-0051-OT-DL-271225
```

## Step 4: Check Vercel Logs

In Vercel Dashboard → Your Project → Functions → Logs, look for:
- `🤖 Bot preview request for event:`
- `✅ Event found:`

If you don't see these logs, the middleware/rewrites aren't working.

## Common Issues

### Issue 1: Preview endpoint returns 404
**Solution:** Check that the backend route is registered correctly in `backend/src/routes/event.js`

### Issue 2: Logo returns 404
**Solution:** Ensure `logo.png` exists in `frontend/public/logo.png` and gets copied during build

### Issue 3: Bots still getting static HTML
**Possible causes:**
1. Middleware not running - Check Vercel logs
2. Rewrites not matching - Verify user-agent pattern
3. Cache issue - Clear platform cache using debug tools

### Issue 4: Environment variable not set
**Solution:** Set `FRONTEND_URL=https://portal.stairs.org.in` in Vercel dashboard

