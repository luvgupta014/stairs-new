const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { getPlansForUserType, getUserTypeDisplayName } = require('../config/paymentPlans');
const { successResponse, errorResponse } = require('../utils/helpers');
const { authenticate, requireCoach, requireInstitute, requireClub, requireStudent, checkEventPermission } = require('../utils/authMiddleware');
const { createSubscriptionInvoice } = require('../services/invoiceService');

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Test endpoint to check authentication
router.get('/test-auth', authenticate, (req, res) => {
  res.json(successResponse({
    userId: req.user.id,
    userRole: req.user.role,
    message: 'Authentication working'
  }, 'Auth test successful'));
});

// Get payment plans for a specific user type
router.get('/plans/:userType', async (req, res) => {
  try {
    const { userType } = req.params;

    // Validate user type
    const validUserTypes = ['student', 'coach', 'club', 'institute'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json(errorResponse('Invalid user type.', 400));
    }

    const planConfig = getPlansForUserType(userType);
    const userDisplayName = getUserTypeDisplayName(userType);

    res.json(successResponse({
      userType,
      userDisplayName,
      ...planConfig
    }, 'Payment plans retrieved successfully.'));

  } catch (error) {
    console.error('Get payment plans error:', error);
    res.status(500).json(errorResponse('Failed to retrieve payment plans.', 500));
  }
});

// Get all payment plans (for admin/comparison purposes)
router.get('/plans', async (req, res) => {
  try {
    const allPlans = {};
    const userTypes = ['student', 'coach', 'club', 'institute'];

    userTypes.forEach(userType => {
      allPlans[userType] = {
        userDisplayName: getUserTypeDisplayName(userType),
        ...getPlansForUserType(userType)
      };
    });

    res.json(successResponse(allPlans, 'All payment plans retrieved successfully.'));

  } catch (error) {
    console.error('Get all payment plans error:', error);
    res.status(500).json(errorResponse('Failed to retrieve payment plans.', 500));
  }
});

// Create payment order for subscription (unified for all user types)
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { planId, userType } = req.body;

    // Validate user type
    const validUserTypes = ['student', 'coach', 'club', 'institute'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json(errorResponse('Invalid user type.', 400));
    }

    // Get plan details
    const planConfig = getPlansForUserType(userType);
    const plan = planConfig.plans.find(p => p.id === planId);

    if (!plan) {
      return res.status(400).json(errorResponse('Invalid plan selected.', 400));
    }

    // Create Razorpay order
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const userIdShort = req.user.id.slice(-6); // Last 6 chars of user ID
    const receipt = `${userType.slice(0, 2)}_${userIdShort}_${timestamp}`; // Max ~20 chars

    console.log(`Generated receipt: "${receipt}" (length: ${receipt.length})`);

    const order = await razorpay.orders.create({
      amount: plan.price * 100, // Amount in paise
      currency: 'INR',
      receipt: receipt,
      notes: {
        userId: req.user.id,
        userType: userType,
        planId: planId,
        planName: plan.name
      }
    });

    console.log(`✅ Razorpay order created successfully: ${order.id} for ${plan.name} (₹${plan.price})`);

    // Determine payment type based on plan duration
    const paymentType = 'REGISTRATION'; // Use a known valid enum value temporarily
    console.log(`💾 Saving payment record with type: ${paymentType}`);

    // Save payment record
    const payment = await prisma.payment.create({
      data: {
        userId: req.user.id,
        userType: userType.toUpperCase(),
        type: paymentType,
        amount: plan.price,
        currency: 'INR',
        razorpayOrderId: order.id,
        status: 'PENDING',
        description: `${plan.name} subscription for ${userType}`,
        metadata: JSON.stringify({
          planId: planId,
          planName: plan.name,
          userType: userType
        })
      }
    });

    res.json(successResponse({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planName: plan.name,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    }, 'Payment order created successfully.'));

  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json(errorResponse('Failed to create payment order.', 500));
  }
});

// Updated: create-order-events route to mirror create-order behavior and avoid FK error
// Note: Using authenticate only (not requireCoach) to allow flexibility, but we verify coach ownership
router.post('/create-order-events', authenticate, async (req, res) => {
  try {
    const { eventId } = req.body;

    // Validate eventId
    if (!eventId) {
      return res.status(400).json(errorResponse('Event ID is required.', 400));
    }

    // Fetch event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        coach: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    // Permission check (admin, coach owner, or assigned with feeManagement)
    const hasPermission = await checkEventPermission({
      user: req.user,
      eventId: event.id,
      permissionKey: 'feeManagement'
    });
    if (!hasPermission) {
      return res.status(403).json(errorResponse('Access denied. Fee management not permitted for this event.', 403));
    }

    // Fee mode guard
    if (event.feeMode === 'DISABLED') {
      return res.status(400).json(errorResponse('Payments are disabled for this event.', 400));
    }

    console.log('Creating payment order for event', event.name);

    const participantCount = event.currentParticipants || 0;

    // Load global settings (single row)
    const globalSettings = await prisma.globalSettings.findFirst();
    const perStudentBaseCharge = globalSettings?.perStudentBaseCharge || 0;
    const defaultEventFee = globalSettings?.defaultEventFee || 0;

    // Automatic fee calculation
    // GLOBAL: per-student base charge; if no participants, fallback to defaultEventFee
    // EVENT: use event.eventFee (admin-set) and add coordinatorFee if provided
    let amountInRupees = 0;
    if (event.feeMode === 'GLOBAL') {
      if (participantCount > 0 && perStudentBaseCharge > 0) {
        amountInRupees = perStudentBaseCharge * participantCount;
      } else {
        amountInRupees = defaultEventFee;
      }
    } else if (event.feeMode === 'EVENT') {
      amountInRupees = (event.eventFee || 0) + (event.coordinatorFee || 0);
    } else {
      // fallback
      amountInRupees = 2 * participantCount;
    }

    const amount = Math.round(amountInRupees * 100); // in paise

    // Edge case: Zero amount payment
    if (amount <= 0 || participantCount === 0) {
      return res.status(400).json(errorResponse('Cannot create payment for event with no participants. Please register participants first.', 400));
    }

    // Check if there's already a successful payment for this event by this user
    const existingPayment = await prisma.payment.findFirst({
      where: {
        userId: req.user.id,
        status: 'SUCCESS',
        metadata: {
          contains: eventId
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (existingPayment) {
      try {
        const metadata = existingPayment.metadata ? JSON.parse(existingPayment.metadata) : {};
        if (metadata.eventId === eventId && existingPayment.status === 'SUCCESS') {
          console.log('⚠️ Payment already exists for this event');
          return res.status(400).json(errorResponse('Payment for this event has already been completed.', 400));
        }
      } catch (parseError) {
        // Continue if metadata parsing fails
        console.warn('Could not parse existing payment metadata');
      }
    }

    // Create Razorpay order
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const userIdForReceipt = (req.user?.id || '').toString().slice(-6); // Last 6 chars of authenticated user ID
    const receipt = `EV_${userIdForReceipt}_${timestamp}`; // Max ~20 chars

    console.log(`Generated receipt: "${receipt}" (length: ${receipt.length})`);

    let order;
    try {
      order = await razorpay.orders.create({
        amount: amount,
        currency: 'INR',
        receipt: receipt,
        notes: {
          userId: req.user.id,
          eventId: eventId
        }
      });
    } catch (razorpayError) {
      console.error('❌ Razorpay order creation failed:', razorpayError);
      if (razorpayError.error && razorpayError.error.description) {
        return res.status(400).json(errorResponse(`Razorpay error: ${razorpayError.error.description}`, 400));
      }
      return res.status(500).json(errorResponse('Failed to create Razorpay order. Please try again.', 500));
    }

    console.log(`✅ Razorpay order created successfully: ${order.id} for event ${event.name} (₹${amountInRupees})`);

    // Ensure authenticated user exists in DB (this mirrors /create-order behavior)
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      console.error(`Authenticated user not found: ${req.user.id}`);
      return res.status(400).json(errorResponse('Authenticated user not found. Please contact support.', 400));
    }

    // Save payment record (use same pattern as /create-order)
    let payment;
    try {
      payment = await prisma.payment.create({
        data: {
          userId: req.user.id,
          userType: 'COACH',
          type: 'EVENT_REGISTRATION',
          amount: amountInRupees,
          currency: 'INR',
          razorpayOrderId: order.id,
          status: 'PENDING',
          description: `Event fee payment for ${event.name} (${participantCount} participants)`,
          metadata: JSON.stringify({
            eventId: eventId,
            eventName: event.name,
            participantCount: participantCount
          })
        }
      });
    } catch (dbError) {
      console.error('❌ Failed to save payment record:', dbError);
      // Helpful log for Prisma FK errors
      if (dbError?.code === 'P2003') {
        console.error('Prisma P2003 (FK violated). This indicates the payment.userId value does not exist in users table.');
      }
      // Try to cancel the Razorpay order (best effort)
      try {
        await razorpay.orders.cancel(order.id);
        console.log('✅ Cancelled Razorpay order due to DB error');
      } catch (cancelError) {
        console.error('⚠️ Could not cancel Razorpay order:', cancelError);
      }
      throw dbError;
    }

    // Calculate per-student fee for display
    let perStudentFee = 0;
    if (event.feeMode === 'GLOBAL' && participantCount > 0 && perStudentBaseCharge > 0) {
      perStudentFee = perStudentBaseCharge;
    } else if (event.feeMode === 'EVENT' && participantCount > 0) {
      // For EVENT mode, divide total by participant count
      const totalFee = (event.eventFee || 0) + (event.coordinatorFee || 0);
      perStudentFee = totalFee / participantCount;
    }

    res.json(successResponse({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      eventName: event.name,
      participantCount: participantCount,
      amountInRupees: amountInRupees,
      perStudentFee: Math.round(perStudentFee * 100) / 100, // Round to 2 decimal places
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    }, 'Event payment order created successfully.'));

  } catch (error) {
    console.error('Create payment order error:', error);

    // Helpful log for Prisma FK errors
    if (error?.code === 'P2003') {
      console.error('Prisma P2003 (FK violated). This indicates the payment.userId value does not exist in users table.');
      return res.status(400).json(errorResponse('Database error: User not found. Please contact support.', 400));
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json(errorResponse('Payment service temporarily unavailable. Please try again later.', 503));
    }

    res.status(500).json(errorResponse('Failed to create payment order.', 500));
  }
});

// Create payment order for student participation fee (admin-created events only)
router.post('/create-order-student-event', authenticate, requireStudent, async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json(errorResponse('Event ID is required.', 400));
    }

    // Fetch event with fee controls
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    if (!event.createdByAdmin || !event.studentFeeEnabled) {
      return res.status(400).json(errorResponse('This event does not require a student participation fee.', 400));
    }

    // Validate student profile
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    if (!student) {
      return res.status(404).json(errorResponse('Student profile not found.', 404));
    }

    // Check if already registered
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_studentId: {
          eventId,
          studentId: student.id
        }
      }
    });

    if (existingRegistration && existingRegistration.status === 'APPROVED') {
      return res.status(400).json(errorResponse('You are already registered for this event.', 400));
    }

    // Prevent duplicate successful payments
    const existingSuccess = await prisma.payment.findFirst({
      where: {
        userId: req.user.id,
        status: 'SUCCESS',
        metadata: {
          contains: eventId
        }
      }
    });

    if (existingSuccess) {
      return res.status(400).json(errorResponse('Payment already completed for this event.', 400));
    }

    const amountInRupees = Number(event.studentFeeAmount) || 0;
    if (amountInRupees <= 0) {
      return res.status(400).json(errorResponse('Participation fee amount must be greater than zero.', 400));
    }

    const amount = Math.round(amountInRupees * 100); // paise

    // Reuse or create pending payment record
    // Use registrationId if exists, otherwise null (will be created after payment)
    const registrationId = existingRegistration?.id || null;
    
    let paymentRecord = await prisma.payment.findFirst({
      where: {
        userId: req.user.id,
        status: 'PENDING',
        type: 'EVENT_STUDENT_FEE',
        metadata: {
          contains: eventId
        }
      }
    });

    // Extract selectedCategory from request body
    const { selectedCategory } = req.body || {};

    if (!paymentRecord) {
      paymentRecord = await prisma.payment.create({
        data: {
          userId: req.user.id,
          userType: 'STUDENT',
          type: 'EVENT_STUDENT_FEE',
          amount: amountInRupees,
          currency: 'INR',
          status: 'PENDING',
          description: `Participation fee for ${event.name}`,
          metadata: JSON.stringify({
            eventId,
            studentId: student.id,
            registrationId: registrationId,
            unit: event.studentFeeUnit || 'PERSON',
            createdByAdmin: true,
            pendingRegistration: !existingRegistration, // Flag to create registration after payment
            selectedCategory: selectedCategory || null
          })
        }
      });
    } else {
      // Update existing payment record with selectedCategory if provided
      try {
        const currentMeta = paymentRecord.metadata ? JSON.parse(paymentRecord.metadata) : {};
        await prisma.payment.update({
          where: { id: paymentRecord.id },
          data: {
            metadata: JSON.stringify({
              ...currentMeta,
              selectedCategory: selectedCategory || currentMeta.selectedCategory || null
            })
          }
        });
      } catch (metaError) {
        console.warn('⚠️ Failed to update payment metadata with selectedCategory:', metaError);
      }
    }

    // Create Razorpay order
    const timestamp = Date.now().toString().slice(-8);
    const userIdForReceipt = (req.user?.id || '').toString().slice(-6);
    const receipt = `SEV_${userIdForReceipt}_${timestamp}`;

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt,
      notes: {
        userId: req.user.id,
        eventId,
        registrationId: registrationId,
        context: 'student_event_fee'
      }
    });

    // Attach order details to payment
    await prisma.payment.update({
      where: { id: paymentRecord.id },
      data: {
        razorpayOrderId: order.id,
        amount: amountInRupees
      }
    });

    return res.json(successResponse({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: paymentRecord.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      registrationId: registrationId,
      eventId,
      studentFeeAmount: amountInRupees
    }, 'Payment order created successfully for student event participation.'));
  } catch (error) {
    console.error('❌ Create student event payment order error:', error);
    res.status(500).json(errorResponse('Failed to create student event payment order.', 500));
  }
});

