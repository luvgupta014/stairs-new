#!/bin/bash
# Fix Vite environment variable substitution
echo "🔧 Fixing Vite Environment Variable Substitution"
echo "================================================="
echo ""

FRONTEND_DIR="/root/stairs-new/frontend"
FRONTEND_ENV="$FRONTEND_DIR/.env"

if [ ! -f "$FRONTEND_ENV" ]; then
    echo "❌ .env file not found at $FRONTEND_ENV"
    exit 1
fi

echo "📋 Current .env file:"
cat "$FRONTEND_ENV" | grep VITE_GOOGLE_MAPS_API_KEY
echo ""

# Get the key
BROWSER_KEY=$(grep "^VITE_GOOGLE_MAPS_API_KEY=" "$FRONTEND_ENV" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')

if [ -z "$BROWSER_KEY" ]; then
    echo "❌ No key found in .env"
    exit 1
fi

KEY_PREVIEW="${BROWSER_KEY:0:20}...${BROWSER_KEY: -10}"
echo "📋 Key to embed: $KEY_PREVIEW"
echo ""

# Check if .env.production exists (Vite reads this for production builds)
echo "🔍 Checking for .env.production:"
if [ -f "$FRONTEND_DIR/.env.production" ]; then
    echo "   ✅ .env.production exists"
    echo "   📋 Current content:"
    cat "$FRONTEND_DIR/.env.production" | grep VITE_GOOGLE_MAPS_API_KEY || echo "   (no VITE_GOOGLE_MAPS_API_KEY found)"
else
    echo "   ⚠️  .env.production not found"
    echo "   → Creating .env.production for production builds"
fi
echo ""

# Create/update .env.production
echo "🔧 Creating/updating .env.production:"
cat > "$FRONTEND_DIR/.env.production" << EOF
# Production environment variables
# This file is used by Vite for production builds

VITE_GOOGLE_MAPS_API_KEY=$BROWSER_KEY
EOF

echo "✅ Created .env.production"
echo ""

# Also ensure .env has it
echo "🔧 Ensuring .env has correct format:"
sed -i '/^VITE_GOOGLE_MAPS_API_KEY=/d' "$FRONTEND_ENV"
echo "" >> "$FRONTEND_ENV"
echo "# Google Maps API Key (Browser/Frontend)" >> "$FRONTEND_ENV"
echo "VITE_GOOGLE_MAPS_API_KEY=$BROWSER_KEY" >> "$FRONTEND_ENV"

echo "✅ Updated .env"
echo ""

# Clean and rebuild
echo "🧹 Cleaning build:"
cd "$FRONTEND_DIR"
rm -rf dist node_modules/.vite .vite
echo "✅ Cleaned"
echo ""

echo "🔨 Rebuilding with explicit environment variables..."
echo "   Setting VITE_GOOGLE_MAPS_API_KEY=$BROWSER_KEY"
echo ""

# Build with explicit env var
VITE_GOOGLE_MAPS_API_KEY="$BROWSER_KEY" npm run build

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
            echo "   ❌ Still showing variable substitution issue: $KEY_IN_BUILD"
            echo "   → Check Vite config or try building with mode:production explicitly"
        else
            echo "   ⚠️  Keys don't match - may need to check build process"
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
echo "================================================="
echo "✅ Done!"
echo ""
echo "📋 Files updated:"
echo "   - .env"
echo "   - .env.production"
echo ""
echo "🚀 Next: Clear browser cache and test!"

