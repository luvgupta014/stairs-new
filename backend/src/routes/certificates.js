const express = require('express');
const router = express.Router();
const { authenticate, requireCoach } = require('../utils/authMiddleware');
const certificateService = require('../services/certificateService');
const EventService = require('../services/eventService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const eventService = new EventService();

// Helper functions
const successResponse = (data, message = 'Success') => ({ success: true, message, data });
const errorResponse = (message, statusCode = 400) => ({ success: false, message, statusCode });

// Utility to fetch event and students
async function fetchEventAndStudents(eventId, selectedStudents) {
  const event = await eventService.resolveEventId(eventId);
  if (!event) throw new Error('Event not found or you do not have permission');

  const students = await prisma.student.findMany({
    where: { id: { in: selectedStudents } },
    select: {
      id: true,
      name: true,
      user: { select: { uniqueId: true } }
    }
  });

  if (students.length !== selectedStudents.length) {
    throw new Error('Some selected students were not found');
  }

  return { event, students };
}

// Generic function to prepare certificate data
function prepareCertificatesData(event, students, orderId = null) {
  const eventDate = new Date(event.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return students.map(student => ({
    participantName: student.name,
    sportName: event.sport,
    eventName: event.name,
    eventDate: eventDate,
    date: eventDate,
    studentId: student.id,
    studentUniqueId: student.user.uniqueId,
    eventId: event.id,
    eventUniqueId: event.uniqueId,
    orderId: orderId
  }));
}

// POST /api/certificates/issue - Participation Certificates (ORIGINAL - WORKING)
router.post('/issue', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId, selectedStudents } = req.body;
    if (!eventId || !selectedStudents || selectedStudents.length === 0) {
      return res.status(400).json(errorResponse('Missing required fields: eventId or selectedStudents'));
    }

    const { event, students } = await fetchEventAndStudents(eventId, selectedStudents);

    // Check for existing certificates
    const existingCertificates = await prisma.certificate.findMany({
      where: { eventId: event.id, studentId: { in: selectedStudents } },
      select: { studentId: true }
    });

    if (existingCertificates.length > 0) {
      return res.status(400).json(errorResponse(`Certificates already issued for ${existingCertificates.length} student(s)`));
    }

    const certificatesData = prepareCertificatesData(event, students);

    const { results, errors } = await certificateService.generateBulkCertificates(certificatesData);

    // Create notifications
    for (const certificate of results) {
      const student = await prisma.student.findUnique({ where: { id: certificate.studentId }, select: { userId: true } });
      if (student) {
        await prisma.notification.create({
          data: {
            userId: student.userId,
            type: 'GENERAL',
            title: '🎓 Certificate Issued!',
            message: `Your certificate for ${event.name} has been issued. You can download it from your dashboard.`,
            data: JSON.stringify({ certificateId: certificate.id, certificateUrl: certificate.certificateUrl })
          }
        });
      }
    }

    res.json(successResponse({ issued: results.length, failed: errors.length, certificates: results, errors }, `Successfully issued ${results.length} participation certificate(s)`));
  } catch (error) {
    console.error('❌ Error issuing participation certificates:', error);
    res.status(500).json(errorResponse(error.message || 'Failed to issue certificates'));
  }
});

