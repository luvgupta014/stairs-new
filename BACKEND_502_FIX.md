# 🚨 URGENT: Fix Backend 502 Bad Gateway

## Problem
Backend at `stairs-api.astroraag.com` is returning **502 Bad Gateway**. This means:
- ❌ Backend server is **down** or **not responding**
- ❌ Cloudflare can't reach your backend
- ❌ All API calls are failing

---

## ✅ Fix Steps

### Step 1: Check Backend Status

**Via SSH:**
```bash
# SSH to your server
ssh root@your-server

# Check if Node.js backend process is running
pm2 list
# or
ps aux | grep node

# Check if backend service is running
systemctl status your-backend-service
```

**Via cPanel (if you have access):**
- Go to "Terminal" or "SSH Access"
- Run: `pm2 list` or `ps aux | grep node`

---

### Step 2: Check Backend Logs

```bash
# PM2 logs
pm2 logs backend --lines 50

# Or systemd logs
journalctl -u your-backend-service -n 50

# Or check error logs
tail -f /root/stairs-new/backend/logs/error.log
```

**Look for:**
- Database connection errors
- Port already in use errors
- Out of memory errors
- Missing environment variables

---

### Step 3: Navigate to Backend Directory

```bash
cd /root/stairs-new/backend
# or wherever your backend is located
# Based on cPanel, it might be in:
# /home/astroraag/public_html/stairs-api.astroraag
```

---

### Step 4: Check Backend Process

```bash
# Check if port 5000 (or your backend port) is in use
lsof -i :5000
# or
netstat -tulpn | grep :5000

# If port is free, backend is not running
# If port is in use, check what's using it
```

---

### Step 5: Restart Backend

#### Option A: PM2 (Recommended)

```bash
cd /root/stairs-new/backend

# List PM2 processes
pm2 list

# If backend exists in PM2:
pm2 restart backend
# or
pm2 restart all

# If backend is not in PM2, start it:
pm2 start npm --name "backend" -- start
# or
pm2 start server.js --name "backend"
```

#### Option B: Direct Node.js

```bash
cd /root/stairs-new/backend

# Kill existing process (if any)
pkill -f "node.*backend"

# Start backend
npm start
# or
node src/index.js
```

#### Option C: Systemd Service

```bash
# Restart service
systemctl restart stairs-backend
# or whatever your service is named

# Check status
systemctl status stairs-backend
```

---

### Step 6: Verify Backend is Running

```bash
# Test locally (on server)
curl http://localhost:5000/health
# or your backend port

# Should return:
# {"status":"healthy","timestamp":"...","database":"connected"}

# Test from outside
curl https://stairs-api.astroraag.com/health
```

---

### Step 7: Fix Common Issues

#### Issue: Port Already in Use
```bash
# Find process using port
lsof -i :5000

# Kill it
kill -9 <PID>

# Restart backend
pm2 restart backend
```

#### Issue: Database Connection Error
```bash
# Check database is running
sudo systemctl status postgresql

# Check DATABASE_URL in .env
cat /root/stairs-new/backend/.env | grep DATABASE_URL

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### Issue: Out of Memory
```bash
# Check memory
free -h

# If low memory, restart backend or increase server resources
pm2 restart backend
```

#### Issue: Missing Environment Variables
```bash
# Check .env file exists
ls -la /root/stairs-new/backend/.env

# Verify critical variables
cat /root/stairs-new/backend/.env | grep -E "PORT|DATABASE_URL|JWT_SECRET"
```

---

### Step 8: Check Cloudflare Configuration

If backend is running but still getting 502:

1. **Check Cloudflare DNS:**
   - Go to Cloudflare Dashboard
   - DNS → Records
   - Verify `stairs-api.astroraag.com` points to correct IP
   - TTL should be "Auto" or low value

2. **Check Cloudflare SSL:**
   - SSL/TLS → Overview
   - Mode should be "Full" or "Full (strict)"
   - Not "Flexible" (causes issues with backend)

3. **Check Cloudflare Proxy:**
   - DNS → Records
   - Orange cloud should be ON (proxied)
   - If backend has direct IP access, try turning proxy OFF temporarily

---

### Step 9: Check Backend .htaccess (if using Apache)

Based on cPanel screenshot, check if there's an `.htaccess` in backend directory:

```bash
cat /home/astroraag/public_html/stairs-api.astroraag/.htaccess
```

Make sure it's not blocking requests or redirecting incorrectly.

---

## ✅ After Backend is Up

Once backend is running:

1. **Test health endpoint:**
   ```bash
   curl https://stairs-api.astroraag.com/health
   ```

2. **Test API endpoint:**
   ```bash
   curl https://stairs-api.astroraag.com/api/maps/places/autocomplete?input=test
   ```

3. **Check CORS headers:**
   ```bash
   curl -I -H "Origin: https://portal.stairs.org.in" \
     https://stairs-api.astroraag.com/api/maps/places/autocomplete
   ```

4. **Refresh frontend** and test venue autocomplete

---

## 📋 Diagnostic Checklist

- [ ] Backend process is running (`pm2 list` or `ps aux | grep node`)
- [ ] Backend is listening on correct port (`lsof -i :5000`)
- [ ] Backend health endpoint works (`curl http://localhost:5000/health`)
- [ ] Database is connected (check logs)
- [ ] Environment variables are set (`.env` file exists)
- [ ] No port conflicts
- [ ] Cloudflare DNS points to correct IP
- [ ] Cloudflare SSL mode is "Full"
- [ ] Backend accessible from outside (`curl https://stairs-api.astroraag.com/health`)

---

## 🆘 If Still Not Working

**Check backend error logs:**
```bash
# PM2 logs
pm2 logs backend --err --lines 100

# Or check console output
cd /root/stairs-new/backend
npm start
```

**Common error patterns:**
- `ECONNREFUSED` → Database not running
- `EADDRINUSE` → Port already in use
- `MODULE_NOT_FOUND` → Missing dependencies
- `EACCES` → Permission issues

**Share the error message and we can fix it!**

