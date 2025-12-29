# Diagnostic: Device Inconsistency Issues

## Problem
Public event page (`/event/:uniqueId`) displays correctly on your devices but not on others.

## Possible Causes & Solutions

### 1. **Browser Cache / CDN Cache** ⚠️ MOST LIKELY
**Issue**: Old build artifacts are cached on some devices/CDN edge locations but not others.

**Diagnosis**:
```bash
# Check build timestamp/hash in deployed files
curl -I https://portal.stairs.org.in/event/EVT-XXXXX | grep -i "cache\|etag\|last-modified"

# Check if static assets have versioning
# Look for: index-D5-cdvuy.js vs index-ABC123.js
```

**Solutions**:
- **Clear CDN Cache**: Clear Cloudflare cache (if using Cloudflare)
- **Add Cache-Busting**: Ensure Vite build outputs unique hashes (already configured)
- **Hard Refresh**: Users should do Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

**Fix**: Force cache invalidation:
```bash
# On server, update build timestamp
cd /root/stairs-new/frontend
rm -rf dist
npm run build
# Deploy with new timestamp
```

---

### 2. **Environment Variable Substitution Failure** ⚠️ LIKELY
**Issue**: `VITE_GOOGLE_MAPS_API_KEY` not properly embedded in production build, causing different behavior.

**Symptoms**:
- Some devices show errors, others don't
- API calls work on some browsers but fail on others
- Console shows `undefined` or `${L}...` for API key

**Diagnosis**:
```bash
# On server
cd /root/stairs-new/frontend
grep -r "VITE_GOOGLE_MAPS_API_KEY" dist/ | head -5
# Should show actual key, NOT variable name

# Check .env.production exists
cat .env.production | grep VITE_GOOGLE_MAPS_API_KEY
```

**Solutions**:
1. **Verify `.env.production` exists**:
```bash
cd /root/stairs-new/frontend
echo "VITE_GOOGLE_MAPS_API_KEY=YOUR_BROWSER_KEY_HERE" > .env.production
```

2. **Clean rebuild**:
```bash
rm -rf dist node_modules/.vite
npm run build
```

3. **Verify substitution**:
```bash
grep -o "AIzaSy[^\"']*" dist/assets/*.js | head -1
# Should show your API key
```

---

### 3. **Service Worker / Browser Cache**
**Issue**: Progressive Web App (PWA) service worker or aggressive browser caching.

**Diagnosis**:
- Open DevTools → Application → Service Workers
- Check if service worker is registered
- Look for "Update on reload" option

**Solutions**:
- Unregister service workers
- Clear browser cache completely
- Disable "Cache" in DevTools Network tab when testing

---

### 4. **API Endpoint CORS / Network Issues**
**Issue**: Different networks (mobile data vs WiFi) hitting different API endpoints or CORS blocking.

**Diagnosis**:
```bash
# Test API from different locations
curl -H "Origin: https://portal.stairs.org.in" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://stairs-api.astroraag.com/api/events/EVT-XXXXX
```

**Solutions**:
- Verify CORS headers on backend:
```javascript
// backend/src/index.js
const defaultAllowedOrigins = [
  'https://portal.stairs.org.in',
  'https://www.portal.stairs.org.in'
];
```

---

### 5. **Browser Compatibility Issues**
**Issue**: Different browsers (Chrome vs Safari vs Firefox) handle JavaScript/React differently.

**Diagnosis**:
- Test on multiple browsers on same device
- Check browser console for errors
- Verify all polyfills are included

**Solutions**:
- Add browser detection and fallbacks
- Ensure Vite targets modern browsers correctly
- Check `package.json` for compatibility requirements

---

### 6. **React Hydration Errors**
**Issue**: Server-rendered HTML doesn't match client-rendered React (if SSR is enabled).

**Diagnosis**:
- Check browser console for "hydration" warnings
- Compare HTML source vs rendered DOM

**Solutions**:
- This is a SPA, so hydration shouldn't be an issue
- If using SSR, ensure consistent rendering

---

