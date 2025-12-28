#!/bin/bash
# Quick fix script for CORS and Google Maps API issues
# Run this on your backend server

echo "🔧 Fixing CORS and Google Maps API Configuration..."
echo ""

BACKEND_ENV="/root/stairs-new/backend/.env"

# Check if .env exists
if [ ! -f "$BACKEND_ENV" ]; then
    echo "❌ Backend .env not found at $BACKEND_ENV"
    echo "   Please create it first or update the path."
    exit 1
fi

# Backup .env
cp "$BACKEND_ENV" "${BACKEND_ENV}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backed up .env file"

# Remove old CORS_ORIGINS line if exists
sed -i '/^CORS_ORIGINS=/d' "$BACKEND_ENV"

# Add CORS_ORIGINS to .env
echo "" >> "$BACKEND_ENV"
echo "# CORS Origins - Added $(date)" >> "$BACKEND_ENV"
echo "CORS_ORIGINS=https://portal.stairs.org.in,https://www.portal.stairs.org.in" >> "$BACKEND_ENV"
echo "✅ Added CORS_ORIGINS to $BACKEND_ENV"
echo ""

# Verify the change
echo "📋 Current CORS_ORIGINS:"
grep "CORS_ORIGINS" "$BACKEND_ENV"
echo ""

echo "📝 Next Steps:"
echo "1. Restart your backend server:"
echo "   pm2 restart all"
echo "   # or"
echo "   systemctl restart your-backend-service"
echo ""
echo "2. Add domain to Google Cloud Console:"
echo "   - Go to: https://console.cloud.google.com/apis/credentials"
echo "   - Edit your Google Maps API key"
echo "   - Add to HTTP referrers:"
echo "     • https://portal.stairs.org.in/*"
echo "     • https://www.portal.stairs.org.in/*"
echo ""
echo "3. Wait 5-10 minutes for Google changes to propagate"
echo ""
echo "✅ Script completed!"

