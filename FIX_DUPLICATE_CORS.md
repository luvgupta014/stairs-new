# Fix Duplicate CORS_ORIGINS

## Problem
Your `backend/.env` file has duplicate `CORS_ORIGINS` entries:
```
CORS_ORIGINS=https://portal.stairs.org.in,https://www.portal.stairs.org.in
CORS_ORIGINS=https://portal.stairs.org.in,https://www.portal.stairs.org.in
CORS_ORIGINS=https://portal.stairs.org.in,https://www.portal.stairs.org.in
```

This can cause issues - the backend might only read the first or last one, or get confused.

---

## ✅ Quick Fix

### Option 1: Run the Fix Script (Recommended)

On your backend server:
```bash
cd /root/stairs-new
bash fix-duplicate-cors.sh
```

This will:
- ✅ Backup your `.env` file
- ✅ Remove all duplicate `CORS_ORIGINS` entries
- ✅ Add a single clean entry
- ✅ Show you the result

### Option 2: Manual Fix

```bash
cd /root/stairs-new/backend

# Backup first
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Remove all CORS_ORIGINS lines
sed -i '/^CORS_ORIGINS=/d' .env
sed -i '/# CORS Origins/d' .env

# Add single clean entry
echo "" >> .env
echo "# CORS Origins" >> .env
echo "CORS_ORIGINS=https://portal.stairs.org.in,https://www.portal.stairs.org.in" >> .env
```

---

## ✅ Verify

```bash
# Check .env file
grep "CORS_ORIGINS" /root/stairs-new/backend/.env

# Should show only ONE line:
# CORS_ORIGINS=https://portal.stairs.org.in,https://www.portal.stairs.org.in
```

---

## 🚀 Restart Backend

After fixing, restart your backend:

```bash
pm2 restart all
# or
systemctl restart your-backend-service
```

---

## ✅ Test

After restart, test CORS:

```bash
curl -I -H "Origin: https://portal.stairs.org.in" \
  https://stairs-api.astroraag.com/api/maps/places/autocomplete

# Should see:
# Access-Control-Allow-Origin: https://portal.stairs.org.in
```

---

## 📝 What Happened?

The fix script we provided earlier (`QUICK_FIX_CORS_MAPS.sh`) was run multiple times, and each time it appended a new `CORS_ORIGINS` line without removing the old one. This script fixes that by:
1. Removing all existing `CORS_ORIGINS` lines
2. Adding a single clean entry
3. Creating a backup before making changes

