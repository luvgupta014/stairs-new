#!/bin/bash
# Complete deployment script for sports.js file
# Run this on your server: bash deploy-sports-file.sh

set -e

echo "🚀 Deploying Sports Constants File..."
echo ""

# Set paths
PROJECT_ROOT="/root/stairs-new"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
CONSTANTS_DIR="$FRONTEND_DIR/src/constants"
SPORTS_FILE="$CONSTANTS_DIR/sports.js"

# Create directory
echo "📁 Creating constants directory..."
mkdir -p "$CONSTANTS_DIR"
echo "✅ Directory created: $CONSTANTS_DIR"
echo ""

# Create sports.js file
echo "📝 Creating sports.js file..."
cat > "$SPORTS_FILE" << 'SPORTS_EOF'
/**
 * Comprehensive Sports List
 * Includes all sports from Olympics, Commonwealth Games, Asian Games, and KIYG
 * Plus eSports category
 */

// All sports in alphabetical order
export const ALL_SPORTS = [
  // A
  '3x3 Basketball',
  'Archery',
  'Artistic Swimming',
  'Athletics',
  
  // B
  'Badminton',
  'Baseball',
  'Basketball', // 5x5 Basketball
  'Beach Volleyball',
  'Boxing',
  'Breaking',
  'Bridge',
  
  // C
  'Canoeing',
  'Chess',
  'Cricket', // Adding common sports not in table
  'Cycling',
  
  // D
  'Diving',
  
  // E
  'Equestrian',
  'Esports', // New category
  
  // F
  'Fencing',
  'Flag Football',
  'Football',
  
  // G
  'Gatka',
  'Go',
  'Golf',
  'Gymnastics',
  
  // H
  'Handball',
  'Hockey',
  
  // J
  'Ju-jitsu',
  'Judo',
  
  // K
  'Kabaddi',
  'Kalaripayattu',
  'Karate',
  'Kho-Kho',
  'Kurash',
  
  // L
  'Lacrosse',
  'Lawn Bowls',
  
  // M
  'Mallakhamb',
  'Modern Pentathlon',
  
  // N
  'Netball',
  
  // O
  'Open Water Swimming',
  'Other', // For any sport not listed
  
  // P
  'Para Powerlifting',
  
  // R
  'Rowing',
  'Rugby',
  'Rugby Sevens',
  
  // S
  'Sailing',
  'Sepak Takraw',
  'Shooting',
  'Skateboarding',
  'Softball',
  'Sport Climbing',
  'Squash',
  'Surfing',
  'Swimming',
  
  // T
  'Table Tennis',
  'Taekwondo',
  'Tennis',
  'Thang-Ta',
  'Triathlon',
  
  // V
  'Volleyball', // Indoor Volleyball
  
  // W
  'Water Polo',
  'Weightlifting',
  'Wrestling',
  'Wushu',
  
  // X
  'Xiangqi',
  
  // Y
  'Yogasana'
];

