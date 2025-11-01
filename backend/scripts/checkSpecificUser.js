/**
 * Script to check a specific user and their uniqueId
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser(email) {
  console.log(`🔍 === CHECKING USER: ${email} ===\n`);
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
        coachProfile: true,
        instituteProfile: true,
        clubProfile: true
      }
    });

    if (!user) {
      console.log(`❌ User not found with email: ${email}\n`);
      return;
    }

    console.log('✅ User found!\n');
    console.log('📋 User Details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Phone: ${user.phone || 'N/A'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   UniqueId: ${user.uniqueId || '❌ NULL/EMPTY'}`);
    console.log(`   Verified: ${user.isVerified ? '✅' : '❌'}`);
    console.log(`   Active: ${user.isActive ? '✅' : '❌'}`);
    console.log(`   Created: ${user.createdAt.toISOString()}`);

    // Show profile details
    if (user.studentProfile) {
      console.log('\n👨‍🎓 Student Profile:');
      console.log(`   Name: ${user.studentProfile.name}`);
      console.log(`   State: ${user.studentProfile.state || 'N/A'}`);
      console.log(`   Sport: ${user.studentProfile.sport || 'N/A'}`);
    }
    if (user.coachProfile) {
      console.log('\n👨‍🏫 Coach Profile:');
      console.log(`   Name: ${user.coachProfile.name}`);
      console.log(`   State: ${user.coachProfile.state || 'N/A'}`);
    }

    // Check if uniqueId needs to be generated
    if (!user.uniqueId) {
      console.log('\n⚠️  This user does NOT have a uniqueId!');
      console.log('   Run the migration script to generate one:');
      console.log('   node scripts/migrateToNewUID.js');
    }

  } catch (error) {
    console.error('❌ Error checking user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'ashishchanchalani@email.com';

checkUser(email)
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
