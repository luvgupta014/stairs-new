const express = require('express');
const crypto = require('crypto');
const prisma = require('../utils/prismaClient');
const { authenticate, requireEventIncharge } = require('../utils/authMiddleware');
const { validateEmail, hashPassword, successResponse, errorResponse } = require('../utils/helpers');
const { generateUID } = require('../utils/uidGenerator');

const router = express.Router();

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const validateIndianPhone = (phone) => {
  if (!phone) return true; // optional
  const p = phone.toString().trim();
  return /^[6-9]\d{9}$/.test(p);
};

const normalizeOptional = (v) => {
  if (v === undefined || v === null) return null;
  const s = v.toString().trim();
  return s.length ? s : null;
};

const validateStrongPassword = (password) => {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
  if (typeof password !== 'string') return false;
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
};

/**
 * Public: Validate an incharge invite token (used by frontend registration page)
 * GET /api/event-incharge/invites/validate?token=...
 */
router.get('/invites/validate', async (req, res) => {
  try {
    const token = (req.query.token || '').toString().trim();
    if (!token) return res.status(400).json(errorResponse('token is required', 400));

    const invite = await prisma.eventInchargeInvite.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            sport: true,
            level: true,
            venue: true,
            city: true,
            state: true,
            startDate: true,
            endDate: true,
            uniqueId: true
          }
        },
        vendor: true
      }
    });

    if (!invite) return res.status(404).json(errorResponse('Invalid invite token.', 404));
    if (invite.revokedAt) return res.status(400).json(errorResponse('Invite has been revoked.', 400));
    if (invite.usedAt) return res.status(400).json(errorResponse('Invite has already been used.', 400));
    if (invite.expiresAt < new Date()) return res.status(400).json(errorResponse('Invite has expired.', 400));

    res.json(successResponse({
      email: invite.email,
      isPointOfContact: invite.isPointOfContact,
      permissions: {
        resultUpload: invite.resultUpload,
        studentManagement: invite.studentManagement,
        certificateManagement: invite.certificateManagement,
        feeManagement: invite.feeManagement
      },
      event: invite.event,
      vendor: invite.vendor ? {
        id: invite.vendor.id,
        name: invite.vendor.name
      } : null
    }, 'Invite is valid.'));
  } catch (error) {
    console.error('❌ Validate incharge invite error:', error);
    res.status(500).json(errorResponse('Failed to validate invite.', 500));
  }
});

/**
 * Public: Complete registration for an invited incharge
 * POST /api/event-incharge/register
 */
