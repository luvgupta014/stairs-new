const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { 
  generateToken, 
  validateEmail, 
  validatePhone, 
  validatePassword,
  generateOTP,
  hashPassword,
  comparePassword,
  successResponse,
  errorResponse 
} = require('../utils/helpers');
const { generateUID } = require('../utils/uidGenerator');
const { sendOTPEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/emailService');

const router = express.Router();
const prisma = new PrismaClient();

// Test route for debugging
router.post('/test-email', async (req, res) => {
  try {
    console.log('🧪 === EMAIL TEST STARTED ===');
    const { email } = req.body;
    console.log('📧 Test email request for:', email);
    
    if (!email) {
      console.log('❌ Email validation failed: No email provided');
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    console.log('🧪 Testing email to:', email);
    
    const testOTP = '123456';
    console.log('📨 Sending test OTP:', testOTP);
    
    const result = await sendOTPEmail(email, testOTP, 'Test User');
    console.log('✅ Email service response:', result);
    
    res.json({ 
      success: true, 
      message: 'Test email sent successfully',
      result: result
    });
    
  } catch (error) {
    console.error('❌ Test email failed:', error);
    console.error('📋 Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      success: false, 
      message: 'Test email failed', 
      error: error.message 
    });
  }
});

// Student Registration with OTP
router.post('/student/register', async (req, res) => {
  try {
    console.log('🎓 === STUDENT REGISTRATION STARTED ===');
    console.log('📝 Student registration request received at:', new Date().toISOString());
    console.log('🔍 Request body keys:', Object.keys(req.body));
    console.log('📋 Full request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      name,
      fatherName,
      aadhaar,
      gender,
      dateOfBirth,
      state,
      district,
      address,
      pincode,
      phone,
      email,
      sport,
      sport2,
      sport3,
      school,
      club,
      coachName,
      coachMobile,
      level,
      password
    } = req.body;

    console.log('📋 Extracted fields validation:', {
      name: { provided: !!name, value: name },
      fatherName: { provided: !!fatherName, value: fatherName },
      aadhaar: { provided: !!aadhaar, value: aadhaar?.substring(0, 4) + '****' },
      gender: { provided: !!gender, value: gender },
      dateOfBirth: { provided: !!dateOfBirth, value: dateOfBirth },
      state: { provided: !!state, value: state },
      district: { provided: !!district, value: district },
      address: { provided: !!address, value: address?.substring(0, 20) + '...' },
      pincode: { provided: !!pincode, value: pincode },
      phone: { provided: !!phone, value: phone },
      email: { provided: !!email, value: email },
      sport: { provided: !!sport, value: sport },
      school: { provided: !!school, value: school },
      password: { provided: !!password, length: password?.length }
    });

    // Validation
    console.log('🔍 === VALIDATION PHASE ===');
    const requiredFields = [name, fatherName, aadhaar, gender, dateOfBirth, state, district, address, pincode, phone, email, sport, school, password];
    const missingFields = [];
    
    if (!name) missingFields.push('name');
    if (!fatherName) missingFields.push('fatherName');
    if (!aadhaar) missingFields.push('aadhaar');
    if (!gender) missingFields.push('gender');
    if (!dateOfBirth) missingFields.push('dateOfBirth');
    if (!state) missingFields.push('state');
    if (!district) missingFields.push('district');
    if (!address) missingFields.push('address');
    if (!pincode) missingFields.push('pincode');
    if (!phone) missingFields.push('phone');
    if (!email) missingFields.push('email');
    if (!sport) missingFields.push('sport');
    if (!school) missingFields.push('school');
    if (!password) missingFields.push('password');

    if (missingFields.length > 0) {
      console.log('❌ Validation failed: Missing required fields:', missingFields);
      return res.status(400).json(errorResponse('Missing required fields: ' + missingFields.join(', '), 400));
    }
    console.log('✅ All required fields provided');

    console.log('📧 Validating email format...');
    if (!validateEmail(email)) {
      console.log('❌ Validation failed: Invalid email format for:', email);
      return res.status(400).json(errorResponse('Invalid email format.', 400));
    }
    console.log('✅ Email format valid');

    console.log('📞 Validating phone format...');
    if (!validatePhone(phone)) {
      console.log('❌ Validation failed: Invalid phone format for:', phone);
      return res.status(400).json(errorResponse('Invalid phone number format.', 400));
    }
    console.log('✅ Phone format valid');

    console.log('🔒 Validating password strength...');
    if (!validatePassword(password)) {
      console.log('❌ Validation failed: Weak password');
      return res.status(400).json(errorResponse('Password must be at least 6 characters long.', 400));
    }
    console.log('✅ Password meets requirements');

    // Check if user already exists
    console.log('🔍 === CHECKING EXISTING USERS ===');
    console.log('🔍 Checking for existing user with email or phone...');
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone }
        ]
      }
    });

    if (existingUser) {
      console.log('❌ User already exists:', {
        id: existingUser.id,
        email: existingUser.email,
        phone: existingUser.phone,
        role: existingUser.role
      });
      return res.status(409).json(errorResponse('User with this email or phone already exists.', 409));
    }
    console.log('✅ No existing user found with this email/phone');

    // Check if Aadhaar already exists
    console.log('🆔 Checking for existing Aadhaar...');
    const existingAadhaar = await prisma.student.findFirst({
      where: { aadhaar: aadhaar }
    });

    if (existingAadhaar) {
      console.log('❌ Aadhaar already exists:', aadhaar.substring(0, 4) + '****');
      return res.status(409).json(errorResponse('User with this Aadhaar already exists.', 409));
    }
    console.log('✅ Aadhaar is unique');

    // Generate OTP
    console.log('🔑 === GENERATING CREDENTIALS ===');
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log('🔑 Generated OTP:', otp);
    console.log('⏰ OTP expires at:', otpExpires.toISOString());

    // Generate UID with format: A0001DL1124 (Type + Serial + State + MMYY)
    const uniqueId = await generateUID('STUDENT', state);
    console.log('🆔 Generated UID:', uniqueId);

    // Hash password
    console.log('🔒 Hashing password...');
    const hashedPassword = await hashPassword(password);
    console.log('✅ Password hashed successfully');

    console.log('💾 === CREATING USER RECORD ===');
    console.log('🔄 Creating user and student profile...');

    // Prepare date of birth
    let dobDate;
    try {
      dobDate = new Date(dateOfBirth);
      console.log('📅 Date of birth parsed:', dobDate.toISOString());
    } catch (dobError) {
      console.log('❌ Invalid date of birth format:', dateOfBirth);
      return res.status(400).json(errorResponse('Invalid date of birth format.', 400));
    }

    // Create user and student profile
    const user = await prisma.user.create({
      data: {
        uniqueId,
        email,
        phone,
        password: hashedPassword,
        role: 'STUDENT',
        isVerified: false,
        studentProfile: {
          create: {
            name,
            fatherName,
            aadhaar,
            gender,
            dateOfBirth: dobDate,
            state,
            district,
            address,
            pincode,
            sport,
            sport2: sport2 || null,
            sport3: sport3 || null,
            school,
            club: club || null,
            coachName: coachName || null,
            coachMobile: coachMobile || null,
            level: level || 'BEGINNER',
          }
        },
        otpRecords: {
          create: {
            code: otp,
            type: 'REGISTRATION',
            expiresAt: otpExpires,
            isUsed: false
          }
        }
      },
      include: {
        studentProfile: true,
        otpRecords: true
      }
    });

    console.log('✅ User created successfully:', {
      userId: user.id,
      uniqueId: user.uniqueId,
      email: user.email,
      studentId: user.studentProfile?.id,
      otpRecordId: user.otpRecords?.[0]?.id
    });

    // Send OTP via Email
    console.log('📧 === SENDING OTP EMAIL ===');
    try {
      console.log('📧 Sending OTP email to:', email);
      await sendOTPEmail(email, otp, name);
      console.log(`✅ OTP sent successfully to ${email}: ${otp}`);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', {
        error: emailError.message,
        stack: emailError.stack,
        code: emailError.code
      });
      // Continue anyway - user is created, they can resend OTP
    }

    console.log('🎉 === REGISTRATION COMPLETED ===');
    const response = {
      message: 'Registration successful. Please verify your email.',
      userId: user.id,
      uniqueId: user.uniqueId,
      requiresOtp: true
    };
    console.log('📤 Sending response:', response);

    res.status(201).json(successResponse(response, 'Student registered successfully. OTP sent to email.', 201));

  } catch (error) {
    console.error('❌ === STUDENT REGISTRATION ERROR ===');
    console.error('💥 Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    
    // Check for specific Prisma errors
    if (error.code === 'P2002') {
      console.error('🚫 Unique constraint violation:', error.meta);
      return res.status(409).json(errorResponse('A user with this information already exists.', 409));
    }
    
    res.status(500).json(errorResponse('Registration failed. Please try again.', 500));
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    console.log('🔐 === OTP VERIFICATION STARTED ===');
    console.log('📝 Request received at:', new Date().toISOString());
    console.log('📋 Request body:', req.body);
    
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      console.log('❌ Missing required fields:', { userId: !!userId, otp: !!otp });
      return res.status(400).json(errorResponse('User ID and OTP are required.', 400));
    }

    console.log('🔍 Looking for user with ID:', userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        coachProfile: true,
        instituteProfile: true,
        clubProfile: true,
        otpRecords: {
          where: {
            type: 'REGISTRATION',
            isUsed: false
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found for ID:', userId);
      return res.status(404).json(errorResponse('User not found.', 404));
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      otpRecordsCount: user.otpRecords?.length || 0
    });

    // Find latest unused OTP record for registration
    console.log('🔍 Looking for valid OTP record...');
    console.log('🔍 Available OTP records:', user.otpRecords?.map(record => ({
      id: record.id,
      code: record.code,
      type: record.type,
      isUsed: record.isUsed,
      expiresAt: record.expiresAt,
      isExpired: new Date() > record.expiresAt
    })));

    const otpRecord = await prisma.oTPRecord.findFirst({
      where: {
        userId: userId,
        code: otp,
        type: 'REGISTRATION',
        isUsed: false,
        expiresAt: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      console.log('❌ Invalid or expired OTP:', {
        providedOtp: otp,
        userId: userId,
        currentTime: new Date().toISOString()
      });
      return res.status(400).json(errorResponse('Invalid or expired OTP.', 400));
    }

    console.log('✅ Valid OTP found:', {
      otpId: otpRecord.id,
      code: otpRecord.code,
      expiresAt: otpRecord.expiresAt
    });

    // Mark OTP as used and verify user
    console.log('🔄 Marking OTP as used and activating user...');
    await prisma.oTPRecord.update({
      where: { id: otpRecord.id },
      data: { isUsed: true }
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        isActive: true
      },
      include: {
        studentProfile: true,
        coachProfile: true,
        instituteProfile: true,
        clubProfile: true
      }
    });

    console.log('✅ User updated successfully:', {
      id: updatedUser.id,
      isVerified: updatedUser.isVerified,
      isActive: updatedUser.isActive
    });

    // Generate JWT token
    console.log('🎟️ Generating JWT token...');
    const token = generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role
    });
    console.log('✅ JWT token generated');

    // Send welcome email
    console.log('📧 Sending welcome email...');
    try {
      const profileName = updatedUser.studentProfile?.name || 
                         updatedUser.coachProfile?.name || 
                         updatedUser.instituteProfile?.name || 
                         updatedUser.clubProfile?.name || 
                         'User';
      await sendWelcomeEmail(updatedUser.email, profileName, updatedUser.role);
      console.log('✅ Welcome email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError);
      // Don't fail the request if welcome email fails
    }

    console.log('🎉 === OTP VERIFICATION COMPLETED ===');
    
    console.log('🔍 User data for payment check:', {
      role: updatedUser.role,
      hasCoachProfile: !!updatedUser.coachProfile,
      hasInstituteProfile: !!updatedUser.instituteProfile,
      hasClubProfile: !!updatedUser.clubProfile,
      coachPaymentStatus: updatedUser.coachProfile?.paymentStatus,
      institutePaymentStatus: updatedUser.instituteProfile?.paymentStatus,
      clubPaymentStatus: updatedUser.clubProfile?.paymentStatus
    });
    
    // Check if payment is required for this user
    let requiresPayment = false;
    let paymentStatus = 'SUCCESS'; // Default for students
    
    if (updatedUser.role === 'COACH' && updatedUser.coachProfile) {
      paymentStatus = updatedUser.coachProfile.paymentStatus || 'PENDING';
      requiresPayment = paymentStatus === 'PENDING';
    } else if (updatedUser.role === 'INSTITUTE' && updatedUser.instituteProfile) {
      paymentStatus = updatedUser.instituteProfile.paymentStatus || 'PENDING';
      requiresPayment = paymentStatus === 'PENDING';
    } else if (updatedUser.role === 'CLUB' && updatedUser.clubProfile) {
      paymentStatus = updatedUser.clubProfile.paymentStatus || 'PENDING';
      requiresPayment = paymentStatus === 'PENDING';
    }
    
    console.log('💰 Payment status check:', {
      role: updatedUser.role,
      paymentStatus,
      requiresPayment
    });
    
    const responseData = {
      token,
      requiresPayment,
      paymentStatus,
      user: {
        id: updatedUser.id,
        uniqueId: updatedUser.uniqueId,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        profile: updatedUser.studentProfile || updatedUser.coachProfile || updatedUser.instituteProfile || updatedUser.clubProfile
      }
    };
    console.log('📤 Sending response data keys:', Object.keys(responseData));

    res.json(successResponse(responseData, 'Phone verified successfully.'));

  } catch (error) {
    console.error('❌ === OTP VERIFICATION ERROR ===');
    console.error('💥 Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json(errorResponse('OTP verification failed.', 500));
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    console.log('🔄 === RESEND OTP STARTED ===');
    console.log('📝 Request received at:', new Date().toISOString());
    console.log('📋 Request body:', req.body);
    
    const { userId } = req.body;

    if (!userId) {
      console.log('❌ Missing userId');
      return res.status(400).json(errorResponse('User ID is required.', 400));
    }

    console.log('🔍 Looking for user with ID:', userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        coachProfile: true,
        instituteProfile: true,
        clubProfile: true
      }
    });

    if (!user) {
      console.log('❌ User not found for ID:', userId);
      return res.status(404).json(errorResponse('User not found.', 404));
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive
    });

    if (user.isActive && user.isVerified) {
      console.log('❌ User is already verified');
      return res.status(400).json(errorResponse('User is already verified.', 400));
    }

    // Generate new OTP
    console.log('🔑 Generating new OTP...');
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log('🔑 New OTP generated:', otp);
    console.log('⏰ OTP expires at:', otpExpires.toISOString());

    // Create new OTP record
    const otpRecord = await prisma.oTPRecord.create({
      data: {
        userId: userId,
        code: otp,
        type: 'REGISTRATION',
        expiresAt: otpExpires,
        isUsed: false
      }
    });

    console.log('✅ New OTP record created:', {
      id: otpRecord.id,
      code: otpRecord.code
    });

    // Send OTP via Email
    console.log('📧 Sending new OTP email...');
    try {
      const userName = user.studentProfile?.name || 
                      user.coachProfile?.name || 
                      user.instituteProfile?.name || 
                      user.clubProfile?.name || 
                      'User';
      await sendOTPEmail(user.email, otp, userName);
      console.log(`✅ New OTP sent to email ${user.email}: ${otp}`);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError);
      return res.status(500).json(errorResponse('Failed to send OTP email.', 500));
    }

    console.log('🎉 === RESEND OTP COMPLETED ===');
    res.json(successResponse(null, 'OTP sent successfully to your email.'));

  } catch (error) {
    console.error('❌ === RESEND OTP ERROR ===');
    console.error('💥 Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json(errorResponse('Failed to resend OTP.', 500));
  }
});

