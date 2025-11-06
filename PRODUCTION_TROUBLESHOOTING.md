# 🚀 Production Deployment & Debugging Guide

## Quick Fixes for Production Issues

### 1. SSH into Production Server
```bash
ssh -p 2222 root@160.187.22.41
```

### 2. Run Diagnostics
```bash
cd /path/to/backend
node scripts/productionDebug.js
```

This will check:
- ✅ Database connection
- ✅ Environment variables
- ✅ File permissions
- ✅ Memory/Disk usage
- ✅ Data integrity

### 3. Check Backend Logs
```bash
# View last 100 lines of logs
pm2 logs backend --lines 100

# View errors only
pm2 logs backend --err

# Real-time logs
pm2 logs backend
```

### 4. Pull Latest Changes
```bash
cd /path/to/backend
git pull origin main
npm install
npx prisma generate
npx prisma db push
pm2 restart backend
```

### 5. Verify API Endpoints
```bash
# Test health check
curl http://localhost:5000/api/health

# Test dashboard (replace TOKEN with real JWT)
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/coach/dashboard

# Test certificate endpoint
curl http://localhost:5000/api/certificates/health
```

---

## 🔍 Common Production Issues & Fixes

### Issue: 500 Error on Dashboard

**Symptoms:**
- Frontend shows "Failed to load dashboard"
- 500 status code

**Diagnose:**
```bash
pm2 logs backend --lines 50 | grep -i "analytics\|dashboard"
```

**Possible Causes:**
1. **Coach not found** - JWT token issues
   - Fix: Check JWT_SECRET matches on server
   ```bash
   echo $JWT_SECRET
   ```

2. **Database query error** - Bad data
   - Fix: Run diagnostics
   ```bash
   node scripts/productionDebug.js
   ```

3. **Null/undefined value** - Missing data
   - Fix: Check if coach exists in database
   ```bash
   npm run cli
   # prisma> select from Coach
   ```

### Issue: Certificate Generation Times Out

**Symptoms:**
- Certificate endpoint returns 500
- No error in logs

**Diagnose:**
```bash
# Check if Puppeteer is installed
npm list puppeteer

# Check PDF template exists
ls -la templates/certificate-template.html
```

**Fix:**
```bash
# Increase timeout in certificateService.js
# Change: waitUntil: ['load'] 
# To: waitUntil: ['networkidle0', 'load', 'domcontentloaded']
```

### Issue: File Upload Fails

**Symptoms:**
- Upload endpoint returns 500
- "ENOENT: no such file or directory"

**Diagnose:**
```bash
# Check uploads directory exists
ls -la uploads/

# Check permissions
ls -la | grep uploads
```

**Fix:**
```bash
# Create missing directories
mkdir -p uploads/certificates
mkdir -p uploads/results
mkdir -p temp

# Set proper permissions
chmod -R 755 uploads/
chmod -R 755 temp/
```

### Issue: "Too many connections" Database Error

**Symptoms:**
- Random 500 errors
- "Error: Client has encountered a connection timeout"

**Diagnose:**
```bash
# Check active connections
psql -c "SELECT count(*) FROM pg_stat_activity;"
```

**Fix:**
```bash
# Update .env DATABASE_URL with connection limits
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&connection_limit=5&pool_timeout=15"

# Restart backend
pm2 restart backend
```

---

## 📋 Production Checklist

Before deploying, verify:

- [ ] All environment variables set
  ```bash
  env | grep -E "DATABASE_URL|JWT_SECRET|NODE_ENV"
  ```

- [ ] Database migrations run
  ```bash
  npx prisma db push
  npx prisma migrate status
  ```

- [ ] Directories exist with correct permissions
  ```bash
  ls -la uploads/ temp/ templates/
  ```

- [ ] Backend process running
  ```bash
  pm2 status
  ```

- [ ] API endpoints responding
  ```bash
  curl http://localhost:5000/api/health
  ```

- [ ] No errors in logs
  ```bash
  pm2 logs backend --lines 50 | grep ERROR
  ```

---

## 🛠️ Deployment Process

### Step 1: Backup Production
```bash
# Backup database
pg_dump stairs_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup uploads
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz uploads/
```

### Step 2: Pull Changes
```bash
cd /path/to/backend
git fetch origin
git pull origin main
npm install
```

### Step 3: Run Migrations
```bash
npx prisma db push
npx prisma migrate deploy
```

### Step 4: Restart Backend
```bash
pm2 restart backend
pm2 save

# Wait a few seconds for startup
sleep 5

# Check status
pm2 status
pm2 logs backend --lines 20
```

### Step 5: Verify Endpoints
```bash
# Test health
curl http://localhost:5000/api/health

# Test with real data
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/coach/dashboard
```

---

## 📊 Monitoring Commands

```bash
# Real-time process monitoring
pm2 monit

# View all processes
pm2 status

# View specific logs
pm2 logs backend
pm2 logs frontend

# View error logs
pm2 logs backend --err

# Save PM2 process list
pm2 save

# Resurrect on reboot
pm2 startup

# Stop all
pm2 stop all

# Delete all
pm2 delete all
```

---

## 🆘 Emergency Recovery

If backend crashes completely:

```bash
# Kill all Node processes
pkill -f "node"

# Remove old PM2 data
rm -rf ~/.pm2/

# Start fresh
cd /path/to/backend
pm2 start src/index.js --name backend
pm2 save
pm2 startup
```

---

## 📞 Support

If issues persist after these steps:

1. **Collect logs:**
   ```bash
   pm2 logs backend > backend_logs.txt
   pm2 logs frontend > frontend_logs.txt
   node scripts/productionDebug.js > diagnostics.txt
   ```

2. **Check system resources:**
   ```bash
   top
   df -h
   free -h
   ```

3. **Verify configuration:**
   ```bash
   env | grep -E "NODE_ENV|DATABASE_URL|FRONTEND_URL"
   ```

---

**Last Updated:** December 2024
**Version:** 1.0.0
