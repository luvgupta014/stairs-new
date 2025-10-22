const axios = require('axios');

async function testStudentEventsWithRealCredentials() {
  try {
    console.log('🧪 Testing Student Events with Real Credentials...\n');
    
    // Use the real student credentials from the database
    const studentLoginData = {
      email: 'herevay180@fogdiver.com',
      password: 'password123' // Assuming default password
    };
    
    console.log('1. Testing student login with real credentials...');
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/student/login', studentLoginData);
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
        console.log(`✅ Found ${eventsResponse.data.data?.events?.length || 0} events for student`);
        console.log('API Response structure:', JSON.stringify(eventsResponse.data, null, 2));
        
        if (eventsResponse.data.data?.events && eventsResponse.data.data.events.length > 0) {
          console.log('\nAvailable events for student:');
          eventsResponse.data.data.events.forEach(event => {
            console.log(`  - ${event.name} (${event.status}) - Start: ${event.startDate}`);
            console.log(`    ID: ${event.id}, Registered: ${event.isRegistered}`);
          });
        } else {
          console.log('❌ No events returned for student');
          console.log('Response data:', eventsResponse.data);
        }
        
      } else {
        console.log('❌ Login failed:', loginResponse.data.message);
      }
    } catch (loginError) {
      console.log('❌ Login failed:', loginError.response?.status, loginError.response?.data?.message || loginError.message);
      
      // Try OTP-based login instead
      console.log('\n3. Testing OTP-based auth (if available)...');
      try {
        const otpResponse = await axios.post('http://localhost:5000/api/auth/student/send-otp', {
          phone: 'herevay180@fogdiver.com' // Try with email as phone
        });
        console.log('OTP sent response:', otpResponse.data);
      } catch (otpError) {
        console.log('❌ OTP send also failed:', otpError.response?.status, otpError.response?.data?.message || otpError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStudentEventsWithRealCredentials();