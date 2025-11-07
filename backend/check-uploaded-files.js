const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUploadedFiles() {
  try {
    console.log('🔍 Checking EventResultFile records in database...\n');

    const files = await prisma.eventResultFile.findMany({
      include: {
        coach: {
          select: {
            name: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' },
      take: 10
    });

    if (files.length === 0) {
      console.log('❌ No files found in database');
      return;
    }

    console.log(`✅ Found ${files.length} uploaded files:\n`);
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.originalName}`);
      console.log(`   Uploaded: ${file.uploadedAt}`);
      console.log(`   Size: ${(file.size / 1024).toFixed(2)} KB`);
      console.log(`   Coach: ${file.coach?.name || 'Unknown'}`);
      console.log(`   Description: ${file.description || 'N/A'}`);
      console.log('');
    });

    console.log('✅ Database verification complete');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUploadedFiles();
