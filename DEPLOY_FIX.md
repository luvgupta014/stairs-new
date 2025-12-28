# Quick Fix for Build Error

The file exists but Vite can't resolve it. Two solutions:

## ✅ Solution 1: Path Alias (Recommended - Already Applied)

Updated `vite.config.js` with path aliases. All imports now use `@constants/sports` instead of relative paths.

**If this still fails, try Solution 2.**

---

## ✅ Solution 2: Explicit .js Extension (Backup)

If path aliases don't work, add `.js` extension to all imports:

```bash
# On server, update all files:
cd /root/stairs-new/frontend/src

# Update imports to use .js extension
sed -i "s|from '../../constants/sports'|from '../../constants/sports.js'|g" pages/ClubRegister.jsx
sed -i "s|from '../../constants/sports'|from '../../constants/sports.js'|g" pages/InstituteRegister.jsx
sed -i "s|from '../../constants/sports'|from '../../constants/sports.js'|g" pages/events/EventCreate.jsx
sed -i "s|from '../constants/sports'|from '../constants/sports.js'|g" components/EventForm.jsx
sed -i "s|from '../constants/sports'|from '../constants/sports.js'|g" pages/StudentRegister.jsx
sed -i "s|from '../constants/sports'|from '../constants/sports.js'|g" pages/StudentAdd.jsx
```

---

## 🔍 Verify File Exists

```bash
ls -la /root/stairs-new/frontend/src/constants/sports.js
cat /root/stairs-new/frontend/src/constants/sports.js | head -20
```

---

## 🚀 Rebuild

```bash
cd /root/stairs-new/frontend
rm -rf node_modules/.vite  # Clear Vite cache
npm run build
```

