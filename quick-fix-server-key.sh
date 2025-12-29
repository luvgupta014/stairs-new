#!/bin/bash
# Quick helper script to update backend Google Maps API key
# Run this AFTER creating the new server key in Google Cloud Console

echo "🔧 Google Maps Server Key Update Helper"
echo "========================================"
echo ""

BACKEND_ENV="/root/stairs-new/backend/.env"

if [ ! -f "$BACKEND_ENV" ]; then
    echo "❌ Backend .env not found at $BACKEND_ENV"
    exit 1
fi

echo "📋 Current Google Maps API Key:"
CURRENT_KEY=$(grep "^GOOGLE_MAPS_API_KEY=" "$BACKEND_ENV" | cut -d'=' -f2)
if [ -z "$CURRENT_KEY" ]; then
    echo "   ⚠️  No key found in .env"
else
    # Show first 10 and last 4 characters
    KEY_PREVIEW="${CURRENT_KEY:0:10}...${CURRENT_KEY: -4}"
    echo "   Current: $KEY_PREVIEW"
fi
echo ""

echo "📝 Instructions:"
echo "1. Go to: https://console.cloud.google.com/apis/credentials"
echo "2. Create a NEW API key for server-side use"
echo "3. Set restrictions: IP addresses (NOT referrers)"
echo "4. Add your server IP: 160.187.22.41"
echo "5. Enable Places API in API restrictions"
echo "6. Copy the new key"
echo ""

read -p "Enter your new server API key (or press Ctrl+C to cancel): " NEW_KEY

if [ -z "$NEW_KEY" ]; then
    echo "❌ No key provided. Exiting."
    exit 1
fi

# Backup .env
cp "$BACKEND_ENV" "${BACKEND_ENV}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backed up .env file"
echo ""

# Update the key
if grep -q "^GOOGLE_MAPS_API_KEY=" "$BACKEND_ENV"; then
    # Replace existing key
    sed -i "s|^GOOGLE_MAPS_API_KEY=.*|GOOGLE_MAPS_API_KEY=$NEW_KEY|" "$BACKEND_ENV"
    echo "✅ Updated existing GOOGLE_MAPS_API_KEY"
else
    # Add new key
    echo "" >> "$BACKEND_ENV"
    echo "# Google Maps API Key (Server-side)" >> "$BACKEND_ENV"
    echo "GOOGLE_MAPS_API_KEY=$NEW_KEY" >> "$BACKEND_ENV"
    echo "✅ Added new GOOGLE_MAPS_API_KEY"
fi

echo ""
echo "📋 Updated key (preview):"
grep "^GOOGLE_MAPS_API_KEY=" "$BACKEND_ENV" | sed 's/\(.\{10\}\).*\(.\{4\}\)$/\1...\2/'
echo ""

echo "🚀 Next steps:"
echo "1. Restart backend: pm2 restart stairs-backend"
echo "2. Test endpoint: curl http://localhost:5000/api/maps/places/autocomplete?input=test"
echo "3. Check logs: pm2 logs stairs-backend --lines 20"
echo ""

read -p "Restart backend now? (y/n): " RESTART

if [ "$RESTART" == "y" ] || [ "$RESTART" == "Y" ]; then
    echo "🔄 Restarting backend..."
    pm2 restart stairs-backend
    echo "✅ Backend restarted"
    echo ""
    echo "📋 Recent logs:"
    sleep 2
    pm2 logs stairs-backend --lines 10 --nostream
else
    echo "⏭️  Skipping restart. Run 'pm2 restart stairs-backend' when ready."
fi

echo ""
echo "✅ Done!"

