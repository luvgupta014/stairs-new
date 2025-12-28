#!/bin/bash
# Quick script to create constants directory and sports.js file on server
# Run this on your server

cd ~/stairs-new/frontend/src

# Create constants directory if it doesn't exist
mkdir -p constants

# Check if sports.js exists
if [ ! -f constants/sports.js ]; then
    echo "⚠️  constants/sports.js not found!"
    echo "Please upload the file from your local project:"
    echo "  frontend/src/constants/sports.js"
    echo ""
    echo "Or copy it manually:"
    exit 1
else
    echo "✅ constants/sports.js exists"
    echo "File size: $(wc -l < constants/sports.js) lines"
fi

# Verify file has exports
if grep -q "export.*SORTED_SPORTS" constants/sports.js; then
    echo "✅ File has correct exports"
else
    echo "❌ File missing exports - may be corrupted"
fi

echo ""
echo "If file doesn't exist, upload it from your local machine:"
echo "  scp frontend/src/constants/sports.js root@your-server:/root/stairs-new/frontend/src/constants/"

