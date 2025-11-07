const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Test file upload
async function testFileUpload() {
  try {
    console.log('🧪 Testing file upload...\n');

    // First, login as a coach to get token
    console.log('🔐 Step 1: Logging in as coach...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/coach/login', {
      email: 'john.coach@email.com',
      password: 'password123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...\n');

    // Create a test CSV file
    console.log('📄 Step 2: Creating test CSV file...');
    const testCsvPath = path.join(__dirname, 'test-results.csv');
    const csvContent = `Student ID,Name,Score,Rank
001,Student One,95,1
002,Student Two,87,2
003,Student Three,92,3`;

    fs.writeFileSync(testCsvPath, csvContent);
    console.log('✅ Test CSV created at:', testCsvPath, '\n');

    // Upload the file
    console.log('📤 Step 3: Uploading file...');
    const form = new FormData();
    form.append('files', fs.createReadStream(testCsvPath));
    form.append('description', 'Test event results');

    const eventId = 'cmho5esr70005u80opklr4qne'; // The event ID from the error

    const uploadResponse = await axios.post(
      `http://localhost:5000/api/events/${eventId}/results`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ File uploaded successfully!');
    console.log('📊 Response:', JSON.stringify(uploadResponse.data, null, 2), '\n');

    // Clean up
    fs.unlinkSync(testCsvPath);
    console.log('🧹 Test file cleaned up');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.message) {
      console.error('📋 Error details:', error.response.data.message);
    }
  }
}

testFileUpload();
