# Final Fix for Sports Import Issue

## ✅ What I've Done

1. ✅ **Updated `vite.config.js`** - Added path aliases:
   - `@constants` → `./src/constants`
   - `@` → `./src`

2. ✅ **Updated all 6 imports** to use `@constants/sports` instead of relative paths

## 🚀 Try Building Now

```bash
cd /root/stairs-new/frontend
rm -rf node_modules/.vite  # Clear Vite cache
npm run build
```

---

## 🔄 If Still Fails - Use Explicit .js Extension

Run this script on your server:

```bash
cd /root/stairs-new
bash fix-imports-explicit-ext.sh
cd frontend
npm run build
```

Or manually update imports:

```bash
cd /root/stairs-new/frontend/src

# Add .js extension to all imports
sed -i "s|from '@constants/sports'|from '@constants/sports.js'|g" pages/ClubRegister.jsx
sed -i "s|from '@constants/sports'|from '@constants/sports.js'|g" pages/InstituteRegister.jsx
sed -i "s|from '@constants/sports'|from '@constants/sports.js'|g" pages/events/EventCreate.jsx
sed -i "s|from '@constants/sports'|from '@constants/sports.js'|g" components/EventForm.jsx
sed -i "s|from '@constants/sports'|from '@constants/sports.js'|g" pages/StudentRegister.jsx
sed -i "s|from '@constants/sports'|from '@constants/sports.js'|g" pages/StudentAdd.jsx
```

---

## 🔍 Verify File Exists (Double Check)

```bash
# Check file exists
ls -la /root/stairs-new/frontend/src/constants/sports.js

# Check file has content
head -10 /root/stairs-new/frontend/src/constants/sports.js

# Check exports exist
grep -n "export.*SORTED_SPORTS" /root/stairs-new/frontend/src/constants/sports.js
```

---

## 📋 Updated Files

- ✅ `frontend/vite.config.js` - Added path aliases
- ✅ `frontend/src/pages/ClubRegister.jsx` - Updated import
- ✅ `frontend/src/pages/InstituteRegister.jsx` - Updated import
- ✅ `frontend/src/pages/events/EventCreate.jsx` - Updated import
- ✅ `frontend/src/components/EventForm.jsx` - Updated import
- ✅ `frontend/src/pages/StudentRegister.jsx` - Updated import
- ✅ `frontend/src/pages/StudentAdd.jsx` - Updated import

---

## 🎯 The Path Alias Approach

All imports now use:
```javascript
import { SORTED_SPORTS } from '@constants/sports';
```

Instead of relative paths. This is more reliable and maintainable.

**Try building first, then use the backup script if needed!**

