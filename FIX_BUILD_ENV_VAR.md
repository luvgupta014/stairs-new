# 🔧 Fix: Frontend Build Not Using Correct Environment Variable

## Problem

The built files have a different key than what's in `.env`. This happens when:
- Vite cache hasn't been cleared
- Environment variable format is incorrect
- Build process isn't reading `.env` correctly

---

## ✅ Solution: Clean Rebuild

### Quick Fix:

```bash
cd /root/stairs-new
bash fix-frontend-env-build.sh
```

This script will:
1. ✅ Verify .env file format
2. ✅ Clean .env format (remove quotes/spaces)
3. ✅ Clean build directory and Vite cache
4. ✅ Rebuild frontend
5. ✅ Verify key in built files

---

### Manual Fix:

```bash
cd /root/stairs-new/frontend

# 1. Verify .env has correct key (no quotes, no spaces)
cat .env | grep VITE_GOOGLE_MAPS_API_KEY
# Should be: VITE_GOOGLE_MAPS_API_KEY=AIzaSy...

# 2. Clean build directory and cache
rm -rf dist node_modules/.vite

# 3. Rebuild
npm run build

# 4. Verify key in built files
grep -r "maps.googleapis.com" dist/ | grep -o "key=[^&]*" | head -1
```

---

## 🔍 Verify .env Format

The `.env` file should have:

```bash
VITE_GOOGLE_MAPS_API_KEY=AIzaSyYourKeyHere
```

**NOT:**
- ❌ `VITE_GOOGLE_MAPS_API_KEY="AIzaSy..."`
- ❌ `VITE_GOOGLE_MAPS_API_KEY='AIzaSy...'`
- ❌ `VITE_GOOGLE_MAPS_API_KEY = AIzaSy...` (spaces)

---

## 📋 After Rebuild

1. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or clear cache completely
   - Or test in incognito window

2. **Test:**
   - Visit: https://portal.stairs.org.in/admin/event/create
   - Check browser console (F12)
   - Should NOT see authorization errors

---

**Run `fix-frontend-env-build.sh` to fix the build issue!**

