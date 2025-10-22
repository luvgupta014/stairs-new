const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEvents() {
  try {
    console.log('Checking database for approved events...\n');
    
    // Get all events with their status
    const allEvents = await prisma.event.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        _count: {
          select: {
            registrations: true
          }
        }
      }
    });
    
    console.log(`Total events in database: ${allEvents.length}`);
    
    // Filter approved/active events
    const approvedEvents = allEvents.filter(event => 
      ['APPROVED', 'ACTIVE'].includes(event.status)
    );
    
    console.log(`Approved/Active events: ${approvedEvents.length}`);
    
    // Filter events that students should see (approved/active + future dates)
    const now = new Date();
    const studentVisibleEvents = approvedEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate > now;
    });
    
    console.log(`Events visible to students (future dates): ${studentVisibleEvents.length}\n`);
    
    if (allEvents.length > 0) {
      console.log('All Events Summary:');
      allEvents.forEach(event => {
        console.log(`- ${event.name} (${event.status}) - Start: ${event.startDate}, End: ${event.endDate}, Registrations: ${event._count.registrations}`);
      });
    }
    
    if (studentVisibleEvents.length > 0) {
      console.log('\nEvents Students Should See:');
      studentVisibleEvents.forEach(event => {
        console.log(`- ${event.name} (${event.status}) - Start: ${event.startDate}, End: ${event.endDate}`);
      });
    } else {
      console.log('\n❌ NO EVENTS AVAILABLE FOR STUDENT REGISTRATION');
      console.log('Possible reasons:');
      console.log('1. No events with APPROVED/ACTIVE status');
      console.log('2. All events have past dates');
      console.log('3. All registration deadlines have passed');
    }
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEvents();