# STAIRS Platform - Complete Setup & Deployment Guide

## Document Information
- **Project Name:** STAIRS Platform
- **Version:** 1.0
- **Date:** November 2025
- **Audience:** DevOps Engineers, System Administrators, Developers

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Development Setup](#2-local-development-setup)
3. [Production Server Setup](#3-production-server-setup)
4. [Database Configuration](#4-database-configuration)
5. [Application Deployment](#5-application-deployment)
6. [Nginx Configuration](#6-nginx-configuration)
7. [SSL Certificate Setup](#7-ssl-certificate-setup)
8. [PM2 Process Management](#8-pm2-process-management)
9. [Monitoring & Logging](#9-monitoring--logging)
10. [Backup & Recovery](#10-backup--recovery)
11. [Troubleshooting](#11-troubleshooting)
12. [Maintenance Procedures](#12-maintenance-procedures)

---

## 1. Prerequisites

### 1.1 Hardware Requirements

**Development Environment:**
- CPU: 2 cores minimum
- RAM: 4GB minimum
- Storage: 20GB free space

**Production Environment:**
- CPU: 4 cores minimum
- RAM: 8GB minimum
- Storage: 100GB SSD
- Network: 1Gbps bandwidth

### 1.2 Software Requirements

**All Environments:**
- Node.js v18.x or higher
- npm v9.x or higher
- Git
- PostgreSQL v14.x or higher

**Production Only:**
- Ubuntu 22.04 LTS
- Nginx v1.22 or higher
- PM2 v5.x or higher
- Certbot (for SSL)

### 1.3 External Service Accounts

- **Razorpay Account:** For payment processing (key_id and key_secret)
- **Email Service:** Gmail/SMTP credentials for sending emails
- **Google Maps API:** API key for location services

---

## 2. Local Development Setup

### 2.1 Clone Repository

```bash
# Clone the repository
git clone https://github.com/luvgupta014/stairs-new.git
cd stairs-new
```

### 2.2 Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 2.3 Configure Backend Environment Variables

Edit `backend/.env`:

```bash
# Application
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/stairs_dev"

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 2.4 Database Setup

```bash
# Install PostgreSQL (if not installed)
# On Ubuntu:
sudo apt update
sudo apt install postgresql postgresql-contrib

# On macOS:
brew install postgresql@14

# Start PostgreSQL service
# On Ubuntu:
sudo systemctl start postgresql
# On macOS:
brew services start postgresql@14

# Create database
sudo -u postgres psql
CREATE DATABASE stairs_dev;
CREATE USER stairs_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE stairs_dev TO stairs_user;
\q

# Run Prisma migrations
npx prisma generate
npx prisma migrate dev
```

### 2.5 Start Backend Server

```bash
# Development mode with hot reload
npm run dev

# Or production mode
npm start
```

Backend should now be running on `http://localhost:5000`

### 2.6 Frontend Setup

```bash
# Open new terminal, navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 2.7 Configure Frontend Environment Variables

Edit `frontend/.env`:

```bash
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 2.8 Start Frontend Development Server

```bash
npm run dev
```

Frontend should now be running on `http://localhost:5173`

### 2.9 Verify Setup

1. Open browser and navigate to `http://localhost:5173`
2. You should see the STAIRS landing page
3. Try registering a new student account
4. Check backend terminal for logs

---

## 3. Production Server Setup

### 3.1 Server Provisioning

```bash
# SSH into your server
ssh root@your_server_ip

# Update system packages
sudo apt update
sudo apt upgrade -y

# Install essential build tools
sudo apt install -y build-essential curl wget git
```

### 3.2 Install Node.js

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x
```

### 3.3 Install PostgreSQL

```bash
# Install PostgreSQL 14
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo systemctl status postgresql
```

### 3.4 Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Allow Nginx through firewall
sudo ufw allow 'Nginx Full'
```

### 3.5 Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### 3.6 Configure Firewall

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH (important!)
sudo ufw allow 22

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Check status
sudo ufw status
```

---

## 4. Database Configuration

### 4.1 Create Production Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE stairs_prod;
CREATE USER stairs_user WITH ENCRYPTED PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE stairs_prod TO stairs_user;

# Exit psql
\q
```

### 4.2 Configure PostgreSQL for Remote Access (if needed)

Edit `/etc/postgresql/14/main/postgresql.conf`:

```bash
# Uncomment and modify
listen_addresses = 'localhost'  # Keep localhost only for security
```

Edit `/etc/postgresql/14/main/pg_hba.conf`:

```bash
# Add at the end
local   all             stairs_user                              md5
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### 4.3 Test Database Connection

```bash
psql -U stairs_user -d stairs_prod -h localhost
# Enter password when prompted
# If successful, you'll see the psql prompt
\q
```

---

## 5. Application Deployment

### 5.1 Clone Repository on Server

```bash
# Create application directory
sudo mkdir -p /var/www
cd /var/www

# Clone repository
sudo git clone https://github.com/luvgupta014/stairs-new.git
cd stairs-new

# Set ownership
sudo chown -R $USER:$USER /var/www/stairs-new
```

### 5.2 Deploy Backend

```bash
cd /var/www/stairs-new/backend

# Install production dependencies
npm install --production

# Create .env file
nano .env
```

Production `backend/.env`:

```bash
NODE_ENV=production
PORT=5000

DATABASE_URL="postgresql://stairs_user:strong_password_here@localhost:5432/stairs_prod"

JWT_SECRET=production_jwt_secret_min_32_characters_long

RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_production_razorpay_secret

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=production_email@gmail.com
EMAIL_PASS=production_app_password

GOOGLE_MAPS_API_KEY=your_production_google_maps_key

FRONTEND_URL=https://yourdomain.com
```

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Create uploads directory
mkdir -p uploads/certificates
mkdir -p uploads/results
mkdir -p uploads/event-results
chmod -R 755 uploads
```

### 5.3 Deploy Frontend

```bash
cd /var/www/stairs-new/frontend

# Install dependencies
npm install

# Create .env file
nano .env
```

Production `frontend/.env`:

```bash
VITE_API_URL=https://yourdomain.com/api
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
VITE_GOOGLE_MAPS_API_KEY=your_production_google_maps_key
```

```bash
# Build for production
npm run build

# Verify build
ls -la dist/
```

---

## 6. Nginx Configuration

### 6.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/stairs
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        root /var/www/stairs-new/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for long-running requests
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    # Uploads (certificates, results)
    location /uploads {
        alias /var/www/stairs-new/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Client max body size for file uploads
    client_max_body_size 50M;
}
```

### 6.2 Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/stairs /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 7. SSL Certificate Setup

### 7.1 Install Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Obtain SSL Certificate

```bash
# Get certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (recommended)
```

### 7.3 Verify Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# If successful, certbot will auto-renew before expiry
```

### 7.4 Updated Nginx Config (After SSL)

Certbot automatically updates your Nginx config. Verify:

```bash
sudo nano /etc/nginx/sites-available/stairs
```

It should now have SSL configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ... rest of configuration ...
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 8. PM2 Process Management

### 8.1 Start Backend with PM2

```bash
cd /var/www/stairs-new/backend

# Start with PM2
pm2 start src/index.js --name stairs-backend

# Or use ecosystem file for advanced configuration
pm2 start ecosystem.config.js
```

### 8.2 PM2 Ecosystem File (Recommended)

Create `backend/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'stairs-backend',
      script: 'src/index.js',
      cwd: '/var/www/stairs-new/backend',
      instances: 4,  // Use 4 CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      autorestart: true,
      watch: false
    }
  ]
};
```

Start with ecosystem:

```bash
pm2 start ecosystem.config.js
```

### 8.3 PM2 Commands

```bash
# View running processes
pm2 list

# View logs
pm2 logs stairs-backend

# View only errors
pm2 logs stairs-backend --err

# Monitor resources
pm2 monit

# Restart application
pm2 restart stairs-backend

# Stop application
pm2 stop stairs-backend

# Delete from PM2
pm2 delete stairs-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Copy and run the command it outputs
```

### 8.4 PM2 Auto-Startup

```bash
# Generate startup script
pm2 startup systemd

# This will output a command like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u your_user --hp /home/your_user

# Run that command

# Save current PM2 process list
pm2 save
```

---

## 9. Monitoring & Logging

### 9.1 Application Logs

```bash
# Backend logs via PM2
pm2 logs stairs-backend

# View last 100 lines
pm2 logs stairs-backend --lines 100

# Follow logs in real-time
pm2 logs stairs-backend --lines 0
```

### 9.2 Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### 9.3 PostgreSQL Logs

```bash
# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### 9.4 System Resource Monitoring

```bash
# Install htop
sudo apt install htop

# Monitor resources
htop

# Disk usage
df -h

# Memory usage
free -m

# PM2 monitoring
pm2 monit
```

### 9.5 Log Rotation

Create `/etc/logrotate.d/stairs`:

```bash
/var/www/stairs-new/backend/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    missingok
    create 0644 www-data www-data
}
```

---

## 10. Backup & Recovery

### 10.1 Database Backup

**Manual Backup:**

```bash
# Create backup directory
sudo mkdir -p /backups/database
sudo chown $USER:$USER /backups/database

# Backup database
pg_dump -U stairs_user -d stairs_prod | gzip > /backups/database/stairs_$(date +%Y%m%d_%H%M%S).sql.gz
```

**Automated Backup Script:**

Create `/root/backup_db.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="stairs_prod"
DB_USER="stairs_user"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/stairs_$DATE.sql.gz

# Delete backups older than 30 days
find $BACKUP_DIR -name "stairs_*.sql.gz" -mtime +30 -delete

echo "Backup completed: stairs_$DATE.sql.gz"
```

Make executable:

```bash
sudo chmod +x /root/backup_db.sh
```

**Setup Cron Job:**

```bash
# Edit crontab
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * /root/backup_db.sh >> /var/log/db_backup.log 2>&1
```

### 10.2 Database Restore

```bash
# Uncompress and restore
gunzip -c /backups/database/stairs_20251113_020000.sql.gz | psql -U stairs_user -d stairs_prod

# Or if not compressed
psql -U stairs_user -d stairs_prod < /backups/database/stairs_20251113_020000.sql
```

### 10.3 File Backup

```bash
# Backup uploads directory
tar -czf /backups/uploads_$(date +%Y%m%d).tar.gz /var/www/stairs-new/backend/uploads/

# Backup to remote server (if configured)
rsync -avz /var/www/stairs-new/backend/uploads/ user@backup-server:/backups/stairs_uploads/
```

---

## 11. Troubleshooting

### 11.1 Backend Not Starting

**Check PM2 logs:**
```bash
pm2 logs stairs-backend --err
```

**Common issues:**
- Port 5000 already in use
- Database connection error
- Missing environment variables

**Solutions:**
```bash
# Check if port is in use
sudo lsof -i :5000

# Kill process using port
sudo kill -9 <PID>

# Test database connection
psql -U stairs_user -d stairs_prod -h localhost

# Verify .env file
cat /var/www/stairs-new/backend/.env
```

### 11.2 Database Connection Errors

**Check PostgreSQL status:**
```bash
sudo systemctl status postgresql
```

**Restart PostgreSQL:**
```bash
sudo systemctl restart postgresql
```

**Test connection:**
```bash
psql -U stairs_user -d stairs_prod -h localhost
```

### 11.3 Nginx Issues

**Test Nginx configuration:**
```bash
sudo nginx -t
```

**Restart Nginx:**
```bash
sudo systemctl restart nginx
```

**Check Nginx logs:**
```bash
sudo tail -f /var/log/nginx/error.log
```

### 11.4 SSL Certificate Issues

**Check certificate expiry:**
```bash
sudo certbot certificates
```

**Renew certificate:**
```bash
sudo certbot renew
```

**Force renewal:**
```bash
sudo certbot renew --force-renewal
```

### 11.5 High Memory Usage

**Check PM2 processes:**
```bash
pm2 list
pm2 monit
```

**Restart application:**
```bash
pm2 restart stairs-backend
```

**Adjust max memory restart in ecosystem.config.js:**
```javascript
max_memory_restart: '1G'
```

---

## 12. Maintenance Procedures

### 12.1 Update Application

```bash
# SSH to server
ssh user@your_server_ip

# Navigate to application directory
cd /var/www/stairs-new

# Stash any local changes
git stash

# Pull latest changes
git pull origin main

# Backend updates
cd backend
npm install --production
npx prisma generate
npx prisma migrate deploy

# Frontend updates
cd ../frontend
npm install
npm run build

# Restart backend
pm2 restart stairs-backend

# Reload Nginx
sudo systemctl reload nginx
```

### 12.2 Update Dependencies

```bash
# Check for outdated packages
npm outdated

# Update specific package
npm update <package-name>

# Update all packages (carefully)
npm update

# Audit for vulnerabilities
npm audit
npm audit fix
```

### 12.3 Database Maintenance

```bash
# Connect to database
psql -U stairs_user -d stairs_prod

# Vacuum and analyze
VACUUM ANALYZE;

# Check database size
SELECT pg_size_pretty(pg_database_size('stairs_prod'));

# Exit
\q
```

### 12.4 Clean Up Old Files

```bash
# Clean PM2 logs
pm2 flush

# Clean old logs
find /var/www/stairs-new/backend/logs -name "*.log" -mtime +30 -delete

# Clean npm cache
npm cache clean --force

# Clean old uploads (be careful!)
# Only delete files older than 1 year
find /var/www/stairs-new/backend/uploads -type f -mtime +365 -delete
```

### 12.5 Monitor System Health

```bash
# Check disk usage
df -h

# Check memory usage
free -m

# Check CPU usage
top

# Check PM2 processes
pm2 list

# Check Nginx status
sudo systemctl status nginx

# Check PostgreSQL status
sudo systemctl status postgresql
```

---

## 13. Security Checklist

- [ ] Firewall configured (UFW) with only necessary ports open
- [ ] SSL certificate installed and auto-renewal configured
- [ ] Strong passwords for database and server
- [ ] Environment variables properly secured (not in version control)
- [ ] Regular security updates applied
- [ ] Database backups automated
- [ ] PM2 process monitoring active
- [ ] Nginx properly configured with security headers
- [ ] File permissions properly set (755 for directories, 644 for files)
- [ ] SSH key authentication enabled (password auth disabled)

---

## 14. Deployment Checklist

**Pre-Deployment:**
- [ ] Code tested in development environment
- [ ] Database migrations tested
- [ ] Environment variables prepared
- [ ] Backup taken
- [ ] Maintenance window scheduled (if needed)

**Deployment:**
- [ ] Pull latest code
- [ ] Install dependencies
- [ ] Run database migrations
- [ ] Build frontend
- [ ] Restart backend
- [ ] Clear caches
- [ ] Reload Nginx

**Post-Deployment:**
- [ ] Verify application is running
- [ ] Check logs for errors
- [ ] Test critical user flows
- [ ] Monitor performance
- [ ] Update documentation

---

## 15. Support Contacts

**Development Team:** dev@stairs.com  
**DevOps Team:** devops@stairs.com  
**Emergency Contact:** +91-XXXX-XXXXXX

---

**Document Version:** 1.0  
**Last Updated:** November 2025  
**Next Review:** February 2026
