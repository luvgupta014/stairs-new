# Troubleshooting Guide: Event Link Previews Not Working

## Current Issue
Social media platforms (WhatsApp, Facebook, LinkedIn, etc.) are not showing event-specific previews when sharing event links.

## Diagnosis Checklist

### ✅ What's Working:
1. **Bot Detection**: Bots are correctly redirected to `/api/events/preview/...`
2. **Backend Endpoint**: The preview route exists in `backend/src/routes/event.js`
3. **Event Data**: Events are accessible in the database

### ❌ What's NOT Working:
1. **Apache Proxy**: `/api` requests are serving React app HTML instead of proxying to backend
2. **Preview HTML**: Meta tags are not being generated/served

---

## Step 1: Verify Backend is Running

**Check if your Node.js backend is running:**
```bash
# SSH into your server
ssh user@your-server

# Check if backend process is running
ps aux | grep node
# OR
pm2 list  # if using PM2

# Check if backend is responding
curl http://localhost:5000/api/events/preview/EVT-0051-OT-DL-271225
```

**Expected:** HTML with meta tags  
**If error:** Backend is not running or not accessible on port 5000

**Fix:** Start your backend:
```bash
cd /path/to/stairs-new/backend
pm2 start src/index.js --name stairs-backend
# OR
npm start
```

---

## Step 2: Test Direct Backend Access

**Test if backend preview endpoint works:**
```bash
curl http://localhost:5000/api/events/preview/EVT-0051-OT-DL-271225
```

**Expected:** 
```html
<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="Event Name" />
  ...
</head>
```

**If 404/Error:** Backend route might not be registered correctly

**Fix:** Check `backend/src/index.js` has:
```javascript
app.use('/api/events', eventRoutes);
```

---

## Step 3: Check Apache Proxy Configuration

**Test if Apache is proxying `/api` requests:**
```bash
curl https://portal.stairs.org.in/api/events/preview/EVT-0051-OT-DL-271225
```

**Expected:** HTML with meta tags (same as Step 2)  
**If React HTML:** Apache is NOT proxying - this is the issue!

---

## Step 4: Enable Apache Proxy (The Fix)

### Option A: Via Virtual Host Config (Best)

**1. Find your Apache config:**
```bash
# Usually:
/etc/apache2/sites-available/portal.stairs.org.in.conf
# OR
/etc/httpd/conf.d/portal.stairs.org.in.conf  # CentOS/RHEL
```

**2. Add BEFORE DocumentRoot:**
```apache
<VirtualHost *:443>
    ServerName portal.stairs.org.in
    
    # ... SSL config ...
    
    # PROXY API TO BACKEND (MUST BE FIRST)
    ProxyPreserveHost On
    ProxyRequests Off
    
    <Location /api>
        ProxyPass http://localhost:5000/api
        ProxyPassReverse http://localhost:5000/api
        ProxyPreserveHost On
        RequestHeader set X-Forwarded-Proto "https"
    </Location>
    
    # THEN DocumentRoot
    DocumentRoot /var/www/stairs-new/frontend/dist
    ...
</VirtualHost>
```

**3. Enable modules and restart:**
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo apache2ctl configtest  # Verify no errors
sudo systemctl restart apache2
```

### Option B: Via .htaccess (If Allowed)

I've updated your `.htaccess` to include proxy rules. Test if it works:

```bash
# Test the endpoint
curl https://portal.stairs.org.in/api/events/preview/EVT-0051-OT-DL-271225
```

**If still React HTML:** Your hosting provider doesn't allow ProxyPass in .htaccess. Use Option A.

---

## Step 5: Verify Fix

**1. Test API endpoint:**
```bash
curl https://portal.stairs.org.in/api/events/preview/EVT-0051-OT-DL-271225 | grep og:title
```

**Should show:** `<meta property="og:title" content="[Event Name]" />`

**2. Test bot redirect:**
```bash
curl -I -H "User-Agent: facebookexternalhit/1.1" \
  https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225
```

**Should show:** `Location: /api/events/preview/EVT-0051-OT-DL-271225`

**3. Test with Facebook Debugger:**
- Go to: https://developers.facebook.com/tools/debug/
- Enter: `https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225`
- Click "Debug" then "Scrape Again"
- Should show event name and description

---

## Common Errors

### Error: "ProxyPass not allowed here"
**Cause:** Trying to use ProxyPass in .htaccess but hosting provider restricts it  
**Fix:** Configure proxy in Apache virtual host config (Option A)

### Error: "Connection refused" when testing backend
**Cause:** Backend not running or wrong port  
**Fix:** Check backend is running: `ps aux | grep node`

### Error: Backend works locally but not via Apache
**Cause:** Backend listening on wrong interface (127.0.0.1 vs 0.0.0.0)  
**Fix:** Ensure backend listens on all interfaces: `app.listen(5000, '0.0.0.0')`

### Error: Still getting React HTML
**Cause:** Apache config order is wrong (DocumentRoot before ProxyPass)  
**Fix:** Ensure `<Location /api>` comes BEFORE `<Directory>`/DocumentRoot

---

## Still Not Working?

**Check Apache error logs:**
```bash
sudo tail -f /var/log/apache2/error.log
# OR
sudo tail -f /var/log/httpd/error_log  # CentOS/RHEL
```

**Look for:**
- "ProxyPass" errors
- "mod_proxy" module not found
- Connection refused errors

**Share the error message and I can help debug further!**