### 7. **Different Build Versions Deployed**
**Issue**: Multiple versions of the app exist, and different devices are accessing different versions.

**Diagnosis**:
```bash
# Check file hashes in dist/
ls -la dist/assets/ | grep index
# Compare hashes across deployments
```

**Solutions**:
- Ensure only one version is deployed
- Clear old deployments
- Use versioned static assets (Vite does this by default)

---

### 8. **Missing Assets / 404 Errors**
**Issue**: Some assets (images, fonts, CSS) fail to load on certain networks/devices.

**Diagnosis**:
- Check Network tab in DevTools
- Look for 404 errors
- Verify all assets are deployed

**Solutions**:
- Ensure all assets are in `dist/` folder
- Check `.htaccess` or server config for proper asset serving
- Verify base path in `vite.config.js` is correct

---

## Quick Fix Script

Create and run this on your server:

```bash
#!/bin/bash
# fix-device-inconsistency.sh

echo "🔧 Fixing Device Inconsistency Issues..."

cd /root/stairs-new/frontend

# 1. Ensure .env.production exists
if [ ! -f .env.production ]; then
    echo "⚠️ Creating .env.production from .env..."
    cp .env .env.production
fi

# 2. Clean everything
echo "🧹 Cleaning build artifacts..."
rm -rf dist
rm -rf node_modules/.vite

# 3. Verify environment variable
echo "🔍 Checking VITE_GOOGLE_MAPS_API_KEY..."
if ! grep -q "VITE_GOOGLE_MAPS_API_KEY" .env.production; then
    echo "❌ VITE_GOOGLE_MAPS_API_KEY not found in .env.production"
    echo "Please add it manually"
    exit 1
fi

# 4. Rebuild
echo "🏗️ Building frontend..."
npm run build

# 5. Verify build
echo "✅ Verifying build..."
if [ ! -f dist/index.html ]; then
    echo "❌ Build failed - dist/index.html not found"
    exit 1
fi

# 6. Check API key substitution
echo "🔑 Checking API key substitution..."
if grep -r "\${L}" dist/ 2>/dev/null; then
    echo "⚠️ WARNING: Variable substitution may have failed"
    echo "Found \${L} in built files"
else
    echo "✅ No variable substitution issues found"
fi

# 7. Generate cache-busting timestamp
TIMESTAMP=$(date +%s)
echo "📅 Build timestamp: $TIMESTAMP"

echo ""
echo "✅ Build complete!"
echo "📦 Next steps:"
echo "1. Deploy dist/ folder to web server"
echo "2. Clear CDN cache (if using Cloudflare)"
echo "3. Test on multiple devices/browsers"
```

---

## Testing Checklist

After deploying, test on:

- [ ] **Different Browsers**:
  - Chrome (desktop)
  - Safari (desktop)
  - Firefox (desktop)
  - Chrome (mobile)
  - Safari (iOS)

- [ ] **Different Networks**:
  - Same WiFi
  - Different WiFi
  - Mobile data (4G/5G)

- [ ] **Different Devices**:
  - Desktop
  - Tablet
  - Mobile phone

- [ ] **Incognito/Private Mode**:
  - Test in fresh browser session
  - No cache, no cookies

- [ ] **Different Locations**:
  - If possible, test from different IP addresses

---

## Most Common Fix

**90% of the time, it's cache-related:**

1. **Clear CDN Cache** (Cloudflare or your CDN)
2. **Force rebuild** with clean cache:
   ```bash
   cd /root/stairs-new/frontend
   rm -rf dist node_modules/.vite
   npm run build
   ```
3. **Deploy fresh build**
4. **Test in incognito mode** (bypasses browser cache)

---

## If Issue Persists

1. **Collect diagnostics**:
   - Browser console errors
   - Network tab failures
   - Device/browser info
   - Network type (WiFi/mobile)

2. **Compare working vs non-working**:
   - What's different?
   - Browser version?
   - Network?
   - Location?

3. **Check server logs**:
   - Backend API errors
   - Static file serving errors
   - 404s for assets

