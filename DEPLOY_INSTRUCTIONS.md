# Quick Deployment Instructions

## Option 1: Use Deployment Script (Easiest)

1. **SSH into your server**
2. **Navigate to project directory:**
   ```bash
   cd /path/to/stairs-new
   ```
3. **Make script executable:**
   ```bash
   chmod +x deploy-preview-files.sh
   ```
4. **Edit script to set correct website root** (line 6):
   ```bash
   nano deploy-preview-files.sh
   # Change: WEBSITE_ROOT="/var/www/stairs-new/frontend/dist"
   # To your actual website root path
   ```
5. **Run script:**
   ```bash
   ./deploy-preview-files.sh
   ```

---

## Option 2: Manual Deployment

### Step 1: Find Your Website Root

```bash
# Usually one of these:
/var/www/stairs-new/frontend/dist/
/home/username/public_html/
/path/to/where/index.html/is/
```

**Find it by:**
```bash
find /var/www -name "index.html" 2>/dev/null | grep dist
# OR
grep DocumentRoot /etc/apache2/sites-available/*.conf
```

### Step 2: Copy Files

```bash
# Copy to website root
cp .htaccess /path/to/website/root/
cp event-preview.php /path/to/website/root/
cp debug-preview.php /path/to/website/root/  # Optional but helpful

# Set permissions
chmod 644 /path/to/website/root/.htaccess
chmod 644 /path/to/website/root/event-preview.php
```

### Step 3: Verify

```bash
# Check files exist
ls -la /path/to/website/root/.htaccess
ls -la /path/to/website/root/event-preview.php
ls -la /path/to/website/root/index.html

# All three should be in the same directory
```

---

## Option 3: Use FTP/SFTP/File Manager

1. **Connect to your server** via FTP/SFTP or use cPanel File Manager
2. **Navigate to website root** (where `index.html` is)
3. **Upload files:**
   - `.htaccess`
   - `event-preview.php`
   - `debug-preview.php` (optional)
4. **Verify files are uploaded**

---

## After Deployment - Test

### Test 1: PHP File Directly
```bash
curl "https://portal.stairs.org.in/event-preview.php?id=TEST"
```
Should return HTML (not 404)

### Test 2: Bot Detection
```bash
curl -I -H "User-Agent: LinkedInBot/1.0" \
  "https://portal.stairs.org.in/event/TEST"
```
Should return 200 OK with HTML

### Test 3: Debug Script
Visit in browser:
```
https://portal.stairs.org.in/debug-preview.php
```
Shows full diagnostic report

---

## Troubleshooting

### If files aren't uploading:
- Check file permissions
- Verify you have write access to website root
- Check disk space: `df -h`

### If PHP returns 404:
- Verify file is in correct location (same as index.html)
- Check file name is exactly `event-preview.php` (case-sensitive)
- Verify PHP is enabled

### If rewrite not working:
- Enable mod_rewrite: `sudo a2enmod rewrite`
- Check AllowOverride: Should be `All` in Apache config
- Restart Apache: `sudo systemctl restart apache2`

---

## Files Needed

Make sure you have these files in your project:
- ✅ `.htaccess` - Apache rewrite rules
- ✅ `event-preview.php` - PHP handler for bots
- ✅ `debug-preview.php` - Diagnostic tool
- ✅ `deploy-preview-files.sh` - Deployment script

All files should be ready in your project directory!

