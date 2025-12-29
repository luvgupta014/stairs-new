#!/bin/bash
# Helper script to update browser API key in frontend .env
echo "🔧 Update Browser API Key"
echo "========================="
echo ""

FRONTEND_ENV="/root/stairs-new/frontend/.env"

if [ ! -f "$FRONTEND_ENV" ]; then
    echo "❌ Frontend .env not found at $FRONTEND_ENV"
    echo "Creating .env file..."
    touch "$FRONTEND_ENV"
fi

# Backup
cp "$FRONTEND_ENV" "${FRONTEND_ENV}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backed up .env file"
echo ""

# Show current key
CURRENT_KEY=$(grep "^VITE_GOOGLE_MAPS_API_KEY=" "$FRONTEND_ENV" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')

if [ ! -z "$CURRENT_KEY" ]; then
    KEY_PREVIEW="${CURRENT_KEY:0:20}...${CURRENT_KEY: -10}"
    echo "📋 Current browser key: $KEY_PREVIEW"
    echo ""
    echo "⚠️  Make sure this is a DIFFERENT key from your server key!"
    echo "   - Server key should have IP restrictions"
    echo "   - Browser key should have HTTP referer restrictions"
    echo ""
fi

echo "📝 Instructions:"
echo "1. Go to: https://console.cloud.google.com/apis/credentials"
echo "2. Create a NEW API key for browser use"
echo "3. Set restrictions: HTTP referrers (NOT IP addresses)"
echo "4. Add referer: https://portal.stairs.org.in/*"
echo "5. Enable: Maps JavaScript API"
echo ""
echo "Press Enter to continue after you have the new browser key..."
read

echo ""
read -p "Enter your new browser API key: " NEW_KEY

if [ -z "$NEW_KEY" ]; then
    echo "❌ No key provided. Exiting."
    exit 1
fi

# Remove old key line
sed -i '/^VITE_GOOGLE_MAPS_API_KEY=/d' "$FRONTEND_ENV"

# Add new key
echo "" >> "$FRONTEND_ENV"
echo "# Google Maps API Key (Browser/Frontend)" >> "$FRONTEND_ENV"
echo "VITE_GOOGLE_MAPS_API_KEY=$NEW_KEY" >> "$FRONTEND_ENV"

echo ""
echo "✅ Updated browser key"
echo ""

# Verify it's different from server key
BACKEND_ENV="/root/stairs-new/backend/.env"
if [ -f "$BACKEND_ENV" ]; then
    SERVER_KEY=$(grep "^GOOGLE_MAPS_API_KEY=" "$BACKEND_ENV" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')
    if [ "$NEW_KEY" == "$SERVER_KEY" ]; then
        echo "⚠️  WARNING: Browser key is same as server key!"
        echo "   They should be DIFFERENT!"
        echo "   - Server key: IP restrictions"
        echo "   - Browser key: HTTP referer restrictions"
    else
        echo "✅ Browser key is different from server key (correct)"
    fi
fi

echo ""
echo "📋 Updated key (preview):"
grep "^VITE_GOOGLE_MAPS_API_KEY=" "$FRONTEND_ENV" | sed 's/\(.\{20\}\).*\(.\{10\}\)$/\1...\2/'
echo ""

echo "🚀 Next steps:"
echo "1. Rebuild frontend: cd /root/stairs-new/frontend && npm run build"
echo "2. Restart frontend (if using PM2): pm2 restart b2c-frontend"
echo "3. Clear browser cache and test"
echo ""