// Sports organized by category
export const SPORTS_BY_CATEGORY = {
  'Olympic Sports': [
    '3x3 Basketball',
    'Archery',
    'Artistic Swimming',
    'Athletics',
    'Badminton',
    'Baseball',
    'Basketball',
    'Beach Volleyball',
    'Boxing',
    'Breaking',
    'Canoeing',
    'Cycling',
    'Diving',
    'Equestrian',
    'Fencing',
    'Flag Football',
    'Football',
    'Golf',
    'Gymnastics',
    'Handball',
    'Hockey',
    'Judo',
    'Karate',
    'Lacrosse',
    'Modern Pentathlon',
    'Open Water Swimming',
    'Rowing',
    'Rugby Sevens',
    'Sailing',
    'Shooting',
    'Skateboarding',
    'Softball',
    'Sport Climbing',
    'Squash',
    'Surfing',
    'Swimming',
    'Table Tennis',
    'Taekwondo',
    'Tennis',
    'Triathlon',
    'Volleyball',
    'Water Polo',
    'Weightlifting',
    'Wrestling'
  ],
  
  'Commonwealth Sports': [
    'Athletics',
    'Badminton',
    'Basketball',
    'Beach Volleyball',
    'Boxing',
    'Bridge',
    'Canoeing',
    'Chess',
    'Cycling',
    'Diving',
    'Equestrian',
    'Fencing',
    'Football',
    'Golf',
    'Gymnastics',
    'Handball',
    'Hockey',
    'Ju-jitsu',
    'Judo',
    'Kabaddi',
    'Karate',
    'Kurash',
    'Lawn Bowls',
    'Modern Pentathlon',
    'Netball',
    'Open Water Swimming',
    'Para Powerlifting',
    'Rowing',
    'Rugby Sevens',
    'Sailing',
    'Sepak Takraw',
    'Shooting',
    'Skateboarding',
    'Sport Climbing',
    'Squash',
    'Surfing',
    'Swimming',
    'Table Tennis',
    'Taekwondo',
    'Tennis',
    'Triathlon',
    'Volleyball',
    'Water Polo',
    'Weightlifting',
    'Wrestling',
    'Wushu',
    'Xiangqi',
    'Go',
    'Esports'
  ],
  
  'Asian Games / KIYG Sports': [
    '3x3 Basketball',
    'Archery',
    'Athletics',
    'Badminton',
    'Basketball',
    'Boxing',
    'Cycling',
    'Football',
    'Gatka',
    'Gymnastics',
    'Hockey',
    'Judo',
    'Kabaddi',
    'Kalaripayattu',
    'Kho-Kho',
    'Mallakhamb',
    'Rugby',
    'Swimming',
    'Table Tennis',
    'Thang-Ta',
    'Weightlifting',
    'Wrestling',
    'Yogasana'
  ],
  
  'eSports': [
    'Esports'
  ],
  
  'Traditional / Regional Sports': [
    'Gatka',
    'Kabaddi',
    'Kalaripayattu',
    'Kho-Kho',
    'Mallakhamb',
    'Sepak Takraw',
    'Thang-Ta',
    'Wushu',
    'Yogasana'
  ],
  
  'Mind Sports': [
    'Bridge',
    'Chess',
    'Go',
    'Xiangqi'
  ],
  
  'Combat Sports': [
    'Boxing',
    'Breaking',
    'Judo',
    'Ju-jitsu',
    'Karate',
    'Kalaripayattu',
    'Kurash',
    'Taekwondo',
    'Wrestling',
    'Wushu'
  ],
  
  'Water Sports': [
    'Artistic Swimming',
    'Canoeing',
    'Diving',
    'Open Water Swimming',
    'Rowing',
    'Sailing',
    'Swimming',
    'Water Polo'
  ],
  
  'Team Sports': [
    '3x3 Basketball',
    'Baseball',
    'Basketball',
    'Beach Volleyball',
    'Football',
    'Handball',
    'Hockey',
    'Lacrosse',
    'Netball',
    'Rugby',
    'Rugby Sevens',
    'Softball',
    'Volleyball',
    'Water Polo'
  ]
};

// Popular sports (most commonly used)
export const POPULAR_SPORTS = [
  'Football',
  'Cricket',
  'Basketball',
  'Tennis',
  'Badminton',
  'Volleyball',
  'Hockey',
  'Athletics',
  'Swimming',
  'Table Tennis',
  'Boxing',
  'Wrestling',
  'Kabaddi',
  'Archery',
  'Cycling',
  'Gymnastics',
  'Golf',
  'Shooting',
  'Weightlifting',
  'Esports'
];

// Sort alphabetically for easy selection
export const SORTED_SPORTS = [...ALL_SPORTS].sort((a, b) => 
  a.localeCompare(b, undefined, { sensitivity: 'base' })
);

// Default export - all sports sorted
export default SORTED_SPORTS;
SPORTS_EOF

echo "✅ File created: $SPORTS_FILE"
echo ""

# Set permissions
chmod 644 "$SPORTS_FILE"
echo "✅ Permissions set"
echo ""

# Verify file
echo "🔍 Verifying file..."
if [ -f "$SPORTS_FILE" ]; then
    LINE_COUNT=$(wc -l < "$SPORTS_FILE")
    echo "✅ File exists ($LINE_COUNT lines)"
    
    if grep -q "export const SORTED_SPORTS" "$SPORTS_FILE"; then
        echo "✅ File has correct exports"
    else
        echo "❌ File missing exports!"
        exit 1
    fi
else
    echo "❌ File creation failed!"
    exit 1
fi

echo ""
echo "✅ Sports file deployed successfully!"
echo ""
echo "📦 Next: Build the frontend"
echo "   cd $FRONTEND_DIR"
echo "   npm run build"
echo ""