// Student event fee: mark payment attempt as CANCELLED / FAILED (so admins can follow up)
router.post('/student-event/mark-attempt', authenticate, requireStudent, async (req, res) => {
  try {
    const { eventId, razorpayOrderId, status, details } = req.body || {};

    if (!eventId) return res.status(400).json(errorResponse('Event ID is required.', 400));
    if (!razorpayOrderId) return res.status(400).json(errorResponse('razorpayOrderId is required.', 400));
    if (!status) return res.status(400).json(errorResponse('status is required.', 400));

    const nextStatus = String(status || '').toUpperCase();
    if (nextStatus !== 'CANCELLED' && nextStatus !== 'FAILED') {
      return res.status(400).json(errorResponse('Invalid status. Allowed: CANCELLED, FAILED.', 400));
    }

    // Find the student-event payment for this order
    const payment = await prisma.payment.findFirst({
      where: {
        userId: req.user.id,
        razorpayOrderId: String(razorpayOrderId),
        type: 'EVENT_STUDENT_FEE'
      }
    });

    if (!payment) {
      return res.status(404).json(errorResponse('Payment record not found for this order.', 404));
    }

    if (String(payment.status || '').toUpperCase() === 'SUCCESS') {
      // Don't override successful payments
      return res.json(successResponse({
        paymentId: payment.id,
        status: payment.status,
        ignored: true
      }, 'Payment already successful; status update ignored.'));
    }

    let meta = {};
    try { meta = payment.metadata ? JSON.parse(payment.metadata) : {}; } catch { meta = {}; }

    // Best-effort guard: ensure this payment is for this event
    if (meta?.eventId && meta.eventId !== eventId) {
      return res.status(400).json(errorResponse('Payment does not belong to the given event.', 400));
    }

    const nowIso = new Date().toISOString();
    const attempt = meta?.paymentAttempt && typeof meta.paymentAttempt === 'object' ? meta.paymentAttempt : {};
    const normalizedDetails = details && typeof details === 'object' ? details : { message: details };

    const updatedMeta = {
      ...meta,
      paymentAttempt: {
        ...attempt,
        lastStatus: nextStatus,
        lastUpdatedAt: nowIso,
        ...(nextStatus === 'CANCELLED'
          ? { cancelledAt: nowIso, cancelledDetails: normalizedDetails }
          : { failedAt: nowIso, failedDetails: normalizedDetails })
      }
    };

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: nextStatus,
        metadata: JSON.stringify(updatedMeta)
      }
    });

    return res.json(successResponse({
      paymentId: updated.id,
      status: updated.status
    }, 'Payment attempt status recorded.'));
  } catch (error) {
    console.error('❌ Mark student event payment attempt error:', error);
    return res.status(500).json(errorResponse('Failed to record payment attempt status.', 500));
  }
});

