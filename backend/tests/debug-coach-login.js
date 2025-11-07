const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugCoachLogin() {
  const email = 'rihimes569@fergetic.com';
  
  try {
    console.log('🔍 Debugging coach login for:', email);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        coachProfile: true,
        studentProfile: true,
        instituteProfile: true,
        clubProfile: true
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   UID:', user.uniqueId);
    console.log('   Verified:', user.isVerified);
    console.log('   Active:', user.isActive);

    console.log('\n📋 Profile Status:');
    console.log('   Coach Profile:', user.coachProfile ? '✅ EXISTS' : '❌ MISSING');
    console.log('   Student Profile:', user.studentProfile ? '✅ EXISTS' : '❌ MISSING');
    console.log('   Institute Profile:', user.instituteProfile ? '✅ EXISTS' : '❌ MISSING');
    console.log('   Club Profile:', user.clubProfile ? '✅ EXISTS' : '❌ MISSING');

    if (user.coachProfile) {
      console.log('\n👤 Coach Profile Details:');
      console.log('   ID:', user.coachProfile.id);
      console.log('   Name:', user.coachProfile.name);
      console.log('   State:', user.coachProfile.state);
      console.log('   Primary Sport:', user.coachProfile.primarySport);
      console.log('   Membership Status:', user.coachProfile.membershipStatus);
      console.log('   Payment Status:', user.coachProfile.paymentStatus);
    } else {
      console.log('\n⚠️  PROBLEM: User role is', user.role, 'but coach profile does not exist!');
      console.log('   This will cause 404 error when /api/coach/profile is called.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugCoachLogin();
