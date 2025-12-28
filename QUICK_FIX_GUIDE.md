# Quick Fix Guide - Still Not Working After Deployment

## 🔍 The Problem

Based on testing, the bot detection is working but it's still serving React HTML instead of PHP handler.

## ✅ Critical Steps (Do These First)

### Step 1: Verify Files Are Uploaded

**SSH into your server and check:**

```bash
# Find your website root directory
# Usually: /var/www/stairs-new/frontend/dist/
# OR: /home/username/public_html/
# OR: Check Apache DocumentRoot config

# Check files exist
ls -la /path/to/website/root/.htaccess
ls -la /path/to/website/root/event-preview.php
```

**Both files MUST be in the same directory as `index.html`**

---

### Step 2: Test PHP File Directly

```bash
curl "https://portal.stairs.org.in/event-preview.php?id=EVT-0051-OT-DL-271225"
```

**Expected:** HTML with meta tags  
**If 404:** PHP file not uploaded or wrong location  
**If React HTML:** PHP file is being caught by React routing (see Step 3)

---

### Step 3: Fix .htaccess Location

**The issue might be:**

1. **Multiple `.htaccess` files** - React build might have its own
2. **Wrong directory** - `.htaccess` must be where `index.html` is
3. **React routing catching PHP** - Need to exclude PHP files from React routing

**Update `.htaccess` to exclude PHP files from React routing:**

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Bot detection for event link previews - Route bots to PHP handler
    RewriteCond %{HTTP_USER_AGENT} (bot|crawler|spider|scraper|facebookexternalhit|facebookcatalog|Twitterbot|Twitter|LinkedInBot|LinkedIn|WhatsApp|whatsapp|Slackbot|Slack|TelegramBot|Telegram|SkypeUriPreview|Discordbot|Discord|Googlebot|Google|Bingbot|Bing|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|facebot|ia_archiver|Pinterestbot|Pinterest|redditbot|reddit|Applebot|Line|Kik|Viber|WeChat|Snapchat|TikTok|PostmanRuntime|curl|wget) [NC]
    RewriteRule ^event/([^/]+)$ /event-preview.php?id=$1 [L]
    
    # IMPORTANT: Don't route PHP files to React
    RewriteCond %{REQUEST_FILENAME} \.php$ [NC]
    RewriteRule . - [L]
    
    # Skip rewriting for index.html
    RewriteRule ^index\.html$ - [L]
    
    # For regular users, serve React app (standard SPA routing)
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-l
    RewriteRule . /index.html [L]
</IfModule>
```

---

### Step 4: Upload Debug Scripts

Upload these files to your website root:

1. **`debug-preview.php`** - Comprehensive debug report
2. **`test-backend.php`** - Test backend connection

**Then access:**
```
https://portal.stairs.org.in/debug-preview.php
```

**This will tell you exactly what's wrong!**

---

### Step 5: Check Backend is Running

```bash
# SSH into server
curl http://localhost:5000/api/events/preview/EVT-0051-OT-DL-271225
```

**Expected:** HTML with meta tags  
**If error:** Backend not running - start it!

```bash
cd /path/to/backend
npm start
# OR
pm2 start src/index.js --name stairs-backend
```

---

### Step 6: Verify .htaccess is Being Read

**Add test rule to `.htaccess`:**

```apache
# Add at the top, before other rules
RewriteRule ^test-htaccess$ /test.html [R=301,L]
```

**Test:**
```bash
curl -I "https://portal.stairs.org.in/test-htaccess"
```

**If redirects to test.html:** ✅ `.htaccess` is working  
**If not:** `.htaccess` not being read - check AllowOverride

---

## 🚨 Most Common Issues

### Issue 1: PHP File Not Uploaded
**Symptom:** `curl event-preview.php` returns 404

**Fix:**
- Upload `event-preview.php` to website root
- Ensure it's in same folder as `index.html`

---

### Issue 2: .htaccess Not Processing
**Symptom:** Bot requests still get React HTML

**Fixes:**
1. Check `AllowOverride All` in Apache config
2. Ensure `mod_rewrite` is enabled
3. Check for conflicting `.htaccess` files
4. Verify `.htaccess` is in correct directory

---

### Issue 3: Backend Not Running
**Symptom:** PHP can't connect to backend

**Fix:**
```bash
# Start backend
pm2 start src/index.js --name stairs-backend
# OR
cd /path/to/backend && npm start

# Verify
curl http://localhost:5000/health
```

---

### Issue 4: React Routing Catching PHP
**Symptom:** PHP file accessed directly returns React HTML

**Fix:** Add this rule BEFORE React routing:
```apache
RewriteCond %{REQUEST_FILENAME} \.php$ [NC]
RewriteRule . - [L]
```

---

## 📋 Complete Verification Checklist

Run these commands and check each one:

```bash
# 1. Files exist
[ ] ls -la /path/to/root/.htaccess
[ ] ls -la /path/to/root/event-preview.php

# 2. PHP file works
[ ] curl "https://portal.stairs.org.in/event-preview.php?id=TEST"
     → Should return HTML (not 404, not React HTML)

# 3. Backend running
[ ] curl http://localhost:5000/api/events/preview/EVT-XXXX
     → Should return HTML with OG tags

# 4. Bot detection works
[ ] curl -I -H "User-Agent: facebookexternalhit/1.1" \
     "https://portal.stairs.org.in/event/EVT-XXXX"
     → Should route to event-preview.php

# 5. Debug script
[ ] curl "https://portal.stairs.org.in/debug-preview.php"
     → Should show full diagnostic report
```

---

## 🎯 Next Steps

1. **Upload `debug-preview.php`** to your server
2. **Access it via browser:** `https://portal.stairs.org.in/debug-preview.php`
3. **Share the output** - it will tell us exactly what's wrong!

The debug script will check:
- ✅ Files exist
- ✅ Backend connection
- ✅ PHP configuration
- ✅ Apache modules
- ✅ Everything else

This will pinpoint the exact issue!

