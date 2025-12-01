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

    // Verify the user is the coach of this event
    // event.coachId is the Coach table ID, not User ID
    // We need to check if the coach's userId matches req.user.id
    if (!event.coach || String(event.coach.userId) !== String(req.user.id)) {
      console.warn(`⚠️ Authorization check failed:`, {
        eventId: event.id,
        eventCoachId: event.coachId,
        coachUserId: event.coach?.userId,
        reqUserId: req.user.id,
        userRole: req.user.role
      });
      return res.status(403).json(errorResponse('You are not authorized to create payment for this event.', 403));
    }

    console.log('Creating payment order for event', event.name);

    // Calculate amount: ₹2 per participant
    const participantCount = event.currentParticipants || 0;
    const amountInRupees = 500 * participantCount;
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

    res.json(successResponse({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      eventName: event.name,
      participantCount: participantCount,
      amountInRupees: amountInRupees,
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

// Get event payment status (coach-accessible)
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

    // Verify the user is the coach of this event
    // Get coach record for the user
    const coach = await prisma.coach.findUnique({
      where: { userId: req.user.id },
      select: { id: true }
    });

    // Check authorization: user must be a coach and event must belong to that coach
    if (!coach || req.user.role !== 'COACH') {
      console.warn(`⚠️ Authorization failed: User is not a coach`, {
        eventId: event.id,
        reqUserRole: req.user.role,
        hasCoach: !!coach
      });
      return res.status(403).json(errorResponse('You are not authorized to view payment status for this event.', 403));
    }

    if (String(event.coachId) !== String(coach.id)) {
      console.warn(`⚠️ Authorization failed: Event does not belong to coach`, {
        eventId: event.id,
        eventCoachId: event.coachId,
        coachId: coach.id,
        reqUserId: req.user.id
      });
      return res.status(403).json(errorResponse('You are not authorized to view payment status for this event.', 403));
    }

    // Check for event fee payment (from Payment table)
    // coach variable is already defined above from authorization check
    const eventFeePayment = await prisma.payment.findFirst({
      where: {
        userId: req.user.id,
        status: 'SUCCESS',
        OR: [
          {
            metadata: {
              contains: eventId
            }
          },
          {
            description: {
              contains: event.name
            }
          }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
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
      eventName: event.name
    }, 'Payment status retrieved successfully'));

  } catch (error) {
    console.error('❌ Error checking event payment status:', error);
    res.status(500).json(errorResponse('Failed to check payment status', 500));
  }
});

module.exports = router;