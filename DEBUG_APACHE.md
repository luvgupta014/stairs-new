# Debugging Apache .htaccess for Event Link Previews

## Quick Test Commands

### 1. Test Bot Detection (should redirect)
```bash
curl -I -H "User-Agent: facebookexternalhit/1.1" \
  https://yourdomain.com/subdirectory/event/EVT-XXXX-XX-XX-XXXXXX
```

**Expected:** `Location: /subdirectory/api/events/preview/EVT-XXXX-XX-XX-XXXXXX` or `/api/events/preview/EVT-XXXX-XX-XX-XXXXXX`

### 2. Test Regular User (should serve React app)
```bash
curl -I -H "User-Agent: Mozilla/5.0" \
  https://yourdomain.com/subdirectory/event/EVT-XXXX-XX-XX-XXXXXX
```

**Expected:** `200 OK` with React app HTML

### 3. Test Preview Endpoint Directly
```bash
curl https://yourdomain.com/subdirectory/api/events/preview/EVT-XXXX-XX-XX-XXXXXX
# OR if API is at root:
curl https://yourdomain.com/api/events/preview/EVT-XXXX-XX-XX-XXXXXX
```

**Expected:** HTML with `<meta property="og:title" content="Event Name" />`

## Common Issues

### Issue 1: API Path Wrong

**Symptom:** Redirect returns 404 or goes to wrong location

**Solution:** Check where your API is actually mounted:
- If API is at root: Use `/api/events/preview/$1`
- If API is under subdirectory: Use `/subdirectory/api/events/preview/$1`

**Check in your backend config:**
```javascript
// backend/src/index.js
app.use('/api/events', eventRoutes);
```

**Test which works:**
```bash
# Try root API
curl https://yourdomain.com/api/events/preview/EVT-XXXX

# Try subdirectory API
curl https://yourdomain.com/subdirectory/api/events/preview/EVT-XXXX
```

### Issue 2: .htaccess Not Processing

**Symptom:** No redirect happens, bots get React app

**Check:**
1. Is `.htaccess` in the correct directory? (usually `frontend/dist/` or document root)
2. Is `AllowOverride All` enabled in Apache config?
3. Is `mod_rewrite` enabled?
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```
4. Check Apache error logs:
   ```bash
   sudo tail -f /var/log/apache2/error.log
   ```

### Issue 3: Bot User-Agent Not Detected

**Symptom:** Bots still get React app instead of preview

**Solution:** Add more bot patterns. Test with:
```bash
curl -I -H "User-Agent: WhatsApp/2.0" \
  https://yourdomain.com/subdirectory/event/EVT-XXXX
```

**Add to regex if needed:**
```apache
RewriteCond %{HTTP_USER_AGENT} (bot|crawler|...|YourMissingBotPattern) [NC]
```

### Issue 4: CORS or Backend Not Accessible

**Symptom:** Preview endpoint returns error or CORS error

**Check:**
1. Is backend running and accessible?
2. Check backend logs for preview requests
3. Verify `FRONTEND_URL` environment variable is set correctly

### Issue 5: RewriteBase Confusion

**Symptom:** Redirects go to wrong paths

**Understanding RewriteBase:**
- `RewriteBase /subdirectory` means all relative paths are relative to `/subdirectory`
- Absolute paths (starting with `/`) ignore RewriteBase
- The redirect path should be absolute: `/subdirectory/api/...` or `/api/...`

## Step-by-Step Debugging

### Step 1: Verify .htaccess Location
```bash
# Find your document root
grep DocumentRoot /etc/apache2/sites-available/*.conf

# Check if .htaccess exists there
ls -la /path/to/document/root/.htaccess

# Check permissions
chmod 644 /path/to/document/root/.htaccess
```

### Step 2: Test Rewrite Rules
Add debug logging to .htaccess (temporary):
```apache
RewriteLog /var/log/apache2/rewrite.log
RewriteLogLevel 3
```

**Restart Apache and test:**
```bash
sudo systemctl restart apache2
curl -I -H "User-Agent: facebookexternalhit/1.1" \
  https://yourdomain.com/subdirectory/event/EVT-XXXX

# Check logs
sudo tail -f /var/log/apache2/rewrite.log
```

**Remove debug logging after testing!**

### Step 3: Verify Backend Preview Endpoint
```bash
# Test directly
curl -v https://yourdomain.com/api/events/preview/EVT-XXXX

# Check response headers
# Should see: Content-Type: text/html
# Should see: meta tags in HTML body
```

### Step 4: Test with Real Bot
Use Facebook's debugger:
1. Go to: https://developers.facebook.com/tools/debug/
2. Enter: `https://yourdomain.com/subdirectory/event/EVT-XXXX`
3. Click "Debug"
4. Check "Scrape Again" to force fresh fetch

## Alternative: Use Proxy Instead of Redirect

If redirects aren't working, you can proxy directly (requires `mod_proxy`):

```apache
# Enable modules
sudo a2enmod proxy
sudo a2enmod proxy_http

# In .htaccess (if allowed) or virtual host config:
RewriteCond %{HTTP_USER_AGENT} (bot|crawler|...) [NC]
RewriteRule ^event/([^/]+)$ http://localhost:5000/api/events/preview/$1 [P,L]
```

**Note:** ProxyPass in .htaccess may not work on all servers. Better to use in virtual host config.

## Still Not Working?

1. **Check Apache version:**
   ```bash
   apache2 -v
   ```

2. **Verify all modules are loaded:**
   ```bash
   apache2ctl -M | grep -E "rewrite|proxy"
   ```

3. **Check for conflicting .htaccess files:**
   ```bash
   find /path/to/document/root -name ".htaccess" -type f
   ```

4. **Test with minimal .htaccess:**
   ```apache
   RewriteEngine On
   RewriteBase /subdirectory
   RewriteCond %{HTTP_USER_AGENT} facebookexternalhit [NC]
   RewriteRule ^event/(.+)$ /api/events/preview/$1 [R=307,L]
   ```

5. **Contact hosting support** if using shared hosting - some hosts disable .htaccess rewrites

