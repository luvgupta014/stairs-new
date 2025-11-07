const { PrismaClient } = require('@prisma/client');
const { generateUID } = require('../src/utils/uidGenerator');
const { hashPassword, generateOTP } = require('../src/utils/helpers');

const prisma = new PrismaClient();

async function testRegistration() {
  try {
    console.log('🧪 === TESTING STUDENT REGISTRATION ===\n');

    // Test UID Generation
    console.log('1️⃣  Testing UID Generation...');
    const uid = await generateUID('STUDENT', 'Delhi');
    console.log('   Generated UID:', uid);
    console.log('   UID Format: A0001DL071125\n');

    // Test password hashing
    console.log('2️⃣  Testing Password Hashing...');
    const hashedPassword = await hashPassword('Test@123');
    console.log('   Password hashed successfully\n');

    // Test OTP generation
    console.log('3️⃣  Testing OTP Generation...');
    const otp = generateOTP();
    console.log('   Generated OTP:', otp, '\n');

    // Test creating user with student profile
    console.log('4️⃣  Testing User Creation with Student Profile...');
    const user = await prisma.user.create({
      data: {
        uniqueId: uid,
        email: 'test.student@example.com',
        phone: '9876543219',
        password: hashedPassword,
        role: 'STUDENT',
        isVerified: false,
        studentProfile: {
          create: {
            name: 'Test Student',
            fatherName: 'Father Name',
            aadhaar: '123456789999',
            gender: 'Male',
            dateOfBirth: new Date('2000-01-01'),
            state: 'Delhi',
            district: 'South Delhi',
            address: 'Test Address',
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

    console.log('   ✅ User created successfully!');
    console.log('   User ID:', user.id);
    console.log('   Unique ID:', user.uniqueId);
    console.log('   Student ID:', user.studentProfile?.id);
    console.log('   OTP Record ID:', user.otpRecords?.[0]?.id, '\n');

    console.log('✅ All tests passed! Registration flow is working correctly.\n');

  } catch (error) {
    console.error('❌ === ERROR IN REGISTRATION TEST ===');
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Meta:', error.meta);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testRegistration();
