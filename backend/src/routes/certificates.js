const express = require('express');
const router = express.Router();
const { authenticate, requireCoach, requireAdmin } = require('../utils/authMiddleware');
const certificateService = require('../services/certificateService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper functions
const successResponse = (data, message = 'Success') => ({ success: true, message, data });
const errorResponse = (message, statusCode = 400) => ({ success: false, message, statusCode });

/**
 * @route   POST /api/certificates/issue
 * @desc    Issue certificates to selected students (Admin only)
 * @access  Private (Admin)
 */
router.post('/issue', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId, orderId, selectedStudents } = req.body;

    console.log(`📜 Certificate issuance request:`, { eventId, orderId, selectedStudents: selectedStudents?.length });

    // Validate input
    if (!eventId || !selectedStudents || selectedStudents.length === 0) {
      return res.status(400).json(errorResponse('Missing required fields: eventId or selectedStudents'));
    }

    // Find event by id or uniqueId
    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { id: eventId },
          { uniqueId: eventId }
        ]
      },
      select: {
        id: true,
        uniqueId: true,
        name: true,
        sport: true,
        startDate: true
      }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found or you do not have permission'));
    }

    // COMMENTED OUT: Order verification and payment check
    // Admin can now issue certificates without order completion constraint
    /*
    // Verify the order and check payment status
    const order = await prisma.eventOrder.findFirst({
      where: {
        id: orderId,
        eventId,
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

    // Check if trying to issue more certificates than paid for
    if (selectedStudents.length > order.certificates) {
      return res.status(400).json(errorResponse(
        `You can only issue ${order.certificates} certificate(s). You selected ${selectedStudents.length} students.`
      ));
    }
    */

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

    // Check for already issued certificates (without orderId constraint)
    const existingCertificates = await prisma.certificate.findMany({
      where: {
        eventId: event.id,
        // orderId, // Removed orderId constraint
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
    const eventDate = new Date(event.startDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // CRITICAL: Pass database IDs internally, UIDs only for display
    const certificatesData = students.map(student => ({
      participantName: student.name,
      sportName: event.sport,
      eventName: event.name,
      eventDate: eventDate,
      date: eventDate, // For backwards compatibility
      studentId: student.id, // Use database ID internally
      studentUniqueId: student.user.uniqueId, // For display on certificate
      eventId: event.id, // Use database ID internally
      eventUniqueId: event.uniqueId, // For display on certificate
      orderId: orderId || null // Optional orderId
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
 * @desc    Get all issued certificates for an event (Admin only)
 * @access  Private (Admin)
 * @note    Returns all certificates for the event regardless of order
 */
router.get('/event/:eventId/issued', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;

    console.log(`📜 Fetching issued certificates for event: ${eventId}`);

    // Find event by id or uniqueId
    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { id: eventId },
          { uniqueId: eventId }
        ]
      },
      select: { id: true, uniqueId: true, name: true }
    });

    console.log(`🔍 Event lookup result:`, event);

    if (!event) {
      console.log(`❌ Event not found for ID: ${eventId}`);
      return res.status(404).json(errorResponse('Event not found'));
    }

    // Get all certificates for this event - check both database ID and uniqueId
    // Some old certificates might have uniqueId stored, newer ones have database ID
    const certificatesRaw = await prisma.certificate.findMany({
      where: {
        OR: [
          { eventId: event.id },
          { eventId: event.uniqueId },
          { eventId: eventId } // Also check if eventId param was stored directly
        ]
      },
      orderBy: { issueDate: 'desc' }
    });

    console.log(`📋 Found ${certificatesRaw.length} certificates for event ${event.name}`);

    // Fetch student details for each certificate
    const certificates = await Promise.all(certificatesRaw.map(async cert => {
      try {
        // Try to find student by database ID first, then by uniqueId
        let student = await prisma.student.findUnique({
          where: { id: cert.studentId },
          select: {
            name: true,
            user: { select: { uniqueId: true, email: true } }
          }
        });

        // If not found by ID, try finding by uniqueId through user
        if (!student) {
          const user = await prisma.user.findUnique({
            where: { uniqueId: cert.studentId },
            include: {
              studentProfile: {
                select: {
                  name: true
                }
              }
            }
          });
          
          if (user?.studentProfile) {
            student = {
              name: user.studentProfile.name,
              user: {
                uniqueId: user.uniqueId,
                email: user.email
              }
            };
          }
        }

        return {
          ...cert,
          studentName: student?.name || 'Unknown',
          studentUniqueId: student?.user?.uniqueId || cert.studentId,
          studentEmail: student?.user?.email || ''
        };
      } catch (err) {
        console.error(`⚠️ Error fetching student ${cert.studentId}:`, err);
        return {
          ...cert,
          studentName: 'Unknown',
          studentUniqueId: cert.studentId,
          studentEmail: ''
        };
      }
    }));

    console.log(`✅ Successfully retrieved ${certificates.length} certificates`);

    res.json(successResponse({
      certificates,
      count: certificates.length,
      eventName: event.name
    }, 'Certificates retrieved successfully'));

  } catch (error) {
    console.error('❌ Error fetching event certificates:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json(errorResponse('Failed to fetch certificates', 500));
  }
});

/**
 * @route   GET /api/certificates/event/:eventId/eligible-students
 * @desc    Get eligible students for certificate issuance for an event (Admin only)
 * @access  Private (Admin)
 * @note    Order verification commented out - Admin can issue certificates without order completion
 */
router.get('/event/:eventId/eligible-students', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { orderId } = req.query;

    console.log(`📋 Fetching eligible students for event: ${eventId}${orderId ? `, order: ${orderId}` : ''}`);

    // Find event by id or uniqueId
    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { id: eventId },
          { uniqueId: eventId }
        ]
      },
      select: {
        id: true,
        uniqueId: true,
        name: true,
        status: true
      }
    });

    console.log('[DEBUG] Eligible students eventId param:', eventId);
    console.log('[DEBUG] Event found:', event);
    if (!event) {
      return res.status(404).json(errorResponse('Event not found'));
    }

    // COMMENTED OUT: Order verification and payment check
    // Admin can now view and issue certificates without order completion constraint
    /*
    // Verify the order and check payment status
    const order = await prisma.eventOrder.findFirst({
      where: {
        id: orderId,
        eventId,
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
    */

    // Get all students registered for this event
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId: event.id,
        status: { in: ['REGISTERED', 'APPROVED'] }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            sport: true,
            user: {
              select: {
                uniqueId: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Get already issued certificates for this event - check all possible ID formats
    const issuedCertificates = await prisma.certificate.findMany({
      where: {
        OR: [
          { eventId: event.id },
          { eventId: event.uniqueId },
          { eventId: eventId } // Also check if eventId param was stored directly
        ]
      },
      select: {
        studentId: true
      }
    });

    console.log(`📋 Found ${issuedCertificates.length} issued certificates for event ${event.name}`);

    // Build a set of issued student IDs - check both database ID and uniqueId
    const issuedStudentIds = new Set();
    
    for (const cert of issuedCertificates) {
      issuedStudentIds.add(cert.studentId);
      
      // Also try to find the database ID if cert.studentId is a uniqueId
      const student = await prisma.student.findFirst({
        where: {
          OR: [
            { id: cert.studentId },
            { user: { uniqueId: cert.studentId } }
          ]
        },
        select: { id: true }
      });
      
      if (student) {
        issuedStudentIds.add(student.id);
      }
    }

    console.log(`🔍 Total student IDs to exclude (including uniqueIds): ${issuedStudentIds.size}`);

    // Filter out students who already have certificates
    const eligibleStudents = registrations
      .filter(reg => !issuedStudentIds.has(reg.student.id))
      .map(reg => ({
        id: reg.student.id,
        name: reg.student.name,
        uniqueId: reg.student.user.uniqueId,
        studentId: reg.student.user.uniqueId, // Also provide as studentId for clarity
        email: reg.student.user.email,
        sport: reg.student.sport,
        registrationStatus: reg.status
      }));

    res.json(successResponse({
      eligibleStudents,
      totalEligible: eligibleStudents.length,
      totalRegistered: registrations.length,
      certificatesIssued: issuedCertificates.length,
      certificatesRemaining: eligibleStudents.length, // All eligible students can get certificates
      eventName: event.name,
      eventStatus: event.status
    }, 'Eligible students retrieved successfully'));

  } catch (error) {
    console.error('❌ Error fetching eligible students:', error);
    res.status(500).json(errorResponse('Failed to fetch eligible students', 500));
  }
});

/**
 * @route   GET /api/certificates/:uid/html
 * @desc    Get HTML version of certificate (fallback if PDF has issues)
 * @access  Public
 */
router.get('/:uid/html', async (req, res) => {
  try {
    const { uid } = req.params;

    const certificate = await prisma.certificate.findUnique({
      where: { uid }
    });

    if (!certificate) {
      return res.status(404).json(errorResponse('Certificate not found'));
    }

    // Construct HTML file path
    const htmlPath = certificate.certificateUrl.replace('.pdf', '.html');
    const fs = require('fs');
    const path = require('path');
    const fullPath = path.join(__dirname, '../..', htmlPath);

    // Check if HTML file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json(errorResponse('HTML version not available'));
    }

    // Send HTML file
    res.sendFile(fullPath);

  } catch (error) {
    console.error('❌ Error serving HTML certificate:', error);
    res.status(500).json(errorResponse('Failed to serve HTML certificate', 500));
  }
});

module.exports = router;
