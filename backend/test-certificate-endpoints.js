const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const EVENT_ID = 'cmho5esr70005u80opklr4qne';

// You'll need to get a valid admin token
// For now, let's just test the endpoint structure
async function testEndpoints() {
  console.log('🧪 Testing Certificate Endpoints...\n');
  
  try {
    // Test 1: Get eligible students (will fail without auth, but we can see the error)
    console.log('1️⃣ Testing GET /api/certificates/event/:eventId/eligible-students');
    try {
      const response = await axios.get(`${BASE_URL}/api/certificates/event/${EVENT_ID}/eligible-students`, {
        headers: {
          'Authorization': 'Bearer fake-token'
        }
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      if (error.response) {
        console.log(`❌ Status ${error.response.status}:`, error.response.data);
      } else {
        console.log('❌ Error:', error.message);
      }
    }
    
    console.log('\n');
    
    // Test 2: Get issued certificates
    console.log('2️⃣ Testing GET /api/certificates/event/:eventId/issued');
    try {
      const response = await axios.get(`${BASE_URL}/api/certificates/event/${EVENT_ID}/issued`, {
        headers: {
          'Authorization': 'Bearer fake-token'
        }
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      if (error.response) {
        console.log(`❌ Status ${error.response.status}:`, error.response.data);
      } else {
        console.log('❌ Error:', error.message);
      }
    }
    
    console.log('\n');
    
    // Test 3: Health check (no auth needed)
    console.log('3️⃣ Testing GET /health');
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
  } catch (error) {
    console.error('Fatal error:', error.message);
  }
}

testEndpoints();
