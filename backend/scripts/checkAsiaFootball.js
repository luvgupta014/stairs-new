const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAsiaFootballEvent() {
  try {
    console.log('🔍 Checking Asia Football event status...\n');
    
    // Find the Asia Football event
    const asiaFootballEvent = await prisma.event.findFirst({
      where: {
        name: {
          contains: 'Asia Football',
          mode: 'insensitive'
        }
      },
      include: {
        registrations: {
          include: {
            student: {
              select: {
                name: true,
                user: {
                  select: { email: true }
                }
              }
            }
          }
        },
        coach: {
          select: { name: true }
        }
      }
    });
    
    if (asiaFootballEvent) {
      console.log('📊 Asia Football Event Details:');
      console.log(`   ID: ${asiaFootballEvent.id}`);
      console.log(`   Name: ${asiaFootballEvent.name}`);
      console.log(`   Status: ${asiaFootballEvent.status}`);
      console.log(`   Start Date: ${asiaFootballEvent.startDate}`);
      console.log(`   End Date: ${asiaFootballEvent.endDate}`);
      console.log(`   Created: ${asiaFootballEvent.createdAt}`);
      console.log(`   Coach: ${asiaFootballEvent.coach?.name || 'No coach'}`);
      console.log(`   Registrations: ${asiaFootballEvent.registrations.length}`);
      
      if (asiaFootballEvent.registrations.length > 0) {
        console.log('\n📋 Students registered:');
        asiaFootballEvent.registrations.forEach(reg => {
          console.log(`   - ${reg.student.name} (${reg.student.user.email}) - Status: ${reg.status}`);
        });
      }
      
      // Check if this event should be visible to students
      const currentDate = new Date();
      const eventStart = new Date(asiaFootballEvent.startDate);
      const shouldBeVisible = ['APPROVED', 'ACTIVE'].includes(asiaFootballEvent.status) && eventStart >= currentDate;
      
      console.log(`\n🔍 Analysis:`);
      console.log(`   Should be visible to students: ${shouldBeVisible}`);
      console.log(`   Event is in past: ${eventStart < currentDate}`);
      console.log(`   Status allows visibility: ${['APPROVED', 'ACTIVE'].includes(asiaFootballEvent.status)}`);
      
      if (!shouldBeVisible && asiaFootballEvent.registrations.length > 0) {
        console.log('\n⚠️  ISSUE IDENTIFIED:');
        console.log('   This event should NOT be visible to students, but they are still registered!');
        console.log('   This can cause confusion for students.');
      }
      
    } else {
      console.log('❌ Asia Football event not found in database');
      
      // Check for any events with "football" in the name
      const footballEvents = await prisma.event.findMany({
        where: {
          name: {
            contains: 'football',
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true
        }
      });
      
      if (footballEvents.length > 0) {
        console.log('\n📋 Found football-related events:');
        footballEvents.forEach(event => {
          console.log(`   - ${event.name} (${event.status}) - ${event.startDate}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking event:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAsiaFootballEvent();
