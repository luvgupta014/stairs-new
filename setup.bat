@echo off
echo 🏃 Setting up STAIRS Talent Hub...

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js found
node --version

:: Setup Backend
echo 🔧 Setting up Backend...
cd backend

if not exist ".env" (
    echo 📝 Creating backend .env from template...
    copy .env.example .env >nul
    echo ⚠️  Please edit backend\.env with your configuration before running the server!
)

echo 📦 Installing backend dependencies...
call npm install

echo 🗄️  Setting up database...
call npx prisma generate
call npx prisma migrate dev --name init

echo ✅ Backend setup complete!

:: Setup Frontend
echo 🔧 Setting up Frontend...
cd ..\frontend

if not exist ".env" (
    echo 📝 Creating frontend .env...
    echo VITE_BACKEND_URL=http://localhost:3000 > .env
    echo VITE_NODE_ENV=development >> .env
)

echo 📦 Installing frontend dependencies...
call npm install

echo ✅ Frontend setup complete!

cd ..

echo 🎉 Setup complete!
echo.
echo 📋 Next steps:
echo 1. Edit backend\.env with your JWT_SECRET and other config
echo 2. Start backend: cd backend ^&^& npm run dev
echo 3. Start frontend: cd frontend ^&^& npm run dev
echo.
echo 🌐 Access the app at: http://localhost:5173
echo 🔗 API will be at: http://localhost:3000

pause