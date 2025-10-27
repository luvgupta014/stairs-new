## 🚨 EMERGENCY: Backend Server is DOWN

### Connection Refused = Server Not Running

Your backend server has **completely stopped** on production. Here's how to fix it:

---

## 🎯 IMMEDIATE RECOVERY STEPS

### 1. SSH to your server:
```bash
ssh user@160.187.22.41
```

### 2. Check if backend is running:
```bash
pm2 list
```

### 3. Check what you see:

**If you see processes with status 'stopped' or 'errored':**
```bash
pm2 restart all
pm2 logs
```

**If you see NO processes:**
```bash
cd ~/stairs-new/backend
pm2 start src/index.js --name 'stairs-backend'
pm2 logs
```

**If PM2 restart fails:**
```bash
cd ~/stairs-new/backend
pm2 delete all
pm2 start npm --name 'stairs-backend' -- start
pm2 save
```

### 4. Test if server is back:
```bash
curl http://localhost:5000/health
```

**Expected response:**
```json
{"status":"healthy","timestamp":"...","database":"connected"}
```

---

## 🔧 AFTER SERVER IS RUNNING

### Fix CORS immediately:
```bash
cd ~/stairs-new/backend
nano src/index.js
```

Find this line (around line 44):
```javascript
'http://localhost:5173', 
```

Change to:
```javascript
'http://localhost:5173',
'http://160.187.22.41:3008',
'http://160.187.22.41:5173',
```

Save and restart:
```bash
pm2 restart all
```

---

## 🔍 WHY DID IT CRASH?

Common causes:
1. **Database timeout** (Neon connection lost)
2. **Memory issues** on your server
3. **Unhandled exceptions** in code
4. **Environment variables** missing
5. **Port conflicts**

### Check crash logs:
```bash
pm2 logs --lines 50
```

---

## ✅ SUCCESS INDICATORS

1. `pm2 list` shows status 'online'
2. `curl http://localhost:5000/health` returns JSON
3. Frontend login works at `http://160.187.22.41:3008`

---

## 🚨 IF NOTHING WORKS

**Nuclear option - Complete restart:**
```bash
cd ~/stairs-new/backend
pm2 delete all
pkill -f node
npm install
npm start
```

**The priority is to get ANY response from port 5000, then we can fix CORS.**