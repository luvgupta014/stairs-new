#!/bin/bash

echo "🚀 STAIRS Production Deployment - November 7, 2025"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Pull latest code
echo -e "${YELLOW}Step 1: Pulling latest code...${NC}"
git pull origin main
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git pull failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Code updated${NC}"
echo ""

# Step 2: Backend dependencies
echo -e "${YELLOW}Step 2: Checking backend dependencies...${NC}"
cd backend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm install failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 3: Regenerate Prisma Client
echo -e "${YELLOW}Step 3: Regenerating Prisma Client...${NC}"
npx prisma generate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Prisma generate failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Prisma Client regenerated${NC}"
echo ""

# Step 4: Restart PM2
echo -e "${YELLOW}Step 4: Restarting backend service...${NC}"
pm2 restart stairs-api
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  PM2 restart failed, trying 'pm2 restart all'...${NC}"
    pm2 restart all
fi
echo -e "${GREEN}✅ Backend service restarted${NC}"
echo ""

# Step 5: Show logs
echo -e "${YELLOW}Step 5: Checking backend logs...${NC}"
echo "Showing last 50 lines of logs..."
pm2 logs stairs-api --lines 50 --nostream
echo ""

# Summary
echo -e "${GREEN}=================================================="
echo "✅ Deployment Complete!"
echo "=================================================="
echo ""
echo "Please verify:"
echo "1. Revenue Dashboard: https://stairs.astroraag.com/admin/revenue"
echo "2. Certificate History: https://stairs.astroraag.com/admin/event/{eventId}/certificates"
echo ""
echo "To monitor logs: pm2 logs stairs-api"
echo -e "${NC}"
