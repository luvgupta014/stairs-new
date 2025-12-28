# Deployment Checklist - Event Link Previews

## ✅ Critical Files That Must Be Uploaded

### 1. `.htaccess` file
**Location:** Website root (same folder as `index.html`)  
**Path:** `/var/www/stairs-new/frontend/dist/.htaccess` or wherever your React build is

**Verify it's there:**
```bash
# SSH into server
ls -la /path/to/your/website/root/.htaccess
cat /path/to/your/website/root/.htaccess | grep "event-preview"
```

**Should contain:**
```apache
RewriteRule ^event/([^/]+)$ /event-preview.php?id=$1 [L]
```

---

### 2. `event-preview.php` file
**Location:** Same directory as `.htaccess` (website root)

**Verify it's there:**
```bash
ls -la /path/to/your/website/root/event-preview.php
```

**Check if it's accessible:**
```bash
curl https://portal.stairs.org.in/event-preview.php?id=TEST
```
Should return HTML (even if error, should be HTML not 404)

---

### 3. Backend Server Running
**Check if backend is running:**
```bash
# SSH into server
ps aux | grep node
# OR if using PM2
pm2 list

# Test backend directly
curl http://localhost:5000/api/events/preview/EVT-0051-OT-DL-271225
```

**Should return:** HTML with meta tags

---

## 🔍 Step-by-Step Debugging

### Step 1: Test PHP File Directly

```bash
curl -v "https://portal.stairs.org.in/event-preview.php?id=EVT-0051-OT-DL-271225"
```

**Expected:** HTML response with meta tags  
**If 404:** PHP file not uploaded or wrong location  
**If empty:** PHP error - check Apache error logs

---

### Step 2: Test Backend Connection from PHP

**Edit `event-preview.php` temporarily** to debug:

```php
// Add after line 60 (after curl_close)
if ($error) {
    header('Content-Type: text/plain');
    die("Backend connection error: " . $error . "\nBackend URL: " . $previewUrl);
}
if ($httpCode !== 200) {
    header('Content-Type: text/plain');
    die("Backend returned HTTP $httpCode\nURL: $previewUrl\nResponse: " . substr($html, 0, 500));
}
```

**Then test:**
```bash
curl "https://portal.stairs.org.in/event-preview.php?id=EVT-0051-OT-DL-271225"
```

This will show what's wrong.

---

### Step 3: Test Bot Detection

```bash
curl -I -H "User-Agent: facebookexternalhit/1.1" \
  "https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225"
```

**Expected:** Should route to `event-preview.php`  
**If redirects to React app:** Bot detection not working

**Check:**
- Is `.htaccess` in correct location?
- Is `mod_rewrite` enabled?
- Are there conflicting `.htaccess` files?

---

### Step 4: Check Apache Error Logs

```bash
# SSH into server
sudo tail -f /var/log/apache2/error.log
# OR
sudo tail -f /var/log/httpd/error_log  # CentOS/RHEL
```

**Then test:**
```bash
curl -H "User-Agent: facebookexternalhit/1.1" \
  "https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225"
```

**Look for:**
- PHP errors
- Rewrite rule errors
- Permission errors

---

### Step 5: Verify File Permissions

```bash
# Files should be readable
chmod 644 .htaccess
chmod 644 event-preview.php

# Check ownership
ls -la .htaccess event-preview.php
```

---

### Step 6: Test Backend URL in PHP

**Create test file `test-backend.php`:**

```php
<?php
$backendUrl = 'http://localhost:5000';
$previewUrl = $backendUrl . '/api/events/preview/EVT-0051-OT-DL-271225';

$ch = curl_init($previewUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 5,
    CURLOPT_CONNECTTIMEOUT => 3,
]);

$html = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "Backend URL: $previewUrl\n";
echo "HTTP Code: $httpCode\n";
echo "Error: " . ($error ?: 'None') . "\n";
echo "Response length: " . strlen($html) . " bytes\n";
echo "First 500 chars:\n" . substr($html, 0, 500);
?>
```

**Upload and test:**
```bash
curl "https://portal.stairs.org.in/test-backend.php"
```

---

## 🔧 Common Issues & Fixes

### Issue 1: PHP File Not Found (404)

**Symptoms:** `curl event-preview.php` returns 404

**Fixes:**
1. Check file location - must be in website root
2. Check file name - must be exactly `event-preview.php`
3. Check Apache document root matches file location

---

### Issue 2: Bot Detection Not Working

**Symptoms:** Bots get React app instead of PHP handler

**Fixes:**
1. **Check `.htaccess` location:**
   ```bash
   # Find document root
   grep DocumentRoot /etc/apache2/sites-available/*.conf
   
   # .htaccess must be there
   ls -la /path/to/document/root/.htaccess
   ```

2. **Check mod_rewrite enabled:**
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

3. **Check AllowOverride:**
   ```apache
   # In Apache config, ensure:
   <Directory /path/to/document/root>
       AllowOverride All
   </Directory>
   ```

4. **Check for conflicting .htaccess:**
   ```bash
   find /path/to/document/root -name ".htaccess" -type f
   ```

---

### Issue 3: Backend Connection Fails

**Symptoms:** PHP can't reach `localhost:5000`

**Fixes:**
1. **Backend not running:**
   ```bash
   cd /path/to/backend
   npm start
   # OR
   pm2 start src/index.js --name stairs-backend
   ```

2. **Wrong port:**
   - Check backend PORT in `.env`
   - Update `$backendUrl` in `event-preview.php`

3. **Backend on different server:**
   - Update `$backendUrl` to actual backend URL
   - Example: `http://backend-server-ip:5000`

4. **PHP can't access localhost:**
   - Some shared hosting blocks localhost
   - Use actual IP: `127.0.0.1:5000`
   - Or backend server IP if different

---

### Issue 4: Still Getting React HTML

**Symptoms:** Even bots get React app

**Check:**
1. Is `.htaccess` being read?
   ```bash
   # Add test rule to .htaccess
   RewriteRule ^test-rewrite$ /test.html [R=301,L]
   # Then test: curl -I https://yourdomain.com/test-rewrite
   # If not redirecting, .htaccess not working
   ```

2. Is React routing catching it first?
   - Make sure bot detection rule is BEFORE React routing rule

3. Check Apache rewrite log:
   ```apache
   # Add to Apache config temporarily:
   RewriteLog /var/log/apache2/rewrite.log
   RewriteLogLevel 3
   ```

---

## ✅ Final Verification

Run these tests in order:

```bash
# 1. Test PHP file directly
curl "https://portal.stairs.org.in/event-preview.php?id=EVT-0051-OT-DL-271225"

# 2. Test bot detection
curl -I -H "User-Agent: facebookexternalhit/1.1" \
  "https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225"

# 3. Test backend directly (from server)
curl "http://localhost:5000/api/events/preview/EVT-0051-OT-DL-271225"

# 4. Test with Facebook Debugger
# Go to: https://developers.facebook.com/tools/debug/
# Enter: https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225
```

---

## 📝 Quick Debug Script

Create `debug-preview.php` on your server:

```php
<?php
header('Content-Type: text/plain');

echo "=== Event Preview Debug ===\n\n";

// 1. Check files exist
echo "1. File check:\n";
echo "   .htaccess: " . (file_exists('.htaccess') ? 'EXISTS' : 'NOT FOUND') . "\n";
echo "   event-preview.php: " . (file_exists('event-preview.php') ? 'EXISTS' : 'NOT FOUND') . "\n\n";

// 2. Check backend
echo "2. Backend check:\n";
$backendUrl = 'http://localhost:5000';
$testUrl = $backendUrl . '/api/events/preview/EVT-0051-OT-DL-271225';
echo "   Testing: $testUrl\n";

$ch = curl_init($testUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 5,
    CURLOPT_CONNECTTIMEOUT => 3,
]);
$html = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "   HTTP Code: $code\n";
echo "   Error: " . ($error ?: 'None') . "\n";
echo "   Response: " . (strlen($html) > 0 ? strlen($html) . ' bytes' : 'EMPTY') . "\n";
if ($html) {
    echo "   Has OG tags: " . (strpos($html, 'og:title') !== false ? 'YES' : 'NO') . "\n";
}
echo "\n";

// 3. Check rewrite rules
echo "3. Rewrite test:\n";
echo "   REQUEST_URI: " . $_SERVER['REQUEST_URI'] . "\n";
echo "   QUERY_STRING: " . ($_SERVER['QUERY_STRING'] ?? 'none') . "\n";
?>
```

**Upload and access:** `https://portal.stairs.org.in/debug-preview.php`

---

## 🆘 Still Not Working?

**Share these details:**

1. Output of `debug-preview.php`
2. Apache error logs (last 50 lines)
3. Result of: `curl "https://portal.stairs.org.in/event-preview.php?id=TEST"`
4. Result of: `curl -I -H "User-Agent: facebookexternalhit/1.1" "https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225"`

This will help identify the exact issue!

