#!/bin/bash

echo "🚀 Starting STAIRS deployment..."

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

echo ""
echo "🏥 Testing backend health..."
sleep 2
curl http://localhost:5000/health

echo ""
echo "🌐 Your app should be live at:"
echo "   Frontend: https://stairs.astroraag.com"
echo "   API: https://stairs-api.astroraag.com"
