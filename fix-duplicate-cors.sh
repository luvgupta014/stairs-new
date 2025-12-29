#!/bin/bash
# Fix duplicate CORS_ORIGINS entries in backend .env
# Run this on your backend server

BACKEND_ENV="/root/stairs-new/backend/.env"

if [ ! -f "$BACKEND_ENV" ]; then
    echo "❌ Backend .env not found at $BACKEND_ENV"
    exit 1
fi

echo "🔧 Fixing duplicate CORS_ORIGINS entries..."
echo ""

# Backup .env
cp "$BACKEND_ENV" "${BACKEND_ENV}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backed up .env file"
echo ""

# Remove all CORS_ORIGINS lines
sed -i '/^CORS_ORIGINS=/d' "$BACKEND_ENV"

# Remove comment lines related to CORS
sed -i '/# CORS Origins/d' "$BACKEND_ENV"

# Add single clean CORS_ORIGINS entry at the end
echo "" >> "$BACKEND_ENV"
echo "# CORS Origins" >> "$BACKEND_ENV"
echo "CORS_ORIGINS=https://portal.stairs.org.in,https://www.portal.stairs.org.in" >> "$BACKEND_ENV"

echo "✅ Fixed duplicate CORS_ORIGINS entries"
echo ""
echo "📋 Current CORS_ORIGINS:"
grep "CORS_ORIGINS" "$BACKEND_ENV"
echo ""
echo "🚀 Now restart your backend:"
echo "   pm2 restart all"
echo "   # or"
echo "   systemctl restart your-backend-service"
echo ""