// Verify payment (unified for all user types and event payments)
router.post('/verify', authenticate, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userType,
      context,
      eventId
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json(errorResponse('Missing required payment fields.', 400));
    }

    console.log(`🔍 Verifying payment for user ${req.user.id}, order: ${razorpay_order_id}, context: ${context || 'subscription'}`);

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      console.log('❌ Payment signature verification failed');
      return res.status(400).json(errorResponse('Invalid payment signature.', 400));
    }

    console.log('✅ Payment signature verified successfully');

    // Handle event payment context
    if (context === 'event_payment' && eventId) {
      return handleEventPaymentVerification(req, res, {
        razorpay_order_id,
        razorpay_payment_id,
        eventId,
        userId: req.user.id
      });
    }

    // Handle student participation fee
    if (context === 'student_event_fee' && eventId) {
      return handleStudentEventPaymentVerification(req, res, {
        razorpay_order_id,
        razorpay_payment_id,
        eventId,
        userId: req.user.id
      });
    }

    // Handle subscription payment (existing logic)
    // Check if payment already exists and is successful (prevent duplicate processing)
    const existingPayment = await prisma.payment.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
        userId: req.user.id,
        status: 'SUCCESS'
      }
    });

    if (existingPayment && existingPayment.razorpayPaymentId === razorpay_payment_id) {
      console.log('⚠️ Payment already verified. Returning success.');
      return res.json(successResponse({
        paymentId: razorpay_payment_id,
        status: 'SUCCESS',
        alreadyProcessed: true
      }, 'Payment was already verified.'));
    }

    // Update payment record
    const payment = await prisma.payment.updateMany({
      where: {
        razorpayOrderId: razorpay_order_id,
        userId: req.user.id,
        status: { not: 'SUCCESS' } // Only update if not already successful
      },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        status: 'SUCCESS'
      }
    });

    console.log(`💾 Updated ${payment.count} payment records`);

    if (payment.count === 0) {
      // Check if payment exists but is already successful
      const existingPending = await prisma.payment.findFirst({
        where: {
          razorpayOrderId: razorpay_order_id,
          userId: req.user.id
        }
      });

      if (existingPending && existingPending.status === 'SUCCESS') {
        console.log('⚠️ Payment already processed');
        return res.json(successResponse({
          paymentId: razorpay_payment_id,
          status: 'SUCCESS',
          alreadyProcessed: true
        }, 'Payment was already verified.'));
      }

      console.log('❌ No payment record found to update');
      return res.status(404).json(errorResponse('Payment record not found.', 404));
    }

    // Update user profile based on userType (only for subscription payments)
    if (userType) {
      console.log(`🔄 Updating ${userType} profile for user ${req.user.id}`);

      const now = new Date();
      let subscriptionExpiresAt;
      let subscriptionType;

      // Premium members (coordinators/coaches) use financial year (April 1 - March 31)
      if (userType.toLowerCase() === 'coach') {
        const { getFinancialYearEnd } = require('../utils/financialYear');
        subscriptionExpiresAt = getFinancialYearEnd(); // March 31st of current FY
        subscriptionType = 'ANNUAL'; // Premium members have annual subscriptions
        console.log(`📅 Premium member subscription: Financial year expiry (${subscriptionExpiresAt.toISOString()})`);
      } else {
        // Other user types use monthly subscriptions
        subscriptionExpiresAt = new Date();
        subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 1); // 1 month subscription
        subscriptionType = 'MONTHLY';
      }

      if (userType.toLowerCase() === 'coach') {
        await prisma.coach.update({
          where: { userId: req.user.id },
          data: {
            paymentStatus: 'SUCCESS',
            isActive: true,
            subscriptionType: subscriptionType,
            subscriptionExpiresAt: subscriptionExpiresAt
          }
        });
        console.log('✅ Coach profile updated successfully');
      } else if (userType.toLowerCase() === 'student') {
        await prisma.student.update({
          where: { userId: req.user.id },
          data: {
            paymentStatus: 'SUCCESS',
            isActive: true,
            subscriptionType: subscriptionType,
            subscriptionExpiresAt: subscriptionExpiresAt
          }
        });
        console.log('✅ Student profile updated successfully');
      } else if (userType.toLowerCase() === 'club') {
        await prisma.club.update({
          where: { userId: req.user.id },
          data: {
            paymentStatus: 'SUCCESS',
            isActive: true,
            subscriptionType: subscriptionType,
            subscriptionExpiresAt: subscriptionExpiresAt
          }
        });
        console.log('✅ Club profile updated successfully');
      } else if (userType.toLowerCase() === 'institute') {
        await prisma.institute.update({
          where: { userId: req.user.id },
          data: {
            paymentStatus: 'SUCCESS',
            isActive: true,
            subscriptionType: subscriptionType,
            subscriptionExpiresAt: subscriptionExpiresAt
          }
        });
        console.log('✅ Institute profile updated successfully');
      }
    }

    // Get user details for invoice
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        email: true,
        name: true
      }
    });

    // Get payment details
    const paymentRecord = await prisma.payment.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
        userId: req.user.id
      },
      select: {
        amount: true,
        description: true,
        metadata: true
      }
    });

    // Create invoice and send receipt email
    if (user && paymentRecord) {
      try {
        const metadata = paymentRecord.metadata ? JSON.parse(paymentRecord.metadata) : {};
        await createSubscriptionInvoice({
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          userEmail: user.email,
          userName: user.name || 'User',
          amount: paymentRecord.amount,
          currency: 'INR',
          description: paymentRecord.description || 'Subscription Payment',
          metadata: {
            planName: metadata.planName,
            planId: metadata.planId,
            userType: userType
          }
        });
      } catch (invoiceError) {
        console.error('⚠️ Invoice generation failed (non-critical):', invoiceError);
        // Don't fail payment verification if invoice fails
      }
    }

    console.log('✅ Payment verification completed successfully');

    res.json(successResponse({
      paymentId: razorpay_payment_id,
      status: 'SUCCESS'
    }, 'Payment verified successfully. Receipt has been sent to your email.'));

  } catch (error) {
    console.error('❌ Verify payment error:', error);
    res.status(500).json(errorResponse('Payment verification failed.', 500));
  }
});

