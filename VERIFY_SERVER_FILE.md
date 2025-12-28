# Verify File Exists on Server

## Quick Check Commands

**Run these on your server to verify:**

```bash
# 1. Check if directory exists
ls -la /root/stairs-new/frontend/src/constants/

# 2. Check if file exists
ls -la /root/stairs-new/frontend/src/constants/sports.js

# 3. Check file content (first few lines)
head -10 /root/stairs-new/frontend/src/constants/sports.js

# 4. Check if exports exist
grep "export.*SORTED_SPORTS" /root/stairs-new/frontend/src/constants/sports.js
```

## If File Doesn't Exist

**Option 1: Upload via SCP (from local machine)**
```bash
scp frontend/src/constants/sports.js root@your-server:/root/stairs-new/frontend/src/constants/sports.js
```

**Option 2: Create on server using nano**
```bash
# On server
mkdir -p /root/stairs-new/frontend/src/constants
nano /root/stairs-new/frontend/src/constants/sports.js
# Then paste the entire file content from your local file
```

**Option 3: Copy from local file via cPanel File Manager**
- Upload the file directly through cPanel

## If File Exists But Still Fails

**Check file permissions:**
```bash
chmod 644 /root/stairs-new/frontend/src/constants/sports.js
```

**Verify the import path is correct:**
From `src/pages/ClubRegister.jsx`:
- `../../constants/sports` should resolve to `src/constants/sports.js`

**Check for typos:**
```bash
# Verify exact path
realpath /root/stairs-new/frontend/src/constants/sports.js
# Should output: /root/stairs-new/frontend/src/constants/sports.js
```

## Test After Fixing

```bash
cd /root/stairs-new/frontend
npm run build
```

