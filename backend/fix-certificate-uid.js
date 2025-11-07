/**
 * Fix certificate UID - Replace null with proper event uniqueId
 * Run on production server: node fix-certificate-uid.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const prisma = new PrismaClient();

async function fixCertificateUID() {
  try {
    console.log('🔧 Fixing certificate UID...\n');

    // Get the event
    const event = await prisma.event.findUnique({
      where: { uniqueId: 'EVT-0001-FB-GJ-071125' }
    });

    if (!event) {
      console.error('❌ Event not found');
      return;
    }

    // Get certificates for this event
    const certificates = await prisma.certificate.findMany({
      where: { eventId: event.id }
    });

    console.log(`Found ${certificates.length} certificate(s) for event ${event.name}\n`);

    for (const cert of certificates) {
      console.log(`Processing certificate: ${cert.uniqueId}`);
      
      // Get student details
      const student = await prisma.student.findUnique({
        where: { id: cert.studentId },
        select: {
          user: {
            select: { uniqueId: true }
          }
        }
      });

      if (!student) {
        console.error(`  ❌ Student not found for ID: ${cert.studentId}`);
        continue;
      }

      // Generate correct UID
      const correctUID = `STAIRS-CERT-${event.uniqueId}-${student.user.uniqueId}`;
      console.log(`  Current UID: ${cert.uniqueId}`);
      console.log(`  Correct UID: ${correctUID}`);

      if (cert.uniqueId === correctUID) {
        console.log(`  ✅ UID is already correct`);
        continue;
      }

      // Rename PDF file
      const certificatesDir = path.join(__dirname, 'uploads/certificates');
      const oldFilename = `${cert.uniqueId}.pdf`;
      const newFilename = `${correctUID}.pdf`;
      const oldPath = path.join(certificatesDir, oldFilename);
      const newPath = path.join(certificatesDir, newFilename);

      try {
        // Check if old file exists
        await fs.access(oldPath);
        console.log(`  📄 Renaming: ${oldFilename} → ${newFilename}`);
        await fs.rename(oldPath, newPath);
        console.log(`  ✅ File renamed successfully`);
      } catch (e) {
        console.log(`  ⚠️ File not found or rename failed: ${e.message}`);
      }

      // Also rename HTML backup if it exists
      const oldHtmlFilename = `${cert.uniqueId}.html`;
      const newHtmlFilename = `${correctUID}.html`;
      const oldHtmlPath = path.join(certificatesDir, oldHtmlFilename);
      const newHtmlPath = path.join(certificatesDir, newHtmlFilename);

      try {
        await fs.access(oldHtmlPath);
        await fs.rename(oldHtmlPath, newHtmlPath);
        console.log(`  ✅ HTML backup renamed`);
      } catch (e) {
        // HTML file might not exist, that's ok
      }

      // Update database record
      const updated = await prisma.certificate.update({
        where: { id: cert.id },
        data: {
          uniqueId: correctUID,
          certificateUrl: `/uploads/certificates/${newFilename}`
        }
      });

      console.log(`  ✅ Database record updated\n`);
    }

    console.log('✅ Certificate UID fix completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCertificateUID();