// Helper function to handle event payment verification
async function handleEventPaymentVerification(req, res, { razorpay_order_id, razorpay_payment_id, eventId, userId }) {
  try {
    console.log(`🎯 Handling event payment verification for event ${eventId}`);

    // Validate event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        coach: {
          select: {
            userId: true,
            name: true,
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    // Verify the user is authorized (coach of the event)
    // event.coachId is the Coach table ID, we need to check coach.userId
    if (!event.coach || String(event.coach.userId) !== String(userId)) {
      console.warn(`⚠️ Authorization check failed in verification:`, {
        eventId: eventId,
        eventCoachId: event.coachId,
        coachUserId: event.coach?.userId,
        userId: userId
      });
      // Still allow if they created the payment order, but log warning
    }

    // Check if payment already exists and is successful (prevent duplicate processing)
    const existingPayment = await prisma.payment.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
        userId: userId,
        status: 'SUCCESS'
      }
    });

    if (existingPayment && existingPayment.razorpayPaymentId === razorpay_payment_id) {
      console.log('⚠️ Event payment already verified. Returning success.');
      return res.json(successResponse({
        paymentId: razorpay_payment_id,
        status: 'SUCCESS',
        eventId: eventId,
        alreadyProcessed: true
      }, 'Event payment was already verified.'));
    }

    // Update payment record
    const payment = await prisma.payment.updateMany({
      where: {
        razorpayOrderId: razorpay_order_id,
        userId: userId,
        status: { not: 'SUCCESS' }
      },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        status: 'SUCCESS'
      }
    });

    if (payment.count === 0) {
      const existingPending = await prisma.payment.findFirst({
        where: {
          razorpayOrderId: razorpay_order_id,
          userId: userId
        }
      });

      if (existingPending && existingPending.status === 'SUCCESS') {
        console.log('⚠️ Event payment already processed');
        return res.json(successResponse({
          paymentId: razorpay_payment_id,
          status: 'SUCCESS',
          eventId: eventId,
          alreadyProcessed: true
        }, 'Event payment was already verified.'));
      }

      return res.status(404).json(errorResponse('Payment record not found.', 404));
    }

    // Create or update EventPayment record
    const paymentRecord = await prisma.payment.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
        userId: userId
      }
    });

    if (paymentRecord) {
      // Find existing EventPayment or create new one
      const existingEventPayment = await prisma.eventPayment.findFirst({
        where: {
          eventId: eventId,
          razorpayOrderId: razorpay_order_id
        }
      });

      if (existingEventPayment) {
        // Update existing EventPayment
        await prisma.eventPayment.update({
          where: { id: existingEventPayment.id },
          data: {
            razorpayPaymentId: razorpay_payment_id,
            status: 'SUCCESS'
          }
        });
        console.log('✅ Updated existing EventPayment record');
      } else {
        // Create new EventPayment record
        await prisma.eventPayment.create({
          data: {
            eventId: eventId,
            amount: paymentRecord.amount,
            currency: paymentRecord.currency || 'INR',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            status: 'SUCCESS',
            description: paymentRecord.description || `Event fee payment for ${event.name}`
          }
        });
        console.log('✅ Created new EventPayment record');
      }
    }

    console.log('✅ Event payment verified and EventPayment record updated');

    // Get user details for potential invoice
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true
      }
    });

    // Try to create invoice (non-critical)
    if (user && paymentRecord) {
      try {
        const metadata = paymentRecord.metadata ? JSON.parse(paymentRecord.metadata) : {};
        // Note: You may want to create a separate invoice service for event payments
        // For now, we'll skip invoice creation for event payments or use subscription invoice
        console.log('📧 Invoice generation skipped for event payments (can be added later)');
      } catch (invoiceError) {
        console.error('⚠️ Invoice generation failed (non-critical):', invoiceError);
      }
    }

    return res.json(successResponse({
      paymentId: razorpay_payment_id,
      status: 'SUCCESS',
      eventId: eventId,
      eventName: event.name
    }, 'Event payment verified successfully.'));

  } catch (error) {
    console.error('❌ Event payment verification error:', error);
    throw error; // Re-throw to be caught by main handler
  }
}

// Alias route for backward compatibility - handles /api/verify-payment
// This route is called by frontend, so we need to handle it directly
router.post('/verify-payment', authenticate, async (req, res) => {
  // Extract the handler logic from /verify
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userType,
      context,
      eventId
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json(errorResponse('Missing required payment fields.', 400));
    }

    console.log(`🔍 Verifying payment (via /verify-payment) for user ${req.user.id}, order: ${razorpay_order_id}, context: ${context || 'subscription'}`);

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      console.log('❌ Payment signature verification failed');
      return res.status(400).json(errorResponse('Invalid payment signature.', 400));
    }

    console.log('✅ Payment signature verified successfully');

    // Handle event payment context
    if (context === 'event_payment' && eventId) {
      return handleEventPaymentVerification(req, res, {
        razorpay_order_id,
        razorpay_payment_id,
        eventId,
        userId: req.user.id
      });
    }

    // Handle subscription payment (existing logic)
    // Check if payment already exists and is successful (prevent duplicate processing)
    const existingPayment = await prisma.payment.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
        userId: req.user.id,
        status: 'SUCCESS'
      }
    });

    if (existingPayment && existingPayment.razorpayPaymentId === razorpay_payment_id) {
      console.log('⚠️ Payment already verified. Returning success.');
      return res.json(successResponse({
        paymentId: razorpay_payment_id,
        status: 'SUCCESS',
        alreadyProcessed: true
      }, 'Payment was already verified.'));
    }

    // Update payment record
    const payment = await prisma.payment.updateMany({
      where: {
        razorpayOrderId: razorpay_order_id,
        userId: req.user.id,
        status: { not: 'SUCCESS' } // Only update if not already successful
      },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        status: 'SUCCESS'
      }
    });

    console.log(`💾 Updated ${payment.count} payment records`);

    if (payment.count === 0) {
      // Check if payment exists but is already successful
      const existingPending = await prisma.payment.findFirst({
        where: {
          razorpayOrderId: razorpay_order_id,
          userId: req.user.id
        }
      });

      if (existingPending && existingPending.status === 'SUCCESS') {
        console.log('⚠️ Payment already processed');
        return res.json(successResponse({
          paymentId: razorpay_payment_id,
          status: 'SUCCESS',
          alreadyProcessed: true
        }, 'Payment was already verified.'));
      }

      console.log('❌ No payment record found to update');
      return res.status(404).json(errorResponse('Payment record not found.', 404));
    }

    // Update user profile based on userType (only for subscription payments)
    if (userType) {
      console.log(`🔄 Updating ${userType} profile for user ${req.user.id}`);

      const now = new Date();
      let subscriptionExpiresAt;
      let subscriptionType;

      // Premium members (coordinators/coaches) use financial year (April 1 - March 31)
      if (userType.toLowerCase() === 'coach') {
        const { getFinancialYearEnd } = require('../utils/financialYear');
        subscriptionExpiresAt = getFinancialYearEnd(); // March 31st of current FY
        subscriptionType = 'ANNUAL'; // Premium members have annual subscriptions
        console.log(`📅 Premium member subscription: Financial year expiry (${subscriptionExpiresAt.toISOString()})`);
      } else {
        // Other user types use monthly subscriptions
        subscriptionExpiresAt = new Date();
        subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 1); // 1 month subscription
        subscriptionType = 'MONTHLY';
      }

      if (userType.toLowerCase() === 'coach') {
        await prisma.coach.update({
          where: { userId: req.user.id },
          data: {
            paymentStatus: 'SUCCESS',
            isActive: true,
            subscriptionType: subscriptionType,
            subscriptionExpiresAt: subscriptionExpiresAt
          }
        });
        console.log('✅ Coach profile updated successfully');
      } else if (userType.toLowerCase() === 'student') {
        await prisma.student.update({
          where: { userId: req.user.id },
          data: {
            paymentStatus: 'SUCCESS',
            isActive: true,
            subscriptionType: subscriptionType,
            subscriptionExpiresAt: subscriptionExpiresAt
          }
        });
        console.log('✅ Student profile updated successfully');
      } else if (userType.toLowerCase() === 'club') {
        await prisma.club.update({
          where: { userId: req.user.id },
          data: {
            paymentStatus: 'SUCCESS',
            isActive: true,
            subscriptionType: subscriptionType,
            subscriptionExpiresAt: subscriptionExpiresAt
          }
        });
        console.log('✅ Club profile updated successfully');
      } else if (userType.toLowerCase() === 'institute') {
        await prisma.institute.update({
          where: { userId: req.user.id },
          data: {
            paymentStatus: 'SUCCESS',
            isActive: true,
            subscriptionType: subscriptionType,
            subscriptionExpiresAt: subscriptionExpiresAt
          }
        });
        console.log('✅ Institute profile updated successfully');
      }
    }

    // Get user details for invoice
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        email: true,
        name: true
      }
    });

    // Get payment details
    const paymentRecord = await prisma.payment.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
        userId: req.user.id
      },
      select: {
        amount: true,
        description: true,
        metadata: true
      }
    });

    // Create invoice and send receipt email
    if (user && paymentRecord) {
      try {
        const metadata = paymentRecord.metadata ? JSON.parse(paymentRecord.metadata) : {};
        await createSubscriptionInvoice({
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          userEmail: user.email,
          userName: user.name || 'User',
          amount: paymentRecord.amount,
          currency: 'INR',
          description: paymentRecord.description || 'Subscription Payment',
          metadata: {
            planName: metadata.planName,
            planId: metadata.planId,
            userType: userType
          }
        });
      } catch (invoiceError) {
        console.error('⚠️ Invoice generation failed (non-critical):', invoiceError);
        // Don't fail payment verification if invoice fails
      }
    }

    console.log('✅ Payment verification completed successfully');

    res.json(successResponse({
      paymentId: razorpay_payment_id,
      status: 'SUCCESS'
    }, 'Payment verified successfully. Receipt has been sent to your email.'));

  } catch (error) {
    console.error('❌ Verify payment error:', error);
    res.status(500).json(errorResponse('Payment verification failed.', 500));
  }
});

// Get payment history (unified for all user types)
router.get('/history', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.payment.count({
        where: { userId: req.user.id }
      })
    ]);

    res.json(successResponse({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Payment history retrieved successfully.'));

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json(errorResponse('Failed to retrieve payment history.', 500));
  }
});

