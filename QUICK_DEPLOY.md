# 🚀 Quick Deploy - Event Preview

## All Files Ready! Here's How to Deploy:

### **Option 1: Automated Script (Recommended)**

1. **SSH into your server**
2. **Navigate to project:**
   ```bash
   cd /path/to/stairs-new
   ```
3. **Edit the script** to set your website root:
   ```bash
   nano deploy-preview-files.sh
   # Change line 6: WEBSITE_ROOT="/var/www/stairs-new/frontend/dist"
   # To your actual path (where index.html is)
   ```
4. **Run it:**
   ```bash
   ./deploy-preview-files.sh
   ```

**Done!** The script will:
- ✅ Copy all files to correct location
- ✅ Set proper permissions
- ✅ Check Apache configuration
- ✅ Verify backend connection
- ✅ Show you what to test

---

### **Option 2: Manual (If Script Doesn't Work)**

1. **Find your website root** (where `index.html` is):
   ```bash
   find /var/www -name "index.html" 2>/dev/null | head -1
   # OR
   grep DocumentRoot /etc/apache2/sites-available/*.conf
   ```

2. **Copy files:**
   ```bash
   cp .htaccess /path/to/website/root/
   cp event-preview.php /path/to/website/root/
   cp debug-preview.php /path/to/website/root/
   ```

3. **Set permissions:**
   ```bash
   chmod 644 /path/to/website/root/.htaccess
   chmod 644 /path/to/website/root/event-preview.php
   ```

---

## ✅ After Deployment - Test

```bash
# Test 1: PHP file works
curl "https://portal.stairs.org.in/event-preview.php?id=TEST"

# Test 2: Bot detection works
curl -I -H "User-Agent: LinkedInBot/1.0" \
  "https://portal.stairs.org.in/event/TEST"

# Test 3: Debug tool
curl "https://portal.stairs.org.in/debug-preview.php"
```

---

## 📁 Files Ready in Your Project:

- ✅ `.htaccess` - Updated with bot detection
- ✅ `event-preview.php` - PHP handler
- ✅ `debug-preview.php` - Diagnostic tool
- ✅ `deploy-preview-files.sh` - Automated deployment script

**Just run the script and you're done!**

