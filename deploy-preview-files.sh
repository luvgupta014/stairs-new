#!/bin/bash
# Deployment script for event preview functionality
# Run this on your server to deploy all necessary files

set -e

echo "🚀 Deploying Event Preview Files..."
echo ""

# Configuration - UPDATE THESE PATHS
WEBSITE_ROOT="/var/www/stairs-new/frontend/dist"
# OR if different:
# WEBSITE_ROOT="/home/username/public_html"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  This script may need sudo for some operations"
    echo ""
fi

# Step 1: Verify website root exists
if [ ! -d "$WEBSITE_ROOT" ]; then
    echo "❌ Website root not found: $WEBSITE_ROOT"
    echo "Please update WEBSITE_ROOT in this script"
    exit 1
fi

echo "✅ Website root found: $WEBSITE_ROOT"
echo ""

# Step 2: Copy files
echo "📁 Copying files..."

# Copy .htaccess (backup existing first)
if [ -f "$WEBSITE_ROOT/.htaccess" ]; then
    echo "   Backing up existing .htaccess..."
    cp "$WEBSITE_ROOT/.htaccess" "$WEBSITE_ROOT/.htaccess.backup.$(date +%Y%m%d_%H%M%S)"
fi

cp .htaccess "$WEBSITE_ROOT/.htaccess"
echo "   ✅ .htaccess copied"

# Copy PHP file
cp event-preview.php "$WEBSITE_ROOT/event-preview.php"
echo "   ✅ event-preview.php copied"

# Copy debug script
if [ -f "debug-preview.php" ]; then
    cp debug-preview.php "$WEBSITE_ROOT/debug-preview.php"
    echo "   ✅ debug-preview.php copied"
fi

echo ""

# Step 3: Set permissions
echo "🔒 Setting file permissions..."
chmod 644 "$WEBSITE_ROOT/.htaccess"
chmod 644 "$WEBSITE_ROOT/event-preview.php"
if [ -f "$WEBSITE_ROOT/debug-preview.php" ]; then
    chmod 644 "$WEBSITE_ROOT/debug-preview.php"
fi
echo "   ✅ Permissions set"
echo ""

# Step 4: Verify files
echo "🔍 Verifying files..."
if [ -f "$WEBSITE_ROOT/.htaccess" ] && [ -f "$WEBSITE_ROOT/event-preview.php" ]; then
    echo "   ✅ All files in place"
else
    echo "   ❌ Some files missing!"
    exit 1
fi

# Step 5: Check Apache configuration
echo ""
echo "🔧 Checking Apache configuration..."

# Check if mod_rewrite is enabled
if command -v apache2ctl &> /dev/null; then
    if apache2ctl -M 2>/dev/null | grep -q rewrite_module; then
        echo "   ✅ mod_rewrite is enabled"
    else
        echo "   ⚠️  mod_rewrite not enabled"
        echo "   Run: sudo a2enmod rewrite && sudo systemctl restart apache2"
    fi
elif command -v httpd &> /dev/null; then
    if httpd -M 2>/dev/null | grep -q rewrite_module; then
        echo "   ✅ mod_rewrite is enabled"
    else
        echo "   ⚠️  mod_rewrite not enabled"
        echo "   Enable it in httpd.conf"
    fi
else
    echo "   ⚠️  Cannot check mod_rewrite (apache2ctl/httpd not found)"
fi

echo ""

# Step 6: Test backend connection
echo "🔌 Testing backend connection..."
if curl -s --connect-timeout 2 http://localhost:5000/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running"
elif curl -s --connect-timeout 2 http://127.0.0.1:5000/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running (127.0.0.1)"
else
    echo "   ⚠️  Backend not accessible on port 5000"
    echo "   Make sure backend is running: pm2 start src/index.js --name stairs-backend"
fi

echo ""

# Step 7: Summary
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Test PHP file: curl https://portal.stairs.org.in/event-preview.php?id=TEST"
echo "   2. Test bot detection: curl -I -H 'User-Agent: LinkedInBot/1.0' https://portal.stairs.org.in/event/TEST"
echo "   3. Check debug: https://portal.stairs.org.in/debug-preview.php"
echo "   4. Test with LinkedIn Post Inspector"
echo ""
echo "🔍 Troubleshooting:"
echo "   - If PHP returns 404: Check file permissions and location"
echo "   - If rewrite not working: Enable mod_rewrite and AllowOverride All"
echo "   - If backend error: Start backend server"
echo ""

