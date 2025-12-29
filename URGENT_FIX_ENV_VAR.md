# 🚨 URGENT: Fix Environment Variable Substitution

## Problem

The build shows `${L}...` instead of the actual API key, meaning Vite is not substituting the environment variable during build.

---

## ✅ Solution: Create .env.production File

Vite uses `.env.production` for production builds. If it doesn't exist, variables may not be substituted.

### Quick Fix:

```bash
cd /root/stairs-new
bash fix-vite-env-substitution.sh
```

This will:
1. ✅ Create `.env.production` file with the browser key
2. ✅ Update `.env` file
3. ✅ Clean build directory
4. ✅ Rebuild with explicit environment variable
5. ✅ Verify key in built files

---

### Manual Fix:

```bash
cd /root/stairs-new/frontend

# 1. Get the browser key from .env
BROWSER_KEY=$(grep "^VITE_GOOGLE_MAPS_API_KEY=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')

# 2. Create .env.production file
cat > .env.production << EOF
VITE_GOOGLE_MAPS_API_KEY=$BROWSER_KEY
EOF

# 3. Clean and rebuild
rm -rf dist node_modules/.vite
VITE_GOOGLE_MAPS_API_KEY="$BROWSER_KEY" npm run build
```

---

## 🔍 Why This Happens

Vite reads environment variables from:
1. `.env` - for all modes
2. `.env.production` - for production builds (overrides .env)
3. `.env.local` - local overrides (gitignored)

If `.env.production` doesn't exist, Vite might not properly substitute variables in production builds.

---

## ✅ Verification

After rebuilding:

```bash
# Check built files
grep -r "maps.googleapis.com" dist/ | grep "key=" | head -1

# Should show the actual key, NOT ${VITE_GOOGLE_MAPS_API_KEY}
```

---

## 📋 Also Check Google Cloud Console

Even after fixing the build, make sure:

1. **Browser key exists** and is different from server key
2. **HTTP referer restrictions** are set (NOT IP)
3. **Checkboxes are CHECKED** for referers:
   - `https://portal.stairs.org.in/*`
   - `https://*.portal.stairs.org.in/*`
   - `https://www.portal.stairs.org.in/*`

---

**Run `fix-vite-env-substitution.sh` to fix the build issue!**

