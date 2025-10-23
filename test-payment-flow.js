// Test the payment flow after OTP verification
const BASE_URL = 'http://localhost:5000';

// Test club registration without pay later
async function testClubPaymentFlow() {
  console.log('🧪 Testing Club Registration Flow Without Pay Later');
  
  try {
    // 1. Register club without pay later
    console.log('\n1. Registering club without pay later...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/club/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Sports Club',
        email: `testclub${Date.now()}@example.com`,
        phone: `987654321${Math.floor(Math.random() * 10)}`,
        password: 'testpass123',
        address: '123 Sports Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        website: 'https://testclub.com',
        description: 'A test sports club',
        established: '2020',
        facilities: 'Swimming Pool, Gym, Courts',
        sportsOffered: ['Swimming', 'Tennis'],
        contactPerson: 'Test Manager',
        planType: 'standard',
        payLater: false  // This should require payment
      })
    });

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      console.log('❌ Registration failed:', errorText);
      return;
    }

    const registerData = await registerResponse.json();
    console.log('✅ Registration response:', registerData);
    
    if (!registerData.success) {
      console.log('❌ Registration failed:', registerData.message);
      return;
    }

    const { userId, requiresPayment } = registerData.data;
    console.log('📊 Registration details:', {
      userId,
      requiresPayment,
      message: registerData.message
    });

    // 2. Verify OTP (simulating OTP verification)
    console.log('\n2. Verifying OTP...');
    
    // Note: In a real test, you'd get the OTP from the email
    // For this test, let's simulate with a fake OTP first to see the error handling
    const otpResponse = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        otp: '123456'  // This will likely fail, but let's see the response structure
      })
    });

    const otpData = await otpResponse.json();
    console.log('📋 OTP verification response:', otpData);
    
    if (otpData.success) {
      console.log('✅ OTP verified successfully');
      console.log('💰 Payment required:', otpData.data.requiresPayment);
      console.log('💳 Payment status:', otpData.data.paymentStatus);
    } else {
      console.log('❌ OTP verification failed (expected for fake OTP):', otpData.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test institute registration without pay later
async function testInstitutePaymentFlow() {
  console.log('\n🧪 Testing Institute Registration Flow Without Pay Later');
  
  try {
    // 1. Register institute without pay later
    console.log('\n1. Registering institute without pay later...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/institute/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Institute',
        email: `testinstitute${Date.now()}@example.com`,
        phone: `987654322${Math.floor(Math.random() * 10)}`,
        password: 'testpass123',
        address: '456 Education Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123457',
        website: 'https://testinstitute.com',
        description: 'A test educational institute',
        established: '2015',
        accreditation: 'CBSE',
        facilities: 'Labs, Library, Sports',
        coursesOffered: ['Math', 'Science'],
        contactPerson: 'Test Principal',
        planType: 'standard',
        payLater: false  // This should require payment
      })
    });

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      console.log('❌ Registration failed:', errorText);
      return;
    }

    const registerData = await registerResponse.json();
    console.log('✅ Registration response:', registerData);
    
    if (!registerData.success) {
      console.log('❌ Registration failed:', registerData.message);
      return;
    }

    const { userId, requiresPayment } = registerData.data;
    console.log('📊 Registration details:', {
      userId,
      requiresPayment,
      message: registerData.message
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testClubPaymentFlow();
setTimeout(() => {
  testInstitutePaymentFlow();
}, 2000);