#!/bin/bash

# Install Chrome and regenerate certificate
echo "🔧 Installing Chrome for Puppeteer..."

cd /root/stairs-new/backend

# Install Chrome browser
npx puppeteer browsers install chrome

echo ""
echo "✅ Chrome installed"
echo ""
echo "🎓 Regenerating certificate..."
echo ""

# Regenerate the certificate
node regenerate-certificate.js

echo ""
echo "📋 Checking if PDF was created..."
echo ""

# Check if file exists
if [ -f "uploads/certificates/STAIRS-CERT-EVT-0001-FB-GJ-071125-A0001DL071125.pdf" ]; then
    echo "✅ Certificate PDF created successfully!"
    ls -lh uploads/certificates/STAIRS-CERT-EVT-0001-FB-GJ-071125-A0001DL071125.pdf
else
    echo "❌ Certificate PDF not found"
fi

echo ""
echo "Done!"
