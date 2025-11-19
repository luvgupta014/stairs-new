# STAIRS Platform - Overall Setup Guide

## 1. Prerequisites
- Node.js v18+
- npm v9+
- PostgreSQL v14+
- Git
- Ubuntu 22.04 (for production)

---

## 2. Local Development Setup

### Backend
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd stairs-new/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env` and fill in database, email, Razorpay keys
4. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```
5. Start backend server:
   ```bash
   npm run dev
   ```

### Frontend
1. Go to frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env` and fill in API URL, Razorpay key, Google Maps key
4. Start frontend server:
   ```bash
   npm run dev
   ```

---

## 3. Production Deployment

### Server Setup
1. Provision Ubuntu 22.04 server
2. Install Node.js, npm, PostgreSQL, Nginx, PM2
3. Clone repository and set up environment variables
4. Run migrations and build frontend
5. Start backend and frontend with PM2
6. Configure Nginx for reverse proxy and SSL (Let's Encrypt)

### Example PM2 Commands
```bash
pm2 start backend/src/index.js --name stairs-backend
pm2 start frontend/dist --name stairs-frontend --watch
pm2 save
pm2 startup
```

---

## 4. Database Backup & Restore
- Use `pg_dump` for backups
- Automate with cron jobs
- Restore with `psql`

---

## 5. Troubleshooting
- Check PM2 logs: `pm2 logs stairs-backend`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Check database status: `sudo systemctl status postgresql`
- Common issues: Port conflicts, missing environment variables, migration errors

---

## 6. Useful Links
- Documentation: `/backend/Documentation/`
- API Reference: `/backend/Documentation/API_REFERENCE.md`
- Frontend Guide: `/backend/Documentation/FRONTEND_DOCUMENTATION.md`
- Deployment Guide: `/backend/Documentation/SETUP_DEPLOYMENT_GUIDE.md`

---

_Last updated: November 2025_