router.post('/register', async (req, res) => {
  try {
    const {
      token,
      password,

      // Incharge person details
      fullName,
      phone,
      designation,
      panNumber,
      aadhaar,

      // Vendor details
      vendorId,
      vendorName,
      vendorGstin,
      vendorPan,
      vendorAddress,
      vendorCity,
      vendorState,
      vendorPincode
    } = req.body || {};

    if (!token) return res.status(400).json(errorResponse('token is required', 400));
    if (!password) return res.status(400).json(errorResponse('password is required', 400));
    if (!validateStrongPassword(password)) {
      return res.status(400).json(errorResponse('Password must be at least 8 characters with uppercase, lowercase, and number.', 400));
    }
    if (!fullName) return res.status(400).json(errorResponse('fullName is required', 400));
    if (!validateIndianPhone(phone)) {
      return res.status(400).json(errorResponse('Invalid phone number. Use 10-digit Indian mobile number.', 400));
    }

    const tokenHash = hashToken(token.toString().trim());

    const invite = await prisma.eventInchargeInvite.findUnique({
      where: { tokenHash },
      include: { event: true }
    });

    if (!invite) return res.status(404).json(errorResponse('Invalid invite token.', 404));
    if (invite.revokedAt) return res.status(400).json(errorResponse('Invite has been revoked.', 400));
    if (invite.usedAt) return res.status(400).json(errorResponse('Invite has already been used.', 400));
    if (invite.expiresAt < new Date()) return res.status(400).json(errorResponse('Invite has expired.', 400));

    const email = invite.email?.toLowerCase();
    if (!email || !validateEmail(email)) return res.status(400).json(errorResponse('Invite email is invalid.', 400));

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json(errorResponse('A user with this email already exists. Event incharge must be a separate account.', 409));
    }

    const hashedPassword = await hashPassword(password);
    const stateForUid = vendorState || invite.event?.state || 'Delhi';
    const uniqueId = await generateUID('EVENT_INCHARGE', stateForUid);

    const result = await prisma.$transaction(async (tx) => {
      let resolvedVendorId = vendorId || invite.vendorId;

      if (resolvedVendorId) {
        const v = await tx.eventVendor.findUnique({ where: { id: resolvedVendorId } });
        if (!v) throw new Error('Invalid vendorId.');
      } else {
        if (!vendorName) throw new Error('vendorName is required when vendorId is not provided.');
        const vendor = await tx.eventVendor.create({
          data: {
            name: normalizeOptional(vendorName),
            gstin: normalizeOptional(vendorGstin),
            pan: normalizeOptional(vendorPan),
            address: normalizeOptional(vendorAddress),
            city: normalizeOptional(vendorCity),
            state: normalizeOptional(vendorState),
            pincode: normalizeOptional(vendorPincode)
          }
        });
        resolvedVendorId = vendor.id;
      }

      const user = await tx.user.create({
        data: {
          uniqueId,
          name: normalizeOptional(fullName),
          email,
          phone: normalizeOptional(phone),
          password: hashedPassword,
          role: 'EVENT_INCHARGE',
          isActive: true,
          isVerified: true
        }
      });

      const inchargeProfile = await tx.eventIncharge.create({
        data: {
          userId: user.id,
          vendorId: resolvedVendorId,
          fullName: normalizeOptional(fullName),
          phone: normalizeOptional(phone),
          designation: normalizeOptional(designation),
          panNumber: normalizeOptional(panNumber),
          aadhaar: normalizeOptional(aadhaar),
          gstin: normalizeOptional(vendorGstin)
        }
      });

      // Create assignment + enforce only one point-of-contact per event
      if (invite.isPointOfContact) {
        await tx.eventAssignment.updateMany({
          where: { eventId: invite.eventId, role: 'INCHARGE' },
          data: { isPointOfContact: false }
        });
      }

      await tx.eventAssignment.create({
        data: {
          eventId: invite.eventId,
          userId: user.id,
          role: 'INCHARGE',
          isPointOfContact: !!invite.isPointOfContact
        }
      });

      await tx.eventUserPermission.upsert({
        where: { eventId_userId: { eventId: invite.eventId, userId: user.id } },
        update: {
          resultUpload: !!invite.resultUpload,
          studentManagement: !!invite.studentManagement,
          certificateManagement: !!invite.certificateManagement,
          feeManagement: !!invite.feeManagement
        },
        create: {
          eventId: invite.eventId,
          userId: user.id,
          resultUpload: !!invite.resultUpload,
          studentManagement: !!invite.studentManagement,
          certificateManagement: !!invite.certificateManagement,
          feeManagement: !!invite.feeManagement
        }
      });

      await tx.eventInchargeInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() }
      });

      return { user, inchargeProfile };
    });

    res.status(201).json(successResponse({
      userId: result.user.id,
      email,
      uniqueId,
      eventId: invite.eventId
    }, 'Registration completed. You can now login as Event Incharge.', 201));
  } catch (error) {
    console.error('❌ Event incharge registration error:', error);
    if (error?.code === 'P2002') {
      return res.status(409).json(errorResponse('A record with this data already exists (email/phone).', 409));
    }
    res.status(500).json(errorResponse(error.message || 'Registration failed.', 500));
  }
});

/**
 * Authenticated: Get assigned events (event incharge dashboard)
 */
router.get('/me/assigned-events', authenticate, requireEventIncharge, async (req, res) => {
  try {
    const assignments = await prisma.eventAssignment.findMany({
      where: { userId: req.user.id },
      include: {
        event: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const out = await Promise.all(assignments.map(async (a) => {
      const override = await prisma.eventUserPermission.findUnique({
        where: { eventId_userId: { eventId: a.eventId, userId: req.user.id } }
      });
      return {
        ...a,
        permissionOverride: override ? {
          resultUpload: override.resultUpload,
          studentManagement: override.studentManagement,
          certificateManagement: override.certificateManagement,
          feeManagement: override.feeManagement
        } : null
      };
    }));

    res.json(successResponse(out, 'Assigned events retrieved.'));
  } catch (error) {
    console.error('❌ Get incharge assigned events error:', error);
    res.status(500).json(errorResponse('Failed to get assigned events.', 500));
  }
});

module.exports = router;


