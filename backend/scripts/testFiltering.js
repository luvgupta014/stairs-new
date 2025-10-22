const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFilteringFix() {
  try {
    console.log('🧪 Testing updated event filtering logic...\n');
    
    // Test the new filtering logic
    const now = new Date();
    console.log('🕐 Current time:', now.toISOString());
    
    // Check what events students should see now (future events only)
    const studentVisibleEvents = await prisma.event.findMany({
      where: {
        status: { in: ['APPROVED', 'ACTIVE'] },
        startDate: { gt: now }  // New filtering logic
      },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        _count: {
          select: { registrations: true }
        }
      }
    });
    
    console.log(`📊 Events students should see NOW: ${studentVisibleEvents.length}`);
    studentVisibleEvents.forEach(event => {
      const timeUntilEvent = new Date(event.startDate) - now;
      const hoursUntil = Math.round(timeUntilEvent / (1000 * 60 * 60));
      console.log(`   - ${event.name} (${event.status}) - Starts in ${hoursUntil} hours - ${event._count.registrations} registrations`);
    });
    
    // Check what events were filtered out (today's or past events)
    const filteredOutEvents = await prisma.event.findMany({
      where: {
        status: { in: ['APPROVED', 'ACTIVE'] },
        startDate: { lte: now }  // Events that are now filtered out
      },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        _count: {
          select: { registrations: true }
        }
      }
    });
    
    console.log(`\n📊 Events filtered out (started/past): ${filteredOutEvents.length}`);
    filteredOutEvents.forEach(event => {
      const timeSinceStart = now - new Date(event.startDate);
      const hoursSince = Math.round(timeSinceStart / (1000 * 60 * 60));
      console.log(`   - ${event.name} (${event.status}) - Started ${hoursSince} hours ago - ${event._count.registrations} registrations`);
    });
    
    console.log('\n✅ Filtering test completed!');
    console.log('💡 Students should now only see future events, not today\'s Asia Football event.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testFilteringFix();