// Coach Registration with OTP
router.post('/coach/register', async (req, res) => {
  try {
    console.log('👨‍🏫 === COACH REGISTRATION STARTED ===');
    console.log('📝 Coach registration request received at:', new Date().toISOString());
    console.log('🔍 Request body keys:', Object.keys(req.body));
    console.log('📋 Full request body:', JSON.stringify(req.body, null, 2));
    
    const {
      name,
      fatherName,
      motherName,
      aadhaar,
      gender,
      dateOfBirth,
      state,
      district,
      address,
      pincode,
      email,
      phone,
      panNumber,
      utrNumber,
      membershipStatus,
      applyingAs,
      primarySport,
      otherSports,
      password,
      specialization,
      experience,
      certifications,
      bio,
      location
    } = req.body;

    console.log('📋 Extracted coach fields:', {
      name: { provided: !!name, value: name },
      fatherName: { provided: !!fatherName, value: fatherName },
      email: { provided: !!email, value: email },
      phone: { provided: !!phone, value: phone },
      primarySport: { provided: !!primarySport, value: primarySport }
    });

    // Validation
    console.log('🔍 === COACH VALIDATION PHASE ===');
    const missingFields = [];
    
    if (!name) missingFields.push('name');
    if (!fatherName) missingFields.push('fatherName');
    if (!aadhaar) missingFields.push('aadhaar');
    if (!gender) missingFields.push('gender');
    if (!dateOfBirth) missingFields.push('dateOfBirth');
    if (!state) missingFields.push('state');
    if (!district) missingFields.push('district');
    if (!address) missingFields.push('address');
    if (!pincode) missingFields.push('pincode');
    if (!email) missingFields.push('email');
    if (!phone) missingFields.push('phone');
    if (!panNumber) missingFields.push('panNumber');
    if (!utrNumber) missingFields.push('utrNumber');
    
    if (!primarySport) missingFields.push('primarySport');
    if (!password) missingFields.push('password');

    if (missingFields.length > 0) {
      console.log('❌ Coach validation failed: Missing required fields:', missingFields);
      return res.status(400).json(errorResponse('Missing required fields: ' + missingFields.join(', '), 400));
    }
    console.log('✅ All coach required fields provided');

    console.log('📧 Validating coach email format...');
    if (!validateEmail(email)) {
      console.log('❌ Coach validation failed: Invalid email format for:', email);
      return res.status(400).json(errorResponse('Invalid email format.', 400));
    }
    console.log('✅ Coach email format valid');

    console.log('📞 Validating coach phone format...');
    if (!validatePhone(phone)) {
      console.log('❌ Coach validation failed: Invalid phone format for:', phone);
      return res.status(400).json(errorResponse('Invalid phone number format.', 400));
    }
    console.log('✅ Coach phone format valid');

    console.log('🔒 Validating coach password strength...');
    if (!validatePassword(password)) {
      console.log('❌ Coach validation failed: Weak password');
      return res.status(400).json(errorResponse('Password must be at least 8 characters with uppercase, lowercase, and number.', 400));
    }
    console.log('✅ Coach password meets requirements');

    // Check if user already exists
    console.log('🔍 === CHECKING EXISTING COACHES ===');
    console.log('🔍 Checking for existing user with email or phone...');
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone }
        ]
      }
    });

    if (existingUser) {
      console.log('❌ User already exists:', {
        id: existingUser.id,
        email: existingUser.email,
        phone: existingUser.phone,
        role: existingUser.role
      });
      return res.status(409).json(errorResponse('User with this email or phone already exists.', 409));
    }
    console.log('✅ No existing user found with this email/phone');

    // Check if Aadhaar already exists
    console.log('🆔 Checking for existing Aadhaar...');
    const existingAadhaar = await prisma.coach.findFirst({
      where: { aadhaar: aadhaar }
    });

    if (existingAadhaar) {
      console.log('❌ Aadhaar already exists:', aadhaar.substring(0, 4) + '****');
      return res.status(409).json(errorResponse('Coach with this Aadhaar already exists.', 409));
    }
    console.log('✅ Aadhaar is unique');

    // Check if PAN already exists
    console.log('🔍 Checking for existing PAN...');
    const existingPAN = await prisma.coach.findFirst({
      where: { panNumber: panNumber }
    });

    if (existingPAN) {
      console.log('❌ PAN already exists:', panNumber);
      return res.status(409).json(errorResponse('Coach with this PAN number already exists.', 409));
    }
    console.log('✅ PAN is unique');

    // Generate OTP
    console.log('🔑 === GENERATING COACH CREDENTIALS ===');
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log('🔑 Generated OTP:', otp);
    console.log('⏰ OTP expires at:', otpExpires.toISOString());

    // Generate UID with format: C0001DL1124 (Type + Serial + State + MMYY)
    const uniqueId = await generateUID('COACH', state);
    console.log('🆔 Generated UID:', uniqueId);

    // Hash password
    console.log('🔒 Hashing password...');
    const hashedPassword = await hashPassword(password);
    console.log('✅ Password hashed successfully');

    // Payment status is always pending (payment happens after OTP verification)
    const paymentStatus = 'PENDING';
    const isActive = false; // Will be true after OTP verification and payment

    console.log('💾 === CREATING COACH USER RECORD ===');
    console.log('🔄 Creating user and coach profile...');

    // Create user and coach profile
    const user = await prisma.user.create({
      data: {
        uniqueId,
        email,
        phone,
        password: hashedPassword,
        role: 'COACH',
        isActive: false,
        isVerified: false,
        coachProfile: {
          create: {
            name,
            fatherName,
            motherName,
            aadhaar,
            gender,
            dateOfBirth: new Date(dateOfBirth),
            state,
            district,
            address,
            pincode,
            panNumber,
            utrNumber,
            membershipStatus: membershipStatus || 'NEW',
            applyingAs: applyingAs || 'Chief District coordinator',
            primarySport,
            otherSports,
            specialization: primarySport,
            experience: parseInt(experience) || 0,
            certifications: certifications || null,
            bio,
            location: address,
            city: district,
            paymentStatus: paymentStatus,
            isActive: isActive
          }
        },
        otpRecords: {
          create: {
            code: otp,
            type: 'REGISTRATION',
            expiresAt: otpExpires,
            isUsed: false
          }
        }
      },
      include: {
        coachProfile: true
      }
    });

    // Send OTP via Email
    console.log('📧 === SENDING COACH OTP EMAIL ===');
    try {
      console.log('📧 Sending OTP email to:', email);
      await sendOTPEmail(email, otp, name);
      console.log(`✅ OTP sent successfully to ${email}: ${otp}`);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', {
        error: emailError.message,
        stack: emailError.stack,
        code: emailError.code
      });
      // Continue anyway - user is created, they can resend OTP
    }

    console.log('🎉 === COACH REGISTRATION COMPLETED ===');
    const response = {
      message: 'Registration successful. Please verify your email.',
      userId: user.id,
      uniqueId: user.uniqueId,
      coachId: user.coachProfile.id,
      requiresOtp: true,
      requiresPayment: true
    };
    console.log('📤 Sending response:', response);

    res.status(201).json(successResponse(response, 'Coach registered successfully. OTP sent to email.', 201));

  } catch (error) {
    console.error('❌ === COACH REGISTRATION ERROR ===');
    console.error('💥 Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json(errorResponse('Coach registration failed. Please try again.', 500));
  }
});

