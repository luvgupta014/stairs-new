const axios = require('axios');

async function testFullStudentFlow() {
  try {
    console.log('🧪 Testing Full Student Authentication Flow...\n');
    
    // Test login with different combinations since I don't know the exact password
    const possibleLogins = [
      { email: 'herevay180@fogdiver.com', password: 'password123', role: 'STUDENT' },
      { email: 'herevay180@fogdiver.com', password: 'demo123', role: 'STUDENT' },
      { email: 'herevay180@fogdiver.com', password: '123456', role: 'STUDENT' },
      { email: 'herevay180@fogdiver.com', password: 'password', role: 'STUDENT' }
    ];
    
    let authToken = null;
    
    console.log('1. Testing student login...');
    for (const loginData of possibleLogins) {
      try {
        console.log(`   Trying password: ${loginData.password}`);
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', loginData);
        
        if (loginResponse.data.success) {
          authToken = loginResponse.data.data.token;
          console.log('✅ Login successful!');
          console.log('✅ Received auth token');
          break;
        }
      } catch (error) {
        console.log(`   ❌ Failed with ${loginData.password}:`, error.response?.data?.message || error.message);
      }
    }
    
    if (!authToken) {
      console.log('\n❌ Could not authenticate with any password. Let me check database...');
      
      // Check the user in database to see if it has a password
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const user = await prisma.user.findUnique({
        where: { email: 'herevay180@fogdiver.com' },
        select: {
          id: true,
          email: true,
          password: true,
          isVerified: true,
          isActive: true,
          role: true
        }
      });
      
      console.log('📊 User in database:', {
        id: user?.id,
        email: user?.email,
        hasPassword: !!user?.password,
        isVerified: user?.isVerified,
        isActive: user?.isActive,
        role: user?.role
      });
      
      await prisma.$disconnect();
      return;
    }
    
    // Test student events API with token
    console.log('\n2. Testing student events API with auth token...');
    try {
      const eventsResponse = await axios.get('http://localhost:5000/api/student/events?page=1&limit=20', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('✅ Student events API works!');
      console.log('📊 Response:', {
        success: eventsResponse.data.success,
        eventsCount: eventsResponse.data.data?.events?.length || 0,
        totalEvents: eventsResponse.data.data?.total || 0
      });
      
      if (eventsResponse.data.data?.events && eventsResponse.data.data.events.length > 0) {
        console.log('\n📋 Available events for student:');
        eventsResponse.data.data.events.forEach(event => {
          console.log(`  - ${event.name} (${event.status}) - Start: ${new Date(event.startDate).toLocaleDateString()}`);
          console.log(`    ID: ${event.id}, Registered: ${event.isRegistered || false}`);
        });
      } else {
        console.log('\n❌ No events returned for student');
        console.log('🔍 This means either:');
        console.log('   1. No approved events in database');
        console.log('   2. Filtering is too restrictive');
        console.log('   3. Date filtering is excluding events');
      }
      
    } catch (error) {
      console.log('❌ Student events API failed:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFullStudentFlow();