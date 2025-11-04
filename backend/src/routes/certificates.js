const express = require('express');
const router = express.Router();
const { authenticate, requireCoach } = require('../utils/authMiddleware');
const certificateService = require('../services/certificateService');
const prisma = require('../prisma/schema');

// Helper functions
const successResponse = (data, message = 'Success') => ({ success: true, message, data });
const errorResponse = (message, statusCode = 400) => ({ success: false, message, statusCode });

/**
 * @route   POST /api/certificates/issue
 * @desc    Issue certificates to selected students (Coach only)
 * @access  Private (Coach)
 */
router.post('/issue', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId, orderId, selectedStudents } = req.body;
    const coachId = req.user.coachProfile.id;

    console.log(`📜 Certificate issuance request:`, { eventId, orderId, selectedStudents: selectedStudents?.length });

    // Validate input
    if (!eventId || !orderId || !selectedStudents || selectedStudents.length === 0) {
      return res.status(400).json(errorResponse('Missing required fields: eventId, orderId, or selectedStudents'));
    }

    // Verify the event belongs to the coach
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        coachId
      },
      select: {
        id: true,
        name: true,
        sport: true,
        startDate: true
      }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found or you do not have permission'));
    }

    // Verify the order and check payment status
    const order = await prisma.eventOrder.findFirst({
      where: {
        id: orderId,
        eventId,
        coachId,
        paymentStatus: 'SUCCESS'
      },
      select: {
        id: true,
        certificates: true,
        orderNumber: true
      }
    });

    if (!order) {
      return res.status(404).json(errorResponse('Order not found or payment not completed'));
    }

    // Check if coach is trying to issue more certificates than paid for
    if (selectedStudents.length > order.certificates) {
      return res.status(400).json(errorResponse(
        `You can only issue ${order.certificates} certificate(s). You selected ${selectedStudents.length} students.`
      ));
    }

    // Get student details for selected students
    const students = await prisma.student.findMany({
      where: {
        id: { in: selectedStudents }
      },
      select: {
        id: true,
        name: true,
        user: {
          select: {
            uniqueId: true
          }
        }
      }
    });

    if (students.length !== selectedStudents.length) {
      return res.status(400).json(errorResponse('Some selected students were not found'));
    }

    // Check for already issued certificates
    const existingCertificates = await prisma.certificate.findMany({
      where: {
        eventId,
        orderId,
        studentId: { in: selectedStudents }
      },
      select: {
        studentId: true
      }
    });

    if (existingCertificates.length > 0) {
      const alreadyIssuedIds = existingCertificates.map(c => c.studentId);
      return res.status(400).json(errorResponse(
        `Certificates already issued for some students. Already issued count: ${alreadyIssuedIds.length}`
      ));
    }

    // Prepare certificate data for each student
    const certificatesData = students.map(student => ({
      participantName: student.name,
      sportName: event.sport,
      eventName: event.name,
      date: new Date(event.startDate).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      studentId: student.id,
      eventId: event.id,
      orderId: order.id
    }));

    // Generate certificates
    console.log(`🎓 Generating ${certificatesData.length} certificate(s)...`);
    const { results, errors } = await certificateService.generateBulkCertificates(certificatesData);

    if (errors.length > 0) {
      console.error('⚠️ Some certificates failed to generate:', errors);
    }

    // Create notifications for students
    for (const certificate of results) {
      await prisma.notification.create({
        data: {
          userId: (await prisma.student.findUnique({ 
            where: { id: certificate.studentId },
            select: { userId: true }
          })).userId,
          type: 'GENERAL',
          title: '🎓 Certificate Issued!',
          message: `Your certificate for ${event.name} has been issued. You can download it from your dashboard.`,
          data: JSON.stringify({ 
            certificateId: certificate.id,
            certificateUrl: certificate.certificateUrl 
          })
        }
      });
    }

    console.log(`✅ Successfully issued ${results.length} certificate(s)`);

    res.json(successResponse({
      issued: results.length,
      failed: errors.length,
      certificates: results,
      errors
    }, `Successfully issued ${results.length} certificate(s)`));

  } catch (error) {
    console.error('❌ Error issuing certificates:', error);
    res.status(500).json(errorResponse('Failed to issue certificates. Please try again.', 500));
  }
});

/**
 * @route   GET /api/certificates/my-certificates
 * @desc    Get all certificates for logged-in student
 * @access  Private (Student)
 */
router.get('/my-certificates', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!student) {
      return res.status(404).json(errorResponse('Student profile not found'));
    }

    // Get all certificates for this student
    const certificates = await certificateService.getStudentCertificates(student.id);

    res.json(successResponse({
      certificates,
      count: certificates.length
    }, 'Certificates retrieved successfully'));

  } catch (error) {
    console.error('❌ Error fetching student certificates:', error);
    res.status(500).json(errorResponse('Failed to fetch certificates', 500));
  }
});

/**
 * @route   GET /api/certificates/verify/:uid
 * @desc    Verify certificate by UID (Public)
 * @access  Public
 */
router.get('/verify/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    const certificate = await certificateService.getCertificateByUID(uid);

    if (!certificate) {
      return res.status(404).json(errorResponse('Certificate not found'));
    }

    res.json(successResponse({
      certificate,
      verified: true
    }, 'Certificate verified successfully'));

  } catch (error) {
    console.error('❌ Error verifying certificate:', error);
    res.status(500).json(errorResponse('Failed to verify certificate', 500));
  }
});

/**
 * @route   GET /api/certificates/event/:eventId/issued
 * @desc    Get all issued certificates for an event (Coach only)
 * @access  Private (Coach)
 */
router.get('/event/:eventId/issued', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId } = req.params;
    const coachId = req.user.coachProfile.id;

    // Verify event belongs to coach
    const event = await prisma.event.findFirst({
      where: { id: eventId, coachId },
      select: { id: true, name: true }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found or access denied'));
    }

    // Get all certificates for this event
    const certificates = await prisma.certificate.findMany({
      where: { eventId },
      orderBy: { issueDate: 'desc' }
    });

    res.json(successResponse({
      certificates,
      count: certificates.length,
      eventName: event.name
    }, 'Certificates retrieved successfully'));

  } catch (error) {
    console.error('❌ Error fetching event certificates:', error);
    res.status(500).json(errorResponse('Failed to fetch certificates', 500));
  }
});

module.exports = router;