// Institute Registration with OTP
router.post('/institute/register', async (req, res) => {
  try {
    console.log('🏢 === INSTITUTE REGISTRATION STARTED ===');
    console.log('📝 Institute registration request received at:', new Date().toISOString());
    console.log('🔍 Request body keys:', Object.keys(req.body));
    console.log('📋 Full request body:', JSON.stringify(req.body, null, 2));
    
    const {
      name,
      email,
      phone,
      password,
      address,
      website,
      description,
      sportsOffered,
      contactPerson,
      licenseNumber
    } = req.body;

    console.log('📋 Extracted institute fields:', {
      name: { provided: !!name, value: name },
      email: { provided: !!email, value: email },
      phone: { provided: !!phone, value: phone }
    });

    // Validation
    console.log('🔍 === INSTITUTE VALIDATION PHASE ===');
    const requiredFields = [name, email, phone, password, contactPerson];
    const missingFields = [];
    
    if (!name) missingFields.push('name');
    if (!email) missingFields.push('email');
    if (!phone) missingFields.push('phone');
    if (!password) missingFields.push('password');
    if (!contactPerson) missingFields.push('contactPerson');

    if (missingFields.length > 0) {
      console.log('❌ Institute validation failed: Missing required fields:', missingFields);
      return res.status(400).json(errorResponse('Missing required fields: ' + missingFields.join(', '), 400));
    }
    console.log('✅ All institute required fields provided');

    console.log('📧 Validating institute email format...');
    if (!validateEmail(email)) {
      console.log('❌ Institute validation failed: Invalid email format for:', email);
      return res.status(400).json(errorResponse('Invalid email format.', 400));
    }
    console.log('✅ Institute email format valid');

    console.log('📞 Validating institute phone format...');
    if (!validatePhone(phone)) {
      console.log('❌ Institute validation failed: Invalid phone format for:', phone);
      return res.status(400).json(errorResponse('Invalid phone number format.', 400));
    }
    console.log('✅ Institute phone format valid');

    console.log('🔒 Validating institute password strength...');
    if (!validatePassword(password)) {
      console.log('❌ Institute validation failed: Weak password');
      return res.status(400).json(errorResponse('Password must be at least 8 characters with uppercase, lowercase, and number.', 400));
    }
    console.log('✅ Institute password meets requirements');

    // Check if user already exists
    console.log('🔍 === CHECKING EXISTING INSTITUTES ===');
    console.log('🔍 Checking for existing user with email or phone...');
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone }
        ]
      }
    });

    if (existingUser) {
      console.log('❌ User already exists:', {
        id: existingUser.id,
        email: existingUser.email,
        phone: existingUser.phone,
        role: existingUser.role
      });
      return res.status(409).json(errorResponse('User with this email or phone already exists.', 409));
    }
    console.log('✅ No existing user found with this email/phone');

    // Generate OTP
    console.log('🔑 === GENERATING INSTITUTE CREDENTIALS ===');
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log('🔑 Generated OTP:', otp);
    console.log('⏰ OTP expires at:', otpExpires.toISOString());

    // Generate UID with format: I0001DL1124 (Type + Serial + State + MMYY)
    // Extract state from address or use default
    const stateFromAddress = address?.split(',')[2]?.trim() || 'IN';
    const uniqueId = await generateUID('INSTITUTE', stateFromAddress);
    console.log('🆔 Generated UID:', uniqueId);

    // Hash password
    console.log('🔒 Hashing password...');
    const hashedPassword = await hashPassword(password);
    console.log('✅ Password hashed successfully');

    // Create user and institute profile
    console.log('💾 === CREATING INSTITUTE USER RECORD ===');
    console.log('🔄 Creating user and institute profile...');

    const user = await prisma.user.create({
      data: {
        uniqueId,
        email,
        phone,
        password: hashedPassword,
        role: 'INSTITUTE',
        isActive: false,
        isVerified: false,
        instituteProfile: {
          create: {
            name,
            type: 'Sports Institute',
            location: address,
            city: address?.split(',')[1]?.trim() || '',
            state: address?.split(',')[2]?.trim() || '',
            established: new Date().getFullYear().toString(),
            sportsOffered: JSON.stringify(sportsOffered || [])
          }
        },
        otpRecords: {
          create: {
            code: otp,
            type: 'REGISTRATION',
            expiresAt: otpExpires,
            isUsed: false
          }
        }
      },
      include: {
        instituteProfile: true
      }
    });

    // Send OTP via Email
    console.log('📧 === SENDING INSTITUTE OTP EMAIL ===');
    try {
      console.log('📧 Sending OTP email to:', email);
      await sendOTPEmail(email, otp, name);
      console.log(`✅ OTP sent successfully to ${email}: ${otp}`);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', {
        error: emailError.message,
        stack: emailError.stack,
        code: emailError.code
      });
    }

    console.log('🎉 === INSTITUTE REGISTRATION COMPLETED ===');
    const response = {
      message: 'Institute registration successful. Please verify your email.',
      userId: user.id,
      uniqueId: user.uniqueId,
      instituteId: user.instituteProfile.id,
      requiresOtp: true,
      requiresPayment: true
    };
    console.log('📤 Sending response:', response);

    res.status(201).json(successResponse(response, 'Institute registered successfully. OTP sent to email.', 201));

  } catch (error) {
    console.error('❌ === INSTITUTE REGISTRATION ERROR ===');
    console.error('💥 Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json(errorResponse('Registration failed. Please try again.', 500));
  }
});

