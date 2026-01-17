const express = require('express');
const router = express.Router();
const { authenticate, requireCoach, requireAdmin, checkEventPermission } = require('../utils/authMiddleware');
const certificateService = require('../services/certificateService');
const EventService = require('../services/eventService');
const { sendCertificateIssuedEmail, sendWinnerCertificateIssuedEmail } = require('../utils/emailService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const eventService = new EventService();

// Helper functions
const successResponse = (data, message = 'Success') => ({ success: true, message, data });
const errorResponse = (message, statusCode = 400) => ({ success: false, message, statusCode });

// Allow Admin OR Event Incharge with certificateManagement permission for the given event
const requireAdminOrCertificateManager = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json(errorResponse('Unauthorized', 401));

    if (user.role === 'ADMIN') return next();

    if (user.role !== 'EVENT_INCHARGE') {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    const eventId = req.params?.eventId || req.body?.eventId;
    if (!eventId) return res.status(400).json(errorResponse('Missing eventId.', 400));

    const has = await checkEventPermission({ user, eventId, permissionKey: 'certificateManagement' });
    if (!has) return res.status(403).json(errorResponse('Access denied. Certificate management permission required.', 403));

    return next();
  } catch (e) {
    console.error('Certificate permission check error:', e);
    return res.status(500).json(errorResponse('Failed to authorize certificate access.', 500));
  }
};

/**
 * @route   POST /api/certificates/issue
 * @desc    Issue certificates to selected students (Admin or authorized Event Incharge)
 * @access  Private
 */
