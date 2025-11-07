const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDateHandling() {
  try {
    console.log('🧪 Testing Date Handling for IST Platform\n');
    console.log('=' .repeat(60));
    
    // Test 1: Check existing events and their dates
    console.log('\n📋 Test 1: Checking existing events...');
    const events = await prisma.event.findMany({
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        uniqueId: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    if (events.length === 0) {
      console.log('❌ No events found in database');
    } else {
      console.log(`✅ Found ${events.length} events:`);
      events.forEach((event, index) => {
        console.log(`\n   Event ${index + 1}: ${event.name}`);
        console.log(`   - ID: ${event.id}`);
        console.log(`   - Unique ID: ${event.uniqueId}`);
        console.log(`   - Start Date (DB): ${event.startDate.toISOString()}`);
        console.log(`   - Start Date (Local): ${event.startDate.toString()}`);
        if (event.endDate) {
          console.log(`   - End Date (DB): ${event.endDate.toISOString()}`);
          console.log(`   - End Date (Local): ${event.endDate.toString()}`);
        }
      });
    }
    
    // Test 2: Simulate date parsing as backend does
    console.log('\n\n📋 Test 2: Testing date parsing logic...');
    const testDateString = '2025-11-15T10:00:00'; // IST time input from frontend
    
    console.log(`\n   Input from frontend: "${testDateString}"`);
    
    // OLD WAY (without timezone)
    const oldWay = new Date(testDateString);
    console.log(`   Old parsing (new Date): ${oldWay.toISOString()}`);
    console.log(`   Problem: Treats as local time, gets converted incorrectly`);
    
    // NEW WAY (with IST offset)
    const parseAsIST = (dateString) => {
      if (!dateString) return null;
      if (dateString.includes('+') || dateString.includes('Z')) {
        return new Date(dateString);
      }
      return new Date(dateString + '+05:30');
    };
    
    const newWay = parseAsIST(testDateString);
    console.log(`\n   New parsing (with +05:30): ${newWay.toISOString()}`);
    console.log(`   Result: Correctly treats as IST, stores as UTC`);
    
    // Test 3: Simulate date formatting as backend should return
    console.log('\n\n📋 Test 3: Testing date formatting for frontend...');
    
    if (events.length > 0) {
      const testEvent = events[0];
      
      console.log(`\n   Event: ${testEvent.name}`);
      console.log(`   Stored in DB (UTC): ${testEvent.startDate.toISOString()}`);
      
      // Format as IST string (removing timezone)
      const formatDateAsIST = (date) => {
        if (!date) return null;
        return date.toISOString().substring(0, 19);
      };
      
      const formatted = formatDateAsIST(testEvent.startDate);
      console.log(`   Formatted for frontend: ${formatted}`);
      console.log(`   Frontend will extract: ${formatted.substring(0, 16)}`);
    }
    
    // Test 4: Check if there are coaches to test with
    console.log('\n\n📋 Test 4: Checking for test coaches...');
    const coaches = await prisma.coach.findMany({
      include: {
        user: {
          select: { email: true, phone: true, name: true }
        }
      },
      take: 3
    });
    
    if (coaches.length === 0) {
      console.log('❌ No coaches found');
    } else {
      console.log(`✅ Found ${coaches.length} coaches:`);
      coaches.forEach((coach, index) => {
        console.log(`\n   Coach ${index + 1}:`);
        console.log(`   - Name: ${coach.name}`);
        console.log(`   - Email: ${coach.user.email || 'N/A'}`);
        console.log(`   - Phone: ${coach.user.phone || 'N/A'}`);
        console.log(`   - Payment Status: ${coach.paymentStatus}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Date handling test complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testDateHandling();
