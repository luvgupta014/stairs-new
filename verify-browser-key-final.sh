#!/bin/bash
# Final verification of browser key setup
echo "🔍 Final Browser Key Verification"
echo "=================================="
echo ""

FRONTEND_ENV="/root/stairs-new/frontend/.env"
BACKEND_ENV="/root/stairs-new/backend/.env"

# 1. Check keys are different
echo "1️⃣ Checking Keys Are Different:"
BROWSER_KEY=$(grep "^VITE_GOOGLE_MAPS_API_KEY=" "$FRONTEND_ENV" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')
SERVER_KEY=$(grep "^GOOGLE_MAPS_API_KEY=" "$BACKEND_ENV" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')

if [ -z "$BROWSER_KEY" ]; then
    echo "   ❌ No browser key found in frontend/.env"
    exit 1
fi

if [ "$BROWSER_KEY" == "$SERVER_KEY" ]; then
    echo "   ❌ Browser and server keys are the SAME!"
    echo "   → You MUST create a separate browser key"
    echo "   → Browser key needs HTTP referer restrictions"
else
    echo "   ✅ Browser and server keys are different"
fi
echo ""

# 2. Check if frontend has been rebuilt
echo "2️⃣ Checking Frontend Build:"
if [ -d "/root/stairs-new/frontend/dist" ]; then
    # Check when dist was last modified
    BUILD_TIME=$(stat -c %Y /root/stairs-new/frontend/dist 2>/dev/null || stat -f %m /root/stairs-new/frontend/dist 2>/dev/null)
    CURRENT_TIME=$(date +%s)
    AGE=$((CURRENT_TIME - BUILD_TIME))
    
    if [ "$AGE" -lt 300 ]; then
        echo "   ✅ Frontend was rebuilt recently (${AGE}s ago)"
    else
        echo "   ⚠️  Frontend build is old ($(($AGE / 60)) minutes ago)"
        echo "   → Rebuild may be needed: cd frontend && npm run build"
    fi
else
    echo "   ❌ No dist folder found - frontend not built!"
fi
echo ""

# 3. Check if key is in built files
echo "3️⃣ Checking Key in Built Files:"
KEY_IN_BUILD=$(grep -r "maps.googleapis.com" /root/stairs-new/frontend/dist/ 2>/dev/null | grep -o "key=[^&]*" | head -1 | cut -d'=' -f2)

if [ ! -z "$KEY_IN_BUILD" ]; then
    KEY_PREVIEW="${KEY_IN_BUILD:0:20}...${KEY_IN_BUILD: -10}"
    echo "   Found key in build: $KEY_PREVIEW"
    
    # Compare with .env
    if [ "$KEY_IN_BUILD" == "$BROWSER_KEY" ]; then
        echo "   ✅ Built files match .env key"
    else
        echo "   ❌ Built files have DIFFERENT key than .env!"
        echo "   → Frontend needs to be rebuilt"
    fi
else
    echo "   ⚠️  Could not find key in built files"
fi
echo ""

# 4. Recommendations
echo "=================================="
echo "📋 Action Items:"
echo ""

if [ "$BROWSER_KEY" == "$SERVER_KEY" ]; then
    echo "❌ CRITICAL: Create separate browser key:"
    echo "   1. Go to: https://console.cloud.google.com/apis/credentials"
    echo "   2. Create NEW key with HTTP referer restrictions"
    echo "   3. Add referer: https://portal.stairs.org.in/*"
    echo "   4. Run: bash update-browser-key.sh"
fi

if [ "$KEY_IN_BUILD" != "$BROWSER_KEY" ] || [ "$AGE" -gt 300 ]; then
    echo "🔄 Rebuild frontend:"
    echo "   cd /root/stairs-new/frontend"
    echo "   npm run build"
fi

echo ""
echo "✅ After fixes, clear browser cache and test!"
echo ""

