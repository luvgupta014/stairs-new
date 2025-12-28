# 🚨 URGENT: Fix 404 Error for LinkedIn

## The Problem

LinkedIn Post Inspector shows **404 Failure** - this means bots can't access your event preview.

## ✅ Immediate Actions Required

### 1. Verify PHP File is Uploaded

**CRITICAL:** The `event-preview.php` file MUST be in your website root.

**SSH into server and check:**
```bash
# Find your website root (where index.html is)
ls -la /path/to/website/root/event-preview.php
```

**If file doesn't exist:**
- Upload `event-preview.php` to the **exact same directory** as `index.html`
- Verify file permissions: `chmod 644 event-preview.php`

---

### 2. Test PHP File Directly

```bash
curl "https://portal.stairs.org.in/event-preview.php?id=EVT-0051-OT-DL-271225"
```

**Expected:** HTML with meta tags  
**If 404:** File not uploaded or wrong location  
**If works:** Problem is with rewrite rule

---

### 3. Upload Updated .htaccess

I've updated `.htaccess` with:
- Simpler rewrite rule: `^event/(.+)$` instead of complex pattern
- Added `linkedin` to bot detection (in case it's case-sensitive)
- More explicit PHP file exclusion

**Upload the updated `.htaccess` file to your website root.**

---

### 4. Check Apache Configuration

**Verify mod_rewrite is enabled:**
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

**Check AllowOverride:**
```bash
sudo grep -r "AllowOverride" /etc/apache2/sites-available/*.conf
```

**Should see:** `AllowOverride All`

**If not, edit your virtual host config:**
```apache
<Directory /path/to/website/root>
    AllowOverride All
    Require all granted
</Directory>
```

**Then restart:**
```bash
sudo systemctl restart apache2
```

---

### 5. Test Bot Detection

```bash
# Test with LinkedIn user-agent
curl -I -H "User-Agent: LinkedInBot/1.0" \
  "https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225"
```

**Expected:** 200 OK with HTML content  
**If 404:** Rewrite rule not working

---

### 6. Check Apache Error Logs

```bash
# Watch logs in real-time
sudo tail -f /var/log/apache2/error.log

# Then test
curl -H "User-Agent: LinkedInBot/1.0" \
  "https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225"
```

**Look for:**
- File not found errors
- Rewrite rule errors
- PHP errors

---

## 🔧 Quick Test Script

**Create `test-rewrite.php` on your server:**

```php
<?php
header('Content-Type: text/plain');
echo "PHP is working!\n";
echo "REQUEST_URI: " . $_SERVER['REQUEST_URI'] . "\n";
echo "User Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'None') . "\n";
echo "Query String: " . ($_SERVER['QUERY_STRING'] ?? 'None') . "\n";
if (isset($_GET['id'])) {
    echo "Event ID: " . $_GET['id'] . "\n";
}
?>
```

**Upload and test:**
```bash
curl "https://portal.stairs.org.in/test-rewrite.php?id=TEST"
```

**Then test rewrite:**
```bash
curl -H "User-Agent: LinkedInBot/1.0" \
  "https://portal.stairs.org.in/event/TEST"
```

**If both return PHP output:** ✅ Rewrite is working  
**If rewrite returns 404:** Rewrite rule needs fixing

---

## 🎯 Most Likely Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| PHP file not uploaded | Direct PHP access returns 404 | Upload `event-preview.php` |
| Wrong directory | Files in wrong location | Move to website root |
| mod_rewrite disabled | Rewrite not working | Enable: `a2enmod rewrite` |
| AllowOverride = None | .htaccess ignored | Set `AllowOverride All` |

---

## ✅ Verification Checklist

After fixes, verify:

- [ ] `event-preview.php` exists in website root
- [ ] `.htaccess` exists in website root  
- [ ] `mod_rewrite` is enabled
- [ ] `AllowOverride All` is set
- [ ] Backend is running (`curl http://localhost:5000/health`)
- [ ] Direct PHP access works (`curl event-preview.php?id=TEST`)
- [ ] Bot detection works (`curl -H "User-Agent: LinkedInBot" /event/TEST`)

---

## 🆘 If Still Not Working

**Run these and share output:**

```bash
# 1. Check files
ls -la /path/to/root/.htaccess
ls -la /path/to/root/event-preview.php

# 2. Test PHP
curl "https://portal.stairs.org.in/event-preview.php?id=TEST"

# 3. Test rewrite
curl -v -H "User-Agent: LinkedInBot/1.0" \
  "https://portal.stairs.org.in/event/TEST" 2>&1 | head -30

# 4. Check Apache errors
sudo tail -20 /var/log/apache2/error.log
```

Share the output and I'll help debug further!

