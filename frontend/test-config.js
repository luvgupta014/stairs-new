// Configuration Test Script
// Run this in browser console to verify the configuration works

console.log('🧪 Testing Dynamic Environment Configuration...');
console.log('=====================================');

// Test the configuration import
import('./src/config/environment.js')
  .then(module => {
    const { config, getBackendUrl, isDevelopment, isProduction } = module;
    
    console.log('✅ Configuration module loaded successfully');
    console.log('📊 Current Configuration:');
    console.table(config);
    
    console.log('🔍 Configuration Tests:');
    console.log(`  Backend URL: ${getBackendUrl()}`);
    console.log(`  Is Development: ${isDevelopment()}`);
    console.log(`  Is Production: ${isProduction()}`);
    console.log(`  Current Domain: ${window.location.hostname}`);
    console.log(`  Auto-detected URL: ${window.location.protocol}//${window.location.hostname}:5000`);
    
    // Test backend connectivity
    console.log('🌐 Testing Backend Connectivity...');
    fetch(`${config.backendUrl}/health`)
      .then(response => {
        if (response.ok) {
          console.log('✅ Backend is reachable and responding');
          return response.json();
        } else {
          console.log(`⚠️ Backend responded with status: ${response.status}`);
        }
      })
      .then(data => {
        if (data) {
          console.log('📋 Backend Health Data:', data);
        }
      })
      .catch(error => {
        console.log('❌ Backend connectivity test failed:', error.message);
        console.log('💡 This is expected if backend is not running');
      });
      
    console.log('🎯 Configuration Test Complete!');
  })
  .catch(error => {
    console.error('❌ Configuration module failed to load:', error);
  });