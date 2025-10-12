const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEventSchema() {
  try {
    console.log('🔍 Checking Event schema...');
    
    // Try to access Event model
    try {
      const eventCount = await prisma.event.count();
      console.log(`✅ Event table exists with ${eventCount} events`);
      
      // Get sample event if any exist
      const sampleEvent = await prisma.event.findFirst({
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        }
      });
      
      if (sampleEvent) {
        console.log('📋 Sample event structure:', JSON.stringify(sampleEvent, null, 2));
      } else {
        console.log('ℹ️ No events found in database');
      }
      
    } catch (error) {
      console.log('❌ Event table does not exist or has schema issues');
      console.log('Error:', error.message);
      
      // Check what models DO exist
      console.log('\n🔍 Checking available models...');
      
      try {
        const userCount = await prisma.user.count();
        console.log(`✅ User table: ${userCount} records`);
      } catch (e) {
        console.log('❌ User table issue:', e.message);
      }
      
      try {
        const studentCount = await prisma.studentProfile.count();
        console.log(`✅ StudentProfile table: ${studentCount} records`);
      } catch (e) {
        console.log('❌ StudentProfile table issue');
      }
      
      try {
        const coachCount = await prisma.coachProfile.count();
        console.log(`✅ CoachProfile table: ${coachCount} records`);
      } catch (e) {
        console.log('❌ CoachProfile table issue');
      }
    }
    
  } catch (error) {
    console.error('❌ Schema check error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEventSchema();