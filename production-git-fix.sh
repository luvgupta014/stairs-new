#!/bin/bash
# Production Git Conflict Resolution Script
# Run this on your production server to resolve git pull conflicts

echo "=== STAIRS Production Git Fix ==="
echo "Backing up conflicting files..."

# Create backup directory with timestamp
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Move conflicting files to backup
echo "Moving conflicting files to $BACKUP_DIR..."
mv backend/fix-certificate-uid.js $BACKUP_DIR/ 2>/dev/null
mv backend/regenerate-certificate.js $BACKUP_DIR/ 2>/dev/null
mv backend/prisma/migrations/fix_orderId_nullable/migration.sql $BACKUP_DIR/ 2>/dev/null

# Move other untracked files
mv backend/check-cert-files.js $BACKUP_DIR/ 2>/dev/null
mv backend/debug-cert-issue.js $BACKUP_DIR/ 2>/dev/null
mv backend/fix-orderId-constraint.js $BACKUP_DIR/ 2>/dev/null
mv backend/install-and-regenerate.sh $BACKUP_DIR/ 2>/dev/null
mv backend/rename-cert-files.js $BACKUP_DIR/ 2>/dev/null

echo "Files backed up to $BACKUP_DIR"
echo ""
echo "Now pulling latest changes..."
git pull

echo ""
echo "=== Git Pull Complete ==="
echo "Restarting backend..."
pm2 restart 0

echo ""
echo "Building frontend..."
cd frontend
npm run build

echo ""
echo "Restarting frontend..."
pm2 restart 8

echo ""
echo "=== Deployment Complete ==="
echo "Backup files are in: $BACKUP_DIR"
pm2 status
