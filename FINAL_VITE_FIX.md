# 🔧 Final Fix: Vite Environment Variable Substitution

## Problem

Vite is still showing `${L}...` instead of the actual API key, meaning the environment variable isn't being substituted during build.

## ✅ Solution: Explicit Define in Vite Config

I've updated `vite.config.js` to explicitly define the environment variable using Vite's `define` option. This forces Vite to substitute the variable at build time.

---

## 🚀 Rebuild with Updated Config

```bash
cd /root/stairs-new
bash fix-vite-define.sh
```

This will:
1. ✅ Ensure `.env.production` exists
2. ✅ Clean build directory
3. ✅ Rebuild with updated Vite config
4. ✅ Verify key in built files

---

## 📋 What Changed

**Updated `vite.config.js`:**
- Added `loadEnv` to load environment variables
- Added `define` option to explicitly substitute `VITE_GOOGLE_MAPS_API_KEY`
- Reads from `.env.production` for production builds

---

## ✅ After Rebuild

1. **Verify key in built files:**
   ```bash
   grep -r "maps.googleapis.com" /root/stairs-new/frontend/dist/ | grep "key=" | head -1
   ```
   Should show the actual key, NOT `${L}...`

2. **Clear browser cache** (hard refresh: `Ctrl+Shift+R`)

3. **Test:** https://portal.stairs.org.in/admin/event/create

4. **Also verify in Google Cloud Console:**
   - Browser key has HTTP referer restrictions
   - Checkboxes are CHECKED for referers

---

**Run `fix-vite-define.sh` to rebuild with the fixed config!**

