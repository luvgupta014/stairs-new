#!/bin/bash
# Final test to verify API key is working
echo "🔍 Final API Key Test"
echo "===================="
echo ""

BACKEND_ENV="/root/stairs-new/backend/.env"

# Get key
CURRENT_KEY=$(grep "^GOOGLE_MAPS_API_KEY=" "$BACKEND_ENV" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')

if [ -z "$CURRENT_KEY" ]; then
    echo "❌ No key found in .env"
    exit 1
fi

echo "✅ APIs Enabled:"
echo "   - Places API"
echo "   - Places API (New)"
echo "   - Geocoding API"
echo "   - Maps JavaScript API"
echo ""

echo "🧪 Testing Key Directly with Google API:"
echo "   Key: ${CURRENT_KEY:0:20}...${CURRENT_KEY: -10}"
echo ""

TEST_URL="https://maps.googleapis.com/maps/api/place/autocomplete/json?input=test&key=$CURRENT_KEY"
RESPONSE=$(curl -s "$TEST_URL" 2>&1)

STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
ERROR_MSG=$(echo "$RESPONSE" | grep -o '"error_message":"[^"]*"' | cut -d'"' -f4)

echo "📋 Response Status: $STATUS"

if [ "$STATUS" == "OK" ]; then
    echo "   ✅ Key is VALID and working!"
    echo ""
    echo "   The key itself is good. If backend still shows errors,"
    echo "   it's a PM2 environment loading issue."
    echo ""
    echo "   Try complete restart:"
    echo "   bash complete-pm2-restart.sh"
elif [ "$STATUS" == "REQUEST_DENIED" ]; then
    echo "   ❌ REQUEST_DENIED"
    echo "   Error: $ERROR_MSG"
    echo ""
    if echo "$ERROR_MSG" | grep -qi "expired"; then
        echo "   🔴 Key IS EXPIRED in Google Cloud Console"
        echo "   → Create a new key in Google Cloud Console"
    elif echo "$ERROR_MSG" | grep -qi "referer"; then
        echo "   🔴 Key has REFERER restrictions"
        echo "   → Change restrictions to IP addresses (NOT referers)"
        echo "   → Or create new key with IP restrictions"
    elif echo "$ERROR_MSG" | grep -qi "not enabled"; then
        echo "   🔴 Required API not enabled"
        echo "   → Check Google Cloud Console"
        echo "   → Ensure Places API is enabled for this key"
    else
        echo "   🔴 Check Google Cloud Console for key restrictions"
    fi
elif [ "$STATUS" == "INVALID_REQUEST" ]; then
    echo "   ❌ INVALID_REQUEST"
    echo "   → Key might be malformed or missing required parameters"
else
    echo "   ⚠️  Unexpected status: $STATUS"
    if [ ! -z "$ERROR_MSG" ]; then
        echo "   Error: $ERROR_MSG"
    fi
fi

echo ""
echo "📋 Testing Through Backend:"
BACKEND_RESPONSE=$(curl -s "http://localhost:5000/api/maps/places/autocomplete?input=test" 2>&1)
BACKEND_STATUS=$(echo "$BACKEND_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "Unknown")

if [ "$BACKEND_STATUS" == "OK" ]; then
    echo "   ✅ Backend working correctly!"
elif echo "$BACKEND_RESPONSE" | grep -q "expired"; then
    echo "   ❌ Backend still showing expired"
    if [ "$STATUS" == "OK" ]; then
        echo "   → Key is valid, but PM2 not loading it"
        echo "   → Run: bash complete-pm2-restart.sh"
    else
        echo "   → Key is actually expired/invalid"
    fi
else
    echo "   Status: $BACKEND_STATUS"
fi

echo ""
echo "===================="
echo ""
echo "📋 Next Steps:"
if [ "$STATUS" == "OK" ]; then
    echo "✅ Key is valid - run complete PM2 restart:"
    echo "   bash complete-pm2-restart.sh"
elif echo "$ERROR_MSG" | grep -qi "expired\|referer"; then
    echo "🔴 Fix key in Google Cloud Console:"
    echo "   1. Create new key OR edit existing key"
    echo "   2. Set restrictions: IP addresses (NOT referers)"
    echo "   3. Add IP: 160.187.22.41"
    echo "   4. Update .env: bash quick-fix-server-key.sh"
    echo "   5. Restart: bash complete-pm2-restart.sh"
else
    echo "⚠️  Check Google Cloud Console for key configuration"
fi
echo ""