// Club Registration with OTP
router.post('/club/register', async (req, res) => {
  try {
    console.log('🏆 === CLUB REGISTRATION STARTED ===');
    console.log('📝 Club registration request received at:', new Date().toISOString());
    console.log('🔍 Request body keys:', Object.keys(req.body));
    console.log('📋 Full request body:', JSON.stringify(req.body, null, 2));
    
    const {
      name,
      email,
      phone,
      password,
      address,
      website,
      description,
      sportsOffered,
      contactPerson,
      establishedYear
    } = req.body;

    console.log('📋 Extracted club fields:', {
      name: { provided: !!name, value: name },
      email: { provided: !!email, value: email },
      phone: { provided: !!phone, value: phone }
    });

    // Validation
    console.log('🔍 === CLUB VALIDATION PHASE ===');
    const requiredFields = [name, email, phone, password, contactPerson];
    const missingFields = [];
    
    if (!name) missingFields.push('name');
    if (!email) missingFields.push('email');
    if (!phone) missingFields.push('phone');
    if (!password) missingFields.push('password');
    if (!contactPerson) missingFields.push('contactPerson');

    if (missingFields.length > 0) {
      console.log('❌ Club validation failed: Missing required fields:', missingFields);
      return res.status(400).json(errorResponse('Missing required fields: ' + missingFields.join(', '), 400));
    }
    console.log('✅ All club required fields provided');

    console.log('📧 Validating club email format...');
    if (!validateEmail(email)) {
      console.log('❌ Club validation failed: Invalid email format for:', email);
      return res.status(400).json(errorResponse('Invalid email format.', 400));
    }
    console.log('✅ Club email format valid');

    console.log('📞 Validating club phone format...');
    if (!validatePhone(phone)) {
      console.log('❌ Club validation failed: Invalid phone format for:', phone);
      return res.status(400).json(errorResponse('Invalid phone number format.', 400));
    }
    console.log('✅ Club phone format valid');

    console.log('🔒 Validating club password strength...');
    if (!validatePassword(password)) {
      console.log('❌ Club validation failed: Weak password');
      return res.status(400).json(errorResponse('Password must be at least 8 characters with uppercase, lowercase, and number.', 400));
    }
    console.log('✅ Club password meets requirements');

    // Check if user already exists
    console.log('🔍 === CHECKING EXISTING CLUBS ===');
    console.log('🔍 Checking for existing user with email or phone...');
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone }
        ]
      }
    });

    if (existingUser) {
      console.log('❌ User already exists:', {
        id: existingUser.id,
        email: existingUser.email,
        phone: existingUser.phone,
        role: existingUser.role
      });
      return res.status(409).json(errorResponse('User with this email or phone already exists.', 409));
    }
    console.log('✅ No existing user found with this email/phone');

    // Generate OTP
    console.log('🔑 === GENERATING CLUB CREDENTIALS ===');
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log('🔑 Generated OTP:', otp);
    console.log('⏰ OTP expires at:', otpExpires.toISOString());

    // Generate UID with format: B0001DL1124 (Type + Serial + State + MMYY)
    // Extract state from address or use default
    const stateFromAddress = address?.split(',')[2]?.trim() || 'IN';
    const uniqueId = await generateUID('CLUB', stateFromAddress);
    console.log('🆔 Generated UID:', uniqueId);

    // Hash password
    console.log('🔒 Hashing password...');
    const hashedPassword = await hashPassword(password);
    console.log('✅ Password hashed successfully');

    // Create user and club profile
    console.log('💾 === CREATING CLUB USER RECORD ===');
    console.log('🔄 Creating user and club profile...');

    const user = await prisma.user.create({
      data: {
        uniqueId,
        email,
        phone,
        password: hashedPassword,
        role: 'CLUB',
        isActive: false,
        isVerified: false,
        clubProfile: {
          create: {
            name,
            type: 'Sports Club',
            location: address,
            city: address?.split(',')[1]?.trim() || '',
            state: address?.split(',')[2]?.trim() || '',
            established: establishedYear ? establishedYear.toString() : new Date().getFullYear().toString(),
            facilities: JSON.stringify(sportsOffered || [])
          }
        },
        otpRecords: {
          create: {
            code: otp,
            type: 'REGISTRATION',
            expiresAt: otpExpires,
            isUsed: false
          }
        }
      },
      include: {
        clubProfile: true
      }
    });

    // Send OTP via Email
    console.log('📧 === SENDING CLUB OTP EMAIL ===');
    try {
      console.log('📧 Sending OTP email to:', email);
      await sendOTPEmail(email, otp, name);
      console.log(`✅ OTP sent successfully to ${email}: ${otp}`);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', {
        error: emailError.message,
        stack: emailError.stack,
        code: emailError.code
      });
    }

    console.log('🎉 === CLUB REGISTRATION COMPLETED ===');
    const response = {
      message: 'Club registration successful. Please verify your email.',
      userId: user.id,
      uniqueId: user.uniqueId,
      clubId: user.clubProfile.id,
      requiresOtp: true,
      requiresPayment: true
    };
    console.log('📤 Sending response:', response);

    res.status(201).json(successResponse(response, 'Club registered successfully. OTP sent to email.', 201));

  } catch (error) {
    console.error('❌ === CLUB REGISTRATION ERROR ===');
    console.error('💥 Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json(errorResponse('Registration failed. Please try again.', 500));
  }
});

