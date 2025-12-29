#!/bin/bash
# Fix frontend environment variable in build
echo "🔧 Fixing Frontend Environment Variable in Build"
echo "================================================"
echo ""

FRONTEND_DIR="/root/stairs-new/frontend"
FRONTEND_ENV="$FRONTEND_DIR/.env"

if [ ! -f "$FRONTEND_ENV" ]; then
    echo "❌ .env file not found at $FRONTEND_ENV"
    exit 1
fi

# Get the key from .env
BROWSER_KEY=$(grep "^VITE_GOOGLE_MAPS_API_KEY=" "$FRONTEND_ENV" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')

if [ -z "$BROWSER_KEY" ]; then
    echo "❌ No VITE_GOOGLE_MAPS_API_KEY found in .env"
    exit 1
fi

KEY_PREVIEW="${BROWSER_KEY:0:20}...${BROWSER_KEY: -10}"
echo "📋 Browser key from .env: $KEY_PREVIEW"
echo ""

# Check .env format
echo "📄 Checking .env file format:"
if grep -q "^VITE_GOOGLE_MAPS_API_KEY=" "$FRONTEND_ENV"; then
    ENV_LINE=$(grep "^VITE_GOOGLE_MAPS_API_KEY=" "$FRONTEND_ENV")
    echo "   Current line: $ENV_LINE"
    
    # Check for common issues
    if echo "$ENV_LINE" | grep -q " "; then
        echo "   ⚠️  Warning: Key may have spaces"
    fi
    if echo "$ENV_LINE" | grep -q "'\|\""; then
        echo "   ⚠️  Warning: Key has quotes (may need to be removed)"
    fi
else
    echo "   ❌ Key not found in correct format"
fi
echo ""

# Ensure proper format (no quotes, no spaces)
echo "🔧 Ensuring proper .env format..."
# Backup
cp "$FRONTEND_ENV" "${FRONTEND_ENV}.backup.$(date +%Y%m%d_%H%M%S)"

# Remove old key line
sed -i '/^VITE_GOOGLE_MAPS_API_KEY=/d' "$FRONTEND_ENV"

# Add properly formatted key (no quotes, no spaces)
echo "" >> "$FRONTEND_ENV"
echo "# Google Maps API Key (Browser/Frontend)" >> "$FRONTEND_ENV"
echo "VITE_GOOGLE_MAPS_API_KEY=$BROWSER_KEY" >> "$FRONTEND_ENV"

echo "✅ Updated .env with clean format"
echo ""

# Clean build directory
echo "🧹 Cleaning build directory..."
cd "$FRONTEND_DIR"
rm -rf dist node_modules/.vite
echo "✅ Cleaned dist and Vite cache"
echo ""

# Rebuild
echo "🔨 Rebuilding frontend..."
echo "   This may take a minute..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completed successfully"
    echo ""
    
    # Verify key in built files
    echo "🔍 Verifying key in built files..."
    KEY_IN_BUILD=$(grep -r "maps.googleapis.com" dist/ 2>/dev/null | grep -o "key=[^&\"']*" | head -1 | cut -d'=' -f2 | cut -d'"' -f1 | cut -d"'" -f1)
    
    if [ ! -z "$KEY_IN_BUILD" ]; then
        BUILT_PREVIEW="${KEY_IN_BUILD:0:20}...${KEY_IN_BUILD: -10}"
        echo "   Found key in build: $BUILT_PREVIEW"
        
        if [ "$KEY_IN_BUILD" == "$BROWSER_KEY" ]; then
            echo "   ✅ Built files now match .env key!"
        else
            echo "   ⚠️  Still different - checking for environment variable substitution issue"
            echo "   Built: ${KEY_IN_BUILD:0:30}..."
            echo "   .env:  ${BROWSER_KEY:0:30}..."
        fi
    else
        echo "   ⚠️  Could not find key in built files"
    fi
else
    echo ""
    echo "❌ Build failed - check errors above"
    exit 1
fi

echo ""
echo "================================================"
echo "✅ Done!"
echo ""
echo "📋 Next steps:"
echo "1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
echo "2. Or test in incognito window"
echo "3. Visit: https://portal.stairs.org.in/admin/event/create"
echo "4. Check browser console - should not see authorization errors"
echo ""

