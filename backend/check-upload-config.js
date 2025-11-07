const fs = require('fs');
const path = require('path');

console.log('🔍 Checking file upload configuration...\n');

// Check if uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/event-results');
console.log('📁 Uploads directory:', uploadsDir);
console.log('✅ Directory exists:', fs.existsSync(uploadsDir));

// Check if temp directory exists
const tempDir = path.join(__dirname, '../temp');
console.log('📁 Temp directory:', tempDir);
console.log('✅ Directory exists:', fs.existsSync(tempDir));

// List files in uploads directory
if (fs.existsSync(uploadsDir)) {
  const files = fs.readdirSync(uploadsDir);
  console.log('\n📋 Files in uploads/event-results:');
  if (files.length > 0) {
    files.forEach(f => console.log('  -', f));
  } else {
    console.log('  (empty)');
  }
}

console.log('\n✅ Configuration check complete');
