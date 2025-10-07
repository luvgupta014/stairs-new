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
const { generateUniqueId } = require('../utils/uniqueId');
const { sendOTPEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/emailService');

const router = express.Router();
const prisma = new PrismaClient();

// Test route for debugging
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    console.log('🧪 Testing email to:', email);
    
    const testOTP = '123456';
    const result = await sendOTPEmail(email, testOTP, 'Test User');
    
    res.json({ 
      success: true, 
      message: 'Test email sent successfully',
      result: result
    });
    
  } catch (error) {
    console.error('❌ Test email failed:', error);
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
    console.log('📝 Student registration request received:', req.body);
    
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

    console.log('📋 Extracted fields:', {
      name: !!name,
      fatherName: !!fatherName,
      aadhaar: !!aadhaar,
      gender: !!gender,
      dateOfBirth: !!dateOfBirth,
      state: !!state,
      district: !!district,
      address: !!address,
      pincode: !!pincode,
      phone: !!phone,
      email: !!email,
      sport: !!sport,
      school: !!school,
      password: !!password
    });

    // Validation
    if (!name || !fatherName || !aadhaar || !gender || !dateOfBirth || 
        !state || !district || !address || !pincode || !phone || 
        !email || !sport || !school || !password) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json(errorResponse('All required fields must be provided.', 400));
    }

    if (!validateEmail(email)) {
      console.log('❌ Validation failed: Invalid email format');
      return res.status(400).json(errorResponse('Invalid email format.', 400));
    }

    if (!validatePhone(phone)) {
      console.log('❌ Validation failed: Invalid phone format');
      return res.status(400).json(errorResponse('Invalid phone number format.', 400));
    }

    if (!validatePassword(password)) {
      console.log('❌ Validation failed: Invalid password');
      return res.status(400).json(errorResponse('Password must be at least 6 characters long.', 400));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone }
        ]
      }
    });

    if (existingUser) {
      console.log('❌ User already exists:', existingUser.email);
      return res.status(409).json(errorResponse('User with this email or phone already exists.', 409));
    }

    // Check if Aadhaar already exists
    const existingAadhaar = await prisma.student.findFirst({
      where: { aadhaar: aadhaar }
    });

    if (existingAadhaar) {
      console.log('❌ Aadhaar already exists:', aadhaar);
      return res.status(409).json(errorResponse('User with this Aadhaar already exists.', 409));
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Generate unique ID for student
    const uniqueId = generateUniqueId('STUDENT');

    // Hash password
    const hashedPassword = await hashPassword(password);

    console.log('🔄 Creating user and student profile...');

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
            dateOfBirth: new Date(dateOfBirth),
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
        studentProfile: true
      }
    });

    console.log('✅ User created successfully:', user.id);

    // Send OTP via Email
    try {
      console.log('📧 Sending OTP email...');
      await sendOTPEmail(email, otp, name);
      console.log(`✅ OTP sent to email ${email}: ${otp}`);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError);
      // Continue anyway - user is created, they can resend OTP
    }

    res.status(201).json(successResponse({
      message: 'Registration successful. Please verify your email.',
      userId: user.id,
      uniqueId: user.uniqueId,
      requiresOtp: true
    }, 'Student registered successfully. OTP sent to email.', 201));

  } catch (error) {
    console.error('❌ Student registration error:', error);
    res.status(500).json(errorResponse('Registration failed. Please try again.', 500));
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json(errorResponse('User ID and OTP are required.', 400));
    }

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
      return res.status(404).json(errorResponse('User not found.', 404));
    }

    // Find latest unused OTP record for registration
    const otpRecord = await prisma.oTPRecord.findFirst({
      where: {
        userId: userId,
        code: otp,
        type: 'REGISTRATION', // <-- FIXED: must match enum in schema.prisma
        isUsed: false,
        expiresAt: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      return res.status(400).json(errorResponse('Invalid or expired OTP.', 400));
    }

    // Mark OTP as used and verify user
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

    // Generate JWT token
    const token = generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role
    });

    // Send welcome email
    try {
      const profileName = updatedUser.studentProfile?.name || 
                         updatedUser.coachProfile?.name || 
                         updatedUser.instituteProfile?.name || 
                         updatedUser.clubProfile?.name || 
                         'User';
      await sendWelcomeEmail(updatedUser.email, profileName, updatedUser.role);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if welcome email fails
    }

    res.json(successResponse({
      token,
      user: {
        id: updatedUser.id,
        uniqueId: updatedUser.uniqueId,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        profile: updatedUser.studentProfile || updatedUser.coachProfile || updatedUser.instituteProfile || updatedUser.clubProfile
      }
    }, 'Phone verified successfully.'));

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json(errorResponse('OTP verification failed.', 500));
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json(errorResponse('User ID is required.', 400));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json(errorResponse('User not found.', 404));
    }

    if (user.status === 'ACTIVE') {
      return res.status(400).json(errorResponse('User is already verified.', 400));
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new OTP record
    await prisma.oTPRecord.create({
      data: {
        userId: userId,
        code: otp,
        type: 'REGISTRATION',
        expiresAt: otpExpires,
        isUsed: false
      }
    });

    // Send OTP via Email
    try {
      await sendOTPEmail(user.email, otp);
      console.log(`New OTP sent to email ${user.email}: ${otp}`);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return res.status(500).json(errorResponse('Failed to send OTP email.', 500));
    }

    res.json(successResponse(null, 'OTP sent successfully to your email.'));

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json(errorResponse('Failed to resend OTP.', 500));
  }
});

// Coach Registration with OTP
router.post('/coach/register', async (req, res) => {
  try {
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
      location,
      payLater // New field for pay later option
    } = req.body;

    // Validation
    if (!name || !fatherName || !aadhaar || !gender || !dateOfBirth || 
        !state || !district || !address || !pincode || !email || 
        !phone || !panNumber || !utrNumber || !primarySport || !password) {
      return res.status(400).json(errorResponse('All required fields must be provided.', 400));
    }

    if (!validateEmail(email)) {
      return res.status(400).json(errorResponse('Invalid email format.', 400));
    }

    if (!validatePhone(phone)) {
      return res.status(400).json(errorResponse('Invalid phone number format.', 400));
    }

    if (!validatePassword(password)) {
      return res.status(400).json(errorResponse('Password must be at least 8 characters with uppercase, lowercase, and number.', 400));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json(errorResponse('User with this email or phone already exists.', 409));
    }

    // Check if Aadhaar already exists
    const existingAadhaar = await prisma.coach.findFirst({
      where: { aadhaar: aadhaar }
    });

    if (existingAadhaar) {
      return res.status(409).json(errorResponse('Coach with this Aadhaar already exists.', 409));
    }

    // Check if PAN already exists
    const existingPAN = await prisma.coach.findFirst({
      where: { panNumber: panNumber }
    });

    if (existingPAN) {
      return res.status(409).json(errorResponse('Coach with this PAN number already exists.', 409));
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Generate unique ID for coach
    const uniqueId = generateUniqueId('COACH');

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Determine payment status based on payLater flag
    const paymentStatus = payLater ? 'PENDING' : 'PENDING';
    const isActive = false; // Will be true after OTP verification and payment (if required)

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
    try {
      await sendOTPEmail(email, otp, name);
      console.log(`OTP sent to email ${email}: ${otp}`);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Continue anyway - user is created, they can resend OTP
    }

    res.status(201).json(successResponse({
      message: 'Registration successful. Please verify your email.',
      userId: user.id,
      uniqueId: user.uniqueId,
      coachId: user.coachProfile.id,
      requiresOtp: true,
      requiresPayment: !payLater,
      payLater: payLater || false
    }, 'Coach registered successfully. OTP sent to email.', 201));

  } catch (error) {
    console.error('Coach registration error:', error);
    res.status(500).json(errorResponse('Registration failed. Please try again.', 500));
  }
});

// Institute Registration with OTP
router.post('/institute/register', async (req, res) => {
  try {
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
      licenseNumber,
      payLater
    } = req.body;

    // Validation
    if (!name || !email || !phone || !password || !contactPerson) {
      return res.status(400).json(errorResponse('All required fields must be provided.', 400));
    }

    if (!validateEmail(email)) {
      return res.status(400).json(errorResponse('Invalid email format.', 400));
    }

    if (!validatePhone(phone)) {
      return res.status(400).json(errorResponse('Invalid phone number format.', 400));
    }

    if (!validatePassword(password)) {
      return res.status(400).json(errorResponse('Password must be at least 8 characters with uppercase, lowercase, and number.', 400));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json(errorResponse('User with this email or phone already exists.', 409));
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Generate unique ID for institute
    const uniqueId = generateUniqueId('INSTITUTE');

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and institute profile
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
    try {
      await sendOTPEmail(email, otp, name);
      console.log(`OTP sent to email ${email}: ${otp}`);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
    }

    res.status(201).json(successResponse({
      message: 'Institute registration successful. Please verify your email.',
      userId: user.id,
      uniqueId: user.uniqueId,
      instituteId: user.instituteProfile.id,
      requiresOtp: true,
      requiresPayment: !payLater,
      payLater: payLater || false
    }, 'Institute registered successfully. OTP sent to email.', 201));

  } catch (error) {
    console.error('Institute registration error:', error);
    res.status(500).json(errorResponse('Registration failed. Please try again.', 500));
  }
});

