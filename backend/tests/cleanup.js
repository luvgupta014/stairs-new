const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupTestData() {
  try {
    console.log('🧹 === CLEANING UP TEST DATA ===\n');

    // Delete all test entries (those with test emails/phone patterns)
    console.log('Deleting test User records...');
    const deleteUsers = await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: 'test' } },
          { email: { contains: 'apistudent' } },
          { email: { contains: 'apicoach' } },
          { email: { contains: 'apiinstitute' } },
          { email: { contains: 'apiclub' } },
          { email: { contains: 'student.' } },
          { email: { contains: 'coach.' } },
          { email: { contains: 'institute.' } },
          { email: { contains: 'club.' } },
        ]
      }
    });
    console.log(`   ✅ Deleted ${deleteUsers.count} test User records`);

    // Get database stats
    console.log('\n📊 === DATABASE STATS ===');
    const userCount = await prisma.user.count();
    const studentCount = await prisma.student.count();
    const coachCount = await prisma.coach.count();
    const instituteCount = await prisma.institute.count();
    const clubCount = await prisma.club.count();

    console.log(`Total Users: ${userCount}`);
    console.log(`Total Students: ${studentCount}`);
    console.log(`Total Coaches: ${coachCount}`);
    console.log(`Total Institutes: ${instituteCount}`);
    console.log(`Total Clubs: ${clubCount}`);

    console.log('\n✅ Cleanup complete!\n');

  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData();