router.post('/issue', authenticate, requireAdminOrCertificateManager, async (req, res) => {
  try {
    const { eventId, orderId, selectedStudents } = req.body;

    console.log(`📜 Certificate issuance request:`, { eventId, orderId, selectedStudents: selectedStudents?.length });

    // Validate input
    if (!eventId || !selectedStudents || selectedStudents.length === 0) {
      return res.status(400).json(errorResponse('Missing required fields: eventId or selectedStudents'));
    }

    // Use EventService resolver to handle both database ID and uniqueId
    let event;
    try {
      event = await eventService.resolveEventId(eventId);
    } catch (error) {
      console.log(`❌ Event not found for ID: ${eventId}`);
      return res.status(404).json(errorResponse('Event not found or you do not have permission'));
    }

    if (!event) {
      return res.status(404).json(errorResponse('Event not found or you do not have permission'));
    }

    // Payment gating for certificate issuance (supports both admin-created student-fee events and coordinator/coach-paid events)
    // - Admin-created + student fee: require selected students to have APPROVED registrations (payment verified)
    // - Otherwise: require coordinator/coach payment completion (order payment OR event payment)
    let paymentSatisfied = false;
    let paymentMode = 'COACH_EVENT_FEE';

    const requiresStudentFee = !!(event.createdByAdmin && event.studentFeeEnabled && (event.studentFeeAmount || 0) > 0);
    if (requiresStudentFee) {
      paymentMode = 'STUDENT_EVENT_FEE';
      const regs = await prisma.eventRegistration.findMany({
        where: {
          eventId: event.id,
          studentId: { in: selectedStudents },
          status: 'APPROVED'
        },
        select: { studentId: true }
      });
      const approvedSet = new Set(regs.map(r => r.studentId));
      const notApproved = selectedStudents.filter(sid => !approvedSet.has(sid));
      if (notApproved.length > 0) {
        return res.status(402).json(errorResponse('Payment is pending for one or more selected students. Only APPROVED (paid) registrations can receive certificates for this event.', 402));
      }
      paymentSatisfied = true;
    } else {
      // Coordinator/coach-paid path: accept PAID/SUCCESS registration orders, EventPayment SUCCESS, or Payment SUCCESS tied to eventId
      const registrationOrder = await prisma.eventRegistrationOrder.findFirst({
        where: {
          eventId: event.id,
          paymentStatus: { in: ['PAID', 'SUCCESS'] }
        },
        select: { id: true }
      }).catch(() => null);

      const eventPayment = await prisma.eventPayment.findFirst({
        where: { eventId: event.id, status: 'SUCCESS' },
        select: { id: true }
      }).catch(() => null);

      const paymentRow = await prisma.payment.findFirst({
        where: {
          status: 'SUCCESS',
          metadata: { contains: event.id }
        },
        select: { id: true, metadata: true }
      }).catch(() => null);

      let paymentRowMatches = false;
      if (paymentRow?.metadata) {
        try {
          const meta = JSON.parse(paymentRow.metadata);
          paymentRowMatches = meta.eventId === event.id;
        } catch {}
      }

      paymentSatisfied = !!(registrationOrder || eventPayment || paymentRowMatches);
      if (!paymentSatisfied) {
        return res.status(402).json(errorResponse('Payment is pending for this event. Please complete payment before issuing certificates.', 402));
      }
    }

    // COMMENTED OUT: Order verification and per-order quantity check
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
            id: true
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

    // Log certificate data being prepared
    console.log(`📋 Certificate data prepared:`);
    certificatesData.forEach((cert, idx) => {
      console.log(`   [${idx}] eventUniqueId=${cert.eventUniqueId}, studentUniqueId=${cert.studentUniqueId}`);
    }); 

    // Generate certificates
    console.log(`🎓 Generating ${certificatesData.length} certificate(s)...`);
    const { results, errors } = await certificateService.generateBulkCertificates(certificatesData);

    if (errors.length > 0) {
      console.error('⚠️ Some certificates failed to generate:', errors);
    }

    // Create notifications for students + send emails (best-effort)
    let notificationsCreated = 0;
    let emailsSent = 0;
    let emailFailures = 0;
    for (const certificate of results) {
      const studentRow = await prisma.student.findUnique({
        where: { id: certificate.studentId },
        select: { name: true, user: { select: { id: true, email: true } } }
      });

      try {
        if (studentRow?.user?.id) {
      await prisma.notification.create({
        data: {
              userId: studentRow.user.id,
          type: 'GENERAL',
          title: '🎓 Certificate Issued!',
          message: `Your certificate for ${event.name} has been issued. You can download it from your dashboard.`,
          data: JSON.stringify({ 
            certificateId: certificate.id,
            certificateUrl: certificate.certificateUrl 
          })
        }
      });
          notificationsCreated += 1;
        }
      } catch (nErr) {
        console.warn('⚠️ Certificate notification create failed:', nErr?.message || nErr);
      }

      // Best-effort email (do not fail issuance)
      try {
        const to = studentRow?.user?.email;
        if (to) {
          await sendCertificateIssuedEmail({
            to,
            athleteName: studentRow?.name,
            eventName: event.name,
            sportName: event.sport,
            certificateUrl: certificate.certificateUrl
          });
          emailsSent += 1;
        }
      } catch (mailErr) {
        console.warn('⚠️ Participation certificate email failed:', mailErr?.message || mailErr);
        emailFailures += 1;
      }
    }

    console.log(`✅ Successfully issued ${results.length} certificate(s)`);

    res.json(successResponse({
      issued: results.length,
      failed: errors.length,
      notificationsCreated,
      emailsSent,
      emailFailures,
      certificates: results,
      errors
    }, `Successfully issued ${results.length} certificate(s)`));

  } catch (error) {
    console.error('❌ Error issuing certificates:', error);
    res.status(500).json(errorResponse('Failed to issue certificates. Please try again.', 500));
  }
});

/**
 * @route   POST /api/certificates/issue-winner
 * @desc    Issue winner certificates to selected students with positions (Admin or authorized Event Incharge)
 * @access  Private
 */
