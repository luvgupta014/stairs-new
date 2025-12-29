#!/bin/bash
# Test maps endpoint specifically
echo "🧪 Testing Maps API Endpoint"
echo "================================"
echo ""

# Test local endpoint
echo "1️⃣ Testing LOCAL endpoint (localhost:5000):"
LOCAL_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:5000/api/maps/places/autocomplete?input=test 2>&1)
HTTP_CODE=$(echo "$LOCAL_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
BODY=$(echo "$LOCAL_RESPONSE" | grep -v "HTTP_CODE")

echo "   HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" == "200" ]; then
    echo "   ✅ Local endpoint works"
    echo "   Response: $(echo "$BODY" | head -c 200)"
else
    echo "   ❌ Local endpoint returned: $HTTP_CODE"
    echo "   Response: $BODY"
fi
echo ""

# Test external endpoint
echo "2️⃣ Testing EXTERNAL endpoint (via Cloudflare):"
EXTERNAL_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" https://stairs-api.astroraag.com/api/maps/places/autocomplete?input=test 2>&1)
EXTERNAL_HTTP_CODE=$(echo "$EXTERNAL_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
EXTERNAL_BODY=$(echo "$EXTERNAL_RESPONSE" | grep -v "HTTP_CODE")

echo "   HTTP Status: $EXTERNAL_HTTP_CODE"
if [ "$EXTERNAL_HTTP_CODE" == "200" ]; then
    echo "   ✅ External endpoint works"
    echo "   Response: $(echo "$EXTERNAL_BODY" | head -c 200)"
elif [ "$EXTERNAL_HTTP_CODE" == "502" ]; then
    echo "   ❌ External endpoint returning 502 (proxy issue?)"
else
    echo "   ⚠️  External endpoint returned: $EXTERNAL_HTTP_CODE"
    echo "   Response: $EXTERNAL_BODY"
fi
echo ""

# Test CORS headers
echo "3️⃣ Testing CORS Headers (External):"
CORS_RESPONSE=$(curl -s -I -H "Origin: https://portal.stairs.org.in" \
  https://stairs-api.astroraag.com/api/maps/places/autocomplete?input=test 2>&1)

CORS_ORIGIN=$(echo "$CORS_RESPONSE" | grep -i "access-control-allow-origin" || echo "NOT FOUND")
CORS_METHODS=$(echo "$CORS_RESPONSE" | grep -i "access-control-allow-methods" || echo "NOT FOUND")
HTTP_STATUS=$(echo "$CORS_RESPONSE" | grep -i "HTTP/" | head -1)

echo "   HTTP Status: $HTTP_STATUS"
echo "   CORS Origin Header: $CORS_ORIGIN"
echo "   CORS Methods Header: $CORS_METHODS"

if echo "$CORS_ORIGIN" | grep -q "portal.stairs.org.in"; then
    echo "   ✅ CORS headers are present and correct"
else
    echo "   ❌ CORS headers missing or incorrect"
fi
echo ""

# Test OPTIONS preflight
echo "4️⃣ Testing OPTIONS Preflight Request:"
OPTIONS_RESPONSE=$(curl -s -X OPTIONS -H "Origin: https://portal.stairs.org.in" \
  -H "Access-Control-Request-Method: GET" \
  -w "\nHTTP_CODE:%{http_code}" \
  https://stairs-api.astroraag.com/api/maps/places/autocomplete 2>&1)
OPTIONS_CODE=$(echo "$OPTIONS_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)

echo "   HTTP Status: $OPTIONS_CODE"
if [ "$OPTIONS_CODE" == "200" ] || [ "$OPTIONS_CODE" == "204" ]; then
    echo "   ✅ Preflight request works"
else
    echo "   ❌ Preflight request failed: $OPTIONS_CODE"
fi
echo ""

# Check backend logs for maps route
echo "5️⃣ Checking Backend Logs for Maps Route Errors:"
if command -v pm2 &> /dev/null; then
    echo "   Recent logs containing 'maps' or 'places':"
    pm2 logs stairs-backend --lines 50 --nostream 2>/dev/null | grep -i -E "maps|places|autocomplete|error" | tail -10 || echo "   No relevant logs found"
else
    echo "   PM2 not available"
fi
echo ""

echo "================================"
echo "✅ Testing complete!"

