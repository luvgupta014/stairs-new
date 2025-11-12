# STAIRS Platform - Setup & Deployment Guide# STAIRS Platform - Setup & Deployment Guide



## Local Development Setup## Prerequisites

- Node.js v18+ installed

### Prerequisites- PostgreSQL database

- Node.js v18 or higher- Git

- PostgreSQL 14+- npm or yarn

- npm or yarn

- Git---



---## Local Development Setup



### 1. Clone Repository### 1. Clone the Repository

```bash```bash

git clone https://github.com/luvgupta014/stairs-new.gitgit clone <repository-url>

cd stairs-newcd stairs-new

``````



---### 2. Backend Setup



### 2. Backend Setup#### Install Dependencies

```bash

#### Install Dependenciescd backend

```bashnpm install

cd backend```

npm install

```#### Configure Environment Variables

Create `.env` file in `backend/` folder:

#### Configure Environment Variables

Create `.env` file in `backend/` directory:```env

# Database

```envDATABASE_URL="postgresql://username:password@localhost:5432/stairs_db"

# Database

DATABASE_URL="postgresql://user:password@localhost:5432/stairs_db"# JWT

JWT_SECRET="your-super-secret-jwt-key-change-this"

# JWTJWT_EXPIRES_IN="7d"

JWT_SECRET="your-super-secret-jwt-key-change-this"

JWT_EXPIRES_IN="7d"# Razorpay

RAZORPAY_KEY_ID="your_razorpay_key_id"

# RazorpayRAZORPAY_KEY_SECRET="your_razorpay_key_secret"

RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxx"

RAZORPAY_KEY_SECRET="your_razorpay_secret"# Email (Nodemailer)

EMAIL_HOST="smtp.gmail.com"

# Email (Nodemailer)EMAIL_PORT=587

EMAIL_HOST="smtp.gmail.com"EMAIL_USER="your-email@gmail.com"

EMAIL_PORT="587"EMAIL_PASSWORD="your-app-password"

EMAIL_USER="your-email@gmail.com"EMAIL_FROM="STAIRS <noreply@stairs.com>"

EMAIL_PASSWORD="your-app-password"

EMAIL_FROM="STAIRS <noreply@stairs.com>"# Google Maps

GOOGLE_MAPS_API_KEY="your_google_maps_api_key"

# Google Maps

GOOGLE_MAPS_API_KEY="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxx"# URLs

FRONTEND_URL="http://localhost:5173"

# URLsBACKEND_URL="http://localhost:5000"

FRONTEND_URL="http://localhost:5173"

BACKEND_URL="http://localhost:5000"# Node Environment

NODE_ENV="development"

# ServerPORT=5000

PORT=5000```

NODE_ENV="development"

```#### Database Setup

```bash

#### Setup Database# Generate Prisma Client

```bashnpx prisma generate

# Run migrations

npx prisma migrate dev# Run migrations

npx prisma migrate dev

# Seed database (optional)

node scripts/seed.js# (Optional) Seed database

npm run seed

# View database```

npx prisma studio

```#### Start Backend Server

```bash

#### Start Backend Server# Development mode (with nodemon)

```bashnpm run dev

npm run dev      # Development (with nodemon)

npm start        # Production# Production mode

```npm start

```

Backend will run on: http://localhost:5000

Backend will run on: `http://localhost:5000`

---

### 3. Frontend Setup

### 3. Frontend Setup

#### Install Dependencies

#### Install Dependencies```bash

```bashcd ../frontend

cd frontendnpm install

npm install```

```

#### Configure Environment Variables

#### Configure Environment VariablesCreate `.env` file in `frontend/` folder:

Create `.env` file in `frontend/` directory:

```env

```envVITE_API_URL="http://localhost:5000/api"

VITE_API_URL="http://localhost:5000"VITE_RAZORPAY_KEY_ID="your_razorpay_key_id"

VITE_RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxx"VITE_GOOGLE_MAPS_API_KEY="your_google_maps_api_key"

VITE_GOOGLE_MAPS_API_KEY="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxx"```

```

#### Start Frontend Server

#### Start Frontend Server```bash

```bashnpm run dev

npm run dev```

```

Frontend will run on: `http://localhost:5173`

Frontend will run on: http://localhost:5173

### 4. Create Admin User

