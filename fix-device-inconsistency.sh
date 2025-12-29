#!/bin/bash
# fix-device-inconsistency.sh

echo "🔧 Fixing Device Inconsistency Issues..."

cd frontend

# 1. Ensure .env.production exists
if [ ! -f .env.production ]; then
    echo "⚠️ Creating .env.production from .env..."
    cp .env .env.production
fi

# 2. Clean everything
echo "🧹 Cleaning build artifacts..."
rm -rf dist
rm -rf node_modules/.vite

# 3. Verify environment variable
echo "🔍 Checking VITE_GOOGLE_MAPS_API_KEY..."
if ! grep -q "VITE_GOOGLE_MAPS_API_KEY" .env.production; then
    echo "❌ VITE_GOOGLE_MAPS_API_KEY not found in .env.production"
    echo "Please add it manually"
    exit 1
fi

# 4. Rebuild
echo "🏗️ Building frontend..."
npm run build

# 5. Verify build
echo "✅ Verifying build..."
if [ ! -f dist/index.html ]; then
    echo "❌ Build failed - dist/index.html not found"
    exit 1
fi

# 6. Check API key substitution
echo "🔑 Checking API key substitution..."
if grep -r "\${L}" dist/ 2>/dev/null; then
    echo "⚠️ WARNING: Variable substitution may have failed"
    echo "Found \${L} in built files"
else
    echo "✅ No variable substitution issues found"
fi

# 7. Generate cache-busting timestamp
TIMESTAMP=$(date +%s)
echo "📅 Build timestamp: $TIMESTAMP"

echo ""
echo "✅ Build complete!"
echo "📦 Next steps:"
echo "1. Deploy dist/ folder to web server"
echo "2. Clear CDN cache (if using Cloudflare)"
echo "3. Test on multiple devices/browsers"
