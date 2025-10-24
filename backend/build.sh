#!/bin/bash
# Railway build script for STAIRS backend

echo "🔧 Installing dependencies..."
npm ci

echo "🗄️ Generating Prisma client..."
npx prisma generate

echo "✅ Build completed successfully!"