---Run the admin creation script:

```bash

## Production Deploymentcd backend

node scripts/createAdmin.js

### Server Requirements```

- Ubuntu 22.04 LTS

- Node.js v18+Follow the prompts to create your first admin user.

- PostgreSQL 14+

- Nginx (for reverse proxy)---

- PM2 (for process management)

- SSL certificate (Let's Encrypt)## Production Deployment



---### 1. Prepare Environment



### 1. Server Setup#### Update Environment Variables

Create production `.env` file with:

#### Install Node.js- Production database URL

```bash- Secure JWT secret (use strong random string)

curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -- Production API keys

sudo apt-get install -y nodejs- Production URLs (HTTPS)

```

#### Set Node Environment

#### Install PostgreSQL```env

```bashNODE_ENV="production"

sudo apt-get install postgresql postgresql-contrib```

sudo systemctl start postgresql

sudo systemctl enable postgresql### 2. Backend Deployment

```

#### On Ubuntu Server

#### Install PM2

```bash##### Install Dependencies

sudo npm install -g pm2```bash

```# Update system

sudo apt update

#### Install Nginxsudo apt upgrade

```bash

sudo apt-get install nginx# Install Node.js

sudo systemctl start nginxcurl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

sudo systemctl enable nginxsudo apt install -y nodejs

```

# Install PostgreSQL

---sudo apt install postgresql postgresql-contrib



### 2. Deploy Backend# Install PM2 (Process Manager)

sudo npm install -g pm2

#### Clone & Setup```

```bash

cd /var/www##### Setup Application

git clone https://github.com/luvgupta014/stairs-new.git```bash

cd stairs-new/backend# Clone repository

npm install --productiongit clone <repository-url>

```cd stairs-new/backend



#### Configure Production Environment# Install dependencies

Create `.env` file with production values:npm install --production

```env

DATABASE_URL="postgresql://user:password@localhost:5432/stairs_prod"# Setup database

JWT_SECRET="production-secret-key-very-long-and-secure"sudo -u postgres createdb stairs_production

NODE_ENV="production"sudo -u postgres psql

PORT=5000# In psql:

# ... other production values# CREATE USER stairs_user WITH PASSWORD 'secure_password';

```# GRANT ALL PRIVILEGES ON DATABASE stairs_production TO stairs_user;

# \q

#### Run Database Migrations

```bash# Update .env with production database URL

npx prisma migrate deploy

```# Run migrations

npx prisma migrate deploy

#### Start with PM2

```bash# Generate Prisma Client

pm2 start src/index.js --name stairs-backendnpx prisma generate

pm2 save```

pm2 startup

```##### Start with PM2

```bash

---# Start application

pm2 start src/index.js --name stairs-backend

### 3. Deploy Frontend

# Save PM2 configuration

#### Build Frontendpm2 save

```bash

cd /var/www/stairs-new/frontend# Setup PM2 to start on boot

npm installpm2 startup

npm run build# Follow the command it outputs

```

# Check status

#### Configure Nginxpm2 status

Create `/etc/nginx/sites-available/stairs`:

# View logs

```nginxpm2 logs stairs-backend

# Backend API```

server {

    listen 80;##### Setup Nginx Reverse Proxy

    server_name api.stairs.com;```bash

    # Install Nginx

    location / {sudo apt install nginx

        proxy_pass http://localhost:5000;

        proxy_http_version 1.1;# Create Nginx configuration

        proxy_set_header Upgrade $http_upgrade;sudo nano /etc/nginx/sites-available/stairs

        proxy_set_header Connection 'upgrade';```

        proxy_set_header Host $host;

        proxy_cache_bypass $http_upgrade;Add configuration:

        proxy_set_header X-Real-IP $remote_addr;```nginx

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;server {

    }    listen 80;

}    server_name your-domain.com;



# Frontend    location /api {

server {        proxy_pass http://localhost:5000;

    listen 80;        proxy_http_version 1.1;

    server_name stairs.com www.stairs.com;        proxy_set_header Upgrade $http_upgrade;

    root /var/www/stairs-new/frontend/dist;        proxy_set_header Connection 'upgrade';

    index index.html;        proxy_set_header Host $host;

            proxy_set_header X-Real-IP $remote_addr;

    location / {        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        try_files $uri $uri/ /index.html;        proxy_cache_bypass $http_upgrade;

    }    }

    }

    location /uploads {```

        alias /var/www/stairs-new/backend/uploads;

    }```bash

}# Enable site

```sudo ln -s /etc/nginx/sites-available/stairs /etc/nginx/sites-enabled/



Enable site:# Test configuration

```bashsudo nginx -t

sudo ln -s /etc/nginx/sites-available/stairs /etc/nginx/sites-enabled/

sudo nginx -t# Restart Nginx

sudo systemctl reload nginxsudo systemctl restart nginx

``````



#### Setup SSL with Let's Encrypt##### Setup SSL with Let's Encrypt

```bash```bash

sudo apt-get install certbot python3-certbot-nginx# Install Certbot

sudo certbot --nginx -d stairs.com -d www.stairs.com -d api.stairs.comsudo apt install certbot python3-certbot-nginx

```

# Obtain certificate

---sudo certbot --nginx -d your-domain.com



### 4. Configure Firewall# Certbot will automatically configure Nginx for HTTPS

```bash```

sudo ufw allow 22       # SSH

sudo ufw allow 80       # HTTP### 3. Frontend Deployment

sudo ufw allow 443      # HTTPS

sudo ufw enable#### Option A: Vercel

``````bash

cd frontend

---

# Install Vercel CLI

### 5. Setup Monitoringnpm install -g vercel



#### PM2 Monitoring# Deploy

```bashvercel

pm2 monit                     # Real-time monitoring

pm2 logs stairs-backend       # View logs# Follow prompts and configure environment variables in Vercel dashboard

pm2 status                    # Process status```

```

#### Option B: Build and Serve Statically

#### Setup Log Rotation```bash

```bashcd frontend

pm2 install pm2-logrotate

```# Build for production

npm run build

---

# The dist/ folder contains the production build

## Update & Maintenance# Serve with Nginx, Apache, or any static hosting service

```

### Deploy Updates

##### Serve with Nginx

#### Backend Update```nginx

```bashserver {

cd /var/www/stairs-new    listen 80;

git pull    server_name your-frontend-domain.com;

cd backend    root /path/to/frontend/dist;

npm install    index index.html;

npx prisma migrate deploy

pm2 restart stairs-backend    location / {

```        try_files $uri $uri/ /index.html;

    }

