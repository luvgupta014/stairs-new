# Nginx Setup for Event Link Previews (Non-Vercel Deployment)

## If You're Using Nginx (Not Vercel)

If you're deploying on a traditional server with Nginx + PM2 (as shown in your docs), use this Nginx configuration instead of Vercel middleware.

## Setup Instructions

### 1. Update Your Nginx Configuration

Edit your Nginx site configuration:
```bash
sudo nano /etc/nginx/sites-available/stairs
# or
sudo nano /etc/nginx/sites-available/portal.stairs.org.in
```

### 2. Add Bot Detection Block

Add this `location` block **BEFORE** your general `location /` block:

```nginx
# Bot detection for event pages - MUST BE FIRST
location ~ ^/event/([^/]+)$ {
    set $uniqueId $1;
    set $is_bot 0;
    
    # Check if user-agent indicates a bot/crawler
    if ($http_user_agent ~* "(bot|crawler|spider|scraper|facebookexternalhit|facebookcatalog|Twitterbot|Twitter|LinkedInBot|LinkedIn|WhatsApp|whatsapp|Slackbot|Slack|TelegramBot|Telegram|SkypeUriPreview|Discordbot|Discord|Googlebot|Google|Bingbot|Bing|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|facebot|ia_archiver|Pinterestbot|Pinterest|redditbot|reddit|Applebot|Line|Kik|Viber|WeChat|Snapchat|TikTok|PostmanRuntime|curl|wget)") {
        set $is_bot 1;
    }
    
    # Redirect bots to preview endpoint
    if ($is_bot = 1) {
        rewrite ^/event/(.+)$ /api/events/preview/$1 permanent;
        break;
    }
    
    # For regular users, serve the React app
    root /var/www/stairs-new/frontend/dist;
    try_files /index.html =404;
}
```

### 3. Test Nginx Configuration

```bash
sudo nginx -t
```

### 4. Reload Nginx

```bash
sudo systemctl reload nginx
```

### 5. Verify It Works

Test with curl:
```bash
curl -I -H "User-Agent: facebookexternalhit/1.1" \
  https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225
```

Should return: `Location: /api/events/preview/EVT-0051-OT-DL-271225`

## Complete Nginx Example

See `nginx-event-preview.conf` for a complete example configuration.

## If You're Using Vercel

If you're actually using Vercel for deployment:
- Keep the `middleware.js` and `vercel.json` as-is
- The Vercel configuration will handle bot routing automatically
- Just ensure `FRONTEND_URL` environment variable is set

## Determine Your Setup

**Check your domain:**
- If `portal.stairs.org.in` is on Vercel → Use Vercel config (middleware.js)
- If it's on a traditional server → Use Nginx config above

