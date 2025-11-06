# Server Deployment Fix Guide

## Problem Summary
Your backend is crashing because npm dependencies are not installed on the production server.

## Error Details
```
Error: Cannot find module 'puppeteer'
at Object.<anonymous> (/root/stairs-new/backend/src/services/certificateService.js:1:19)
```

## Root Cause
When you deploy code to the server, you need to install npm dependencies. The `puppeteer` module (and likely others) are missing.

## Fix Steps

### 1. SSH into your server
```bash
ssh root@160.187.22.41
```

### 2. Navigate to backend directory
```bash
cd ~/stairs-new/backend
```

### 3. Install all dependencies
```bash
npm install
```

**Important:** Puppeteer requires additional system dependencies (Chromium). Install them:
```bash
# For Ubuntu/Debian
apt-get update
apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

Or use the simpler command:
```bash
apt-get install -y chromium-browser
```

### 4. Restart the backend with PM2
```bash
pm2 restart stairs-backend
```

### 5. Check the status
```bash
pm2 list
```

The `stairs-backend` process should now show status "online" instead of "errored".

### 6. Verify the backend is responding
```bash
curl http://localhost:5000/health
```

You should see:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "database": "connected",
  "version": "1.0.0"
}
```

### 7. Test from browser
Visit: https://stairs-api.astroraag.com/health

You should see the same JSON response.

### 8. Test login from frontend
Try logging in from: https://stairs.astroraag.com

The CORS and login errors should now be resolved.

## Deployment Checklist

Whenever you deploy new code to the server, follow these steps:

1. **Pull latest code**
   ```bash
   cd ~/stairs-new
   git pull origin main
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies (if needed)**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Build frontend**
   ```bash
   npm run build
   ```

5. **Run database migrations (if any)**
   ```bash
   cd ../backend
   npx prisma migrate deploy
   # or
   npx prisma db push
   ```

6. **Restart backend**
   ```bash
   pm2 restart stairs-backend
   ```

7. **Restart frontend (if using PM2)**
   ```bash
   pm2 restart stairs-frontend
   ```

8. **Verify everything is running**
   ```bash
   pm2 list
   pm2 logs stairs-backend --lines 50
   ```

## Common Issues

### Issue 1: Puppeteer fails to install
**Solution:** Install system dependencies first (see step 3 above), then run `npm install` again.

### Issue 2: Port already in use
**Solution:** 
```bash
pm2 stop stairs-backend
pm2 start stairs-backend
```

### Issue 3: Database connection error
**Solution:** Check your `.env` file has correct DATABASE_URL:
```bash
cd ~/stairs-new/backend
cat .env | grep DATABASE_URL
```

### Issue 4: Frontend still shows old code
**Solution:** Clear browser cache (Ctrl+Shift+R) or rebuild frontend:
```bash
cd ~/stairs-new/frontend
npm run build
pm2 restart stairs-frontend
```

## Quick Commands Reference

```bash
# Check all PM2 processes
pm2 list

# View logs for a specific process
pm2 logs stairs-backend
pm2 logs stairs-frontend

# Restart a process
pm2 restart stairs-backend

# Stop a process
pm2 stop stairs-backend

# Start a process
pm2 start stairs-backend

# Delete a process from PM2
pm2 delete stairs-backend

# Save PM2 process list (persists after reboot)
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Automated Deployment Script

Create this file: `~/stairs-new/deploy.sh`
```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Backend deployment
echo "🔧 Installing backend dependencies..."
cd backend
npm install

echo "🗄️  Running database migrations..."
npx prisma generate
npx prisma db push

# Frontend deployment
echo "🎨 Building frontend..."
cd ../frontend
npm install
npm run build

# Restart services
echo "♻️  Restarting services..."
pm2 restart stairs-backend
pm2 restart stairs-frontend

# Show status
echo "✅ Deployment complete!"
pm2 list

echo "🏥 Testing backend health..."
curl http://localhost:5000/health
```

Make it executable:
```bash
chmod +x ~/stairs-new/deploy.sh
```

Use it:
```bash
cd ~/stairs-new
./deploy.sh
```

