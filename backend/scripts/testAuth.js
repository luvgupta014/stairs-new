// Test authentication and student events API
const axios = require('axios');

async function testWithAuth() {
  try {
    console.log('🧪 Testing Student Events with Authentication...\n');
    
    // First, let's try to create a demo student login
    const demoLoginData = {
      email: 'student@demo.com',
      password: 'demo123',
      role: 'STUDENT'
    };
    
    console.log('1. Testing student login...');
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', demoLoginData);
      console.log('✅ Login response status:', loginResponse.status);
      
      if (loginResponse.data.success) {
        const token = loginResponse.data.data.token;
        console.log('✅ Received auth token');
        
        // Test student events with the token
        console.log('\n2. Testing student events with auth token...');
        const eventsResponse = await axios.get('http://localhost:5000/api/student/events', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Student events API works!');
        console.log(`✅ Found ${eventsResponse.data.events?.length || 0} events for student`);
        
        if (eventsResponse.data.events && eventsResponse.data.events.length > 0) {
          console.log('\nAvailable events:');
          eventsResponse.data.events.forEach(event => {
            console.log(`  - ${event.name} (${event.status}) - ${event.startDate}`);
          });
        } else {
          console.log('❌ No events returned for student');
        }
        
      } else {
        console.log('❌ Login failed:', loginResponse.data.message);
      }
    } catch (loginError) {
      console.log('❌ Login failed:', loginError.response?.status, loginError.response?.data?.message || loginError.message);
      
      // If login fails, let's try the general events endpoint with no auth to see the difference
      console.log('\n3. Testing if general events endpoint works without auth...');
      try {
        const generalResponse = await axios.get('http://localhost:5000/api/events');
        console.log('✅ General events works without auth');
      } catch (generalError) {
        console.log('❌ General events also requires auth:', generalError.response?.status);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWithAuth();