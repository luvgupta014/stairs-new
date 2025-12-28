# Production-Ready Event Link Preview Architecture

## ✅ Correct Architecture (Following Best Practices)

**Embeds must be handled by Express, not React.**

### Why?
- Discord / Twitter / WhatsApp **do NOT run JavaScript**
- They only read **raw HTML meta tags**
- React is for users, Express is for bots

### Flow:
```
Social bot → Express → OG HTML (meta tags)
Browser user → Express → Redirect → React app
```

---

## 🎯 Current Implementation

### 1. URL Structure
```
https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225
```

Each event has a unique ID that maps to different embed content.

---

### 2. Express Route (Backend)
**Location:** `backend/src/routes/event.js`

```javascript
router.get('/preview/:uniqueId', async (req, res) => {
  // Fetch event data
  const event = await eventService.getPublicEventByUniqueId(uniqueId);
  
  // Generate HTML with OG tags
  const html = `<!DOCTYPE html>
<html>
<head>
  <!-- Open Graph tags for bots -->
  <meta property="og:title" content="${event.name}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${logoUrl}" />
  
  <!-- Redirect users to React app -->
  <meta http-equiv="refresh" content="0; url=${eventUrl}" />
</head>
<body>...</body>
</html>`;
  
  res.send(html);
});
```

**Why this works:**
- ✅ Bots read OG tags (no JS needed)
- ✅ Users get redirected to React app
- ✅ Clean separation of concerns

---

### 3. PHP Handler (No Server Config Needed)
**Location:** `event-preview.php`

Since we can't modify Apache proxy config, PHP acts as a bridge:

```
Bot → Apache → PHP → Express Backend → HTML with OG tags
```

**Flow:**
1. Bot requests `/event/EVT-XXXX`
2. `.htaccess` routes to `event-preview.php`
3. PHP fetches from `http://localhost:5000/api/events/preview/EVT-XXXX`
4. PHP serves HTML to bot
5. Bot sees meta tags ✅

---

### 4. React App (User Experience)
**Location:** `frontend/src/pages/events/PublicEventDetails.jsx`

React handles the actual UI when users click the link:
- Beautiful event details page
- Registration functionality
- All interactive features

---

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Express Route | ✅ Done | `/api/events/preview/:uniqueId` |
| OG Tags | ✅ Done | Full Open Graph + Twitter Cards |
| User Redirect | ✅ Done | Meta refresh + JS fallback |
| PHP Handler | ✅ Done | Bridge for Apache without proxy |
| Bot Detection | ✅ Done | `.htaccess` routes bots correctly |

---

## 🚀 Enhancements (Future)

### Dynamic OG Images (Like YouTube Thumbnails)

**Install:**
```bash
npm install canvas
```

**Add route:**
```javascript
app.get('/og/event/:uniqueId.png', async (req, res) => {
  const event = await getEvent(req.params.uniqueId);
  
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1200, 630);
  
  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 60px Inter';
  ctx.fillText(event.name, 60, 200);
  
  // Description
  ctx.font = '32px Inter';
  ctx.fillText(event.description, 60, 280);
  
  res.setHeader('Content-Type', 'image/png');
  res.send(canvas.toBuffer());
});
```

Then update OG image URL in preview route to use this dynamic image.

---

### Caching Best Practices

**Current:**
- Cache-Control: `public, s-maxage=3600, stale-while-revalidate=86400`
- Events are unique (uniqueId), so no reuse issues

**Future enhancements:**
- Add versioning for updated events: `/event/EVT-XXXX?v=2`
- Use Cloudflare caching if needed
- Cache bust on event updates

---

### SEO Safety

**Current:**
- `X-Robots-Tag: noindex` on preview pages (prevents duplicate indexing)
- Canonical URLs point to actual event page
- Real event pages are indexable

**Why this works:**
- Preview pages are only for embeds (not search engines)
- Real pages in React are SEO-friendly
- No duplicate content issues

---

## 🎨 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│              Social Media Bot                       │
│  (WhatsApp/Facebook/Twitter/Discord)                │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ GET /event/EVT-XXXX
                   ▼
┌─────────────────────────────────────────────────────┐
│                 Apache Server                       │
│  .htaccess detects bot user-agent                   │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Route to event-preview.php
                   ▼
┌─────────────────────────────────────────────────────┐
│              PHP Handler                            │
│  event-preview.php                                  │
│  - Fetches from Express backend                     │
│  - Returns HTML with OG tags                        │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ HTML with <meta> tags
                   ▼
┌─────────────────────────────────────────────────────┐
│              Social Bot Reads                       │
│  - og:title                                         │
│  - og:description                                   │
│  - og:image                                         │
│  - Creates rich preview ✅                          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              Regular User Browser                   │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ GET /event/EVT-XXXX
                   ▼
┌─────────────────────────────────────────────────────┐
│                 Apache Server                       │
│  .htaccess allows through (not a bot)               │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Serve React app
                   ▼
┌─────────────────────────────────────────────────────┐
│              React Application                      │
│  PublicEventDetails.jsx                             │
│  - Beautiful UI                                     │
│  - Interactive features                             │
│  - Registration functionality                       │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Best Practices Followed

| Practice | Implementation | Status |
|----------|---------------|--------|
| Express for bots | `/api/events/preview/:uniqueId` | ✅ |
| React for users | `PublicEventDetails.jsx` | ✅ |
| No JS for bots | Pure HTML meta tags | ✅ |
| User redirects | Meta refresh + JS fallback | ✅ |
| Unique URLs | Event uniqueId | ✅ |
| Proper caching | Cache-Control headers | ✅ |
| SEO safe | noindex on preview, canonical on real page | ✅ |

---

## 🔍 Testing

### Facebook Debugger
https://developers.facebook.com/tools/debug/
- Enter: `https://portal.stairs.org.in/event/EVT-0051-OT-DL-271225`
- Should show event name and description

### Twitter Card Validator
https://cards-dev.twitter.com/validator
- Same URL
- Should show card preview

### WhatsApp
- Send link in WhatsApp
- Should show rich preview

---

## 📝 Summary

**This architecture follows production best practices:**
- ✅ Express handles embeds (bots)
- ✅ React handles UI (users)
- ✅ Clean separation
- ✅ No server config changes needed (PHP bridge)
- ✅ Works immediately

**Ready for production!** 🚀

