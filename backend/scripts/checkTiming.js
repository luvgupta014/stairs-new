const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExactTiming() {
  try {
    console.log('🕐 Checking exact timing of Asia Football event...\n');
    
    const now = new Date();
    console.log('Current time:', now.toISOString());
    console.log('Current local time:', now.toString());
    
    const asiaFootball = await prisma.event.findFirst({
      where: { name: { contains: 'Asia Football' } }
    });
    
    if (asiaFootball) {
      const eventStart = new Date(asiaFootball.startDate);
      console.log('\nAsia Football event:');
      console.log('Event start time (UTC):', eventStart.toISOString());
      console.log('Event start time (local):', eventStart.toString());
      
      const timeDiff = eventStart - now;
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      console.log(`\nTime difference: ${hoursDiff.toFixed(2)} hours`);
      
      if (hoursDiff > 0) {
        console.log('✅ Event is in the future - this is correct behavior');
        console.log('💡 The issue reported might be about students seeing past registrations,');
        console.log('   not about this specific event being filtered incorrectly.');
      } else {
        console.log('⏰ Event has already started or passed');
      }
      
      // Check if student can see this in their registrations
      const studentRegistrations = await prisma.eventRegistration.findMany({
        where: {
          event: {
            name: { contains: 'Asia Football' }
          }
        },
        include: {
          student: { select: { name: true } },
          event: { select: { name: true, status: true, startDate: true } }
        }
      });
      
      console.log(`\nStudent registrations for this event: ${studentRegistrations.length}`);
      studentRegistrations.forEach(reg => {
        console.log(`   - ${reg.student.name} registered for ${reg.event.name} (${reg.event.status})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkExactTiming();