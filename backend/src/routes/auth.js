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

const router = express.Router();
const prisma = new PrismaClient();

// Student Registration with OTP
router.post('/student/register', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      password, 
      dateOfBirth,
      sport,
      institute,
      level,
      preferredLocation 
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !password) {
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

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and student profile
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        role: 'STUDENT',
        isVerified: false,
        studentProfile: {
          create: {
            name: `${firstName} ${lastName}`,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            sport,
            level: level || 'BEGINNER',
            address: preferredLocation,
          }
        },
        otpRecords: {
          create: {
            code: otp,
            type: 'REGISTRATION', // <-- FIXED: must match enum in schema.prisma
            expiresAt: otpExpires,
            isUsed: false
          }
        }
      },
      include: {
        studentProfile: true
      }
    });

    // TODO: Send OTP via SMS/Email
    console.log(`OTP for ${phone}: ${otp}`);

    res.status(201).json(successResponse({
      message: 'Registration successful. Please verify your phone number.',
      userId: user.id,
      requiresOtp: true
    }, 'Student registered successfully. OTP sent to phone.', 201));

  } catch (error) {
    console.error('Student registration error:', error);
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

    res.json(successResponse({
      token,
      user: {
        id: updatedUser.id,
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

    await prisma.user.update({
      where: { id: userId },
      data: {
        otp,
        otpExpires
      }
    });

    // TODO: Send OTP via SMS/Email
    console.log(`New OTP for ${user.phone}: ${otp}`);

    res.json(successResponse(null, 'OTP sent successfully.'));

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json(errorResponse('Failed to resend OTP.', 500));
  }
});

// Coach Registration
router.post('/coach/register', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      specialization,
      experience,
      certifications,
      bio,
      location,
      city,
      state,
      pincode
    } = req.body;

    // Validation
    if (!name || !email || !phone || !password || !specialization) {
      return res.status(400).json(errorResponse('All required fields must be provided.', 400));
    }

    if (!validateEmail(email)) {
      return res.status(400).json(errorResponse('Invalid email format.', 400));
    }

    if (!validatePhone(phone)) {
      return res.status(400).json(errorResponse('Invalid phone number format.', 400));
    }

    if (!validatePassword(password)) {
      return res.status(400).json(errorResponse('Password must be at least 6 characters.', 400));
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

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and coach profile
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        role: 'COACH',
        isActive: true,
        isVerified: true,
        coachProfile: {
          create: {
            name,
            specialization,
            experience: parseInt(experience) || 0,
            certifications: certifications || null,
            bio,
            location,
            city,
            state,
            pincode,
            paymentStatus: 'PENDING',
            isActive: false // Will be true only after payment
          }
        }
      },
      include: {
        coachProfile: true
      }
    });

    res.status(201).json(successResponse({
      message: 'Coach registration successful. Please complete payment to activate your account.',
      userId: user.id,
      coachId: user.coachProfile.id,
      requiresPayment: true
    }, 'Coach registered successfully.', 201));

  } catch (error) {
    console.error('Coach registration error:', error);
    res.status(500).json(errorResponse('Registration failed. Please try again.', 500));
  }
});

// Institute Registration
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
      licenseNumber
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

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and institute profile
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        role: 'INSTITUTE',
        status: 'ACTIVE',
        institute: {
          create: {
            name,
            address,
            website,
            description,
            sportsOffered: sportsOffered || [],
            contactPerson,
            licenseNumber,
            approvalStatus: 'PENDING'
          }
        }
      },
      include: {
        institute: true
      }
    });

    res.status(201).json(successResponse({
      message: 'Institute registration successful. Your account is pending approval.',
      userId: user.id
    }, 'Institute registered successfully.', 201));

  } catch (error) {
    console.error('Institute registration error:', error);
    res.status(500).json(errorResponse('Registration failed. Please try again.', 500));
  }
});

// Club Registration
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
      establishedYear
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

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and club profile
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        role: 'CLUB',
        status: 'ACTIVE',
        club: {
          create: {
            name,
            address,
            website,
            description,
            sportsOffered: sportsOffered || [],
            contactPerson,
            establishedYear: establishedYear ? parseInt(establishedYear) : null
          }
        }
      },
      include: {
        club: true
      }
    });

    res.status(201).json(successResponse({
      message: 'Club registration successful.',
      userId: user.id
    }, 'Club registered successfully.', 201));

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
      where: { email }
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

    // TODO: Send reset token via email
    console.log(`Password reset token for ${email}: ${resetToken}`);

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