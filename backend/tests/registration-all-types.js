const { PrismaClient } = require('@prisma/client');
const { generateUID } = require('../src/utils/uidGenerator');
const { hashPassword, generateOTP } = require('../src/utils/helpers');

const prisma = new PrismaClient();

// Helper to generate unique identifiers for testing
let counter = 0;
function getUniqueId() {
  return ++counter;
}

async function testStudentRegistration() {
  try {
    console.log('\n🧪 === TESTING STUDENT REGISTRATION ===');
    const uid = await generateUID('STUDENT', 'Delhi');
    const hashedPassword = await hashPassword('Student@123');
    const otp = generateOTP();
    const id = String(getUniqueId()).padStart(9, '0');

    const user = await prisma.user.create({
      data: {
        uniqueId: uid,
        email: `student.${id}@example.com`,
        phone: `9${id.slice(0, 9)}`,
        password: hashedPassword,
        role: 'STUDENT',
        isVerified: false,
        studentProfile: {
          create: {
            name: 'Test Student',
            fatherName: 'Father Name',
            aadhaar: id,
            gender: 'Male',
            dateOfBirth: new Date('2000-01-01'),
            state: 'Delhi',
            district: 'South Delhi',
            address: 'Student Address',
            pincode: '110045',
            sport: 'Football',
            school: 'Test School',
            level: 'BEGINNER',
          }
        },
        otpRecords: {
          create: {
            code: otp,
            type: 'REGISTRATION',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            isUsed: false
          }
        }
      },
      include: {
        studentProfile: true,
        otpRecords: true
      }
    });

    console.log('   ✅ STUDENT created successfully!');
    console.log('   - User ID:', user.id);
    console.log('   - UID:', user.uniqueId);
    console.log('   - Email:', user.email);
    console.log('   - Role:', user.role);
    return true;
  } catch (error) {
    console.error('   ❌ STUDENT registration failed:', error.message);
    return false;
  }
}

async function testCoachRegistration() {
  try {
    console.log('\n🧪 === TESTING COACH REGISTRATION ===');
    const uid = await generateUID('COACH', 'Maharashtra');
    const hashedPassword = await hashPassword('Coach@123');
    const otp = generateOTP();
    const id = String(getUniqueId()).padStart(9, '0');

    const user = await prisma.user.create({
      data: {
        uniqueId: uid,
        email: `coach.${id}@example.com`,
        phone: `9${id.slice(0, 9)}`,
        password: hashedPassword,
        role: 'COACH',
        isVerified: false,
        coachProfile: {
          create: {
            name: 'Test Coach',
            fatherName: 'Father Name',
            aadhaar: id,
            gender: 'Male',
            dateOfBirth: new Date('1980-05-15'),
            state: 'Maharashtra',
            district: 'Mumbai',
            address: 'Coach Address',
            pincode: '400001',
            primarySport: 'Football',
            experience: 10,
            applyingAs: 'Chief District Coordinator',
            membershipStatus: 'NEW',
          }
        },
        otpRecords: {
          create: {
            code: otp,
            type: 'REGISTRATION',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            isUsed: false
          }
        }
      },
      include: {
        coachProfile: true,
        otpRecords: true
      }
    });

    console.log('   ✅ COACH created successfully!');
    console.log('   - User ID:', user.id);
    console.log('   - UID:', user.uniqueId);
    console.log('   - Email:', user.email);
    console.log('   - Role:', user.role);
    return true;
  } catch (error) {
    console.error('   ❌ COACH registration failed:', error.message);
    return false;
  }
}

async function testInstituteRegistration() {
  try {
    console.log('\n🧪 === TESTING INSTITUTE REGISTRATION ===');
    const uid = await generateUID('INSTITUTE', 'Karnataka');
    const hashedPassword = await hashPassword('Institute@123');
    const otp = generateOTP();
    const id = String(getUniqueId()).padStart(9, '0');

    const user = await prisma.user.create({
      data: {
        uniqueId: uid,
        email: `institute.${id}@example.com`,
        phone: `9${id.slice(0, 9)}`,
        password: hashedPassword,
        role: 'INSTITUTE',
        isVerified: false,
        instituteProfile: {
          create: {
            name: 'Test Institute',
            type: 'School',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001',
            location: 'Institute Location',
            established: '2010',
            sportsOffered: 'Cricket,Football,Basketball',
            studentsCount: 500,
            coachesCount: 10,
          }
        },
        otpRecords: {
          create: {
            code: otp,
            type: 'REGISTRATION',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            isUsed: false
          }
        }
      },
      include: {
        instituteProfile: true,
        otpRecords: true
      }
    });

    console.log('   ✅ INSTITUTE created successfully!');
    console.log('   - User ID:', user.id);
    console.log('   - UID:', user.uniqueId);
    console.log('   - Email:', user.email);
    console.log('   - Role:', user.role);
    return true;
  } catch (error) {
    console.error('   ❌ INSTITUTE registration failed:', error.message);
    return false;
  }
}

async function testClubRegistration() {
  try {
    console.log('\n🧪 === TESTING CLUB REGISTRATION ===');
    const uid = await generateUID('CLUB', 'Punjab');
    const hashedPassword = await hashPassword('Club@123');
    const otp = generateOTP();
    const id = String(getUniqueId()).padStart(9, '0');

    const user = await prisma.user.create({
      data: {
        uniqueId: uid,
        email: `club.${id}@example.com`,
        phone: `9${id.slice(0, 9)}`,
        password: hashedPassword,
        role: 'CLUB',
        isVerified: false,
        clubProfile: {
          create: {
            name: 'Test Club',
            type: 'Sports Club',
            city: 'Chandigarh',
            state: 'Punjab',
            location: 'Club Location',
            established: '2015',
            facilities: 'Cricket Field,Football Ground,Tennis Court',
            membershipTypes: 'Regular,Premium',
            membersCount: 100,
          }
        },
        otpRecords: {
          create: {
            code: otp,
            type: 'REGISTRATION',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            isUsed: false
          }
        }
      },
      include: {
        clubProfile: true,
        otpRecords: true
      }
    });

    console.log('   ✅ CLUB created successfully!');
    console.log('   - User ID:', user.id);
    console.log('   - UID:', user.uniqueId);
    console.log('   - Email:', user.email);
    console.log('   - Role:', user.role);
    return true;
  } catch (error) {
    console.error('   ❌ CLUB registration failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 === COMPREHENSIVE USER REGISTRATION TEST ===');
  console.log('Testing all user types: Student, Coach, Institute, Club\n');

  const results = {
    student: await testStudentRegistration(),
    coach: await testCoachRegistration(),
    institute: await testInstituteRegistration(),
    club: await testClubRegistration(),
  };

  console.log('\n📊 === TEST RESULTS ===');
  console.log('Student Registration:', results.student ? '✅ PASS' : '❌ FAIL');
  console.log('Coach Registration:', results.coach ? '✅ PASS' : '❌ FAIL');
  console.log('Institute Registration:', results.institute ? '✅ PASS' : '❌ FAIL');
  console.log('Club Registration:', results.club ? '✅ PASS' : '❌ FAIL');

  const passCount = Object.values(results).filter(r => r).length;
  console.log(`\n🎯 Overall: ${passCount}/4 tests passed\n`);

  if (passCount === 4) {
    console.log('🎉 All registration types are working correctly!\n');
  } else {
    console.log('⚠️ Some registration types have issues. Review the errors above.\n');
  }
}

runAllTests()
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