// POST /api/certificates/issue/winning - Winning Certificates (NEW FEATURE)
router.post('/issue/winning', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId, selectedStudents, positions } = req.body;
    if (!eventId || !selectedStudents || selectedStudents.length === 0) {
      return res.status(400).json(errorResponse('Missing required fields: eventId or selectedStudents'));
    }

    if (!positions || Object.keys(positions).length !== selectedStudents.length) {
      return res.status(400).json(errorResponse('Positions/awards must be assigned to all selected students'));
    }

    const { event, students } = await fetchEventAndStudents(eventId, selectedStudents);

    // Check for already issued certificates
    const existingCertificates = await prisma.certificate.findMany({
      where: { eventId: event.id, studentId: { in: selectedStudents } },
      select: { studentId: true }
    });
    if (existingCertificates.length > 0) {
      return res.status(400).json(errorResponse(`Certificates already issued for ${existingCertificates.length} student(s)`));
    }

    // Add certificateType and positions to certificates data
    const certificatesData = prepareCertificatesData(event, students).map(cert => ({
      ...cert,
      certificateType: 'winning',
      position: positions[cert.studentId]
    }));

    const { results, errors } = await certificateService.generateBulkCertificates(certificatesData);

    // Create notifications
    for (const certificate of results) {
      const student = await prisma.student.findUnique({ where: { id: certificate.studentId }, select: { userId: true } });
      if (student) {
        await prisma.notification.create({
          data: {
            userId: student.userId,
            type: 'GENERAL',
            title: '🏆 Winning Certificate Issued!',
            message: `Your winning certificate for ${event.name} has been issued. You can download it from your dashboard.`,
            data: JSON.stringify({ certificateId: certificate.id, certificateUrl: certificate.certificateUrl })
          }
        });
      }
    }

    res.json(successResponse({ issued: results.length, failed: errors.length, certificates: results, errors }, `Successfully issued ${results.length} winning certificate(s)`));
  } catch (error) {
    console.error('❌ Error issuing winning certificates:', error);
    res.status(500).json(errorResponse(error.message || 'Failed to issue certificates'));
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

    console.log(`📜 Fetching issued certificates for event: ${eventId}`);

    // Use EventService resolver to handle both database ID and uniqueId
    let event;
    try {
      event = await eventService.resolveEventId(eventId);
    } catch (error) {
      console.error(`❌ Event resolution failed for ID: ${eventId}`);
      return res.status(404).json(errorResponse('Event not found'));
    }

    // Re-fetch with coach relation
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

    if (!event) {
      return res.status(404).json(errorResponse('Event not found'));
    }

    // Get all certificates for this event
    const whereConditions = [
      { eventId: event.id },
      { eventId: eventId }
    ];
    
    if (event.uniqueId) {
      whereConditions.push({ eventId: event.uniqueId });
    }
    
    const certificatesRaw = await prisma.certificate.findMany({
      where: {
        OR: whereConditions
      },
      orderBy: { issueDate: 'desc' }
    });

    console.log(`📋 Found ${certificatesRaw.length} certificates for event ${event.name}`);

    // Fetch student details for each certificate
    const certificates = await Promise.all(certificatesRaw.map(async (cert) => {
      try {
        let student = await prisma.student.findUnique({
          where: { id: cert.studentId },
          select: {
            name: true,
            user: { select: { uniqueId: true, email: true } }
          }
        });

        if (!student) {
          const user = await prisma.user.findUnique({
            where: { uniqueId: cert.studentId },
            include: {
              studentProfile: {
                select: { name: true }
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

/**
 * @route   GET /api/certificates/event/:eventId/eligible-students
 * @desc    Get eligible students for certificate issuance for an event (Coach only)
 * @access  Private (Coach)
 */
router.get('/event/:eventId/eligible-students', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId } = req.params;

    console.log(`📋 Fetching eligible students for event: ${eventId}`);

    let event;
    try {
      event = await eventService.resolveEventId(eventId);
    } catch (error) {
      return res.status(404).json(errorResponse('Event not found'));
    }
    
    if (!event) {
      return res.status(404).json(errorResponse('Event not found'));
    }

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

    // Get already issued certificates for this event
    const whereConditions = [
      { eventId: event.id },
      { eventId: eventId }
    ];
    
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

    // Build a set of issued student IDs
    const issuedStudentIds = new Set();
    
    for (const cert of issuedCertificates) {
      issuedStudentIds.add(cert.studentId);
      
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

    // Filter out students who already have certificates
    const eligibleStudents = registrations
      .filter(reg => !issuedStudentIds.has(reg.student.id))
      .map(reg => ({
        id: reg.student.id,
        name: reg.student.name,
        uniqueId: reg.student.user.uniqueId,
        studentId: reg.student.user.uniqueId,
        email: reg.student.user.email,
        sport: reg.student.sport,
        registrationStatus: reg.status
      }));

    res.json(successResponse({
      eligibleStudents,
      totalEligible: eligibleStudents.length,
      totalRegistered: registrations.length,
      certificatesIssued: issuedCertificates.length,
      certificatesRemaining: eligibleStudents.length,
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
      where: { uniqueId: uid }
    });

    if (!certificate) {
      return res.status(404).json(errorResponse('Certificate not found'));
    }

    const htmlPath = certificate.certificateUrl.replace('.pdf', '.html');
    const fs = require('fs');
    const path = require('path');
    const fullPath = path.join(__dirname, '../..', htmlPath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json(errorResponse('HTML version not available'));
    }

    res.sendFile(fullPath);

  } catch (error) {
    console.error('❌ Error serving HTML certificate:', error);
    res.status(500).json(errorResponse('Failed to serve HTML certificate', 500));
  }
});

module.exports = router;