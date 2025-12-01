const express = require('express');
const { PrismaClient } = require('@prisma/client');
// Adjust paths if your helpers or auth middleware live elsewhere
const { authenticate } = require('../../utils/authMiddleware');
const { successResponse, errorResponse } = require('../../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/events/:eventId/payments
 * - Requires authenticated admin user (basic role check below; replace with your admin middleware if you have one)
 * - Returns payment records associated with the given eventId
 */
router.get('/admin/events/:eventId/payments', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Simple admin check — replace with your actual admin middleware if available
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json(errorResponse('Forbidden: admin access required', 403));
    }

    let payments = [];

    // 1) Try scalar eventId column on Payment model (if exists)
    try {
      payments = await prisma.event_payments.findMany({
        where: { eventId: eventId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (err) {
      payments = [];
    }

    // 2) If none found, try metadata JSON-path query (Prisma JSON filtering)
    if (!payments || payments.length === 0) {
      try {
        const jsonFiltered = await prisma.event_payments.findMany({
          where: {
            metadata: {
              path: ['eventId'],
              equals: eventId
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        if (jsonFiltered && jsonFiltered.length) payments = jsonFiltered;
      } catch (err) {
        // ignore and fall through to raw query
      }
    }

    // 3) Fallback: raw Postgres JSONB query (metadata ->> 'eventId' = eventId)
    if (!payments || payments.length === 0) {
      try {
        const raw = await prisma.$queryRawUnsafe(
          `SELECT * FROM "Payment" WHERE (metadata ->> 'eventId') = $1 ORDER BY "createdAt" DESC`,
          eventId
        );
        if (raw && raw.length) payments = raw;
      } catch (err) {
        console.warn('Raw payments query failed (maybe not Postgres or different metadata shape):', err.message || err);
      }
    }

    return res.json(successResponse({ payments: payments || [] }, 'Payments fetched successfully.'));
  } catch (error) {
    console.error('Admin get event payments error:', error);
    return res.status(500).json(errorResponse('Failed to fetch payments for event.', 500));
  }
});

module.exports = router;