// Sync payment status from Razorpay Order Status API
router.post('/sync-payment-status', authenticate, async (req, res) => {
  try {
    const { razorpayOrderId } = req.body;

    if (!razorpayOrderId) {
      return res.status(400).json(errorResponse('Razorpay Order ID is required.', 400));
    }

    console.log(`🔄 Syncing payment status from Razorpay for order: ${razorpayOrderId}`);

    // Fetch order status from Razorpay
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.fetch(razorpayOrderId);
      console.log(`✅ Razorpay order fetched:`, {
        id: razorpayOrder.id,
        status: razorpayOrder.status,
        amount: razorpayOrder.amount,
        amount_paid: razorpayOrder.amount_paid
      });
    } catch (razorpayError) {
      console.error('❌ Razorpay API error:', razorpayError);
      return res.status(400).json(errorResponse(`Failed to fetch order from Razorpay: ${razorpayError.message}`, 400));
    }

    // Check if order is paid
    const isPaid = razorpayOrder.status === 'paid' || razorpayOrder.amount_paid >= razorpayOrder.amount;

    if (!isPaid) {
      return res.json(successResponse({
        razorpayOrderId,
        status: razorpayOrder.status,
        amount: razorpayOrder.amount / 100, // Convert from paise to rupees
        amountPaid: razorpayOrder.amount_paid / 100,
        isPaid: false,
        message: 'Payment is still pending on Razorpay'
      }, 'Payment status synced. Payment is pending.'));
    }

    // Find all payment records with this order ID
    const payments = await prisma.payment.findMany({
      where: {
        razorpayOrderId: razorpayOrderId
      }
    });

    if (payments.length === 0) {
      return res.status(404).json(errorResponse('No payment records found for this order ID.', 404));
    }

    // Update all pending payments to SUCCESS
    let updatedCount = 0;
    for (const payment of payments) {
      if (payment.status !== 'SUCCESS') {
        // Get payment ID from Razorpay payments
        let razorpayPaymentId = payment.razorpayPaymentId;
        
        if (!razorpayPaymentId) {
          try {
            const payments = await razorpay.orders.fetchPayments(razorpayOrderId);
            if (payments.items && payments.items.length > 0) {
              razorpayPaymentId = payments.items[0].id;
            }
          } catch (err) {
            console.warn('Could not fetch payment ID from Razorpay:', err);
          }
        }

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESS',
            razorpayPaymentId: razorpayPaymentId || payment.razorpayPaymentId
          }
        });
        updatedCount++;

        // Update user profiles if needed
        if (payment.userType === 'COACH') {
          await prisma.coach.updateMany({
            where: { userId: payment.userId },
            data: { paymentStatus: 'SUCCESS', isActive: true }
          });
        } else if (payment.userType === 'INSTITUTE') {
          await prisma.institute.updateMany({
            where: { userId: payment.userId },
            data: { paymentStatus: 'SUCCESS', isActive: true }
          });
        } else if (payment.userType === 'CLUB') {
          await prisma.club.updateMany({
            where: { userId: payment.userId },
            data: { paymentStatus: 'SUCCESS', isActive: true }
          });
        }
      }
    }

    console.log(`✅ Updated ${updatedCount} payment records to SUCCESS`);

    res.json(successResponse({
      razorpayOrderId,
      status: 'SUCCESS',
      amount: razorpayOrder.amount / 100,
      amountPaid: razorpayOrder.amount_paid / 100,
      isPaid: true,
      updatedPayments: updatedCount,
      message: `Successfully synced ${updatedCount} payment record(s)`
    }, 'Payment status synced successfully from Razorpay.'));

  } catch (error) {
    console.error('❌ Sync payment status error:', error);
    res.status(500).json(errorResponse('Failed to sync payment status: ' + error.message, 500));
  }
});

