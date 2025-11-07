const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testUpload() {
  try {
    console.log('🧪 Testing Event Result Upload\n');

    // Create test CSV
    const csvPath = path.join(__dirname, 'test-results.csv');
    const csvContent = `Student,Score,Rank
John,95,1
Jane,92,2
Jack,88,3`;
    fs.writeFileSync(csvPath, csvContent);
    console.log('✅ Test CSV created\n');

    // Create FormData
    const form = new FormData();
    form.append('files', fs.createReadStream(csvPath));
    form.append('description', 'Test event results');

    console.log('📤 Uploading file...');
    console.log('📍 Endpoint: http://localhost:5000/api/events/cmho5esr70005u80opklr4qne/results');
    console.log('🔐 Using token from recent login\n');

    // Get a valid token (use hardcoded test token or make login request)
    const loginResp = await axios.post('http://localhost:5000/api/auth/coach/login', {
      email: 'rihimes569@fergetic.com',
      password: 'Temp@123'
    });
    
    const token = loginResp.data.data.token;
    console.log('✅ Got login token\n');

    // Upload file
    const uploadResp = await axios.post(
      'http://localhost:5000/api/events/cmho5esr70005u80opklr4qne/results',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ FILE UPLOAD SUCCESSFUL!\n');
    console.log('📊 Response:', JSON.stringify(uploadResp.data, null, 2));

    // Clean up
    fs.unlinkSync(csvPath);
    console.log('\n🧹 Cleanup complete');

  } catch (error) {
    console.error('❌ UPLOAD FAILED\n');
    console.error('Error:', error.response?.data || error.message);
    if (error.response?.data?.message) {
      console.error('Details:', error.response.data.message);
    }
    if (error.stack) {
      console.error('Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
  }
}

testUpload();