// Club Registration with OTP
router.post('/club/register', async (req, res) => {
  try {
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
      establishedYear,
      payLater
    } = req.body;

    // Validation
    if (!name || !email || !phone || !password || !contactPerson) {
      return res.status(400).json(errorResponse('All required fields must be provided.', 400));
    }

    if (!validateEmail(email)) {
      return res.status(400).json(errorResponse('Invalid email format.', 400));
    }

    if (!validatePhone(phone)) {
      return res.status(400).json(errorResponse('Invalid phone number format.', 400));
    }

    if (!validatePassword(password)) {
      return res.status(400).json(errorResponse('Password must be at least 8 characters with uppercase, lowercase, and number.', 400));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json(errorResponse('User with this email or phone already exists.', 409));
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Generate unique ID for club
    const uniqueId = generateUniqueId('CLUB');

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and club profile
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
            established: establishedYear ? parseInt(establishedYear) : new Date().getFullYear(),
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
        clubProfile: true
      }
    });

    // Send OTP via Email
    try {
      await sendOTPEmail(email, otp, name);
      console.log(`OTP sent to email ${email}: ${otp}`);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
    }

    res.status(201).json(successResponse({
      message: 'Club registration successful. Please verify your email.',
      userId: user.id,
      uniqueId: user.uniqueId,
      clubId: user.clubProfile.id,
      requiresOtp: true,
      requiresPayment: !payLater,
      payLater: payLater || false
    }, 'Club registered successfully. OTP sent to email.', 201));

  } catch (error) {
    console.error('Club registration error:', error);
    res.status(500).json(errorResponse('Registration failed. Please try again.', 500));
  }
});

// Login (Universal)
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json(errorResponse('Email and password are required.', 400));
    }

    if (!validateEmail(email)) {
      return res.status(400).json(errorResponse('Invalid email format.', 400));
    }

    // Find user
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

    if (!user) {
      return res.status(401).json(errorResponse('Invalid credentials.', 401));
    }

    // Check role if specified
    if (role && user.role !== role) {
      return res.status(401).json(errorResponse('Invalid credentials for this role.', 401));
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(errorResponse('Invalid credentials.', 401));
    }

    // Check if user is active and verified
    if (!user.isActive || !user.isVerified) {
      return res.status(401).json(errorResponse('Account is not active. Please verify your phone number.', 401));
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.json(successResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        profile: user.studentProfile || user.coachProfile || user.instituteProfile || user.clubProfile || user.adminProfile
      }
    }, 'Login successful.'));

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(errorResponse('Login failed. Please try again.', 500));
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json(errorResponse('Valid email is required.', 400));
    }

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
      // Don't reveal if email exists
      return res.json(successResponse(null, 'If the email exists, a reset link has been sent.'));
    }

    // Generate reset token
    const resetToken = generateOTP();
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires
      }
    });

    // Send reset token via email
    try {
      const userName = user.studentProfile?.name || 
                      user.coachProfile?.name || 
                      user.instituteProfile?.name || 
                      user.clubProfile?.name || 
                      'User';
      await sendPasswordResetEmail(email, resetToken, userName);
      console.log(`Password reset token sent to ${email}: ${resetToken}`);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't reveal if email exists, but log the error
    }

    res.json(successResponse(null, 'If the email exists, a reset link has been sent.'));

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json(errorResponse('Failed to process request.', 500));
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json(errorResponse('Email, reset token, and new password are required.', 400));
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json(errorResponse('Password must be at least 8 characters with uppercase, lowercase, and number.', 400));
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.resetToken !== resetToken || new Date() > user.resetTokenExpires) {
      return res.status(400).json(errorResponse('Invalid or expired reset token.', 400));
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null
      }
    });

    res.json(successResponse(null, 'Password reset successful.'));

  } catch (error) {
    console.error('Reset password error:', error);
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