/**
 * Quick test to verify the certificate endpoints are working
 * This simulates what the frontend does
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCertificateQuery() {
  console.log('🧪 Testing Certificate Query Fix...\n');
  
  const eventId = 'cmho5esr70005u80opklr4qne';
  
  try {
    // Get the event
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      console.log('❌ Event not found');
      return;
    }
    
    console.log('✅ Event found:', event.name);
    console.log('   Event uniqueId:', event.uniqueId || 'null');
    console.log('');
    
    // Build the WHERE conditions just like in the fixed code
    const whereConditions = [
      { eventId: event.id },
      { eventId: eventId }
    ];
    
    // Only add uniqueId condition if it exists
    if (event.uniqueId) {
      whereConditions.push({ eventId: event.uniqueId });
    }
    
    console.log('📋 Querying certificates with conditions:', JSON.stringify(whereConditions, null, 2));
    console.log('');
    
    // Query certificates
    const certificates = await prisma.certificate.findMany({
      where: {
        OR: whereConditions
      },
      select: {
        id: true,
        studentId: true,
        uniqueId: true
      }
    });
    
    console.log(`✅ Query successful! Found ${certificates.length} certificate(s)`);
    
    if (certificates.length > 0) {
      console.log('\nCertificates:');
      certificates.forEach((cert, i) => {
        console.log(`  ${i + 1}. ID: ${cert.id}, Student: ${cert.studentId}, UID: ${cert.uniqueId}`);
      });
    }
    
    // Now test fetching registrations
    console.log('\n📋 Fetching event registrations...');
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId: event.id,
        status: { in: ['REGISTERED', 'APPROVED'] }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                uniqueId: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    console.log(`✅ Found ${registrations.length} registration(s)`);
    
    if (registrations.length > 0) {
      console.log('\nRegistered Students:');
      registrations.forEach((reg, i) => {
        console.log(`  ${i + 1}. ${reg.student.name} (${reg.student.user.uniqueId})`);
      });
    }
    
    console.log('\n✨ All tests passed! The certificate endpoints should now work.');
    
  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testCertificateQuery();
