const axios = require('axios');

async function testRevenueDashboard() {
  try {
    console.log('Testing revenue dashboard endpoint...');
    const response = await axios.get('http://localhost:5000/api/admin/revenue/dashboard?dateRange=90', {
      headers: {
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // Replace with actual admin token
      }
    });
    console.log('✅ Success!');
    console.log('Status:', response.status);
    console.log('Data keys:', Object.keys(response.data));
  } catch (error) {
    console.log('❌ Error:');
    console.log('Status:', error.response?.status);
    console.log('Error message:', error.response?.data);
    console.log('Full error:', error.message);
  }
}

testRevenueDashboard();
