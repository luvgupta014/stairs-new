#!/bin/bash
# Fix Vite define configuration for environment variables
echo "🔧 Fixing Vite Define Configuration"
echo "===================================="
echo ""

FRONTEND_DIR="/root/stairs-new/frontend"
FRONTEND_ENV="$FRONTEND_DIR/.env"

# Get the key
BROWSER_KEY=$(grep "^VITE_GOOGLE_MAPS_API_KEY=" "$FRONTEND_ENV" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')

if [ -z "$BROWSER_KEY" ]; then
    echo "❌ No VITE_GOOGLE_MAPS_API_KEY found in .env"
    exit 1
fi

KEY_PREVIEW="${BROWSER_KEY:0:20}...${BROWSER_KEY: -10}"
echo "📋 Browser key: $KEY_PREVIEW"
echo ""

# Ensure .env.production exists
echo "📄 Ensuring .env.production exists:"
if [ ! -f "$FRONTEND_DIR/.env.production" ]; then
    echo "VITE_GOOGLE_MAPS_API_KEY=$BROWSER_KEY" > "$FRONTEND_DIR/.env.production"
    echo "✅ Created .env.production"
else
    echo "✅ .env.production already exists"
fi
echo ""

# Clean and rebuild
echo "🧹 Cleaning build:"
cd "$FRONTEND_DIR"
rm -rf dist node_modules/.vite .vite
echo "✅ Cleaned"
echo ""

echo "🔨 Rebuilding with updated Vite config..."
echo "   (Vite config now explicitly defines the env variable)"
echo ""

# Build
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completed"
    echo ""
    
    # Verify
    echo "🔍 Verifying key in built files:"
    KEY_IN_BUILD=$(grep -r "maps.googleapis.com" dist/ 2>/dev/null | grep -o "key=[^&\"']*" | head -1 | cut -d'=' -f2)
    
    if [ ! -z "$KEY_IN_BUILD" ]; then
        BUILT_PREVIEW="${KEY_IN_BUILD:0:20}...${KEY_IN_BUILD: -10}"
        echo "   Found: $BUILT_PREVIEW"
        
        if [ "$KEY_IN_BUILD" == "$BROWSER_KEY" ]; then
            echo "   ✅ Keys match! Build is correct."
        elif echo "$KEY_IN_BUILD" | grep -q '\${'; then
            echo "   ❌ Still showing variable: $KEY_IN_BUILD"
            echo "   → Check if vite.config.js was updated correctly"
        else
            echo "   ⚠️  Keys don't match"
            echo "   Built: ${KEY_IN_BUILD:0:30}..."
            echo "   .env:  ${BROWSER_KEY:0:30}..."
        fi
    else
        echo "   ⚠️  Could not find key in built files"
    fi
else
    echo ""
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "===================================="
echo "✅ Done!"
echo ""