router.post('/issue-winner', authenticate, requireAdminOrCertificateManager, async (req, res) => {
  try {
    const { eventId, selectedStudentsWithPositions } = req.body; // [{studentId, position, positionText}]

    console.log(`🏆 Winner certificate issuance request:`, { eventId, students: selectedStudentsWithPositions?.length });

    if (!eventId || !selectedStudentsWithPositions || selectedStudentsWithPositions.length === 0) {
      return res.status(400).json(errorResponse('Missing required fields: eventId or selectedStudentsWithPositions'));
    }

    let event;
    try {
      event = await eventService.resolveEventId(eventId);
    } catch (error) {
      return res.status(404).json(errorResponse('Event not found'));
    }

    // Payment gating (same logic as /issue)
    const studentIds = selectedStudentsWithPositions.map(s => s.studentId);
    const requiresStudentFee = !!(event.createdByAdmin && event.studentFeeEnabled && (event.studentFeeAmount || 0) > 0);

    let registrationOrder = null;
    if (requiresStudentFee) {
      const regs = await prisma.eventRegistration.findMany({
        where: { eventId: event.id, studentId: { in: studentIds }, status: 'APPROVED' },
        select: { studentId: true }
      });
      const approvedSet = new Set(regs.map(r => r.studentId));
      const notApproved = studentIds.filter(sid => !approvedSet.has(sid));
      if (notApproved.length > 0) {
        return res.status(402).json(errorResponse('Payment is pending for one or more selected students. Only APPROVED (paid) registrations can receive certificates for this event.', 402));
      }
      // No registrationOrder required in student-fee mode
      registrationOrder = { id: null };
    } else {
      registrationOrder = await prisma.eventRegistrationOrder.findFirst({
        where: { eventId: event.id, paymentStatus: { in: ['PAID', 'SUCCESS'] } }
      });
      const eventPayment = await prisma.eventPayment.findFirst({ where: { eventId: event.id, status: 'SUCCESS' } }).catch(() => null);
      if (!registrationOrder && !eventPayment) {
        return res.status(402).json(errorResponse('Payment is pending for this event. Please complete payment before issuing winner certificates.', 402));
      }
    }

    // Get student details
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: {
        id: true,
        name: true,
        user: { select: { uniqueId: true } }
      }
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json(errorResponse('Some selected students were not found'));
    }

    // Check for existing winner certificates
    const existingCertificates = await prisma.certificate.findMany({
      where: {
        eventId: event.id,
        studentId: { in: studentIds },
        uniqueId: { contains: 'WINNER' }
      },
      select: { studentId: true }
    });

    if (existingCertificates.length > 0) {
      return res.status(400).json(errorResponse('Winner certificates already issued for some students'));
    }

    const eventDate = new Date(event.startDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Prepare winner certificate data
    const certificatesData = selectedStudentsWithPositions.map(({ studentId, position, positionText }) => {
      const student = students.find(s => s.id === studentId);
      if (!student) throw new Error(`Student ${studentId} not found`);
      
      return {
        participantName: student.name,
        sportName: event.sport,
        eventName: event.name,
        eventDate: eventDate,
        date: eventDate,
        studentId: student.id,
        studentUniqueId: student.user.uniqueId,
        eventId: event.id,
        eventUniqueId: event.uniqueId,
        orderId: registrationOrder?.id || null,
        position: parseInt(position),
        positionText: positionText || null
      };
    });

    console.log(`🏆 Generating ${certificatesData.length} winner certificate(s)...`);
    const { results, errors } = await certificateService.generateBulkWinnerCertificates(certificatesData);

    // Create notifications
    const regRows = await prisma.eventRegistration.findMany({
      where: { eventId: event.id, studentId: { in: studentIds } },
      select: { studentId: true, points: true, score: true }
    }).catch(() => []);
    const pointsByStudent = new Map(regRows.map(r => [r.studentId, r.points ?? r.score ?? null]));

    let notificationsCreated = 0;
    let emailsSent = 0;
    let emailFailures = 0;

    for (const certificate of results) {
      const studentData = certificatesData.find(c => c.studentId === certificate.studentId);
      const studentRow = await prisma.student.findUnique({
        where: { id: certificate.studentId },
        select: { name: true, user: { select: { id: true, email: true } } }
      });

      try {
        if (studentRow?.user?.id) {
      await prisma.notification.create({
        data: {
              userId: studentRow.user.id,
          type: 'GENERAL',
          title: '🏆 Winner Certificate Issued!',
          message: `Congratulations! Your winner certificate (${studentData.positionText || `Position ${studentData.position}`}) for ${event.name} has been issued.`,
          data: JSON.stringify({ 
            certificateId: certificate.id,
            certificateUrl: certificate.certificateUrl 
          })
        }
      });
          notificationsCreated += 1;
        }
      } catch (nErr) {
        console.warn('⚠️ Winner notification create failed:', nErr?.message || nErr);
      }

      // Best-effort email (do not fail issuance)
      try {
        const to = studentRow?.user?.email;
        if (to) {
          await sendWinnerCertificateIssuedEmail({
            to,
            athleteName: studentRow?.name,
            eventName: event.name,
            sportName: event.sport,
            positionText: studentData?.positionText || `Position ${studentData?.position}`,
            points: pointsByStudent.get(certificate.studentId) ?? null,
            certificateUrl: certificate.certificateUrl
          });
          emailsSent += 1;
        }
      } catch (mailErr) {
        console.warn('⚠️ Winner certificate email failed:', mailErr?.message || mailErr);
        emailFailures += 1;
      }
    }

    console.log(`✅ Successfully issued ${results.length} winner certificate(s)`);

    res.json(successResponse({
      issued: results.length,
      failed: errors.length,
      notificationsCreated,
      emailsSent,
      emailFailures,
      certificates: results,
      errors
    }, `Successfully issued ${results.length} winner certificate(s)`));

  } catch (error) {
    console.error('❌ Error issuing winner certificates:', error);
    res.status(500).json(errorResponse('Failed to issue winner certificates. Please try again.', 500));
  }
});

