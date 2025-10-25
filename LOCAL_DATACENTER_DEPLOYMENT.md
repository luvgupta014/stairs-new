# 🏢 Local Data Center Deployment Guide - STAIRS Project

## 📋 Prerequisites
- ✅ Linux/Windows Server with Node.js 18+ 
- ✅ PostgreSQL Database
- ✅ Git installed
- ✅ Network access for users
- ✅ Port 5000 (backend) and 3000 (frontend) open

## 🚀 Step-by-Step Deployment

### Step 1: Clone Repository on Server
```bash
# On your server
git clone https://github.com/luvgupta014/stairs-new.git
cd stairs-new
```

### Step 2: Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp ../.env.production.template .env

# Edit .env file with your server details
nano .env  # or vim .env or notepad .env
```

**Required .env changes:**
- Replace `YOUR_SERVER_IP` with your actual server IP
- Update `DATABASE_URL` with your PostgreSQL credentials
- Change `JWT_SECRET` to a secure random string

### Step 3: Setup Database
```bash
# In backend directory
npx prisma db push

# Optional: Create admin user
node scripts/createAdmin.js
```

### Step 4: Create Uploads Directory
```bash
# In backend directory
mkdir -p uploads/event-results
chmod 755 uploads/event-results

# Verify directory exists
ls -la uploads/
```

### Step 5: Start Backend Service
```bash
# Option A: Direct start
npm start

# Option B: Production with PM2 (recommended)
npm install -g pm2
pm2 start src/index.js --name "stairs-backend"
pm2 save
pm2 startup
```

### Step 6: Setup Frontend
```bash
# Open new terminal
cd ../frontend

# Install dependencies
npm install

# Copy environment template  
cp ../.env.production.template .env

# Edit .env file
nano .env  # Replace YOUR_SERVER_IP with actual IP

# Build for production
npm run build
```

### Step 7: Serve Frontend
```bash
# Option A: Development server
npm run preview -- --host 0.0.0.0 --port 3000

# Option B: Production with serve
npm install -g serve
serve -s dist -l 3000

# Option C: Production with PM2
pm2 start "npm run preview -- --host 0.0.0.0 --port 3000" --name "stairs-frontend"
```

## 🔗 Access Your Application

### URLs (Replace with your server IP):
- **Frontend**: `http://YOUR_SERVER_IP:3000`
- **Backend API**: `http://YOUR_SERVER_IP:5000`
- **Health Check**: `http://YOUR_SERVER_IP:5000/health`
- **File Access**: `http://YOUR_SERVER_IP:5000/uploads/event-results/filename.xlsx`

### Test the File Upload System:
1. **Access frontend**: `http://YOUR_SERVER_IP:3000`
2. **Register as coach**
3. **Create an event**
4. **Upload Excel file** (event results)
5. **Verify file exists**: Check `backend/uploads/event-results/`
6. **Test download**: Click download in admin panel
7. **Direct file access**: `http://YOUR_SERVER_IP:5000/uploads/event-results/filename.xlsx`

## 📁 File Storage Structure
```
/your-app-directory/
├── backend/
│   ├── uploads/
│   │   └── event-results/          ← Excel files stored here
│   │       ├── event-abc123-file1.xlsx
│   │       ├── event-def456-file2.csv
│   │       └── event-ghi789-file3.pdf
│   ├── src/
│   ├── .env                        ← Production config
│   └── package.json
├── frontend/
│   ├── dist/                       ← Built frontend files
│   ├── .env                        ← Production config
│   └── package.json
└── .env.production.template
```

## 🛡️ Security Configuration

### Firewall Settings:
```bash
# Allow required ports
sudo ufw allow 22    # SSH
sudo ufw allow 3000  # Frontend
sudo ufw allow 5000  # Backend
sudo ufw allow 5432  # PostgreSQL (if external access needed)
sudo ufw enable
```

### File Permissions:
```bash
# Set correct permissions
chmod 755 backend/uploads
chmod 755 backend/uploads/event-results
chmod 644 backend/uploads/event-results/*
```

## 🔧 Process Management (PM2 - Recommended)

### Start Services:
```bash
# Backend
pm2 start backend/src/index.js --name "stairs-backend"

# Frontend (from project root)
pm2 start "npm run preview -- --host 0.0.0.0 --port 3000" --name "stairs-frontend" --cwd frontend

# Save PM2 configuration
pm2 save
pm2 startup
```

### Monitor Services:
```bash
pm2 status
pm2 logs stairs-backend
pm2 logs stairs-frontend
pm2 restart stairs-backend
```

## 📊 Monitoring & Maintenance

### Check File Upload System:
```bash
# Monitor uploads directory
watch -n 5 'ls -la backend/uploads/event-results/'

# Check backend logs
pm2 logs stairs-backend --lines 50

# Check disk usage
df -h
du -sh backend/uploads/
```

### Backup Strategy:
```bash
# Backup uploads folder
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz backend/uploads/

# Backup database
pg_dump stairs_db > stairs_db_backup_$(date +%Y%m%d).sql
```

## 🚨 Troubleshooting

### File Upload Issues:
```bash
# Check permissions
ls -la backend/uploads/event-results/

# Check disk space
df -h

# Check backend logs
pm2 logs stairs-backend
```

### Network Access Issues:
```bash
# Test backend API
curl http://YOUR_SERVER_IP:5000/health

# Test file access
curl http://YOUR_SERVER_IP:5000/uploads/event-results/filename.xlsx

# Check firewall
sudo ufw status
```

### Database Issues:
```bash
# Test database connection
cd backend
npx prisma db push

# Check PostgreSQL status
sudo systemctl status postgresql
```

## ✅ Verification Checklist
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000  
- [ ] Database connected and migrated
- [ ] Uploads directory created with correct permissions
- [ ] File upload test successful
- [ ] File download test successful
- [ ] Admin panel can view uploaded files
- [ ] Coach can upload and manage files
- [ ] All services auto-start on server reboot

## 📞 Support
- Check logs: `pm2 logs`
- Monitor processes: `pm2 status`
- Restart services: `pm2 restart all`
- Server resources: `htop` or `top`

🎉 **Your STAIRS project with Excel file upload system is now deployed on your local data center!**