#!/bin/bash
# Verify the key is actually being used at runtime
echo "🔍 Runtime Key Verification Guide"
echo "=================================="
echo ""

FRONTEND_DIR="/root/stairs-new/frontend"
FRONTEND_ENV="$FRONTEND_DIR/.env"

# Get expected key
EXPECTED_KEY=$(grep "^VITE_GOOGLE_MAPS_API_KEY=" "$FRONTEND_ENV" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')

if [ -z "$EXPECTED_KEY" ]; then
    echo "❌ No key found in .env"
    exit 1
fi

KEY_PREVIEW="${EXPECTED_KEY:0:20}...${EXPECTED_KEY: -10}"
echo "📋 Expected key in .env: $KEY_PREVIEW"
echo ""

# Check .env.production
if [ -f "$FRONTEND_DIR/.env.production" ]; then
    PROD_KEY=$(grep "^VITE_GOOGLE_MAPS_API_KEY=" "$FRONTEND_DIR/.env.production" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')
    if [ ! -z "$PROD_KEY" ]; then
        PROD_PREVIEW="${PROD_KEY:0:20}...${PROD_KEY: -10}"
        echo "📋 Key in .env.production: $PROD_PREVIEW"
        if [ "$PROD_KEY" == "$EXPECTED_KEY" ]; then
            echo "   ✅ Matches .env"
        else
            echo "   ⚠️  Different from .env"
        fi
    else
        echo "   ⚠️  .env.production exists but no key found"
    fi
else
    echo "⚠️  .env.production not found"
    echo "   Creating it now..."
    echo "VITE_GOOGLE_MAPS_API_KEY=$EXPECTED_KEY" > "$FRONTEND_DIR/.env.production"
    echo "   ✅ Created .env.production"
fi

echo ""
echo "=================================="
echo "📋 IMPORTANT: Test in Browser"
echo ""
echo "The '${L}...' pattern might just be minified code."
echo "To verify the key is actually working:"
echo ""
echo "1. Open browser: https://portal.stairs.org.in/admin/event/create"
echo "2. Open DevTools (F12) → Console tab"
echo "3. Look for log: '🔍 Environment check:'"
echo "4. Check: 'API Key exists: true/false'"
echo ""
echo "If it shows 'true', the key IS loaded correctly!"
echo "The authorization error might just be from unchecked checkboxes"
echo "in Google Cloud Console."
echo ""
echo "=================================="
echo ""

