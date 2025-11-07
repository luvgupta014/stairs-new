const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugEventLookup() {
  try {
    console.log('🔍 Debugging Event Lookup...\n');

    // Try to find by uniqueId
    const byUniqueId = await prisma.event.findUnique({
      where: { uniqueId: 'EVT-0001-FB-GJ-071125' }
    });

    if (byUniqueId) {
      console.log('✅ Found by uniqueId:');
      console.log(`   Database ID: ${byUniqueId.id}`);
      console.log(`   Name: ${byUniqueId.name}`);
      console.log(`   UniqueId: ${byUniqueId.uniqueId}\n`);
    } else {
      console.log('❌ Not found by uniqueId\n');
    }

    // List all events
    const allEvents = await prisma.event.findMany({
      select: { id: true, name: true, uniqueId: true }
    });

    console.log(`📋 Total events in database: ${allEvents.length}`);
    allEvents.forEach(e => {
      console.log(`   - ${e.name} (ID: ${e.id}, UID: ${e.uniqueId})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugEventLookup();
