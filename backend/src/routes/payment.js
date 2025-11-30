const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { getPlansForUserType, getUserTypeDisplayName } = require('../config/paymentPlans');
const { successResponse, errorResponse } = require('../utils/helpers');
const { authenticate, requireCoach, requireInstitute, requireClub, requireStudent } = require('../utils/authMiddleware');
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
router.post('/create-order-events', authenticate, async (req, res) => {
  try {
    const { eventId } = req.body;

    // Fetch event details
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }
    console.log('Creating payment order for event', event);

    const amount = 500 * (event.currentParticipants || 0) * 100; // in paise

    // Create Razorpay order
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const userIdForReceipt = (req.user?.id || '').toString().slice(-6); // Last 6 chars of authenticated user ID
    const receipt = `EV_${userIdForReceipt}_${timestamp}`; // Max ~20 chars

    console.log(`Generated receipt: "${receipt}" (length: ${receipt.length})`);

    const order = await razorpay.orders.create({
      amount: amount,
      currency: 'INR',
      receipt: receipt,
      notes: {
        userId: req.user.id,   // use authenticated user id (same approach as /create-order)
        eventId: eventId
      }
    });

    console.log(`✅ Razorpay order created successfully: ${order.id} for event ${event.name} (₹${amount / 100})`);

    // Ensure authenticated user exists in DB (this mirrors /create-order behavior)
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      console.error(`Authenticated user not found: ${req.user.id}`);
      return res.status(400).json(errorResponse('Authenticated user not found. Please contact support.', 400));
    }

    // OPTIONAL: Ensure the authenticated user is the coach of this event.
    // If you want to enforce this, uncomment the block below:
    //
    // if (String(event.coachId) !== String(req.user.id)) {
    //   console.warn(`User ${req.user.id} is not the coach for event ${event.id}`);
    //   return res.status(403).json(errorResponse('You are not authorized to create payment for this event.', 403));
    // }

    // Save payment record (use same pattern as /create-order)
    const payment = await prisma.payment.create({
      data: {
        userId: req.user.id, // use authenticated user's id to avoid FK mismatch
        userType: 'COACH', // charging the coach — adjust if business logic differs
        type: 'EVENT_REGISTRATION',
        amount: amount / 100,
        currency: 'INR',
        razorpayOrderId: order.id,
        status: 'PENDING',
        description: `Registration for event: ${event.name}`,
        metadata: JSON.stringify({
          eventId: eventId,
          eventName: event.name
        })
      }
    });

    res.json(successResponse({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      eventName: event.name,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    }, 'Event payment order created successfully.'));

  } catch (error) {
    console.error('Create payment order error:', error);

    // Helpful log for Prisma FK errors
    if (error?.code === 'P2003') {
      console.error('Prisma P2003 (FK violated). This indicates the payment.userId value does not exist in users table.');
    }

    res.status(500).json(errorResponse('Failed to create payment order.', 500));
  }
});

// Verify payment (unified for all user types)
router.post('/verify', authenticate, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userType
    } = req.body;

    console.log(`🔍 Verifying payment for user ${req.user.id}, order: ${razorpay_order_id}`);

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

    // Update payment record
    const payment = await prisma.payment.updateMany({
      where: {
        razorpayOrderId: razorpay_order_id,
        userId: req.user.id
      },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        status: 'SUCCESS'
      }
    });

    console.log(`💾 Updated ${payment.count} payment records`);

    if (payment.count === 0) {
      console.log('❌ No payment record found to update');
      return res.status(404).json(errorResponse('Payment record not found.', 404));
    }

    // Update user profile based on userType
    console.log(`🔄 Updating ${userType} profile for user ${req.user.id}`);

    // Get existing subscription for proration
    let existingSubscription = null;
    if (userType.toLowerCase() === 'coach') {
      existingSubscription = await prisma.coach.findUnique({
        where: { userId: req.user.id },
        select: { subscriptionExpiresAt: true, subscriptionType: true }
      });
    }

    const now = new Date();
    let subscriptionExpiresAt = new Date();
    subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 1); // 1 month subscription

    // Proration: If user has active subscription, extend from current expiry
    if (existingSubscription?.subscriptionExpiresAt && existingSubscription.subscriptionExpiresAt > now) {
      subscriptionExpiresAt = new Date(existingSubscription.subscriptionExpiresAt);
      subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 1);
      console.log(`📅 Proration: Extending subscription from ${existingSubscription.subscriptionExpiresAt.toISOString()} to ${subscriptionExpiresAt.toISOString()}`);
    }

    if (userType.toLowerCase() === 'coach') {
      await prisma.coach.update({
        where: { userId: req.user.id },
        data: {
          paymentStatus: 'SUCCESS',
          isActive: true,
          subscriptionType: 'MONTHLY',
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
          subscriptionType: 'MONTHLY',
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
          subscriptionType: 'MONTHLY',
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
          subscriptionType: 'MONTHLY',
          subscriptionExpiresAt: subscriptionExpiresAt
        }
      });
      console.log('✅ Institute profile updated successfully');
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

module.exports = router;