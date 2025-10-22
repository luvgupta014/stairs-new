const axios = require('axios');

async function testEventsAPI() {
  try {
    console.log('🧪 Testing Events API directly...\n');
    
    // Test the general events endpoint first (even without auth)
    console.log('1. Testing general events endpoint...');
    try {
      const response = await axios.get('http://localhost:5000/api/events');
      console.log('✅ Events API response status:', response.status);
      if (response.data.success) {
        console.log(`✅ Found ${response.data.data?.events?.length || 0} events`);
      } else {
        console.log('❌ API returned unsuccessful response:', response.data);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Expected 401 (auth required) - API is working, just needs authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data?.message || error.message);
      }
    }
    
    console.log('\n2. Testing student events endpoint...');
    try {
      const response = await axios.get('http://localhost:5000/api/student/events');
      console.log('✅ Student events API response status:', response.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Expected 401 (auth required) - API is working, just needs authentication');
      } else if (error.response?.status === 500) {
        console.log('❌ Still getting 500 error:', error.response?.data);
      } else {
        console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEventsAPI();