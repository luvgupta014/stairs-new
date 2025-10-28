const fs = require('fs');
const path = require('path');

// Directories to ensure exist
const directories = [
  path.join(__dirname, 'temp'),
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads', 'event-results')
];

console.log('🔍 Checking required directories...');

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`✓ Directory exists: ${dir}`);
  }
});

console.log('✅ All required directories are ready!');
