# Apache API Proxy Configuration Fix

## Problem Identified

The bot redirect is working correctly - bots are being redirected to `/api/events/preview/EVT-0051-OT-DL-271225`. However, the preview endpoint is returning the React app HTML instead of the backend preview HTML with meta tags.

This means **Apache is not proxying `/api` requests to the backend** - instead, it's serving the React app.

## Solution

You need to configure Apache to proxy `/api` requests to your backend Node.js server **BEFORE** the React app routing rules.

### Option 1: Virtual Host Configuration (Recommended)

Add this to your Apache virtual host configuration (NOT in .htaccess):

```apache
<VirtualHost *:443>
    ServerName portal.stairs.org.in
    
    # ... SSL configuration ...
    
    # Proxy API requests to backend (MUST BE BEFORE DocumentRoot/Directory config)
    ProxyPreserveHost On
    ProxyRequests Off
    
    <Location /api>
        ProxyPass http://localhost:5000/api
        ProxyPassReverse http://localhost:5000/api
        ProxyPreserveHost On
        
        # Headers for proxy
        RequestHeader set X-Forwarded-Proto "https"
        RequestHeader set X-Real-IP %{REMOTE_ADDR}s
    </Location>
    
    # Document root for frontend
    DocumentRoot /var/www/stairs-new/frontend/dist
    
    <Directory /var/www/stairs-new/frontend/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Enable rewrite engine
        RewriteEngine On
        
        # Bot detection for event pages - MUST BE BEFORE React routing
        RewriteCond %{HTTP_USER_AGENT} (bot|crawler|spider|scraper|facebookexternalhit|facebookcatalog|Twitterbot|Twitter|LinkedInBot|LinkedIn|WhatsApp|whatsapp|Slackbot|Slack|TelegramBot|Telegram|SkypeUriPreview|Discordbot|Discord|Googlebot|Google|Bingbot|Bing|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|facebot|ia_archiver|Pinterestbot|Pinterest|redditbot|reddit|Applebot|Line|Kik|Viber|WeChat|Snapchat|TikTok|PostmanRuntime|curl|wget) [NC]
        RewriteRule ^event/([^/]+)$ /api/events/preview/$1 [R=307,L]
        
        # Standard React SPA routing (for non-bots)
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteCond %{REQUEST_FILENAME} !-l
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

**Important:** 
- The `<Location /api>` block must come **BEFORE** the `<Directory>` block
- Enable modules: `sudo a2enmod proxy proxy_http`
- Update `localhost:5000` to match your backend port

### Option 2: Using .htaccess (If ProxyAllowed)

Some shared hosting providers don't allow ProxyPass in .htaccess. If yours does, add this **at the top** of your .htaccess:

```apache
# Proxy API requests to backend
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ http://localhost:5000/api/$1 [P,L]

# ... rest of your rules ...
```

**Note:** This requires `mod_proxy` and may not work on shared hosting.

### Option 3: Alternative - Rewrite API to Backend Port

If proxy modules aren't available, you might need to configure Apache differently or use Nginx as a reverse proxy.

## Verification Steps

1. **Enable required modules:**
   ```bash
   sudo a2enmod proxy
   sudo a2enmod proxy_http
   sudo systemctl restart apache2
   ```

2. **Test API proxy:**
   ```bash
   curl https://portal.stairs.org.in/api/events/preview/EVT-0051-OT-DL-271225
   ```
   
   **Expected:** HTML with `<meta property="og:title" content="Event Name" />`
   
   **If you get React app HTML:** Proxy is not working - check Apache config

3. **Test bot redirect:**
   ```bash
   curl -I -H "User-Agent: facebookexternalhit/1.1" \
     https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225
   ```
   
   **Expected:** `Location: /api/events/preview/EVT-0051-OT-DL-271225`

4. **Check backend is running:**
   ```bash
   curl http://localhost:5000/api/events/preview/EVT-0051-OT-DL-271225
   ```
   
   **Expected:** HTML with meta tags

## Current Status

✅ Bot detection working - redirects bots to `/api/events/preview/...`  
❌ API proxy not configured - `/api` requests serve React app instead of backend  
✅ Backend preview endpoint exists and should work once proxy is configured

## Next Steps

1. Add the `<Location /api>` proxy configuration to your Apache virtual host
2. Enable `mod_proxy` and `mod_proxy_http`
3. Restart Apache
4. Test the preview endpoint
5. Test with Facebook/LinkedIn debugger tools

