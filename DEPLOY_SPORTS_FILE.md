# Deploy Sports Constants File to Server

## ⚠️ Issue

Build fails because `frontend/src/constants/sports.js` doesn't exist on the server.

## ✅ Quick Fix

### Option 1: Upload via SCP (Recommended)

**From your local machine:**
```bash
scp frontend/src/constants/sports.js root@160-187-22-41:/root/stairs-new/frontend/src/constants/sports.js
```

### Option 2: Create Directory and Copy Content

**SSH into server:**
```bash
ssh root@160-187-22-41

# Create directory
mkdir -p /root/stairs-new/frontend/src/constants

# Create file (copy content from local file)
nano /root/stairs-new/frontend/src/constants/sports.js
# Paste the entire content from your local file
```

### Option 3: Use Git (If using version control)

```bash
# On server
cd /root/stairs-new
git pull
# Or if file is in your commit
git checkout frontend/src/constants/sports.js
```

### Option 4: Copy from Local via cPanel File Manager

1. Open cPanel File Manager
2. Navigate to: `~/stairs-new/frontend/src/`
3. Create `constants` folder if it doesn't exist
4. Upload `sports.js` file into the `constants` folder

## ✅ Verify File Exists

**SSH into server and check:**
```bash
ls -la /root/stairs-new/frontend/src/constants/sports.js
```

**Should show:**
```
-rw-r--r-- 1 root root 5174 Dec 29 XX:XX sports.js
```

## ✅ Test Build

```bash
cd /root/stairs-new/frontend
npm run build
```

**Should build successfully now!**

---

## 📁 File Location

**Local:** `frontend/src/constants/sports.js`  
**Server:** `/root/stairs-new/frontend/src/constants/sports.js`

Make sure the file exists at this exact location on the server!