// Login (Universal)
router.post('/login', async (req, res) => {
  let email, password, role; // Declare outside try block for catch block access
  try {
    console.log('🔐 === LOGIN STARTED ===');
    console.log('📝 Login request received at:', new Date().toISOString());
    console.log('📋 Request body:', {
      email: req.body.email,
      role: req.body.role,
      hasPassword: !!req.body.password
    });
    
    ({ email, password, role } = req.body);

    if (!email || !password) {
      console.log('❌ Login validation failed: Missing email or password');
      return res.status(400).json(errorResponse('Email and password are required.', 400));
    }

    if (!validateEmail(email)) {
      console.log('❌ Login validation failed: Invalid email format for:', email);
      return res.status(400).json(errorResponse('Invalid email format.', 400));
    }

    // Find user
    console.log('🔍 Looking for user with email:', email);
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
        coachProfile: true,
        instituteProfile: true,
        clubProfile: true,
        adminProfile: true
      }
    });
    console.log('🔎 User lookup result:', user);

    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(401).json(errorResponse('No account found with this email address. Please check your email or register for a new account.', 401));
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive
    });

    // Check role if specified
    if (role && user.role !== role) {
      console.log('❌ Role mismatch:', { requestedRole: role, userRole: user.role });
      const roleNames = {
        'STUDENT': 'Student',
        'COACH': 'Coach/Coordinator', 
        'INSTITUTE': 'Institute',
        'CLUB': 'Club',
        'ADMIN': 'Administrator'
      };
      const expectedRole = roleNames[role] || role;
      const actualRole = roleNames[user.role] || user.role;
      return res.status(401).json(errorResponse(`This account is registered as ${actualRole}, not ${expectedRole}. Please use the correct login portal.`, 401));
    }

    // Check password
    console.log('🔒 Verifying password...');
    
    // Check if user has a password set
    if (!user.password) {
      console.log('❌ User has no password set:', email);
      return res.status(401).json(errorResponse('Account setup incomplete. Please reset your password or contact support.', 401));
    }
    
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json(errorResponse('Incorrect password. Please check your password and try again.', 401));
    }
    console.log('✅ Password verified');

    // Check if user is active and verified
    if (!user.isVerified) {
      console.log('❌ User account not verified:', {
        isActive: user.isActive,
        isVerified: user.isVerified
      });
      return res.status(401).json(errorResponse('Account not verified. Please check your email for verification instructions and complete the verification process.', 401));
    }
    
    if (!user.isActive) {
      console.log('❌ User account not active:', {
        isActive: user.isActive,
        isVerified: user.isVerified
      });
      return res.status(401).json(errorResponse('Account is deactivated. Please contact support for assistance.', 401));
    }

    // Generate JWT token
    console.log('🎟️ Generating JWT token...');
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    console.log('✅ JWT token generated');

    console.log('🎉 === LOGIN COMPLETED ===');
    const responseData = {
      token,
      user: {
        id: user.id,
        uniqueId: user.uniqueId,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        profile: user.studentProfile || user.coachProfile || user.instituteProfile || user.clubProfile || user.adminProfile
      }
    };
    console.log('📤 Sending login response for user:', user.email);

    res.json(successResponse(responseData, 'Login successful.'));

  } catch (error) {
    console.error('❌ === LOGIN ERROR ===');
    console.error('💥 Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
      name: error.name,
      errno: error.errno
    });
    console.error('📋 Full error object:', JSON.stringify(error, null, 2));
    console.error('🔍 Email attempted:', email);
    console.error('🔍 Role attempted:', role);
    res.status(500).json(errorResponse('An unexpected error occurred during login. Please try again.', 500));
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    console.log('🔐 === FORGOT PASSWORD STARTED ===');
    console.log('📝 Request received at:', new Date().toISOString());
    console.log('📋 Request body:', { email: req.body.email });
    
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      console.log('❌ Invalid email provided:', email);
      return res.status(400).json(errorResponse('Valid email is required.', 400));
    }

    console.log('🔍 Looking for user with email:', email);
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
      console.log('❌ User not found for email:', email);
      // Don't reveal if email exists - always return success message
      return res.json(successResponse(null, 'If the email exists, a reset code has been sent.'));
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Generate reset token (OTP)
    console.log('🔑 Generating reset token...');
    const resetToken = generateOTP();
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    console.log('🔑 Reset token generated:', resetToken);
    console.log('⏰ Token expires at:', resetTokenExpires.toISOString());

    // Create OTP record for password reset
    console.log('💾 Creating password reset OTP record...');
    const otpRecord = await prisma.oTPRecord.create({
      data: {
        userId: user.id,
        code: resetToken,
        type: 'PASSWORD_RESET',
        expiresAt: resetTokenExpires,
        isUsed: false
      }
    });

    console.log('✅ OTP record created:', {
      id: otpRecord.id,
      code: otpRecord.code,
      type: otpRecord.type
    });

    // Send reset token via email
    console.log('📧 Sending password reset email...');
    try {
      const userName = user.studentProfile?.name || 
                      user.coachProfile?.name || 
                      user.instituteProfile?.name || 
                      user.clubProfile?.name || 
                      'User';
      await sendPasswordResetEmail(email, resetToken, userName);
      console.log(`✅ Password reset token sent to ${email}: ${resetToken}`);
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', {
        error: emailError.message,
        stack: emailError.stack
      });
      // Don't reveal if email exists, but log the error
    }

    console.log('🎉 === FORGOT PASSWORD COMPLETED ===');
    res.json(successResponse(null, 'If the email exists, a reset code has been sent.'));

  } catch (error) {
    console.error('❌ === FORGOT PASSWORD ERROR ===');
    console.error('💥 Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json(errorResponse('Failed to process request.', 500));
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    console.log('🔐 === RESET PASSWORD STARTED ===');
    console.log('📝 Request received at:', new Date().toISOString());
    console.log('📋 Request body:', { 
      email: req.body.email, 
      resetToken: req.body.resetToken,
      hasNewPassword: !!req.body.newPassword
    });
    
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      console.log('❌ Missing required fields:', {
        email: !!email,
        resetToken: !!resetToken,
        newPassword: !!newPassword
      });
      return res.status(400).json(errorResponse('Email, reset token, and new password are required.', 400));
    }

    if (!validatePassword(newPassword)) {
      console.log('❌ Password validation failed');
      return res.status(400).json(errorResponse('Password must be at least 6 characters long.', 400));
    }

    console.log('🔍 Looking for user with email:', email);
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(400).json(errorResponse('Invalid or expired reset token.', 400));
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email
    });

    // Find valid reset token in OTPRecord
    console.log('🔍 Looking for valid reset token...');
    const otpRecord = await prisma.oTPRecord.findFirst({
      where: {
        userId: user.id,
        code: resetToken,
        type: 'PASSWORD_RESET',
        isUsed: false,
        expiresAt: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      console.log('❌ Invalid or expired reset token:', {
        userId: user.id,
        providedToken: resetToken,
        currentTime: new Date().toISOString()
      });
      return res.status(400).json(errorResponse('Invalid or expired reset token.', 400));
    }

    console.log('✅ Valid reset token found:', {
      otpId: otpRecord.id,
      code: otpRecord.code,
      expiresAt: otpRecord.expiresAt
    });

    // Hash new password
    console.log('🔒 Hashing new password...');
    const hashedPassword = await hashPassword(newPassword);
    console.log('✅ Password hashed successfully');

    // Update password and mark OTP as used
    console.log('💾 Updating user password...');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword
      }
    });

    console.log('🔄 Marking OTP as used...');
    await prisma.oTPRecord.update({
      where: { id: otpRecord.id },
      data: { isUsed: true }
    });

    console.log('🎉 === RESET PASSWORD COMPLETED ===');
    res.json(successResponse(null, 'Password reset successful.'));

  } catch (error) {
    console.error('❌ === RESET PASSWORD ERROR ===');
    console.error('💥 Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json(errorResponse('Password reset failed.', 500));
  }
});