/**
 * @route   GET /api/certificates/event/:eventId/payment-status
 * @desc    Check payment status for event certificate issuance
 * @access  Private (Admin or authorized Event Incharge)
 */
router.get('/event/:eventId/payment-status', authenticate, requireAdminOrCertificateManager, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    let event;
    try {
      event = await eventService.resolveEventId(eventId);
    } catch (error) {
      return res.status(404).json(errorResponse('Event not found'));
    }

    const registrationOrder = await prisma.eventRegistrationOrder.findFirst({
      where: { eventId: event.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(successResponse({
      paymentStatus: registrationOrder?.paymentStatus || 'PENDING',
      paymentCompleted: registrationOrder?.paymentStatus === 'SUCCESS',
      orderId: registrationOrder?.id,
      totalAmount: registrationOrder?.totalFeeAmount,
      paymentDate: registrationOrder?.paymentDate
    }, 'Payment status retrieved successfully'));

  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    res.status(500).json(errorResponse('Failed to check payment status', 500));
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
 * @desc    Get all issued certificates for an event (Admin or authorized Event Incharge)
 * @access  Private
 * @note    Returns all certificates for the event regardless of order
 */
router.get('/event/:eventId/issued', authenticate, requireAdminOrCertificateManager, async (req, res) => {
  try {
    const { eventId } = req.params;

    console.log(`📜 Fetching issued certificates for event: ${eventId}`);
    console.log(`   Request URL: ${req.originalUrl}`);
    console.log(`   Admin ID: ${req.admin?.id || 'N/A'}`);

    // Use EventService resolver to handle both database ID and uniqueId
    let event;
    try {
      console.log(`🔍 Step 1: Resolving event ID...`);
      event = await eventService.resolveEventId(eventId);
      console.log(`✅ Event resolved: ID=${event.id}, uniqueId=${event.uniqueId}`);
    } catch (error) {
      console.error(`❌ Event resolution failed for ID: ${eventId}`);
      console.error(`   Error: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
      return res.status(404).json(errorResponse('Event not found'));
    }

    // Re-fetch with coach relation
    console.log(`🔍 Step 2: Fetching event with coach details...`);
    event = await prisma.event.findUnique({
      where: { id: event.id },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            user: {
              select: { uniqueId: true }
            }
          }
        }
      }
    });

    console.log(`🔍 Event lookup result:`, event ? { id: event.id, name: event.name, uniqueId: event.uniqueId } : 'null');

    if (!event) {
      console.error(`❌ Event not found after re-fetch for ID: ${eventId}`);
      return res.status(404).json(errorResponse('Event not found'));
    }

    // Get all certificates for this event - check both database ID and uniqueId
    // Some old certificates might have uniqueId stored, newer ones have database ID
    console.log(`🔍 Step 3: Building certificate query conditions...`);
    const whereConditions = [
      { eventId: event.id },
      { eventId: eventId } // Also check if eventId param was stored directly
    ];
    
    // Only add uniqueId condition if it exists
    if (event.uniqueId) {
      whereConditions.push({ eventId: event.uniqueId });
    }
    
    console.log(`   Query conditions:`, JSON.stringify(whereConditions, null, 2));
    
    console.log(`🔍 Step 4: Querying certificates...`);
    const certificatesRaw = await prisma.certificate.findMany({
      where: {
        OR: whereConditions
      },
      orderBy: { issueDate: 'desc' }
    });

    console.log(`📋 Found ${certificatesRaw.length} raw certificates for event ${event.name}`);
    if (certificatesRaw.length > 0) {
      console.log(`   First certificate: ID=${certificatesRaw[0].id}, studentId=${certificatesRaw[0].studentId}, eventId=${certificatesRaw[0].eventId}`);
    }

    // Fetch student details for each certificate
    console.log(`🔍 Step 5: Enriching certificates with student data...`);
    const certificates = await Promise.all(certificatesRaw.map(async (cert, index) => {
      try {
        console.log(`   Processing certificate ${index + 1}/${certificatesRaw.length}: studentId=${cert.studentId}`);
        
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
          console.log(`      Student not found by ID, trying uniqueId lookup...`);
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
 * @desc    Get eligible students for certificate issuance for an event (Admin or authorized Event Incharge)
 * @access  Private
 * @note    Order verification commented out - Admin can issue certificates without order completion
 */
router.get('/event/:eventId/eligible-students', authenticate, requireAdminOrCertificateManager, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { orderId } = req.query;

    console.log(`📋 Fetching eligible students for event: ${eventId}${orderId ? `, order: ${orderId}` : ''}`);

    // Use EventService resolver to handle both database ID and uniqueId
    let event;
    try {
      event = await eventService.resolveEventId(eventId);
    } catch (error) {
      console.log(`❌ Event not found for ID: ${eventId}`);
      return res.status(404).json(errorResponse('Event not found'));
    }
    
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
    // For admin-created student-fee events, only APPROVED registrations are eligible (payment verified).
    const requiresStudentFee = !!(event.createdByAdmin && event.studentFeeEnabled && (event.studentFeeAmount || 0) > 0);
    const eligibleStatuses = requiresStudentFee ? ['APPROVED'] : ['REGISTERED', 'APPROVED'];
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId: event.id,
        status: { in: eligibleStatuses }
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
    const whereConditions = [
      { eventId: event.id },
      { eventId: eventId } // Also check if eventId param was stored directly
    ];
    
    // Only add uniqueId condition if it exists
    if (event.uniqueId) {
      whereConditions.push({ eventId: event.uniqueId });
    }
    
    const issuedCertificates = await prisma.certificate.findMany({
      where: {
        OR: whereConditions
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
      // First check if it's a User uniqueId, then get the student
      const user = await prisma.user.findUnique({
        where: { uniqueId: cert.studentId },
        select: {
          studentProfile: {
            select: { id: true }
          }
        }
      });
      
      if (user?.studentProfile) {
        issuedStudentIds.add(user.studentProfile.id);
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
    }, 'No eligible students found'));

  } catch (error) {
    console.error('❌ Error fetching eligible students:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
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
      where: { uniqueId: uid }
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
