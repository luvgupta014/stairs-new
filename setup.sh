#!/bin/bash

# STAIRS Talent Hub Setup Script
echo "🏃 Setting up STAIRS Talent Hub..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Setup Backend
echo "🔧 Setting up Backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "📝 Creating backend .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your configuration before running the server!"
fi

echo "📦 Installing backend dependencies..."
npm install

echo "🗄️  Setting up database..."
npx prisma generate
npx prisma migrate dev --name init

echo "✅ Backend setup complete!"

# Setup Frontend
echo "🔧 Setting up Frontend..."
cd ../frontend

if [ ! -f ".env" ]; then
    echo "📝 Creating frontend .env..."
    echo "VITE_BACKEND_URL=http://localhost:3000" > .env
    echo "VITE_NODE_ENV=development" >> .env
fi

echo "📦 Installing frontend dependencies..."
npm install

echo "✅ Frontend setup complete!"

cd ..

echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit backend/.env with your JWT_SECRET and other config"
echo "2. Start backend: cd backend && npm run dev"
echo "3. Start frontend: cd frontend && npm run dev"
echo ""
echo "🌐 Access the app at: http://localhost:5173"
echo "🔗 API will be at: http://localhost:3000"