// Coach Payment Processing
router.post('/coach/payment', async (req, res) => {
  try {
    const {
      coachId,
      paymentType,
      amount,
      razorpayOrderId,
      razorpayPaymentId,
      subscriptionType
    } = req.body;

    if (!coachId || !paymentType || !amount) {
      return res.status(400).json(errorResponse('Missing required payment details.', 400));
    }

    // Find the coach
    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
      include: { user: true }
    });

    if (!coach) {
      return res.status(404).json(errorResponse('Coach not found.', 404));
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        coachId,
        type: paymentType,
        amount: parseFloat(amount),
        razorpayOrderId,
        razorpayPaymentId,
        status: 'SUCCESS',
        description: `${paymentType} payment for coach ${coach.name}`
      }
    });

    // Update coach status based on payment
    const updateData = {
      paymentStatus: 'SUCCESS'
    };

    if (paymentType === 'REGISTRATION') {
      updateData.isActive = true;
      
      // Also activate the user account
      await prisma.user.update({
        where: { id: coach.user.id },
        data: { isActive: true }
      });
    }

    if (subscriptionType) {
      updateData.subscriptionType = subscriptionType;
      const expirationDate = new Date();
      if (subscriptionType === 'MONTHLY') {
        expirationDate.setMonth(expirationDate.getMonth() + 1);
      } else if (subscriptionType === 'ANNUAL') {
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      }
      updateData.subscriptionExpiresAt = expirationDate;
    }

    const updatedCoach = await prisma.coach.update({
      where: { id: coachId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true
          }
        }
      }
    });

    res.json(successResponse({
      payment,
      coach: updatedCoach,
      message: 'Payment processed successfully. Your account is now active!'
    }, 'Payment successful.'));

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json(errorResponse('Payment processing failed.', 500));
  }
});

module.exports = router;