# Production Server - Git Conflict Resolution

## Problem
Git pull is failing because untracked files would be overwritten by merge:
- backend/fix-certificate-uid.js
- backend/prisma/migrations/fix_orderId_nullable/migration.sql
- backend/regenerate-certificate.js

## Solution - Run these commands on your production server:

### Step 1: Backup conflicting files
```bash
cd ~/stairs-new
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=backups/$(date +%Y%m%d_%H%M%S)
```

### Step 2: Move conflicting files to backup
```bash
mv backend/fix-certificate-uid.js $BACKUP_DIR/
mv backend/regenerate-certificate.js $BACKUP_DIR/
mv backend/prisma/migrations/fix_orderId_nullable $BACKUP_DIR/
mv backend/check-cert-files.js $BACKUP_DIR/
mv backend/debug-cert-issue.js $BACKUP_DIR/
mv backend/fix-orderId-constraint.js $BACKUP_DIR/
mv backend/install-and-regenerate.sh $BACKUP_DIR/
mv backend/rename-cert-files.js $BACKUP_DIR/
```

### Step 3: Pull latest changes
```bash
git pull
```

### Step 4: Restart backend
```bash
pm2 restart 0
```

### Step 5: Build and restart frontend
```bash
cd frontend
npm run build
pm2 restart 8
cd ..
```

### Step 6: Verify deployment
```bash
pm2 status
pm2 logs 0 --lines 20
```

---

## Quick One-Liner (Copy-Paste This):

```bash
cd ~/stairs-new && mkdir -p backups/temp_$(date +%s) && mv backend/fix-certificate-uid.js backend/regenerate-certificate.js backend/check-cert-files.js backend/debug-cert-issue.js backend/fix-orderId-constraint.js backend/install-and-regenerate.sh backend/rename-cert-files.js backend/prisma/migrations/fix_orderId_nullable backups/temp_$(date +%s)/ 2>/dev/null ; git pull && pm2 restart 0 && cd frontend && npm run build && pm2 restart 8 && cd .. && pm2 status
```

---

## Alternative: Force overwrite (if you don't need those files)

```bash
cd ~/stairs-new
git reset --hard HEAD
git pull
pm2 restart 0
cd frontend && npm run build && pm2 restart 8
```

**Warning**: This will delete the untracked files permanently!
