# Apache Setup for Event Link Previews

## Setup Instructions for Apache Web Server

### Prerequisites

Enable required Apache modules:
```bash
# On Ubuntu/Debian
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod expires

# On CentOS/RHEL
# Edit /etc/httpd/conf/httpd.conf and ensure these modules are loaded:
# LoadModule rewrite_module modules/mod_rewrite.so
# LoadModule proxy_module modules/mod_proxy.so
# LoadModule proxy_http_module modules/mod_proxy_http.so
# LoadModule headers_module modules/mod_headers.so
# LoadModule expires_module modules/mod_expires.so

# Restart Apache
sudo systemctl restart apache2  # Ubuntu/Debian
sudo systemctl restart httpd    # CentOS/RHEL
```

### Option 1: Using .htaccess (Simple)

1. **Copy .htaccess to your frontend dist directory:**
   ```bash
   cp .htaccess /var/www/stairs-new/frontend/dist/.htaccess
   ```

2. **Ensure AllowOverride is enabled in Apache config:**
   ```apache
   <Directory /var/www/stairs-new/frontend/dist>
       AllowOverride All
       Require all granted
   </Directory>
   ```

3. **Restart Apache:**
   ```bash
   sudo systemctl restart apache2  # or httpd
   ```

### Option 2: Using Virtual Host Configuration (Recommended)

1. **Create or edit your virtual host file:**
   ```bash
   # Ubuntu/Debian
   sudo nano /etc/apache2/sites-available/portal.stairs.org.in.conf
   
   # CentOS/RHEL
   sudo nano /etc/httpd/conf.d/portal.stairs.org.in.conf
   ```

2. **Copy configuration from `apache-event-preview.conf`**

3. **Enable the site (Ubuntu/Debian only):**
   ```bash
   sudo a2ensite portal.stairs.org.in.conf
   ```

4. **Test Apache configuration:**
   ```bash
   sudo apache2ctl configtest  # Ubuntu/Debian
   sudo httpd -t               # CentOS/RHEL
   ```

5. **Restart Apache:**
   ```bash
   sudo systemctl restart apache2  # Ubuntu/Debian
   sudo systemctl restart httpd    # CentOS/RHEL
   ```

## How It Works

1. **Bot Detection:** Apache checks the `User-Agent` header
2. **Bot Routing:** If bot detected, redirects `/event/:uniqueId` → `/api/events/preview/:uniqueId`
3. **Regular Users:** Non-bots get the normal React app (SPA routing)

## Testing

### Test Bot Redirect:
```bash
curl -I -H "User-Agent: facebookexternalhit/1.1" \
  https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225
```

**Expected:** `Location: /api/events/preview/EVT-0051-OT-DL-271225`

### Test Regular User:
```bash
curl -I -H "User-Agent: Mozilla/5.0" \
  https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225
```

**Expected:** `200 OK` with React app HTML

## Troubleshooting

### Issue: Rewrites not working
**Solution:**
1. Verify `mod_rewrite` is enabled: `apache2ctl -M | grep rewrite`
2. Check `AllowOverride All` is set
3. Check Apache error logs: `sudo tail -f /var/log/apache2/error.log`

### Issue: Proxy not working
**Solution:**
1. Verify `mod_proxy` and `mod_proxy_http` are enabled
2. Check backend is running on port 5000
3. Verify proxy pass URL is correct

### Issue: 403 Forbidden
**Solution:**
1. Check file permissions: `chmod 755 /var/www/stairs-new/frontend/dist`
2. Verify `Require all granted` in Directory block
3. Check SELinux context (if using): `sudo restorecon -R /var/www/stairs-new`

## Backend Preview Endpoint

The backend endpoint `/api/events/preview/:uniqueId` must be accessible and working. Test it:
```bash
curl https://portal.stairs.org.in/api/events/preview/EVT-0051-OT-DL-271225
```

Should return HTML with meta tags.

---

**Files:**
- `.htaccess` - Simple solution (copy to dist folder)
- `apache-event-preview.conf` - Complete virtual host configuration
- `APACHE_SETUP_INSTRUCTIONS.md` - This file

