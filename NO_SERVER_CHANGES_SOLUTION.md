# Solution Without Server Configuration Changes

## Overview
This solution uses **PHP** (which is already enabled) to handle event preview requests for social media bots. No Apache configuration changes needed!

## How It Works

1. **Bot Detection**: `.htaccess` detects bots and routes them to `event-preview.php`
2. **PHP Handler**: `event-preview.php` fetches event data from your Node.js backend
3. **HTML Generation**: PHP serves HTML with meta tags directly to the bot
4. **No Proxy Needed**: PHP makes internal HTTP request to backend, no Apache proxy required

## Files Created

1. **`event-preview.php`** - PHP script that handles bot requests
2. **Updated `.htaccess`** - Routes bots to PHP handler instead of backend directly

## Setup Steps

### Step 1: Upload Files
1. Upload `event-preview.php` to your website root (same directory as `index.html`)
2. Upload the updated `.htaccess` file

### Step 2: Configure Backend URL (if needed)
If your backend is NOT on `localhost:5000`, edit `event-preview.php`:

```php
// Line 34-37: Update backend URL if needed
$backendUrl = 'http://localhost:5000';
// OR if backend is on different server:
$backendUrl = 'http://your-backend-server:5000';
// OR use environment variable:
// Set in .htaccess or PHP config: SetEnv BACKEND_URL http://localhost:5000
```

### Step 3: Test

**Test bot detection:**
```bash
curl -I -H "User-Agent: facebookexternalhit/1.1" \
  https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225
```

**Test PHP handler directly:**
```bash
curl https://portal.stairs.org.in/event-preview.php?id=EVT-0051-OT-DL-271225
```

**Expected:** HTML with `<meta property="og:title" content="Event Name" />`

### Step 4: Verify with Facebook Debugger
1. Go to: https://developers.facebook.com/tools/debug/
2. Enter: `https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225`
3. Click "Debug" then "Scrape Again"
4. Should show event name and description

## How It Works (Technical)

1. **Bot requests** `/event/EVT-0051-OT-DL-271225`
2. **`.htaccess`** detects bot user-agent and rewrites to `/event-preview.php?id=EVT-0051-OT-DL-271225`
3. **PHP script** makes HTTP request to `http://localhost:5000/api/events/preview/EVT-0051-OT-DL-271225`
4. **Backend** returns HTML with meta tags
5. **PHP** serves that HTML to the bot
6. **Bot** sees event-specific meta tags ✅

## Advantages

✅ **No server config changes** - Works with shared hosting  
✅ **No Apache proxy needed** - PHP handles backend communication  
✅ **Uses existing PHP** - Already enabled in your setup  
✅ **Works immediately** - Just upload files  

## Troubleshooting

### PHP can't connect to backend
**Error:** "Connection refused" or empty response

**Fix:** 
1. Verify backend is running: `curl http://localhost:5000/api/events/preview/EVT-XXXX`
2. Check backend URL in `event-preview.php` (line 34)
3. If backend is on different server, update `$backendUrl`

### Still getting React HTML
**Check:**
1. `.htaccess` file is uploaded and in root directory
2. `mod_rewrite` is enabled (should be for React routing to work)
3. Test: `curl -I -H "User-Agent: facebookexternalhit/1.1" https://yourdomain.com/event/EVT-XXXX`
   - Should redirect to `event-preview.php`, not serve React HTML

### PHP errors
**Enable error display** (temporarily for testing):
```php
// Add to top of event-preview.php
ini_set('display_errors', 1);
error_reporting(E_ALL);
```

**Check PHP error logs:**
```bash
tail -f /var/log/apache2/error.log
```

## Security Notes

- PHP script only serves HTML - no user input is executed
- Event ID is URL-encoded to prevent injection
- Backend request uses internal localhost connection (secure)
- HTML output is properly escaped

## Next Steps

1. Upload both files to your server
2. Test the endpoint
3. Verify with Facebook/LinkedIn debugger tools
4. Share an event link on WhatsApp to test!

If you encounter any issues, check the troubleshooting section above.

