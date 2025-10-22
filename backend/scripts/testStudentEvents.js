const axios = require('axios');

async function testStudentEventsAPI() {
  try {
    console.log('🧪 Testing Student Events API...\n');
    
    // Test 1: Check if server is responsive
    console.log('1. Testing server health...');
    try {
      const healthResponse = await axios.get('http://localhost:5000/api/health');
      console.log('✅ Server is responsive');
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
    }
    
    // Test 2: Test general events endpoint (no auth)
    console.log('\n2. Testing general events endpoint...');
    try {
      const generalResponse = await axios.get('http://localhost:5000/api/events');
      console.log(`✅ General events endpoint works: ${generalResponse.data.events?.length || 0} events found`);
      console.log('Sample event:', generalResponse.data.events?.[0]?.name || 'No events');
    } catch (error) {
      console.log('❌ General events endpoint failed:', error.response?.status, error.response?.data || error.message);
    }
    
    // Test 3: Test student events endpoint (needs auth - will fail but shows the error)
    console.log('\n3. Testing student events endpoint (without auth)...');
    try {
      const studentResponse = await axios.get('http://localhost:5000/api/student/events');
      console.log(`✅ Student events endpoint works: ${studentResponse.data.events?.length || 0} events found`);
    } catch (error) {
      console.log('❌ Student events endpoint failed (expected without auth):', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test 4: Check if there are approved events in database
    console.log('\n4. Direct database check...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const approvedEvents = await prisma.event.findMany({
      where: { 
        status: { in: ['APPROVED', 'ACTIVE'] },
        startDate: { gte: new Date() }
      },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true
      }
    });
    
    console.log(`✅ Database has ${approvedEvents.length} approved future events:`);
    approvedEvents.forEach(event => {
      console.log(`  - ${event.name} (${event.status}) starts ${event.startDate}`);
    });
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStudentEventsAPI();