#!/bin/bash
# Check what's actually in the built files
echo "🔍 Checking Built Files for API Key"
echo "===================================="
echo ""

FRONTEND_DIR="/root/stairs-new/frontend"

# Find JavaScript files containing maps.googleapis.com
echo "📋 Searching for maps.googleapis.com in built files:"
FILES=$(find "$FRONTEND_DIR/dist" -name "*.js" -type f 2>/dev/null | head -5)

if [ -z "$FILES" ]; then
    echo "❌ No .js files found in dist/"
    exit 1
fi

for file in $FILES; do
    if grep -q "maps.googleapis.com" "$file" 2>/dev/null; then
        echo ""
        echo "📄 File: $(basename $file)"
        echo "   Size: $(wc -c < "$file" | numfmt --to=iec-i)"
        
        # Try to find the key pattern
        KEY_LINE=$(grep -o "maps.googleapis.com[^\"]*" "$file" | head -1)
        if [ ! -z "$KEY_LINE" ]; then
            echo "   Found: ${KEY_LINE:0:100}..."
            
            # Check if it's the actual key or a variable
            if echo "$KEY_LINE" | grep -q "key="; then
                KEY_VALUE=$(echo "$KEY_LINE" | grep -o "key=[^&]*" | cut -d'=' -f2)
                if [ ! -z "$KEY_VALUE" ]; then
                    KEY_PREVIEW="${KEY_VALUE:0:20}...${KEY_VALUE: -10}"
                    echo "   Key value: $KEY_PREVIEW"
                    
                    if echo "$KEY_VALUE" | grep -q '\${' || echo "$KEY_VALUE" | grep -q 'VITE_'; then
                        echo "   ⚠️  Still contains variable reference!"
                    else
                        echo "   ✅ Appears to be a real key"
                    fi
                fi
            fi
        fi
    fi
done

echo ""
echo "===================================="

