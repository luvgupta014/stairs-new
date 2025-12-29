#!/bin/bash
# Comprehensive API key verification
echo "🔍 Comprehensive API Key Verification"
echo "====================================="
echo ""

BACKEND_ENV="/root/stairs-new/backend/.env"

# 1. Get key from .env
echo "1️⃣ Reading Key from .env:"
if [ ! -f "$BACKEND_ENV" ]; then
    echo "   ❌ .env file not found at $BACKEND_ENV"
    exit 1
fi

CURRENT_KEY=$(grep "^GOOGLE_MAPS_API_KEY=" "$BACKEND_ENV" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')

if [ -z "$CURRENT_KEY" ]; then
    echo "   ❌ No GOOGLE_MAPS_API_KEY found in .env"
    exit 1
fi

KEY_PREVIEW="${CURRENT_KEY:0:20}...${CURRENT_KEY: -10}"
echo "   Key found: $KEY_PREVIEW"
echo "   Full key length: ${#CURRENT_KEY} characters"
echo ""

# 2. Test key directly with Google API
echo "2️⃣ Testing Key Directly with Google Places API:"
echo "   (This bypasses your backend and tests the key directly)"
echo ""

TEST_URL="https://maps.googleapis.com/maps/api/place/autocomplete/json?input=test&key=$CURRENT_KEY"
RESPONSE=$(curl -s "$TEST_URL" 2>&1)

if echo "$RESPONSE" | grep -q '"status":"OK"'; then
    echo "   ✅ Key is VALID - Returns OK status"
    PREDICTIONS=$(echo "$RESPONSE" | grep -o '"predictions":\[' | wc -l)
    echo "   ✅ API is responding correctly"
elif echo "$RESPONSE" | grep -q '"status":"REQUEST_DENIED"'; then
    ERROR_MSG=$(echo "$RESPONSE" | grep -o '"error_message":"[^"]*"' | cut -d'"' -f4)
    echo "   ❌ Key ERROR: $ERROR_MSG"
    echo ""
    if echo "$ERROR_MSG" | grep -qi "expired"; then
        echo "   🔴 The key IS EXPIRED in Google's system"
        echo "   → You need to create a NEW key in Google Cloud Console"
    elif echo "$ERROR_MSG" | grep -qi "referer"; then
        echo "   🔴 The key has REFERER restrictions"
        echo "   → Server-side keys cannot have referer restrictions"
        echo "   → Create new key with IP restrictions instead"
    elif echo "$ERROR_MSG" | grep -qi "API key not valid"; then
        echo "   🔴 The key is INVALID or malformed"
        echo "   → Check if you copied the key correctly"
    else
        echo "   🔴 Unknown error - check Google Cloud Console"
    fi
elif echo "$RESPONSE" | grep -q '"status":"INVALID_REQUEST"'; then
    echo "   ❌ INVALID_REQUEST - Key might be malformed"
    echo "   Response: $(echo "$RESPONSE" | head -c 200)"
else
    echo "   ⚠️  Unexpected response:"
    echo "   Status: $(echo "$RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
    echo "   Response preview: $(echo "$RESPONSE" | head -c 300)"
fi
echo ""

# 3. Check backend is using this key
echo "3️⃣ Verifying Backend is Using This Key:"
# Get the key that backend is actually using (from process env)
PM2_ENV=$(pm2 env 2 | grep GOOGLE_MAPS_API_KEY | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')

if [ -z "$PM2_ENV" ]; then
    echo "   ⚠️  Could not read key from PM2 environment"
    echo "   → Backend might not have reloaded .env"
    echo "   → Try: pm2 delete stairs-backend && pm2 start ..."
else
    PM2_PREVIEW="${PM2_ENV:0:20}...${PM2_ENV: -10}"
    if [ "$CURRENT_KEY" == "$PM2_ENV" ]; then
        echo "   ✅ Backend is using the key from .env"
    else
        echo "   ❌ MISMATCH!"
        echo "   .env key: $KEY_PREVIEW"
        echo "   PM2 key:  $PM2_PREVIEW"
        echo "   → Backend is using a DIFFERENT key!"
        echo "   → Need to fully restart PM2 or delete and recreate process"
    fi
fi
echo ""

# 4. Test through backend
echo "4️⃣ Testing Through Your Backend:"
BACKEND_RESPONSE=$(curl -s "http://localhost:5000/api/maps/places/autocomplete?input=test" 2>&1)

if echo "$BACKEND_RESPONSE" | grep -q '"status":"OK"'; then
    echo "   ✅ Backend endpoint working correctly"
elif echo "$BACKEND_RESPONSE" | grep -q "expired"; then
    echo "   ❌ Backend returning expired error"
    echo "   → This confirms the key is expired"
else
    ERROR=$(echo "$BACKEND_RESPONSE" | grep -o '"error_message":"[^"]*"' | cut -d'"' -f4 || echo "Unknown error")
    echo "   ❌ Backend error: $ERROR"
fi
echo ""

# 5. Recommendations
echo "====================================="
echo "📋 Summary & Recommendations:"
echo ""

if echo "$RESPONSE" | grep -q '"status":"OK"'; then
    echo "✅ Key is VALID - Issue might be with PM2 not reloading"
    echo ""
    echo "Try:"
    echo "   pm2 delete stairs-backend"
    echo "   cd /root/stairs-new/backend"
    echo "   pm2 start npm --name stairs-backend -- start"
    echo "   # or"
    echo "   pm2 start src/index.js --name stairs-backend"
elif echo "$RESPONSE" | grep -qi "expired"; then
    echo "❌ Key IS EXPIRED in Google's system"
    echo ""
    echo "Action Required:"
    echo "1. Go to: https://console.cloud.google.com/apis/credentials"
    echo "2. Find this key (starts with: ${CURRENT_KEY:0:20}...)"
    echo "3. Check if it shows as 'Expired'"
    echo "4. Create a BRAND NEW key:"
    echo "   - Name: STAIRS Backend Server Key"
    echo "   - Restrictions: IP addresses → 160.187.22.41"
    echo "   - APIs: Places API, Geocoding API"
    echo "5. Update .env and restart:"
    echo "   bash quick-fix-server-key.sh"
    echo "   pm2 restart stairs-backend --update-env"
elif echo "$RESPONSE" | grep -qi "referer"; then
    echo "❌ Key has REFERER restrictions (cannot use for server-side)"
    echo ""
    echo "Action Required:"
    echo "1. Create NEW key with IP restrictions (NOT referer)"
    echo "2. Or edit existing key and change restrictions to IP"
else
    echo "⚠️  Key has other issues - check error message above"
fi

echo ""
echo "====================================="

