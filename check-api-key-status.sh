#!/bin/bash
# Check API key status and help update it
echo "🔍 Checking Google Maps API Key Status"
echo "======================================="
echo ""

BACKEND_ENV="/root/stairs-new/backend/.env"

if [ ! -f "$BACKEND_ENV" ]; then
    echo "❌ Backend .env not found"
    exit 1
fi

# Get current key
CURRENT_KEY=$(grep "^GOOGLE_MAPS_API_KEY=" "$BACKEND_ENV" | cut -d'=' -f2)

if [ -z "$CURRENT_KEY" ]; then
    echo "❌ No GOOGLE_MAPS_API_KEY found in .env"
    exit 1
fi

echo "📋 Current API Key:"
KEY_PREVIEW="${CURRENT_KEY:0:15}...${CURRENT_KEY: -10}"
echo "   $KEY_PREVIEW"
echo ""

# Test the key
echo "🧪 Testing API Key:"
TEST_RESPONSE=$(curl -s "https://maps.googleapis.com/maps/api/place/autocomplete/json?input=test&key=$CURRENT_KEY" 2>&1)

if echo "$TEST_RESPONSE" | grep -q '"status":"OK"'; then
    echo "   ✅ API key is VALID"
    echo ""
    echo "📝 If you're still seeing 'expired' errors:"
    echo "   1. Check backend logs: pm2 logs stairs-backend --lines 50"
    echo "   2. Verify key matches in .env and Google Cloud Console"
    echo "   3. Restart backend: pm2 restart stairs-backend"
elif echo "$TEST_RESPONSE" | grep -q "REQUEST_DENIED"; then
    ERROR_MSG=$(echo "$TEST_RESPONSE" | grep -o '"error_message":"[^"]*"' | cut -d'"' -f4)
    echo "   ❌ API key ERROR: $ERROR_MSG"
    echo ""
    if echo "$ERROR_MSG" | grep -qi "expired"; then
        echo "🔧 Fix: Create new API key"
        echo ""
        echo "Steps:"
        echo "1. Go to: https://console.cloud.google.com/apis/credentials"
        echo "2. Create new API key"
        echo "3. Set restrictions: IP addresses (NOT referrers)"
        echo "4. Enable: Places API, Geocoding API"
        echo "5. Run: bash quick-fix-server-key.sh"
    elif echo "$ERROR_MSG" | grep -qi "referer"; then
        echo "🔧 Fix: This key has referer restrictions"
        echo "   Server-side keys cannot have referer restrictions"
        echo "   Create new key with IP restrictions instead"
    fi
elif echo "$TEST_RESPONSE" | grep -q "INVALID_REQUEST"; then
    echo "   ⚠️  Invalid request (key might be malformed)"
else
    echo "   ⚠️  Unexpected response"
    echo "   Response: $(echo "$TEST_RESPONSE" | head -c 200)"
fi

echo ""
echo "======================================="
echo ""

# Check backend logs for recent errors
echo "📋 Recent Backend Errors:"
RECENT_ERRORS=$(pm2 logs stairs-backend --lines 50 --nostream 2>/dev/null | grep -i "expired\|denied\|error" | tail -5)
if [ -z "$RECENT_ERRORS" ]; then
    echo "   ✅ No recent errors"
else
    echo "   Recent errors found:"
    echo "$RECENT_ERRORS" | sed 's/^/   /'
fi

echo ""
echo "💡 To update API key:"
echo "   bash quick-fix-server-key.sh"
echo ""

