const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStudentProfiles() {
  try {
    console.log('🔍 Checking all students and their profiles...');
    
    // Get all students
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        studentProfile: true
      }
    });

    console.log(`📊 Found ${students.length} students total`);
    
    students.forEach((student, index) => {
      console.log(`\n${index + 1}. Student: ${student.email}`);
      console.log(`   - ID: ${student.id}`);
      console.log(`   - Role: ${student.role}`);
      console.log(`   - Verified: ${student.isVerified}`);
      console.log(`   - Active: ${student.isActive}`);
      console.log(`   - Has Profile: ${!!student.studentProfile}`);
      if (student.studentProfile) {
        console.log(`   - Profile ID: ${student.studentProfile.id}`);
        console.log(`   - Profile Name: ${student.studentProfile.name}`);
      } else {
        console.log(`   ⚠️  Missing studentProfile!`);
      }
    });

    // Check for orphaned student profiles
    const allProfiles = await prisma.student.findMany({
      include: {
        user: true
      }
    });

    console.log(`\n📊 Found ${allProfiles.length} student profiles total`);
    
    const orphanedProfiles = allProfiles.filter(profile => !profile.user);
    if (orphanedProfiles.length > 0) {
      console.log(`⚠️  Found ${orphanedProfiles.length} orphaned student profiles:`);
      orphanedProfiles.forEach(profile => {
        console.log(`   - Profile ID: ${profile.id}, Name: ${profile.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking student profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudentProfiles();