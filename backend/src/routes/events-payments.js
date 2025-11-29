const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../utils/authMiddleware'); // keep your existing authenticate
const { successResponse, errorResponse } = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/events/:eventId/payments
 * - Requires authenticated user
 * - Checks that authenticated user has admin role (simple role check here; replace with your admin middleware if you have one)
 * - Returns payments associated with the given eventId
 */
router.get('/admin/events/:eventId/payments', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Basic admin check - replace with your actual admin middleware if available
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json(errorResponse('Forbidden: admin access required', 403));
    }

    let payments = [];

    // 1) Try scalar eventId field (if Payment.eventId exists in schema)
    try {
      payments = await prisma.payment.findMany({
        where: {
          eventId: eventId // will work for string/uuid; if your DB uses Int you may need Number(eventId)
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (err) {
      // ignore and attempt JSON approach below
      payments = [];
    }

    // 2) If none found, try metadata JSON-path query (Prisma JSON filter)
    if (!payments || payments.length === 0) {
      try {
        // This uses Prisma's JSON filtering API (supported for JSON/JSONB fields)
        const jsonFiltered = await prisma.payment.findMany({
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
        // ignore - fallback to raw SQL next
      }
    }

    // 3) Fallback: raw SQL for Postgres JSONB (metadata ->> 'eventId' = eventId)
    if (!payments || payments.length === 0) {
      try {
        const raw = await prisma.$queryRawUnsafe(
          `SELECT * FROM "Payment" WHERE (metadata ->> 'eventId') = $1 ORDER BY "createdAt" DESC`,
          eventId
        );
        if (raw && raw.length) payments = raw;
      } catch (err) {
        // ignore - we'll return empty array if everything fails
        console.warn('Raw payments query failed (possibly not Postgres or JSON structure mismatch):', err.message || err);
      }
    }

    // If still empty, that's fine — return empty payments array
    return res.json(successResponse({ payments: payments || [] }, 'Payments fetched successfully.'));
  } catch (error) {
    console.error('Admin get event payments error:', error);
    return res.status(500).json(errorResponse('Failed to fetch payments for event.', 500));
  }
});

module.exports = router;