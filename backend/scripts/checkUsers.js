const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        studentProfile: {
          select: { name: true }
        },
        coachProfile: {
          select: { name: true }
        }
      }
    });
    
    console.log(`Total users: ${users.length}\n`);
    
    if (users.length > 0) {
      console.log('Users in database:');
      users.forEach(user => {
        const name = user.studentProfile?.name || user.coachProfile?.name || 'No name';
        console.log(`- ${user.role}: ${user.email || user.phone} (${name}) - Active: ${user.isActive}, Verified: ${user.isVerified}`);
      });
    } else {
      console.log('❌ No users found in database');
      console.log('💡 You need to register a student first to test the events functionality');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();