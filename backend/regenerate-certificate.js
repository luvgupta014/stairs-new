/**
 * Regenerate Certificate with Correct UID
 * This script regenerates the certificate PDF with the correct UID
 */

const { PrismaClient } = require('@prisma/client');
const certificateService = require('./src/services/certificateService');
const prisma = new PrismaClient();

async function regenerateCertificate() {
  try {
    console.log('🔄 Regenerating certificate with correct UID...\n');

    // Get the certificate
    const cert = await prisma.certificate.findUnique({
      where: { id: 'cmhofgnjg0000u8dswu1r2qib' },
      include: {
        // We'll fetch related data separately
      }
    });

    if (!cert) {
      console.error('❌ Certificate not found');
      return;
    }

    console.log(`Found certificate: ${cert.uniqueId}`);

    // Get event and student details
    const event = await prisma.event.findUnique({
      where: { id: cert.eventId }
    });

    const student = await prisma.student.findUnique({
      where: { id: cert.studentId },
      include: {
        user: {
          select: { uniqueId: true }
        }
      }
    });

    if (!event || !student) {
      console.error('❌ Event or Student not found');
      return;
    }

    console.log(`Event: ${event.name} (${event.uniqueId})`);
    console.log(`Student: ${student.name} (${student.user.uniqueId})\n`);

    // Prepare certificate data
    const eventDate = new Date(event.startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const certificateData = {
      participantName: student.name,
      sportName: event.sport,
      eventName: event.name,
      eventDate: eventDate,
      date: eventDate,
      studentId: student.id,
      studentUniqueId: student.user.uniqueId,
      eventId: event.id,
      eventUniqueId: event.uniqueId,
      orderId: cert.orderId || null
    };

    console.log(`📝 Certificate data:`, certificateData);

    // Regenerate the certificate
    console.log(`\n🎓 Regenerating PDF...`);
    const regenerated = await certificateService.generateCertificate(certificateData);

    console.log(`\n✅ Certificate regenerated successfully!`);
    console.log(`   UID: ${regenerated.uniqueId}`);
    console.log(`   URL: ${regenerated.certificateUrl}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

regenerateCertificate();
