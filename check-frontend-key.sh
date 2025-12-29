#!/bin/bash
# Check frontend Google Maps API key configuration
echo "🔍 Checking Frontend Google Maps API Key"
echo "========================================="
echo ""

FRONTEND_ENV="/root/stairs-new/frontend/.env"

# Check if .env exists
if [ ! -f "$FRONTEND_ENV" ]; then
    echo "❌ Frontend .env not found at $FRONTEND_ENV"
    echo ""
    echo "📝 Creating .env file..."
    echo "VITE_GOOGLE_MAPS_API_KEY=" > "$FRONTEND_ENV"
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  You need to add your browser API key to this file:"
    echo "   VITE_GOOGLE_MAPS_API_KEY=your_browser_key_here"
    exit 1
fi

# Get key
BROWSER_KEY=$(grep "^VITE_GOOGLE_MAPS_API_KEY=" "$FRONTEND_ENV" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')

if [ -z "$BROWSER_KEY" ]; then
    echo "❌ No VITE_GOOGLE_MAPS_API_KEY found in frontend/.env"
    echo ""
    echo "📝 Add it to $FRONTEND_ENV:"
    echo "   VITE_GOOGLE_MAPS_API_KEY=your_browser_key_here"
    echo ""
    echo "⚠️  Browser key MUST have HTTP referer restrictions:"
    echo "   - Not IP restrictions"
    echo "   - Referer: https://portal.stairs.org.in/*"
    exit 1
fi

KEY_PREVIEW="${BROWSER_KEY:0:20}...${BROWSER_KEY: -10}"
echo "✅ Browser key found: $KEY_PREVIEW"
echo ""

# Check if it's different from backend key
BACKEND_ENV="/root/stairs-new/backend/.env"
if [ -f "$BACKEND_ENV" ]; then
    SERVER_KEY=$(grep "^GOOGLE_MAPS_API_KEY=" "$BACKEND_ENV" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')
    if [ "$BROWSER_KEY" == "$SERVER_KEY" ]; then
        echo "⚠️  WARNING: Browser key is same as server key!"
        echo "   Browser and server keys should be DIFFERENT"
        echo "   - Browser key: HTTP referer restrictions"
        echo "   - Server key: IP address restrictions"
    else
        echo "✅ Browser key is different from server key (correct)"
    fi
fi

echo ""
echo "📋 Browser Key Requirements:"
echo "   ✅ Must have HTTP referer restrictions (NOT IP)"
echo "   ✅ Referer should include: https://portal.stairs.org.in/*"
echo "   ✅ Must have Maps JavaScript API enabled"
echo ""
echo "🔍 Check in Google Cloud Console:"
echo "   https://console.cloud.google.com/apis/credentials"
echo "   - Find key: ${BROWSER_KEY:0:20}..."
echo "   - Verify: Application restrictions = HTTP referrers"
echo "   - Verify: Referer includes portal.stairs.org.in"
echo ""