// Get event payment status (coach-accessible + admin-accessible)
router.get('/event/:eventId/payment-status', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Fetch event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        coach: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    // Authorization:
    // - Admin can view any event payment status
    // - Coach can view only own event payment status (existing behavior)
    let coach = null;
    if (req.user.role === 'COACH') {
      coach = await prisma.coach.findUnique({
        where: { userId: req.user.id },
        select: { id: true }
      });
      if (!coach) {
        return res.status(403).json(errorResponse('You are not authorized to view payment status for this event.', 403));
      }
      if (String(event.coachId) !== String(coach.id)) {
        return res.status(403).json(errorResponse('You are not authorized to view payment status for this event.', 403));
      }
    } else if (req.user.role !== 'ADMIN') {
      return res.status(403).json(errorResponse('You are not authorized to view payment status for this event.', 403));
    }

    // Payment model selection:
    // Detect student-fee payments robustly (even if event flags were not set on old events).
    const paidStudentAmount = await prisma.payment.aggregate({
      where: {
        status: 'SUCCESS',
        type: 'EVENT_STUDENT_FEE',
        metadata: { contains: event.id }
      },
      _sum: { amount: true }
    }).then(r => r?._sum?.amount || 0).catch(() => 0);

    const approvedCount = await prisma.eventRegistration.count({
      where: { eventId: event.id, status: 'APPROVED' }
    }).catch(() => 0);

    const studentFeeModeByFlags = !!(event.createdByAdmin && event.studentFeeEnabled && (event.studentFeeAmount || 0) > 0);
    const studentFeeModeByPayments = paidStudentAmount > 0;
    const studentFeeMode = studentFeeModeByFlags || studentFeeModeByPayments;

    if (studentFeeMode) {
      const paymentCompleted = paidStudentAmount > 0 || approvedCount > 0;
      return res.json(successResponse({
        paymentStatus: paymentCompleted ? 'SUCCESS' : 'PENDING',
        paymentCompleted,
        totalAmount: paidStudentAmount,
        paymentDate: null,
        eventId: event.id,
        eventName: event.name,
        paymentMode: 'STUDENT_EVENT_FEE'
      }, 'Payment status retrieved successfully'));
    }

    // Coordinator/coach payment status (existing behavior, but allow ADMIN to evaluate based on overall event payments)
    const paymentUserId = req.user.role === 'COACH' ? req.user.id : (event.coach?.userId || req.user.id);

    const eventFeePayment = await prisma.payment.findFirst({
      where: {
        userId: paymentUserId,
        status: 'SUCCESS',
        OR: [
          { metadata: { contains: eventId } },
          { description: { contains: event.name } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    // Check for registration order payments
    const registrationOrder = coach ? await prisma.eventRegistrationOrder.findFirst({
      where: {
        eventId: event.id,
        coachId: coach.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    }) : null;

    // Check for EventPayment records
    const eventPayment = await prisma.eventPayment.findFirst({
      where: {
        eventId: event.id,
        status: 'SUCCESS'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Determine payment status
    let paymentCompleted = false;
    let paymentStatus = 'PENDING';
    let paymentDate = null;
    let totalAmount = 0;

    if (eventFeePayment) {
      try {
        const metadata = eventFeePayment.metadata ? JSON.parse(eventFeePayment.metadata) : {};
        if (metadata.eventId === eventId) {
          paymentCompleted = true;
          paymentStatus = 'SUCCESS';
          paymentDate = eventFeePayment.updatedAt;
          totalAmount = eventFeePayment.amount;
        }
      } catch (parseError) {
        // If metadata parsing fails, check if it's a recent payment for this event
        if (eventFeePayment.description && eventFeePayment.description.includes(event.name)) {
          paymentCompleted = true;
          paymentStatus = 'SUCCESS';
          paymentDate = eventFeePayment.updatedAt;
          totalAmount = eventFeePayment.amount;
        }
      }
    } else if (eventPayment && eventPayment.status === 'SUCCESS') {
      paymentCompleted = true;
      paymentStatus = 'SUCCESS';
      paymentDate = eventPayment.updatedAt;
      totalAmount = eventPayment.amount;
    } else if (registrationOrder && registrationOrder.paymentStatus === 'PAID') {
      paymentCompleted = true;
      paymentStatus = 'SUCCESS';
      paymentDate = registrationOrder.paymentDate;
      totalAmount = registrationOrder.totalFeeAmount || 0;
    }

    res.json(successResponse({
      paymentStatus: paymentStatus,
      paymentCompleted: paymentCompleted,
      totalAmount: totalAmount,
      paymentDate: paymentDate,
      eventId: event.id,
      eventName: event.name,
      paymentMode: 'COACH_EVENT_FEE'
    }, 'Payment status retrieved successfully'));

  } catch (error) {
    console.error('❌ Error checking event payment status:', error);
    res.status(500).json(errorResponse('Failed to check payment status', 500));
  }
});

// Helper: handle student participation fee verification
async function handleStudentEventPaymentVerification(req, res, { razorpay_order_id, razorpay_payment_id, eventId, userId }) {
  try {
    console.log(`🎯 Handling student event fee verification for event ${eventId}, user ${userId}`);

    // STEP 1: Update payment status
    const paymentUpdate = await prisma.payment.updateMany({
      where: {
        razorpayOrderId: razorpay_order_id,
        userId,
        status: { not: 'SUCCESS' }
      },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        status: 'SUCCESS'
      }
    });

    // Check if payment was already processed
    if (paymentUpdate.count === 0) {
      const existing = await prisma.payment.findFirst({
        where: { razorpayOrderId: razorpay_order_id, userId }
      });

      if (existing?.status === 'SUCCESS') {
        console.log('✅ Payment already verified');
        return res.json(successResponse({
          paymentId: razorpay_payment_id,
          status: 'SUCCESS',
          eventId,
          alreadyProcessed: true
        }, 'Payment was already verified.'));
      }

      return res.status(404).json(errorResponse('Payment record not found for verification.', 404));
    }

    // STEP 2: Get payment record
    const paymentRecord = await prisma.payment.findFirst({
      where: { razorpayOrderId: razorpay_order_id, userId }
    });

    if (!paymentRecord) {
      return res.status(404).json(errorResponse('Payment record not found.', 404));
    }

    // STEP 3: Get student ID and selectedCategory (from metadata or by userId lookup)
    let registrationId = null;
    let studentId = null;
    let pendingRegistration = false;
    let selectedCategory = null;
    
    try {
      const meta = paymentRecord?.metadata ? JSON.parse(paymentRecord.metadata) : {};
      registrationId = meta.registrationId;
      studentId = meta.studentId;
      pendingRegistration = meta.pendingRegistration === true;
      selectedCategory = meta.selectedCategory || null;
    } catch (err) {
      console.warn('⚠️ Failed to parse payment metadata:', err);
    }

    // If studentId not in metadata, fetch from Student table
    if (!studentId) {
      const student = await prisma.student.findUnique({
        where: { userId }
      });
      if (student) {
        studentId = student.id;
        console.log(`✅ Found student ID from lookup: ${studentId}`);
      }
    }

    if (!studentId) {
      console.error('❌ Student ID not found for user:', userId);
      return res.status(404).json(errorResponse('Student profile not found.', 404));
    }

    // STEP 4: Handle registration creation/update
    let finalRegistrationId = registrationId;

    // Check if registration already exists
    const existingReg = await prisma.eventRegistration.findUnique({
      where: {
        eventId_studentId: {
          eventId,
          studentId
        }
      }
    });

    if (existingReg) {
      // Registration exists - update to APPROVED and selectedCategory if provided
      finalRegistrationId = existingReg.id;
      const updateData = { status: 'APPROVED' };
      if (selectedCategory) {
        updateData.selectedCategory = selectedCategory;
      }
      await prisma.eventRegistration.update({
        where: { id: finalRegistrationId },
        data: updateData
      });
      console.log(`✅ Updated existing registration ${finalRegistrationId} to APPROVED${selectedCategory ? ' with category' : ''}`);
    } else {
      // Registration doesn't exist - create new one
      const newRegistration = await prisma.eventRegistration.create({
        data: {
          studentId,
          eventId,
          status: 'APPROVED',
          selectedCategory: selectedCategory || null
        }
      });
      finalRegistrationId = newRegistration.id;
      console.log(`✅ Created new registration ${finalRegistrationId} with APPROVED status`);

      // Update event participant count
      await prisma.event.update({
        where: { id: eventId },
        data: {
          currentParticipants: {
            increment: 1
          }
        }
      });
      console.log(`✅ Updated event ${eventId} participant count`);

      // Update payment metadata with registration ID
      try {
        const currentMeta = paymentRecord.metadata ? JSON.parse(paymentRecord.metadata) : {};
        await prisma.payment.update({
          where: { id: paymentRecord.id },
          data: {
            metadata: JSON.stringify({
              ...currentMeta,
              registrationId: finalRegistrationId,
              studentId: studentId,
              pendingRegistration: false
            })
          }
        });
      } catch (metaError) {
        console.warn('⚠️ Failed to update payment metadata:', metaError);
      }
    }

    console.log(`✅ Student event fee verification completed successfully. Registration ID: ${finalRegistrationId}`);

    return res.json(successResponse({
      paymentId: razorpay_payment_id,
      status: 'SUCCESS',
      eventId,
      registrationId: finalRegistrationId
    }, 'Student event fee verified successfully. Registration completed.'));
  } catch (error) {
    console.error('❌ Student event fee verification error:', error);
    res.status(500).json(errorResponse('Failed to verify student event payment.', 500));
  }
}

module.exports = router;