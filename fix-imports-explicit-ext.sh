#!/bin/bash
# Backup fix: Add .js extensions explicitly
# Run this if path aliases don't work

cd /root/stairs-new/frontend/src

echo "🔧 Adding .js extensions to all sports imports..."

# Update all imports to use explicit .js extension
sed -i "s|from '@constants/sports'|from '@constants/sports.js'|g" pages/ClubRegister.jsx
sed -i "s|from '@constants/sports'|from '@constants/sports.js'|g" pages/InstituteRegister.jsx
sed -i "s|from '@constants/sports'|from '@constants/sports.js'|g" pages/events/EventCreate.jsx
sed -i "s|from '@constants/sports'|from '@constants/sports.js'|g" components/EventForm.jsx
sed -i "s|from '@constants/sports'|from '@constants/sports.js'|g" pages/StudentRegister.jsx
sed -i "s|from '@constants/sports'|from '@constants/sports.js'|g" pages/StudentAdd.jsx

echo "✅ All imports updated"
echo ""
echo "Now run: cd /root/stairs-new/frontend && npm run build"

