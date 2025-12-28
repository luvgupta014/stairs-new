# Deployment Solutions - Event Link Previews

## Overview

Three deployment solutions are available depending on your hosting platform:

1. **Vercel** - Serverless deployment platform
2. **Nginx** - Traditional web server (Ubuntu/Debian/CentOS)
3. **Apache** - Alternative web server

## Quick Decision Guide

**Check your hosting:**
- Using `vercel.json` or deploying to Vercel? → **Use Vercel Solution**
- Using Nginx on Ubuntu/CentOS? → **Use Nginx Solution**
- Using Apache web server? → **Use Apache Solution**

---

## 1. Vercel Solution

**Files:**
- `middleware.js` - Edge middleware (already created)
- `vercel.json` - Vercel configuration (already created)

**Setup:**
1. Ensure `FRONTEND_URL=https://portal.stairs.org.in` is set in Vercel environment variables
2. Deploy - Vercel automatically handles bot routing

**See:** `PRODUCTION_DEPLOYMENT_CHECKLIST.md`

---

## 2. Nginx Solution

**Files:**
- `nginx-event-preview.conf` - Complete Nginx configuration
- `NGINX_SETUP_INSTRUCTIONS.md` - Setup guide

**Setup:**
1. Enable required modules: `sudo a2enmod rewrite proxy proxy_http`
2. Add bot detection location block to your Nginx config
3. Reload Nginx: `sudo systemctl reload nginx`

**See:** `NGINX_SETUP_INSTRUCTIONS.md`

---

## 3. Apache Solution

**Files:**
- `.htaccess` - Simple solution (copy to frontend/dist)
- `apache-event-preview.conf` - Complete virtual host configuration
- `APACHE_SETUP_INSTRUCTIONS.md` - Setup guide

**Setup Options:**

### Option A: Using .htaccess (Simple)
1. Copy `.htaccess` to `/var/www/stairs-new/frontend/dist/`
2. Ensure `AllowOverride All` in Apache config
3. Restart Apache

### Option B: Using Virtual Host (Recommended)
1. Enable modules: `mod_rewrite`, `mod_proxy`, `mod_proxy_http`
2. Copy configuration from `apache-event-preview.conf`
3. Restart Apache

**See:** `APACHE_SETUP_INSTRUCTIONS.md`

---

## Backend Preview Endpoint (All Solutions)

**All solutions require this backend endpoint to work:**
- Route: `/api/events/preview/:uniqueId`
- File: `backend/src/routes/event.js`
- Status: ✅ Already implemented

**Test it:**
```bash
curl https://portal.stairs.org.in/api/events/preview/EVT-0051-OT-DL-271225
```

Should return HTML with event-specific meta tags.

---

## Common Requirements (All Platforms)

1. **Backend Endpoint:** `/api/events/preview/:uniqueId` must be accessible
2. **Environment Variable:** `FRONTEND_URL=https://portal.stairs.org.in` must be set
3. **Logo File:** `frontend/public/logo.png` must exist and be accessible
4. **Backend Running:** Backend server must be running on port 5000 (or configured port)

---

## Testing After Setup

### Test Bot Redirect:
```bash
curl -I -H "User-Agent: facebookexternalhit/1.1" \
  https://portal.stairs.org.in/event/EVT-XXXX-XX-XX-XXXXXX
```

**Expected:** Redirect to `/api/events/preview/EVT-XXXX-XX-XX-XXXXXX`

### Test Preview Endpoint:
```bash
curl https://portal.stairs.org.in/api/events/preview/EVT-XXXX-XX-XX-XXXXXX
```

**Expected:** HTML with `<meta property="og:title" content="Event Name" />`

### Test Platform Tools:
- LinkedIn: https://www.linkedin.com/post-inspector/
- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator

---

## Which Solution Should You Use?

**If you're unsure, check:**

1. **Do you have `vercel.json` in your repo?**
   - Yes → You're using Vercel (or planning to)
   - Use Vercel solution

2. **What web server is running?**
   ```bash
   # Check running web server
   sudo systemctl status nginx
   sudo systemctl status apache2
   sudo systemctl status httpd
   ```
   - Nginx running → Use Nginx solution
   - Apache running → Use Apache solution

3. **Check your deployment documentation**
   - Look at your setup guides
   - Check what's mentioned in README

---

**All solutions provide the same result:**
✅ Bots see event-specific meta tags when sharing event links
✅ Regular users see the normal React app
✅ Works on WhatsApp, Facebook, LinkedIn, Twitter, etc.

