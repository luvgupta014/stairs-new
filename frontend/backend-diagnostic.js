// Paste this in browser console to diagnose backend connection issues

(function() {
  console.log('🏥 STAIRS Backend Connection Diagnostic Tool');
  console.log('=========================================');
  
  // Get current configuration
  const frontendUrl = window.location.origin;
  const configuredBackend = window.localStorage.getItem('backendUrl') || 'Unknown';
  
  console.log('📍 Current Location:', frontendUrl);
  console.log('⚙️  Configured Backend:', configuredBackend);
  
  // Test possible backend URLs
  const testUrls = [
    'http://160.187.22.41:5000',
    'http://160.187.22.41:3001',
    'http://160.187.22.41:8000', 
    'http://160.187.22.41:8080',
    'http://localhost:5000',
    frontendUrl.replace(':3008', ':5000')
  ];
  
  console.log('🔍 Testing backend connectivity...');
  
  let foundBackends = [];
  let completedTests = 0;
  
  testUrls.forEach(url => {
    fetch(`${url}/health`, { 
      method: 'GET',
      mode: 'cors',
      signal: AbortSignal.timeout(5000)
    })
    .then(response => {
      completedTests++;
      if (response.ok) {
        console.log(`✅ Backend FOUND at: ${url}`);
        foundBackends.push(url);
        return response.text();
      } else {
        console.log(`❌ ${url} - HTTP ${response.status}`);
      }
    })
    .then(data => {
      if (data) console.log(`📨 Response: ${data}`);
    })
    .catch(error => {
      completedTests++;
      if (error.name === 'TimeoutError') {
        console.log(`⏱️  ${url} - Timeout`);
      } else if (error.message.includes('CORS')) {
        console.log(`🔒 ${url} - CORS blocked (server might be running)`);
      } else {
        console.log(`❌ ${url} - ${error.message}`);
      }
    })
    .finally(() => {
      if (completedTests === testUrls.length) {
        setTimeout(() => {
          console.log('\n📊 DIAGNOSIS COMPLETE');
          console.log('==================');
          
          if (foundBackends.length > 0) {
            console.log(`✅ Found ${foundBackends.length} working backend(s):`);
            foundBackends.forEach(url => console.log(`   - ${url}`));
            console.log('\n💡 Fix: Update frontend environment variables:');
            console.log(`   VITE_BACKEND_URL=${foundBackends[0]}`);
            console.log('   Then rebuild: npm run build');
          } else {
            console.log('❌ No working backends found!');
            console.log('\n💡 Solutions to try:');
            console.log('   1. SSH to server: ssh root@160.187.22.41');
            console.log('   2. Check backend: cd ~/stairs-new/backend && npm run dev');
            console.log('   3. Check processes: pm2 list');
            console.log('   4. Check ports: netstat -tlnp | grep LISTEN');
            console.log('   5. Start backend: pm2 start src/index.js --name backend');
          }
          
          console.log('\n📖 For complete fix guide, see: PRODUCTION_SERVER_FIX.md');
        }, 1000);
      }
    });
  });
  
  // Also test current API configuration
  if (window.debugBackendConnection) {
    console.log('\n🔧 Running built-in debug function...');
    setTimeout(() => window.debugBackendConnection(), 2000);
  }
  
  // Test authentication endpoints specifically
  setTimeout(() => {
    console.log('\n🔐 Testing authentication endpoints...');
    testUrls.slice(0, 3).forEach(url => {
      fetch(`${url}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test', password: 'test' }),
        signal: AbortSignal.timeout(3000)
      })
      .then(response => {
        if (response.status === 400 || response.status === 401) {
          console.log(`✅ Auth endpoint working at: ${url}/api/auth/admin/login`);
        } else {
          console.log(`❓ ${url}/api/auth/admin/login - HTTP ${response.status}`);
        }
      })
      .catch(error => {
        if (!error.message.includes('timeout')) {
          console.log(`❌ ${url}/api/auth/admin/login - ${error.message}`);
        }
      });
    });
  }, 4000);
  
})();