#### Frontend Update}

```bash```

cd /var/www/stairs-new/frontend

npm install### 4. Configure CORS

npm run build

# Nginx will serve new build automaticallyUpdate `backend/src/index.js` to allow your production frontend URL:

```

```javascript

#### Quick Update Scriptconst cors = require('cors');

Create `deploy.sh`:

```bashapp.use(cors({

#!/bin/bash  origin: ['https://your-frontend-domain.com'],

cd /var/www/stairs-new  credentials: true

git pull}));

cd backend```

npm install

npx prisma migrate deploy### 5. Database Backup

pm2 restart stairs-backend

cd ../frontendSetup automated backups:

npm install```bash

npm run build# Create backup script

echo "Deployment complete!"nano ~/backup-stairs-db.sh

pm2 status```

```

```bash

Make executable:#!/bin/bash

```bashDATE=$(date +%Y%m%d_%H%M%S)

chmod +x deploy.shBACKUP_DIR="/path/to/backups"

```DB_NAME="stairs_production"



---pg_dump $DB_NAME > $BACKUP_DIR/stairs_backup_$DATE.sql

find $BACKUP_DIR -name "stairs_backup_*.sql" -mtime +7 -delete

## Database Backup```



### Manual Backup```bash

```bash# Make executable

pg_dump -U postgres stairs_prod > backup_$(date +%Y%m%d_%H%M%S).sqlchmod +x ~/backup-stairs-db.sh

```

# Add to crontab (daily at 2 AM)

### Automated Backup (Cron)crontab -e

```bash# Add: 0 2 * * * /home/username/backup-stairs-db.sh

crontab -e```

```

---

Add:

```cron## Troubleshooting

0 2 * * * pg_dump -U postgres stairs_prod > /backups/stairs_$(date +\%Y\%m\%d).sql

```### Backend Issues



### Restore from Backup#### Port Already in Use

```bash```bash

psql -U postgres stairs_prod < backup_20251112.sql# Find process using port 5000

```lsof -i :5000

