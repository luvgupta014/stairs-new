/**
 * Script to check users in the database and their uniqueId values
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('🔍 === CHECKING USERS IN DATABASE ===\n');
  
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        uniqueId: true,
        isVerified: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Show last 20 users
    });

    console.log(`📊 Found ${users.length} users in database\n`);

    if (users.length === 0) {
      console.log('❌ No users found in database!\n');
      return;
    }

    console.log('👥 User Details:\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Phone: ${user.phone || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   UniqueId: ${user.uniqueId || '❌ NULL/EMPTY'}`);
      console.log(`   Verified: ${user.isVerified ? '✅' : '❌'}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    // Check for users without uniqueId
    const usersWithoutUID = users.filter(u => !u.uniqueId);
    console.log(`\n📋 Summary:`);
    console.log(`   Total users: ${users.length}`);
    console.log(`   Users with uniqueId: ${users.length - usersWithoutUID.length}`);
    console.log(`   Users without uniqueId: ${usersWithoutUID.length}`);

    if (usersWithoutUID.length > 0) {
      console.log('\n⚠️  Users without uniqueId:');
      usersWithoutUID.forEach(u => {
        console.log(`   - ${u.email || u.phone} (${u.role})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run check
checkUsers()
  .then(() => {
    console.log('\n✅ Check completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
