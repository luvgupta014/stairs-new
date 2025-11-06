#!/bin/bash

# Production Debug Script for Stairs Backend
# Run this on your production server to diagnose issues

echo "=================================="
echo "STAIRS BACKEND PRODUCTION DEBUG"
echo "=================================="
echo ""

# Check if Stairs backend is running
echo "[1] Checking PM2 status for Stairs backend..."
pm2 status | grep -i stairs

echo ""
echo "[2] Checking Stairs backend logs..."
pm2 logs "stairs-backend" --lines 50 --err

echo ""
echo "[3] Checking environment variables..."
cd /root/stairs-new/backend
grep -v "^#" .env | grep -v "^$" | head -20

echo ""
echo "[4] Checking if backend is listening..."
netstat -tlnp | grep node || echo "No node processes listening"

echo ""
echo "[5] Testing API endpoints..."
echo "Testing health endpoint..."
curl -s http://localhost:5000/api/health | head -50

echo ""
echo "Testing coach dashboard (need JWT token)..."
echo "If you have a JWT token, run:"
echo "curl -H 'Authorization: Bearer YOUR_TOKEN' http://localhost:5000/api/coach/dashboard"

echo ""
echo "=================================="
echo "END DEBUG REPORT"
echo "=================================="
