# Fix 404 Error for Event Links

## 🔴 Problem: LinkedIn Getting 404

LinkedIn Post Inspector shows **404 Failure** when accessing:
`https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225`

This means the bot is **not** being routed to `event-preview.php`.

## 🔍 Root Causes

### 1. `.htaccess` Not Processing Bot Requests
- Rewrite rules not matching
- `mod_rewrite` not enabled
- `AllowOverride` not set to `All`

### 2. PHP File Not Accessible
- File not uploaded to correct location
- Wrong file permissions
- PHP not processing `.php` files

### 3. Backend Connection Issue
- Backend not running
- PHP can't reach `localhost:5000`

---

## ✅ Step-by-Step Fix

### Step 1: Verify Files Are Uploaded

**SSH into server:**
```bash
# Find website root (where index.html is)
cd /path/to/website/root

# Check files exist
ls -la .htaccess
ls -la event-preview.php
ls -la index.html

# All three should be in the SAME directory
```

**If files missing:**
- Upload `.htaccess` to website root
- Upload `event-preview.php` to website root
- Both must be in same folder as `index.html`

---

### Step 2: Test PHP File Directly

```bash
curl "https://portal.stairs.org.in/event-preview.php?id=EVT-0051-OT-DL-271225"
```

**Expected:** HTML response with meta tags  
**If 404:** PHP file not uploaded or wrong location  
**If React HTML:** React routing catching PHP (see Step 3)

---

### Step 3: Check Apache Rewrite Configuration

**Verify `mod_rewrite` is enabled:**
```bash
sudo apache2ctl -M | grep rewrite
# OR
sudo a2enmod rewrite
sudo systemctl restart apache2
```

**Verify `AllowOverride` is set:**
```bash
# Check Apache config
sudo grep -r "AllowOverride" /etc/apache2/sites-available/

# Should see:
# AllowOverride All
```

**If not set, edit your virtual host:**
```apache
<Directory /path/to/website/root>
    AllowOverride All
    Require all granted
</Directory>
```

Then restart Apache:
```bash
sudo systemctl restart apache2
```

---

### Step 4: Fix .htaccess - More Explicit Rules

The current `.htaccess` might not be catching all bot patterns. Update to:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # CRITICAL: Don't route PHP files to React
    RewriteCond %{REQUEST_URI} \.php$ [NC]
    RewriteRule . - [L]
    
    # Bot detection - Match event URLs for bots
    RewriteCond %{REQUEST_URI} ^/event/([^/]+)$ [NC]
    RewriteCond %{HTTP_USER_AGENT} (bot|crawler|spider|scraper|facebookexternalhit|facebookcatalog|Twitterbot|Twitter|LinkedInBot|LinkedIn|WhatsApp|whatsapp|Slackbot|Slack|TelegramBot|Telegram|SkypeUriPreview|Discordbot|Discord|Googlebot|Google|Bingbot|Bing|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|facebot|ia_archiver|Pinterestbot|Pinterest|redditbot|reddit|Applebot|Line|Kik|Viber|WeChat|Snapchat|TikTok|PostmanRuntime|curl|wget) [NC]
    RewriteRule ^event/([^/]+)$ /event-preview.php?id=$1 [L,QSA]
    
    # Skip rewriting for index.html
    RewriteRule ^index\.html$ - [L]
    
    # For regular users, serve React app
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-l
    RewriteRule . /index.html [L]
</IfModule>
```

**Key changes:**
- Added `QSA` flag to preserve query strings
- More explicit URI matching
- PHP exclusion rule uses `REQUEST_URI` for better matching

---

### Step 5: Test Backend is Running

```bash
# From server
curl http://localhost:5000/api/events/preview/EVT-0051-OT-DL-271225
```

**Expected:** HTML with meta tags  
**If error:** Start backend:
```bash
cd /path/to/backend
pm2 start src/index.js --name stairs-backend
# OR
npm start
```

---

### Step 6: Add Debugging to PHP

Temporarily add error reporting to `event-preview.php` (after line 8):

```php
<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Get event uniqueId from URL
$requestUri = $_SERVER['REQUEST_URI'];
// ... rest of code
```

**This will show PHP errors if any occur.**

---

### Step 7: Check Apache Error Logs

```bash
# Watch error log in real-time
sudo tail -f /var/log/apache2/error.log

# Then test:
curl -H "User-Agent: LinkedInBot/1.0" \
  "https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225"
```

**Look for:**
- Rewrite rule errors
- PHP errors
- File not found errors

---

## 🎯 Quick Diagnostic

**Run this on your server:**

```bash
# 1. Test PHP file exists
test -f /path/to/root/event-preview.php && echo "✅ PHP file exists" || echo "❌ PHP file missing"

# 2. Test .htaccess exists
test -f /path/to/root/.htaccess && echo "✅ .htaccess exists" || echo "❌ .htaccess missing"

# 3. Test backend
curl -s http://localhost:5000/api/events/preview/EVT-0051-OT-DL-271225 | grep -q "og:title" && echo "✅ Backend works" || echo "❌ Backend issue"

# 4. Test PHP directly
curl -s "https://portal.stairs.org.in/event-preview.php?id=TEST" | grep -q "html" && echo "✅ PHP accessible" || echo "❌ PHP not accessible"
```

---

## 🚨 Most Likely Issues

### Issue 1: Files Not in Website Root
**Symptom:** 404 on both bot requests and direct PHP access

**Fix:** Upload files to **exact same directory as `index.html`**

---

### Issue 2: Rewrite Rules Not Matching
**Symptom:** Bot gets React HTML or 404

**Fix:** Use updated `.htaccess` with explicit matching (Step 4)

---

### Issue 3: Backend Not Running
**Symptom:** PHP can't fetch from backend

**Fix:** Start backend server (Step 5)

---

## ✅ After Fixing - Verify

1. **Test bot detection:**
   ```bash
   curl -I -H "User-Agent: LinkedInBot/1.0" \
     "https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225"
   ```
   Should return 200 OK with HTML content

2. **Test LinkedIn Inspector again:**
   - Go to: https://www.linkedin.com/post-inspector/
   - Enter: `https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225`
   - Should show preview with event details

3. **Test Facebook Debugger:**
   - Go to: https://developers.facebook.com/tools/debug/
   - Enter the same URL
   - Should show OG tags

---

## 📝 Next Steps

1. Upload updated `.htaccess` (from Step 4)
2. Verify files are in correct location
3. Check Apache error logs
4. Test backend is running
5. Retest with LinkedIn Inspector

If still getting 404, share the output of the diagnostic commands above!

