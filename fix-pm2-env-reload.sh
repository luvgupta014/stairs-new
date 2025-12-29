#!/bin/bash
# Fix PM2 environment variable reload issue
echo "🔧 Fixing PM2 Environment Variable Reload"
echo "========================================="
echo ""

# Verify .env has the new key
echo "📋 Checking .env file:"
BACKEND_ENV="/root/stairs-new/backend/.env"
if [ -f "$BACKEND_ENV" ]; then
    CURRENT_KEY=$(grep "^GOOGLE_MAPS_API_KEY=" "$BACKEND_ENV" | cut -d'=' -f2)
    if [ ! -z "$CURRENT_KEY" ]; then
        KEY_PREVIEW="${CURRENT_KEY:0:15}...${CURRENT_KEY: -10}"
        echo "   ✅ Key found: $KEY_PREVIEW"
    else
        echo "   ❌ No GOOGLE_MAPS_API_KEY found in .env"
        exit 1
    fi
else
    echo "   ❌ .env file not found"
    exit 1
fi
echo ""

# Restart with --update-env flag
echo "🔄 Restarting backend with environment variable reload..."
pm2 restart stairs-backend --update-env

echo ""
echo "⏳ Waiting 3 seconds for backend to start..."
sleep 3

# Check if backend is running
echo ""
echo "📋 Backend Status:"
pm2 list | grep stairs-backend

echo ""
echo "🧪 Testing endpoint..."
TEST_RESPONSE=$(curl -s "http://localhost:5000/api/maps/places/autocomplete?input=test" 2>&1)

if echo "$TEST_RESPONSE" | grep -q '"status":"OK"'; then
    echo "   ✅ Endpoint working! API key is valid."
elif echo "$TEST_RESPONSE" | grep -q "expired"; then
    echo "   ❌ Still showing expired error"
    echo ""
    echo "   Possible issues:"
    echo "   1. The new key you created is also expired"
    echo "   2. Key has wrong restrictions (must be IP, not referer)"
    echo "   3. Places API not enabled for this key"
    echo ""
    echo "   Check: https://console.cloud.google.com/apis/credentials"
    echo "   Verify the key:"
    echo "   - Has IP restrictions (NOT referer restrictions)"
    echo "   - Has Places API enabled"
    echo "   - Is not expired"
elif echo "$TEST_RESPONSE" | grep -q "REQUEST_DENIED"; then
    ERROR_MSG=$(echo "$TEST_RESPONSE" | grep -o '"error_message":"[^"]*"' | cut -d'"' -f4)
    echo "   ❌ Error: $ERROR_MSG"
else
    echo "   ⚠️  Unexpected response:"
    echo "   $(echo "$TEST_RESPONSE" | head -c 200)"
fi

echo ""
echo "📋 Recent logs (checking for expired errors):"
EXPIRED_COUNT=$(pm2 logs stairs-backend --lines 20 --nostream 2>/dev/null | grep -i "expired" | wc -l)
if [ "$EXPIRED_COUNT" -eq 0 ]; then
    echo "   ✅ No expired errors in recent logs"
else
    echo "   ⚠️  Found $EXPIRED_COUNT expired error(s) in recent logs"
    echo "   Run: pm2 logs stairs-backend --lines 50 | grep expired"
fi

echo ""
echo "========================================="
echo "✅ Done!"
echo ""
echo "💡 If still showing expired:"
echo "   1. Verify key in Google Cloud Console is not expired"
echo "   2. Check key restrictions (IP, not referer)"
echo "   3. Ensure Places API is enabled"
echo "   4. Try creating a completely new key"
echo ""

