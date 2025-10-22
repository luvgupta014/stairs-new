const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigateAsiaFootball() {
  try {
    console.log('🔍 Investigating Asia Football event issue...\n');
    
    // Check all events and their dates
    const allEvents = await prisma.event.findMany({
      include: {
        registrations: {
          include: {
            student: {
              select: {
                name: true,
                user: { select: { email: true } }
              }
            }
          }
        }
      }
    });
    
    console.log(`📊 Total events in database: ${allEvents.length}\n`);
    
    allEvents.forEach(event => {
      const isToday = new Date(event.startDate).toDateString() === new Date().toDateString();
      const isPast = new Date(event.startDate) < new Date();
      const registrationCount = event.registrations.length;
      
      console.log(`📅 ${event.name}:`);
      console.log(`   Status: ${event.status}`);
      console.log(`   Start: ${event.startDate} ${isToday ? '(TODAY)' : ''} ${isPast ? '(PAST)' : '(FUTURE)'}`);
      console.log(`   Registrations: ${registrationCount}`);
      
      if (registrationCount > 0) {
        console.log(`   Students registered:`);
        event.registrations.forEach(reg => {
          console.log(`     - ${reg.student.name} (${reg.student.user.email}) [${reg.status}]`);
        });
      }
      console.log('');
    });
    
    // The issue might be that the Asia Football event is today's date
    // Let's check what happens with today's events
    const currentDate = new Date();
    const todayEvents = allEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === currentDate.toDateString();
    });
    
    if (todayEvents.length > 0) {
      console.log('🕐 Events happening TODAY:');
      todayEvents.forEach(event => {
        console.log(`   - ${event.name} (${event.status}) - ${event.registrations.length} registrations`);
      });
      
      console.log('\n💡 POTENTIAL ISSUE IDENTIFIED:');
      console.log('   Events happening today might be showing as "registered" when they should');
      console.log('   be filtered out or marked differently for students.');
      console.log('   Students might be confused seeing events they can\'t participate in anymore.');
    }
    
  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

investigateAsiaFootball();