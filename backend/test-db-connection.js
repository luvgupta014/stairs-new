const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing Prisma connection...');
    
    // Test basic connection
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected. Total users: ${userCount}`);
    
    // Test EventResultFile model
    console.log('Testing EventResultFile model...');
    const resultFiles = await prisma.eventResultFile.findMany({
      take: 1
    });
    console.log(`✅ EventResultFile query successful. Found ${resultFiles.length} files`);
    
    // Test with include
    console.log('Testing EventResultFile with include...');
    const resultFilesWithCoach = await prisma.eventResultFile.findMany({
      include: {
        coach: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 1
    });
    console.log(`✅ EventResultFile with coach include successful. Found ${resultFilesWithCoach.length} files`);
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();