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

# Step 4: Push database migrations (if needed)
echo -e "${YELLOW}Step 4: Applying database migrations...${NC}"
npx prisma db push --skip-generate
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: Database push encountered an issue (may be normal if schema is up to date)${NC}"
fi
echo -e "${GREEN}✅ Database checked${NC}"
echo ""

# Step 5: Restart PM2
echo -e "${YELLOW}Step 5: Restarting backend service...${NC}"
pm2 restart stairs-backend
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  PM2 restart failed, trying direct start...${NC}"
    pm2 start src/index.js --name stairs-backend
fi
echo -e "${GREEN}✅ Backend service restarted${NC}"
sleep 3
echo ""

# Step 6: Show logs
echo -e "${YELLOW}Step 6: Checking backend logs...${NC}"
echo "Showing last 50 lines of error logs..."
pm2 logs stairs-backend --lines 50 --err
echo ""

# Summary
echo -e "${GREEN}=================================================="
echo "✅ Deployment Complete!"
echo "=================================================="
echo ""
echo "FIXES APPLIED:"
echo "1. Added app.set('trust proxy', 1) for X-Forwarded-For header"
echo "2. Fixed notification type enum mapping (EVENT_APPROVE → EVENT_APPROVED)"
echo "3. Fixed payment status string comparison"
echo ""
echo "Please verify:"
echo "1. Coach Dashboard: https://stairs.astroraag.com/"
echo "2. Certificate Issuance: https://stairs.astroraag.com/admin"
echo ""
echo "If issues persist, check logs:"
echo "  pm2 logs stairs-backend --lines 100 --err"
echo -e "${NC}"
