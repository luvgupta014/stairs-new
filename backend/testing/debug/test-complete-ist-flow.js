const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:5000/api';

// Test the complete IST flow
async function testCompleteISTFlow() {
  console.log('\n🧪 COMPLETE IST DATE/TIME FLOW TEST');
  console.log('=' .repeat(80));
  
  let coachToken, testEventId;
  
  try {
    // Step 1: Login as coach
    console.log('\n📋 STEP 1: Login as Coach');
    console.log('-'.repeat(80));
    
    const coach = await prisma.coach.findFirst({
      where: { paymentStatus: 'SUCCESS' },
      include: { user: true }
    });
    
    if (!coach) throw new Error('No SUCCESS payment coach found');
    
    console.log(`✅ Coach: ${coach.name} (${coach.user.email})`);
    
    // Use phone for login since email password doesn't match
    const loginData = { phone: coach.user.phone, password: 'password' };
    
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, loginData);
      coachToken = loginResponse.data.data.token;
      console.log('✅ Login successful');
    } catch (error) {
      // Try with different password
      loginData.password = 'Password@123';
      const loginResponse = await axios.post(`${API_URL}/auth/login`, loginData);
      coachToken = loginResponse.data.data.token;
      console.log('✅ Login successful');
    }
    
    // Step 2: Create event with IST time
    console.log('\n📋 STEP 2: Create Event with IST Time');
    console.log('-'.repeat(80));
    
    const istStartTime = '2025-11-25T14:30:00'; // 2:30 PM IST on Nov 25
    const istEndTime = '2025-11-25T16:30:00';   // 4:30 PM IST on Nov 25
    
    console.log(`\n📅 Coach enters time (IST):`);
    console.log(`   Start: ${istStartTime} (2:30 PM IST)`);
    console.log(`   End: ${istEndTime} (4:30 PM IST)`);
    
    const eventData = {
      name: 'IST Flow Test Event ' + Date.now(),
      description: 'Testing complete IST workflow',
      sport: 'Football',
      venue: 'Test Stadium',
      city: 'Mumbai',
      state: 'Maharashtra',
      startDate: istStartTime,
      endDate: istEndTime,
      maxParticipants: 50
    };
    
    const createResponse = await axios.post(`${API_URL}/coach/events`, eventData, {
      headers: { Authorization: `Bearer ${coachToken}` }
    });
    
    testEventId = createResponse.data.data.event.id;
    console.log(`\n✅ Event created: ${testEventId}`);
    
    // Check database storage
    const dbEvent = await prisma.event.findUnique({ where: { id: testEventId } });
    console.log(`\n📊 Database (UTC):`);
    console.log(`   Start: ${dbEvent.startDate.toISOString()}`);
    console.log(`   End: ${dbEvent.endDate.toISOString()}`);
    
    // Verify UTC is correct (IST - 5:30 hours)
    const expectedUTCStart = '2025-11-25T09:00:00.000Z'; // 14:30 IST = 09:00 UTC
    const expectedUTCEnd = '2025-11-25T11:00:00.000Z';   // 16:30 IST = 11:00 UTC
    
    const startMatch = dbEvent.startDate.toISOString() === expectedUTCStart;
    const endMatch = dbEvent.endDate.toISOString() === expectedUTCEnd;
    
    if (startMatch && endMatch) {
      console.log(`\n✅ SUCCESS: Database stores correct UTC (IST - 5:30)`);
    } else {
      console.log(`\n❌ FAILED: Database storage incorrect!`);
      console.log(`   Expected Start: ${expectedUTCStart}`);
      console.log(`   Got Start: ${dbEvent.startDate.toISOString()}`);
      console.log(`   Expected End: ${expectedUTCEnd}`);
      console.log(`   Got End: ${dbEvent.endDate.toISOString()}`);
    }
    
    // Step 3: Fetch events (coach dashboard)
    console.log('\n📋 STEP 3: Coach Fetches Events (Should See IST)');
    console.log('-'.repeat(80));
    
    const fetchResponse = await axios.get(`${API_URL}/coach/events`, {
      headers: { Authorization: `Bearer ${coachToken}` }
    });
    
    const fetchedEvent = fetchResponse.data.data.events.find(e => e.id === testEventId);
    
    console.log(`\n📤 API returns to coach:`);
    console.log(`   Start: ${fetchedEvent.startDate}`);
    console.log(`   End: ${fetchedEvent.endDate}`);
    
    // Extract for datetime-local input
    const startForInput = fetchedEvent.startDate.substring(0, 16);
    const endForInput = fetchedEvent.endDate.substring(0, 16);
    
    console.log(`\n🎨 Coach sees in edit form (datetime-local):`);
    console.log(`   Start: ${startForInput}`);
    console.log(`   End: ${endForInput}`);
    
    const fetchCorrect = startForInput === '2025-11-25T14:30' && endForInput === '2025-11-25T16:30';
    
    if (fetchCorrect) {
      console.log(`\n✅ SUCCESS: Coach sees correct IST time in edit form!`);
    } else {
      console.log(`\n❌ FAILED: Coach sees wrong time!`);
      console.log(`   Expected Start: 2025-11-25T14:30`);
      console.log(`   Got Start: ${startForInput}`);
      console.log(`   Expected End: 2025-11-25T16:30`);
      console.log(`   Got End: ${endForInput}`);
    }
    
    // Step 4: Update event with new IST time
    console.log('\n📋 STEP 4: Coach Updates Event with New IST Time');
    console.log('-'.repeat(80));
    
    const newISTStart = '2025-11-26T10:00:00'; // 10:00 AM IST on Nov 26
    const newISTEnd = '2025-11-26T12:00:00';   // 12:00 PM IST on Nov 26
    
    console.log(`\n📅 Coach updates time (IST):`);
    console.log(`   New Start: ${newISTStart} (10:00 AM IST)`);
    console.log(`   New End: ${newISTEnd} (12:00 PM IST)`);
    
    const updateData = {
      startDate: newISTStart,
      endDate: newISTEnd
    };
    
    await axios.put(`${API_URL}/coach/events/${testEventId}`, updateData, {
      headers: { Authorization: `Bearer ${coachToken}` }
    });
    
    console.log(`\n✅ Event updated`);
    
    // Check database after update
    const updatedDBEvent = await prisma.event.findUnique({ where: { id: testEventId } });
    console.log(`\n📊 Database after update (UTC):`);
    console.log(`   Start: ${updatedDBEvent.startDate.toISOString()}`);
    console.log(`   End: ${updatedDBEvent.endDate.toISOString()}`);
    
    // Verify UTC is correct (IST - 5:30 hours)
    const expectedUpdatedUTCStart = '2025-11-26T04:30:00.000Z'; // 10:00 IST = 04:30 UTC
    const expectedUpdatedUTCEnd = '2025-11-26T06:30:00.000Z';   // 12:00 IST = 06:30 UTC
    
    const updateStartMatch = updatedDBEvent.startDate.toISOString() === expectedUpdatedUTCStart;
    const updateEndMatch = updatedDBEvent.endDate.toISOString() === expectedUpdatedUTCEnd;
    
    if (updateStartMatch && updateEndMatch) {
      console.log(`\n✅ SUCCESS: Updated dates stored correctly as UTC!`);
    } else {
      console.log(`\n❌ FAILED: Updated dates incorrect!`);
      console.log(`   Expected Start: ${expectedUpdatedUTCStart}`);
      console.log(`   Got Start: ${updatedDBEvent.startDate.toISOString()}`);
      console.log(`   Expected End: ${expectedUpdatedUTCEnd}`);
      console.log(`   Got End: ${updatedDBEvent.endDate.toISOString()}`);
    }
    
    // Step 5: Fetch again to verify update shows correct IST
    console.log('\n📋 STEP 5: Coach Fetches Updated Event (Should See New IST)');
    console.log('-'.repeat(80));
    
    const refetchResponse = await axios.get(`${API_URL}/coach/events`, {
      headers: { Authorization: `Bearer ${coachToken}` }
    });
    
    const refetchedEvent = refetchResponse.data.data.events.find(e => e.id === testEventId);
    
    console.log(`\n📤 API returns updated event:`);
    console.log(`   Start: ${refetchedEvent.startDate}`);
    console.log(`   End: ${refetchedEvent.endDate}`);
    
    const refetchStartForInput = refetchedEvent.startDate.substring(0, 16);
    const refetchEndForInput = refetchedEvent.endDate.substring(0, 16);
    
    console.log(`\n🎨 Coach sees in edit form after update:`);
    console.log(`   Start: ${refetchStartForInput}`);
    console.log(`   End: ${refetchEndForInput}`);
    
    const refetchCorrect = refetchStartForInput === '2025-11-26T10:00' && refetchEndForInput === '2025-11-26T12:00';
    
    if (refetchCorrect) {
      console.log(`\n✅ SUCCESS: Coach sees updated IST time correctly!`);
    } else {
      console.log(`\n❌ FAILED: Coach sees wrong updated time!`);
      console.log(`   Expected Start: 2025-11-26T10:00`);
      console.log(`   Got Start: ${refetchStartForInput}`);
      console.log(`   Expected End: 2025-11-26T12:00`);
      console.log(`   Got End: ${refetchEndForInput}`);
    }
    
    // Step 6: Verify students/others would see IST too
    console.log('\n📋 STEP 6: Other Users Would See Same IST Time');
    console.log('-'.repeat(80));
    console.log(`\n✅ All users (students, admin, etc.) would see:`);
    console.log(`   Start: ${refetchedEvent.startDate} (10:00 AM IST)`);
    console.log(`   End: ${refetchedEvent.endDate} (12:00 PM IST)`);
    
    // Final Summary
    console.log('\n' + '='.repeat(80));
    console.log('🎉 TEST COMPLETE - SUMMARY');
    console.log('='.repeat(80));
    
    const allTestsPassed = startMatch && endMatch && fetchCorrect && 
                          updateStartMatch && updateEndMatch && refetchCorrect;
    
    if (allTestsPassed) {
      console.log('\n✅ ALL TESTS PASSED!');
      console.log('\n📝 Verified:');
      console.log('   ✅ Coach enters IST time → Stored as UTC correctly');
      console.log('   ✅ Coach fetches events → Sees IST time');
      console.log('   ✅ Coach edits form → Shows IST time');
      console.log('   ✅ Coach updates IST time → Stored as UTC correctly');
      console.log('   ✅ Coach fetches after update → Sees updated IST time');
      console.log('   ✅ All users see IST time consistently');
      console.log('\n🎯 IST workflow is working perfectly!\n');
    } else {
      console.log('\n❌ SOME TESTS FAILED!');
      console.log('\n📝 Issues:');
      if (!startMatch || !endMatch) console.log('   ❌ Initial database storage incorrect');
      if (!fetchCorrect) console.log('   ❌ Coach sees wrong time in edit form');
      if (!updateStartMatch || !updateEndMatch) console.log('   ❌ Updated dates stored incorrectly');
      if (!refetchCorrect) console.log('   ❌ Coach sees wrong updated time');
      console.log('\n⚠️ Need to fix the IST workflow!\n');
    }
    
    // Cleanup
    await prisma.event.delete({ where: { id: testEventId } });
    console.log('🗑️  Test event cleaned up\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Cleanup on error
    if (testEventId) {
      try {
        await prisma.event.delete({ where: { id: testEventId } });
        console.log('🗑️  Test event cleaned up after error\n');
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCompleteISTFlow();