# Or on Windows:

---netstat -ano | findstr :5000



## Troubleshooting# Kill the process and restart

```

### Backend Not Starting

```bash#### Database Connection Error

# Check logs- Verify DATABASE_URL in `.env`

pm2 logs stairs-backend- Check PostgreSQL is running: `sudo systemctl status postgresql`

- Verify user permissions in database

# Check port

sudo lsof -i :5000#### Prisma Client Error

```bash

# Restart# Regenerate Prisma Client

pm2 restart stairs-backendnpx prisma generate

``````



### Database Connection Error### Frontend Issues

```bash

# Check PostgreSQL status#### API Connection Error

sudo systemctl status postgresql- Verify VITE_API_URL in `.env`

- Check backend is running

# Check connection- Check CORS configuration

psql -U postgres -d stairs_prod

```#### Build Errors

```bash

### Nginx Issues# Clear cache and rebuild

```bashrm -rf node_modules package-lock.json

# Test configurationnpm install

sudo nginx -tnpm run build

```

# Restart Nginx

sudo systemctl restart nginx### Production Issues



# Check logs#### PM2 Application Not Starting

sudo tail -f /var/log/nginx/error.log```bash

```# Check logs

pm2 logs stairs-backend

### Git Pull Conflicts

```bash# Restart application

# Stash local changespm2 restart stairs-backend

git stash

# Check environment variables

# Pull updatespm2 env 0

git pull```



# Apply stashed changes#### Nginx 502 Bad Gateway

git stash pop- Check backend is running: `pm2 status`

```- Verify proxy_pass URL in Nginx config

- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

---

#### SSL Certificate Issues

## Performance Optimization```bash

# Renew certificate

### Enable Gzip in Nginxsudo certbot renew

Add to nginx config:

```nginx# Test renewal

gzip on;sudo certbot renew --dry-run

gzip_vary on;```

gzip_min_length 1024;

gzip_types text/plain text/css application/json application/javascript text/xml application/xml;---

```

## Monitoring & Maintenance

### PM2 Cluster Mode

```bash### PM2 Monitoring

pm2 start src/index.js -i max --name stairs-backend```bash

```# Real-time monitoring

pm2 monit

### Database Optimization

```sql# Check logs

-- Add indexespm2 logs

CREATE INDEX idx_event_start_date ON "Event"("startDate");

CREATE INDEX idx_event_status ON "Event"("status");# Restart if needed

pm2 restart all

-- Analyze tables```

ANALYZE "Event";

ANALYZE "EventRegistration";### Database Maintenance

``````bash

# Vacuum database

---psql -U stairs_user -d stairs_production -c "VACUUM ANALYZE;"



## Security Checklist# Check database size

psql -U stairs_user -d stairs_production -c "SELECT pg_size_pretty(pg_database_size('stairs_production'));"

- ✅ Use environment variables for secrets```

- ✅ Enable firewall (UFW)

- ✅ Setup SSL certificates### Log Rotation

- ✅ Use strong JWT secretSetup log rotation for application logs to prevent disk space issues.

- ✅ Rate limiting enabled

- ✅ CORS configured properly---

- ✅ Database backups automated

- ✅ Keep dependencies updated## Scaling Considerations

- ✅ Monitor logs regularly

- ✅ Use PM2 for process management### Horizontal Scaling

- Use load balancer (Nginx, HAProxy)

---- Deploy multiple backend instances

- Use Redis for session management

**Last Updated**: November 2025- Database connection pooling


### Performance Optimization
- Enable Prisma query caching
- Implement API rate limiting
- Use CDN for static assets
- Optimize database queries with indexes

---

## Security Checklist

- [ ] Strong JWT secret in production
- [ ] HTTPS enabled (SSL certificate)
- [ ] CORS properly configured
- [ ] Database user with minimal privileges
- [ ] Environment variables secured (not in version control)
- [ ] API rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] File upload restrictions enforced
- [ ] Regular security updates (npm audit)
- [ ] Firewall configured (UFW on Ubuntu)

---

For additional help, refer to:
- `TESTING_GUIDE.md` for testing procedures
- `MAINTENANCE_SUPPORT.md` for ongoing maintenance
- `API_REFERENCE.md` for API documentation
