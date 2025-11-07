const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:5000/api';

// Helper to login and get token
async function loginAsCoach() {
  try {
    // Find a coach with SUCCESS payment status
    const coach = await prisma.coach.findFirst({
      where: { paymentStatus: 'SUCCESS' },
      include: { user: true }
    });
    
    if (!coach) {
      throw new Error('No coach with SUCCESS payment status found');
    }
    
    console.log(`🔐 Logging in as: ${coach.user.email || coach.user.phone}`);
    
    const loginPayload = coach.user.email 
      ? { email: coach.user.email, password: 'Test@123' }
      : { phone: coach.user.phone, password: 'Test@123' };
    
    const response = await axios.post(`${API_URL}/auth/login`, loginPayload);
    
    if (!response.data.success) {
      throw new Error('Login failed: ' + response.data.message);
    }
    
    console.log(`✅ Logged in successfully`);
    return {
      token: response.data.data.token,
      coach: coach
    };
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    throw error;
  }
}

// Test 1: Create a new event with specific IST time
async function testEventCreation(token) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 Test 1: Creating Event with IST Time');
  console.log('='.repeat(60));
  
  const testDate = '2025-11-15T10:00:00'; // 10:00 AM IST on Nov 15
  const testEndDate = '2025-11-15T12:00:00'; // 12:00 PM IST on Nov 15
  
  console.log(`\n📅 Creating event with:`);
  console.log(`   Start: ${testDate} (10:00 AM IST)`);
  console.log(`   End: ${testEndDate} (12:00 PM IST)`);
  
  const eventData = {
    name: 'Date Test Event ' + Date.now(),
    description: 'Testing IST date handling',
    sport: 'Football',
    venue: 'Test Stadium',
    city: 'Delhi',
    state: 'Delhi',
    startDate: testDate,
    endDate: testEndDate,
    maxParticipants: 50
  };
  
  try {
    const response = await axios.post(`${API_URL}/coach/events`, eventData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const event = response.data.data.event;
      console.log(`\n✅ Event created successfully!`);
      console.log(`   Event ID: ${event.id}`);
      console.log(`   Event UID: ${event.uniqueId}`);
      console.log(`   Start Date (from API): ${event.startDate}`);
      console.log(`   End Date (from API): ${event.endDate}`);
      
      // Check in database
      const dbEvent = await prisma.event.findUnique({
        where: { id: event.id }
      });
      
      console.log(`\n📊 Database verification:`);
      console.log(`   Start Date (DB UTC): ${dbEvent.startDate.toISOString()}`);
      console.log(`   Start Date (DB Local): ${dbEvent.startDate.toString()}`);
      console.log(`   End Date (DB UTC): ${dbEvent.endDate.toISOString()}`);
      console.log(`   End Date (DB Local): ${dbEvent.endDate.toString()}`);
      
      // Convert UTC to IST for verification
      const startIST = new Date(dbEvent.startDate.getTime() + (5.5 * 60 * 60 * 1000));
      const endIST = new Date(dbEvent.endDate.getTime() + (5.5 * 60 * 60 * 1000));
      
      console.log(`\n🔍 IST Conversion Check:`);
      console.log(`   Expected Start: 2025-11-15 10:00:00 IST`);
      console.log(`   Actual Start: ${startIST.toISOString().replace('Z', '').substring(0, 19)} IST`);
      console.log(`   Expected End: 2025-11-15 12:00:00 IST`);
      console.log(`   Actual End: ${endIST.toISOString().replace('Z', '').substring(0, 19)} IST`);
      
      const startMatches = startIST.toISOString().startsWith('2025-11-15T10:00:00');
      const endMatches = endIST.toISOString().startsWith('2025-11-15T12:00:00');
      
      if (startMatches && endMatches) {
        console.log(`\n✅ SUCCESS: Dates stored correctly in IST!`);
      } else {
        console.log(`\n❌ FAILED: Dates not stored correctly!`);
      }
      
      return event.id;
    }
  } catch (error) {
    console.error('\n❌ Event creation failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test 2: Fetch events and check date formatting
async function testEventRetrieval(token, eventId) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 Test 2: Fetching Events and Checking Date Format');
  console.log('='.repeat(60));
  
  try {
    const response = await axios.get(`${API_URL}/coach/events`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const events = response.data.data.events;
      console.log(`\n✅ Retrieved ${events.length} events`);
      
      // Find our test event
      const testEvent = events.find(e => e.id === eventId);
      
      if (testEvent) {
        console.log(`\n📅 Test event retrieved:`);
        console.log(`   Name: ${testEvent.name}`);
        console.log(`   Start Date: ${testEvent.startDate}`);
        console.log(`   End Date: ${testEvent.endDate}`);
        
        // Check format
        const startExtracted = testEvent.startDate.substring(0, 16);
        const endExtracted = testEvent.endDate.substring(0, 16);
        
        console.log(`\n🔍 Frontend will use (for datetime-local):`);
        console.log(`   Start: ${startExtracted}`);
        console.log(`   End: ${endExtracted}`);
        
        const expectedStart = '2025-11-15T10:00';
        const expectedEnd = '2025-11-15T12:00';
        
        if (startExtracted === expectedStart && endExtracted === expectedEnd) {
          console.log(`\n✅ SUCCESS: API returns correct IST format for frontend!`);
        } else {
          console.log(`\n❌ FAILED: API format incorrect!`);
          console.log(`   Expected Start: ${expectedStart}`);
          console.log(`   Got Start: ${startExtracted}`);
          console.log(`   Expected End: ${expectedEnd}`);
          console.log(`   Got End: ${endExtracted}`);
        }
        
        return testEvent;
      } else {
        console.log(`\n⚠️ Test event not found in response`);
      }
    }
  } catch (error) {
    console.error('\n❌ Event retrieval failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test 3: Update event and check if dates are preserved
async function testEventUpdate(token, eventId) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 Test 3: Updating Event Dates');
  console.log('='.repeat(60));
  
  const newStartDate = '2025-11-16T14:30:00'; // 2:30 PM IST on Nov 16
  const newEndDate = '2025-11-16T16:30:00'; // 4:30 PM IST on Nov 16
  
  console.log(`\n📅 Updating event with new times:`);
  console.log(`   New Start: ${newStartDate} (2:30 PM IST)`);
  console.log(`   New End: ${newEndDate} (4:30 PM IST)`);
  
  const updateData = {
    name: 'Updated Date Test Event',
    startDate: newStartDate,
    endDate: newEndDate
  };
  
  try {
    const response = await axios.put(`${API_URL}/coach/events/${eventId}`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      console.log(`\n✅ Event updated successfully!`);
      
      // Verify in database
      const dbEvent = await prisma.event.findUnique({
        where: { id: eventId }
      });
      
      console.log(`\n📊 Database after update:`);
      console.log(`   Start Date (DB UTC): ${dbEvent.startDate.toISOString()}`);
      console.log(`   End Date (DB UTC): ${dbEvent.endDate.toISOString()}`);
      
      // Convert to IST
      const startIST = new Date(dbEvent.startDate.getTime() + (5.5 * 60 * 60 * 1000));
      const endIST = new Date(dbEvent.endDate.getTime() + (5.5 * 60 * 60 * 1000));
      
      console.log(`\n🔍 IST Conversion Check:`);
      console.log(`   Expected Start: 2025-11-16 14:30:00 IST`);
      console.log(`   Actual Start: ${startIST.toISOString().replace('Z', '').substring(0, 19)} IST`);
      console.log(`   Expected End: 2025-11-16 16:30:00 IST`);
      console.log(`   Actual End: ${endIST.toISOString().replace('Z', '').substring(0, 19)} IST`);
      
      const startMatches = startIST.toISOString().startsWith('2025-11-16T14:30:00');
      const endMatches = endIST.toISOString().startsWith('2025-11-16T16:30:00');
      
      if (startMatches && endMatches) {
        console.log(`\n✅ SUCCESS: Updated dates stored correctly in IST!`);
      } else {
        console.log(`\n❌ FAILED: Updated dates not stored correctly!`);
      }
      
      // Fetch again to verify API response
      const fetchResponse = await axios.get(`${API_URL}/coach/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedEvent = fetchResponse.data.data.events.find(e => e.id === eventId);
      
      if (updatedEvent) {
        console.log(`\n📅 Event retrieved after update:`);
        console.log(`   Start Date: ${updatedEvent.startDate}`);
        console.log(`   End Date: ${updatedEvent.endDate}`);
        
        const startExtracted = updatedEvent.startDate.substring(0, 16);
        const endExtracted = updatedEvent.endDate.substring(0, 16);
        
        if (startExtracted === '2025-11-16T14:30' && endExtracted === '2025-11-16T16:30') {
          console.log(`\n✅ SUCCESS: API returns correct updated IST times!`);
        } else {
          console.log(`\n❌ FAILED: API returns incorrect times after update!`);
        }
      }
    }
  } catch (error) {
    console.error('\n❌ Event update failed:', error.response?.data || error.message);
    throw error;
  }
}

// Main test runner
async function runTests() {
  console.log('\n🧪 COMPREHENSIVE IST DATE HANDLING TEST');
  console.log('Testing Event Creation and Update with IST Times\n');
  
  try {
    // Step 1: Login
    const { token, coach } = await loginAsCoach();
    console.log(`   Coach: ${coach.name}`);
    console.log(`   Coach ID: ${coach.id}`);
    
    // Step 2: Create event
    const eventId = await testEventCreation(token);
    
    // Step 3: Retrieve events
    await testEventRetrieval(token, eventId);
    
    // Step 4: Update event
    await testEventUpdate(token, eventId);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS COMPLETED!');
    console.log('='.repeat(60));
    console.log('\n✅ If all tests passed, your IST date handling is working correctly!');
    console.log('   - Events are created with correct IST times');
    console.log('   - Events are retrieved with correct IST format');
    console.log('   - Events can be updated with new IST times');
    console.log('\n📝 You can now test in the UI:');
    console.log('   1. Login as coach at http://localhost:5173');
    console.log('   2. Create an event with time "10:00 AM"');
    console.log('   3. Check that it shows "10:00 AM" when you edit it');
    console.log('   4. Update to "2:30 PM" and verify it saves correctly\n');
    
  } catch (error) {
    console.error('\n❌ Tests failed with error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
runTests();
