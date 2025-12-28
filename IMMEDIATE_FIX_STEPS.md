# Immediate Fix Steps for Event Link Previews

## Problem
The `/api` endpoint is returning React app HTML instead of proxying to the Node.js backend server.

## Root Cause
Apache is not configured to proxy `/api` requests to your backend Node.js server (running on port 5000).

## Solution Options

### Option 1: Use .htaccess with Proxy (Quick Fix)

**IF your hosting provider allows ProxyPass in .htaccess**, use the `.htaccess.PROXY_VERSION` file:

1. **Backup current .htaccess:**
   ```bash
   cp .htaccess .htaccess.backup
   ```

2. **Replace with proxy version:**
   ```bash
   cp .htaccess.PROXY_VERSION .htaccess
   ```

3. **Enable required Apache modules** (requires server access):
   ```bash
   sudo a2enmod rewrite
   sudo a2enmod proxy
   sudo a2enmod proxy_http
   sudo systemctl restart apache2
   ```

4. **Test:**
   ```bash
   curl https://portal.stairs.org.in/api/events/preview/EVT-0051-OT-DL-271225
   ```
   Should return HTML with meta tags.

**Note:** Many shared hosting providers **don't allow** ProxyPass in .htaccess for security reasons. If this doesn't work, use Option 2.

---

### Option 2: Configure Apache Virtual Host (Recommended)

This requires access to your Apache configuration files:

1. **Find your virtual host config file:**
   ```bash
   # Usually one of these:
   /etc/apache2/sites-available/portal.stairs.org.in.conf
   /etc/apache2/sites-available/000-default.conf
   /etc/httpd/conf.d/portal.stairs.org.in.conf  # CentOS/RHEL
   ```

2. **Add this BEFORE the DocumentRoot section:**
   ```apache
   <VirtualHost *:443>
       ServerName portal.stairs.org.in
       
       # ... SSL configuration ...
       
       # PROXY API REQUESTS TO BACKEND (MUST BE BEFORE DocumentRoot)
       ProxyPreserveHost On
       ProxyRequests Off
       
       <Location /api>
           ProxyPass http://localhost:5000/api
           ProxyPassReverse http://localhost:5000/api
           ProxyPreserveHost On
           RequestHeader set X-Forwarded-Proto "https"
           RequestHeader set X-Real-IP %{REMOTE_ADDR}s
       </Location>
       
       # Document root for frontend
       DocumentRoot /var/www/stairs-new/frontend/dist
       
       # ... rest of config ...
   </VirtualHost>
   ```

3. **Enable modules and restart:**
   ```bash
   sudo a2enmod proxy
   sudo a2enmod proxy_http
   sudo apache2ctl configtest  # Test config
   sudo systemctl restart apache2
   ```

---

### Option 3: Contact Hosting Provider (If No Server Access)

If you're on shared hosting (cPanel, etc.) and can't modify virtual host config:

1. **Check if your hosting provider has a way to configure reverse proxy:**
   - cPanel: Some providers allow this in "Apache Modules" or "Reverse Proxy" settings
   - Look for "ProxyPass" or "Reverse Proxy" in control panel

2. **Contact support and ask:**
   - "How do I configure Apache to proxy `/api` requests to a Node.js backend on port 5000?"
   - Share the `<Location /api>` configuration above

3. **Alternative: Use a subdomain:**
   - Set up `api.portal.stairs.org.in` pointing to your backend
   - Update bot redirect to use: `https://api.portal.stairs.org.in/events/preview/$1`
   - Update frontend API calls to use the subdomain

---

## Verification

After implementing any solution, test:

### 1. Test API Endpoint Directly:
```bash
curl https://portal.stairs.org.in/api/events/preview/EVT-0051-OT-DL-271225
```

**Expected:** HTML with `<meta property="og:title" content="Event Name" />`  
**If wrong:** React app HTML (proxy not working)

### 2. Test Bot Redirect:
```bash
curl -I -H "User-Agent: facebookexternalhit/1.1" \
  https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225
```

**Expected:** `Location: /api/events/preview/EVT-0051-OT-DL-271225`

### 3. Test with Facebook Debugger:
1. Go to: https://developers.facebook.com/tools/debug/
2. Enter: `https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225`
3. Click "Debug"
4. Should show event name and description in preview

---

## Current Status

✅ Bot detection: Working (redirects correctly)  
✅ Backend endpoint: Exists and ready  
❌ Apache proxy: NOT configured (this is the issue)  
❌ Preview HTML: Not being served (because proxy isn't working)

---

## What to Do Right Now

1. **Try Option 1 first** (quick test with .htaccess proxy)
2. **If that fails**, you need **Option 2** (virtual host config)
3. **If you can't access server**, use **Option 3** (contact hosting or use subdomain)

The `.htaccess` file is correct for bot detection. The missing piece is the Apache proxy configuration to forward `/api` requests to your backend.

