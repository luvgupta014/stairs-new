#!/bin/bash
# Verify all fixes are working
echo "✅ Verifying All Fixes"
echo "======================"
echo ""

# 1. Test local endpoint
echo "1️⃣ Local Endpoint (localhost:5000):"
LOCAL_TEST=$(curl -s "http://localhost:5000/api/maps/places/autocomplete?input=test")
if echo "$LOCAL_TEST" | grep -q '"status":"OK"'; then
    echo "   ✅ Local endpoint working"
else
    echo "   ❌ Local endpoint error"
    echo "   Response: $(echo "$LOCAL_TEST" | head -c 200)"
fi
echo ""

# 2. Test external endpoint
echo "2️⃣ External Endpoint (via Cloudflare):"
EXTERNAL_TEST=$(curl -s "https://stairs-api.astroraag.com/api/maps/places/autocomplete?input=test")
EXTERNAL_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://stairs-api.astroraag.com/api/maps/places/autocomplete?input=test")

if [ "$EXTERNAL_CODE" == "200" ] && echo "$EXTERNAL_TEST" | grep -q '"status":"OK"'; then
    echo "   ✅ External endpoint working"
elif [ "$EXTERNAL_CODE" == "502" ]; then
    echo "   ⚠️  Still returning 502 - check Apache proxy configuration"
else
    echo "   ⚠️  Status: $EXTERNAL_CODE"
    echo "   Response: $(echo "$EXTERNAL_TEST" | head -c 200)"
fi
echo ""

# 3. Test CORS headers
echo "3️⃣ CORS Headers:"
CORS_HEADERS=$(curl -s -I -H "Origin: https://portal.stairs.org.in" \
  "https://stairs-api.astroraag.com/api/maps/places/autocomplete?input=test" 2>&1)

CORS_ORIGIN=$(echo "$CORS_HEADERS" | grep -i "access-control-allow-origin" || echo "")
CORS_METHODS=$(echo "$CORS_HEADERS" | grep -i "access-control-allow-methods" || echo "")

if echo "$CORS_ORIGIN" | grep -q "portal.stairs.org.in"; then
    echo "   ✅ CORS Origin header present: $CORS_ORIGIN"
else
    echo "   ⚠️  CORS Origin header missing or incorrect"
fi

if [ ! -z "$CORS_METHODS" ]; then
    echo "   ✅ CORS Methods header present: $CORS_METHODS"
else
    echo "   ⚠️  CORS Methods header missing"
fi
echo ""

# 4. Test OPTIONS preflight
echo "4️⃣ OPTIONS Preflight:"
OPTIONS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
  -H "Origin: https://portal.stairs.org.in" \
  -H "Access-Control-Request-Method: GET" \
  "https://stairs-api.astroraag.com/api/maps/places/autocomplete")

if [ "$OPTIONS_CODE" == "200" ] || [ "$OPTIONS_CODE" == "204" ]; then
    echo "   ✅ Preflight request working (HTTP $OPTIONS_CODE)"
else
    echo "   ⚠️  Preflight request returned: HTTP $OPTIONS_CODE"
fi
echo ""

# 5. Check backend logs for recent errors
echo "5️⃣ Recent Backend Errors:"
RECENT_ERRORS=$(pm2 logs stairs-backend --lines 50 --nostream 2>/dev/null | grep -i "error\|denied\|failed" | tail -5)
if [ -z "$RECENT_ERRORS" ]; then
    echo "   ✅ No recent errors found"
else
    echo "   ⚠️  Recent errors:"
    echo "$RECENT_ERRORS" | sed 's/^/      /'
fi
echo ""

echo "======================"
echo "📋 Summary:"
echo ""
if echo "$LOCAL_TEST" | grep -q '"status":"OK"'; then
    echo "✅ Backend Maps API: WORKING"
else
    echo "❌ Backend Maps API: NOT WORKING"
fi

if [ "$EXTERNAL_CODE" == "200" ]; then
    echo "✅ External Access: WORKING"
else
    echo "⚠️  External Access: Check proxy configuration"
fi

if echo "$CORS_ORIGIN" | grep -q "portal.stairs.org.in"; then
    echo "✅ CORS Headers: WORKING"
else
    echo "⚠️  CORS Headers: May need checking"
fi

echo ""
echo "🚀 Next: Test on frontend at https://portal.stairs.org.in/admin/event/create"
echo "   Try typing in the venue field - autocomplete should work!"
echo ""

