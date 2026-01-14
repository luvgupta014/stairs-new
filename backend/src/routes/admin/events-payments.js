const express = require('express');
const { PrismaClient } = require('@prisma/client');
// Adjust paths if your helpers or auth middleware live elsewhere
const { authenticate } = require('../../utils/authMiddleware');
const { successResponse, errorResponse } = require('../../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/events/:eventId/payments
 * - Requires authenticated admin user
 * - Returns payment records associated with the given eventId
 * - Includes student participation fee attempts (Payment.type=EVENT_STUDENT_FEE) including CANCELLED/FAILED
 * - Includes user details so admins can follow up
 */
router.get('/admin/events/:eventId/payments', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Admin gate (case-insensitive) — do NOT require adminProfile here, because some deployments
    // may not have an admin profile row even though the user role is ADMIN.
    const role = String(req.user?.role || '').toUpperCase();
    if (role !== 'ADMIN') {
      return res.status(403).json(errorResponse('Forbidden: admin access required', 403));
    }

    const safeParse = (v) => {
      try {
        if (!v) return {};
        if (typeof v === 'object') return v;
        return JSON.parse(v);
      } catch {
        return {};
    }
    };

    // Payments model (covers student participation fee attempts; metadata.eventId ties to event)
    const rawPayments = await prisma.payment.findMany({
          where: {
        // metadata is a string; broad filter then narrow via JSON.parse
        metadata: { contains: eventId }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            uniqueId: true,
            role: true,
            studentProfile: {
              select: {
                id: true,
                name: true,
                sport: true,
                sport2: true,
                sport3: true,
                level: true,
                school: true,
                district: true,
                state: true,
                eaId: true,
                instagramHandle: true
              }
            }
          }
            }
          },
          orderBy: { createdAt: 'desc' }
    }).catch(() => []);

    const paymentsForEvent = (rawPayments || [])
      .map((p) => {
        const meta = safeParse(p.metadata);
        return { ...p, metadata: meta };
      })
      .filter((p) => p.metadata?.eventId === eventId);

    // EventPayment model (legacy per-event payment records)
    const eventPayments = await prisma.eventPayment.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' }
    }).catch(() => []);

    const normalizedEventPayments = (eventPayments || []).map((p) => ({
      id: p.id,
      userId: null,
      user: null,
      userType: null,
      coachId: null,
      type: 'EVENT_PAYMENT',
      amount: p.amount,
      currency: p.currency,
      razorpayOrderId: p.razorpayOrderId,
      razorpayPaymentId: p.razorpayPaymentId,
      status: p.status,
      description: p.description,
      metadata: { eventId },
      expiresAt: null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    // Merge and sort by createdAt descending
    const combined = [...paymentsForEvent, ...normalizedEventPayments].sort((a, b) => {
      const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

    return res.json(successResponse({ payments: combined }, 'Payments fetched successfully.'));
  } catch (error) {
    console.error('Admin get event payments error:', error);
    return res.status(500).json(errorResponse('Failed to fetch payments for event.', 500));
  }
});

module.exports = router;