// Test script to get the actual OTP from database and test the complete flow
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCompletePaymentFlow() {
  console.log('🧪 Testing Complete Payment Flow with Real OTP');
  
  try {
    // 1. Get the latest user and their OTP
    console.log('\n1. Finding latest test user and OTP...');
    
    const latestUser = await prisma.user.findFirst({
      where: {
        email: {
          contains: 'testclub'
        },
        role: 'CLUB'
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        otpRecords: {
          where: {
            type: 'REGISTRATION',
            isUsed: false
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        clubProfile: true
      }
    });

    if (!latestUser) {
      console.log('❌ No test user found');
      return;
    }

    console.log('✅ Found user:', {
      id: latestUser.id,
      email: latestUser.email,
      role: latestUser.role,
      isVerified: latestUser.isVerified,
      otpCount: latestUser.otpRecords?.length
    });

    if (!latestUser.otpRecords || latestUser.otpRecords.length === 0) {
      console.log('❌ No OTP records found');
      return;
    }

    const otpRecord = latestUser.otpRecords[0];
    console.log('📧 OTP details:', {
      id: otpRecord.id,
      code: otpRecord.code,
      type: otpRecord.type,
      isUsed: otpRecord.isUsed,
      expiresAt: otpRecord.expiresAt,
      isExpired: new Date() > otpRecord.expiresAt
    });

    if (new Date() > otpRecord.expiresAt) {
      console.log('❌ OTP has expired');
      return;
    }

    // 2. Test OTP verification with real OTP
    console.log('\n2. Verifying OTP with real code...');
    
    const otpResponse = await fetch('http://localhost:5000/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: latestUser.id,
        otp: otpRecord.code
      })
    });

    const otpData = await otpResponse.json();
    console.log('📋 OTP verification response:', otpData);
    
    if (otpData.success) {
      console.log('✅ OTP verified successfully');
      console.log('💰 Payment required:', otpData.data.requiresPayment);
      console.log('💳 Payment status:', otpData.data.paymentStatus);
      
      // Check if the user profile shows correct payment status
      console.log('\n3. Checking updated user profile...');
      const updatedUser = await prisma.user.findUnique({
        where: { id: latestUser.id },
        include: {
          clubProfile: true
        }
      });
      
      console.log('👤 Updated user profile:', {
        isVerified: updatedUser.isVerified,
        isActive: updatedUser.isActive,
        clubPaymentStatus: updatedUser.clubProfile?.paymentStatus
      });
      
    } else {
      console.log('❌ OTP verification failed:', otpData.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCompletePaymentFlow();