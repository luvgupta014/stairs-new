const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { createOrderInvoice, createEventPaymentInvoice } = require('../services/invoiceService');
const { authenticate, requireCoach, requireApproved } = require('../utils/authMiddleware');
const {
  successResponse,
  errorResponse,
  getPaginationParams,
  getPaginationMeta
} = require('../utils/helpers');
const { generateUID } = require('../utils/uidGenerator');
const { generateEventUID } = require('../utils/uidGenerator');
const EventService = require('../services/eventService');

const router = express.Router();
const prisma = new PrismaClient();
const eventService = new EventService();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Get coach profile
router.get('/profile', authenticate, requireCoach, async (req, res) => {
  try {
    const coach = await prisma.coach.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            isActive: true,
            isVerified: true,
            createdAt: true,
            uniqueId: true
          }
        },
        studentConnections: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                sport: true,
                level: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        events: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        },
        eventOrders: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    });

    if (!coach) {
      return res.status(404).json(errorResponse('Coach profile not found.', 404));
    }

    res.json(successResponse(coach, 'Coach profile retrieved successfully.'));

  } catch (error) {
    console.error('Get coach profile error:', error);
    res.status(500).json(errorResponse('Failed to retrieve profile.', 500));
  }
});

// Update coach profile
router.put('/profile', authenticate, requireCoach, async (req, res) => {
  try {
    const {
      name,
      phone,
      specialization,
      experience,
      certifications,
      bio,
      location,
      city,
      state,
      pincode
    } = req.body;

    console.log('Updating coach profile:', { name, phone, specialization, experience, certifications, bio, location, city, state, pincode });

    // Update user phone if provided
    if (phone) {
      try {
        await prisma.user.update({
          where: { id: req.user.id },
          data: { phone }
        });
      } catch (phoneError) {
        console.error('Error updating phone:', phoneError);
        return res.status(500).json(errorResponse('Failed to update phone number.', 500));
      }
    }

    // Prepare update data, only include fields that are provided
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (experience !== undefined) updateData.experience = experience ? parseInt(experience) : null;
    if (certifications !== undefined) updateData.certifications = certifications || null;
    if (bio !== undefined) updateData.bio = bio || null;
    if (location !== undefined) updateData.location = location || null;
    if (city !== undefined) updateData.city = city || null;
    if (state !== undefined) updateData.state = state || null;
    if (pincode !== undefined) updateData.pincode = pincode || null;

    console.log('Update data:', updateData);
    console.log('User ID:', req.user.id);

    const updatedCoach = await prisma.coach.update({
      where: { userId: req.user.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            isActive: true
          }
        }
      }
    });

    res.json(successResponse(updatedCoach, 'Profile updated successfully.'));

  } catch (error) {
    console.error('Update coach profile error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json(errorResponse(error.message || 'Failed to update profile.', 500));
  }
});

// Get connection requests
router.get('/connection-requests', authenticate, requireCoach, async (req, res) => {
  try {
    const { status = 'PENDING', page = 1, limit = 10 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      coachId: req.coach.id,
      status: status.toUpperCase()
    };

    const [connections, total] = await Promise.all([
      prisma.studentCoachConnection.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              sport: true,
              level: true,
              bio: true,
              user: {
                select: {
                  email: true,
                  phone: true
                }
              }
            }
          }
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.studentCoachConnection.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      connections,
      pagination
    }, 'Connection requests retrieved successfully.'));

  } catch (error) {
    console.error('Get connection requests error:', error);
    res.status(500).json(errorResponse('Failed to retrieve connection requests.', 500));
  }
});

// Respond to connection request
router.put('/connection-requests/:connectionId', authenticate, requireCoach, requireApproved, async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { action, message } = req.body; // action: 'ACCEPT' or 'REJECT'

    if (!['ACCEPT', 'REJECT'].includes(action)) {
      return res.status(400).json(errorResponse('Action must be ACCEPT or REJECT.', 400));
    }

    const connection = await prisma.studentCoachConnection.findUnique({
      where: { id: connectionId },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!connection) {
      return res.status(404).json(errorResponse('Connection request not found.', 404));
    }

    if (connection.coachId !== req.coach.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    if (connection.status !== 'PENDING') {
      return res.status(400).json(errorResponse('Connection request is not pending.', 400));
    }

    const updatedConnection = await prisma.studentCoachConnection.update({
      where: { id: connectionId },
      data: {
        status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED',
        responseMessage: message,
        respondedAt: new Date()
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            user: {
              select: {
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    // TODO: Send notification to student

    res.json(successResponse(updatedConnection, `Connection request ${action.toLowerCase()}ed successfully.`));

  } catch (error) {
    console.error('Respond to connection request error:', error);
    res.status(500).json(errorResponse('Failed to respond to connection request.', 500));
  }
});

// Get connected students
router.get('/students', authenticate, requireCoach, requireApproved, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      coachId: req.coach.id,
      status: 'ACCEPTED',
      ...(search && {
        student: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { sport: { contains: search, mode: 'insensitive' } }
          ]
        }
      })
    };

    const [connections, total] = await Promise.all([
      prisma.studentCoachConnection.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              sport: true,
              level: true,
              bio: true,
              achievements: true,
              user: {
                select: {
                  email: true,
                  phone: true
                }
              }
            }
          }
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.studentCoachConnection.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      students: connections.map(conn => ({
        connectionId: conn.id,
        connectedAt: conn.createdAt,
        ...conn.student
      })),
      pagination
    }, 'Connected students retrieved successfully.'));

  } catch (error) {
    console.error('Get connected students error:', error);
    res.status(500).json(errorResponse('Failed to retrieve connected students.', 500));
  }
});

// Add student manually (Coach-initiated)
router.post('/students/add', authenticate, requireCoach, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      sport,
      sport2,
      sport3,
      level,
      dateOfBirth,
      fatherName,
      aadhaar,
      gender,
      address,
      city,
      state,
      district,
      pincode,
      school,
      club,
      coachName,
      coachMobile,
      achievements
    } = req.body;

    console.log('📝 Adding single student manually:', { name, email, phone, sport });

    // Check if coach has completed payment or has active subscription
    const coach = await prisma.coach.findUnique({
      where: { userId: req.user.id }
    });

    if (!coach || (coach.paymentStatus === 'PENDING' && !coach.isActive)) {
      return res.status(403).json(errorResponse('Please complete payment to add students. If you chose "Pay Later", please complete the payment to access this feature.', 403));
    }

    // Validate required fields
    if (!name || !email || !phone || !sport) {
      return res.status(400).json(errorResponse('Name, email, phone, and sport are required.', 400));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json(errorResponse('Invalid email format.', 400));
    }

    // Check if user already exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone }
        ]
      }
    });

    // Check if Aadhaar already exists (if provided)
    let aadhaarExists = false;
    if (aadhaar) {
      const existingAadhaar = await prisma.student.findFirst({
        where: { aadhaar: aadhaar }
      });
      if (existingAadhaar) {
        return res.status(400).json(errorResponse('This Aadhaar number is already registered.', 400));
      }
    }

    let student;
    let tempPassword = null;
    let isNewUser = false;

    if (user) {
      console.log('Existing user found:', user.id, user.role);
      if (user.role === 'STUDENT') {
        student = await prisma.student.findUnique({
          where: { userId: user.id }
        });
        
        if (student) {
          // Check if student is already connected to this coach
          const existingConnection = await prisma.studentCoachConnection.findUnique({
            where: {
              studentId_coachId: {
                studentId: student.id,
                coachId: req.coach.id
              }
            }
          });

          if (existingConnection) {
            return res.status(400).json(errorResponse('This student is already connected to you.', 400));
          }
        }
      } else {
        return res.status(400).json(errorResponse(`User exists with role: ${user.role}, cannot create student profile.`, 400));
      }
    }

    if (!student) {
      console.log('Creating new user and student profile...');
      isNewUser = true;

      // Generate temporary password
      tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = await require('../utils/helpers').hashPassword(tempPassword);

      // Parse date of birth if provided
      let parsedDateOfBirth = null;
      if (dateOfBirth) {
        try {
          parsedDateOfBirth = new Date(dateOfBirth);
          if (isNaN(parsedDateOfBirth.getTime())) {
            console.log('WARNING: Invalid date format for dateOfBirth:', dateOfBirth);
            parsedDateOfBirth = null;
          }
        } catch (error) {
          console.log('WARNING: Error parsing dateOfBirth:', error.message);
          parsedDateOfBirth = null;
        }
      }

      // Generate UID with format: A0001DL1124 (Type + Serial + State + MMYY)
      const uniqueId = await generateUID('STUDENT', state || 'Delhi');
      console.log('Generated UID for student:', uniqueId);

      // Create user with student profile
      user = await prisma.user.create({
        data: {
          uniqueId,
          email,
          phone,
          password: hashedPassword,
          role: 'STUDENT',
          isActive: true,
          isVerified: true,
          studentProfile: {
            create: {
              name,
              fatherName: fatherName || null,
              aadhaar: aadhaar || null,
              gender: gender || null,
              dateOfBirth: parsedDateOfBirth,
              state: state || null,
              district: district || null,
              address: address || null,
              pincode: pincode || null,
              sport: sport,
              sport2: sport2 || null,
              sport3: sport3 || null,
              level: level || 'BEGINNER',
              school: school || null,
              club: club || null,
              coachName: coachName || null,
              coachMobile: coachMobile || null,
              achievements: achievements ? JSON.stringify([achievements]) : null,
              profileCompletion: calculateProfileCompletion({
                name, email, phone, sport, fatherName,
                dateOfBirth: parsedDateOfBirth, address, city, state
              })
            }
          }
        },
        include: {
          studentProfile: true
        }
      });

      student = user.studentProfile;
      console.log('Created new user and student:', {
        userId: user.id,
        studentId: student.id,
        profileCompletion: student.profileCompletion
      });
    }

    // Create connection between coach and student
    const connection = await prisma.studentCoachConnection.create({
      data: {
        studentId: student.id,
        coachId: req.coach.id,
        status: 'ACCEPTED',
        initiatedBy: 'COACH'
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                email: true,
                phone: true,
                uniqueId: true
              }
            }
          }
        }
      }
    });

    const responseData = {
      connection,
      isNewUser,
      studentDetails: {
        id: student.id,
        name: student.name,
        email: user.email,
        phone: user.phone,
        uniqueId: user.uniqueId,
        sport: student.sport,
        level: student.level,
        profileCompletion: student.profileCompletion
      }
    };

    if (isNewUser && tempPassword) {
      responseData.tempPassword = tempPassword;
      responseData.message = `Student added successfully. Temporary password: ${tempPassword}. Please share these credentials with the student.`;
    }

    console.log('✅ Student added successfully:', student.name);

    res.status(201).json(successResponse(
      responseData,
      isNewUser 
        ? 'Student added and connected successfully. Temporary credentials have been generated.' 
        : 'Student connected successfully.',
      201
    ));

  } catch (error) {
    console.error('❌ Add student error:', error);
    
    // Handle unique constraint errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'unknown field';
      return res.status(400).json(errorResponse(`Duplicate ${field} - this ${field} is already in use.`, 400));
    }
    
    res.status(500).json(errorResponse(error.message || 'Failed to add student.', 500));
  }
});

// Test CSV parsing endpoint
router.post('/students/test-csv', authenticate, requireCoach, async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json(errorResponse('Please upload a file.', 400));
    }

    const file = req.files.file;
    console.log('Test file details:', {
      name: file.name,
      size: file.size,
      mimetype: file.mimetype
    });

    // Show raw file content
    const rawContent = file.data.toString();
    console.log('Raw file content (first 1000 chars):', rawContent.substring(0, 1000));

    if (file.mimetype.includes('csv')) {
      const csv = require('csv-parser');
      const Readable = require('stream').Readable;
      const testData = [];

      return new Promise((resolve) => {
        const stream = Readable.from(file.data);
        stream
          .pipe(csv())
          .on('headers', (headers) => {
            console.log('Detected headers:', headers);
          })
          .on('data', (data) => {
            console.log('Row data:', data);
            testData.push(data);
          })
          .on('end', () => {
            resolve(res.json(successResponse({
              rawContent: rawContent.substring(0, 500),
              parsedData: testData,
              totalRows: testData.length
            }, 'CSV test completed.')));
          })
          .on('error', (error) => {
            console.error('CSV test error:', error);
            resolve(res.status(500).json(errorResponse('CSV test failed.', 500)));
          });
      });
    }

    res.json(successResponse({ rawContent: rawContent.substring(0, 500) }, 'File test completed.'));

  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json(errorResponse('Test failed.', 500));
  }
});

// Bulk upload students
router.post('/students/bulk-upload', authenticate, requireCoach, async (req, res) => {
  const fs = require('fs');
  const csv = require('csv-parser');
  const XLSX = require('xlsx');

  let tempFilePath = null;

  try {
    // Extend timeout for bulk uploads (5 minutes)
    req.setTimeout(300000);
    res.setTimeout(300000);
    
    // Send headers immediately to keep connection alive
    res.setHeader('Connection', 'keep-alive');
    
    console.log('=== Starting bulk upload process ===');
    console.log('Coach ID:', req.coach.id);
    console.log('Coach Name:', req.coach.name);
    console.log('Request headers:', req.headers);
    console.log('Request files:', req.files);
    console.log('Request body:', req.body);

    // Validate file upload
    if (!req.files || !req.files.file) {
      console.log('ERROR: No file uploaded');
      console.log('req.files:', req.files);
      console.log('req.body:', req.body);
      return res.status(400).json(errorResponse('Please upload a file. Make sure the form field name is "file".', 400));
    }

    const file = req.files.file;
    tempFilePath = file.tempFilePath; // Store for cleanup

    console.log('File details:', {
      name: file.name,
      size: file.size,
      mimetype: file.mimetype,
      tempFilePath: file.tempFilePath
    });

    // Validate file size
    if (file.size > 50 * 1024 * 1024) {
      console.log('ERROR: File too large:', file.size);
      return res.status(400).json(errorResponse('File size exceeds 50MB limit.', 400));
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
      'text/csv',
      'application/csv'
    ];

    if (!allowedTypes.includes(file.mimetype) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      console.log('ERROR: Invalid file type:', file.mimetype);
      return res.status(400).json(errorResponse('Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file.', 400));
    }

    const results = [];
    const errors = [];
    let studentData = [];

    // Determine file type and parse accordingly
    const isCsv = file.mimetype.includes('csv') || file.name.endsWith('.csv');

    if (isCsv) {
      // Process CSV file
      console.log('Processing CSV file from temp path...');

      studentData = await new Promise((resolve, reject) => {
        const rows = [];
        let rowCount = 0;
        let headers = [];

        fs.createReadStream(file.tempFilePath, { encoding: 'utf8' })
          .pipe(csv({
            skipEmptyLines: true,
            mapHeaders: ({ header }) => header.trim(), // Trim whitespace from headers
          }))
          .on('headers', (detectedHeaders) => {
            headers = detectedHeaders;
            console.log('CSV headers detected:', headers);
          })
          .on('data', (data) => {
            rowCount++;
            
            // Check if row has any non-empty values
            const hasData = Object.values(data).some(value => 
              value && value.toString().trim() !== ''
            );

            if (hasData) {
              rows.push(data);
              console.log(`Row ${rowCount}: Valid data found`);
            } else {
              console.log(`Row ${rowCount}: Skipping empty row`);
            }
          })
          .on('end', () => {
            console.log(`CSV parsing complete. Total rows: ${rowCount}, Valid rows: ${rows.length}`);
            
            if (rows.length === 0) {
              console.log('WARNING: No valid data rows found in CSV file');
              console.log('Headers found:', headers);
            }
            
            resolve(rows);
          })
          .on('error', (error) => {
            console.error('CSV parsing error:', error);
            reject(error);
          });
      });

    } else {
      // Process Excel file
      console.log('Processing Excel file from temp path...');
      
      const workbook = XLSX.readFile(file.tempFilePath);
      const sheetName = workbook.SheetNames[0];
      
      console.log('Excel sheet name:', sheetName);
      console.log('Total sheets:', workbook.SheetNames.length);
      
      const worksheet = workbook.Sheets[sheetName];
      studentData = XLSX.utils.sheet_to_json(worksheet, {
        defval: '', // Default value for empty cells
        raw: false, // Get formatted strings instead of raw values
      });
      
      console.log(`Excel parsing complete. Total rows: ${studentData.length}`);
      
      // Filter out completely empty rows
      studentData = studentData.filter(row => {
        const hasData = Object.values(row).some(value => 
          value && value.toString().trim() !== ''
        );
        return hasData;
      });
      
      console.log(`After filtering empty rows: ${studentData.length} valid rows`);
    }

    // Check if we have data to process
    if (studentData.length === 0) {
      console.log('ERROR: No valid data found in file');
      return res.status(400).json(errorResponse(
        'No valid data found in the uploaded file. Please ensure the file contains data rows with at least one column filled.',
        400
      ));
    }

    // Log first row as sample
    console.log('Sample data (first row):', studentData[0]);
    console.log('Available columns:', Object.keys(studentData[0]));

    // Process the student data
    await processBulkStudents(studentData, req.coach.id, results, errors);
    
    console.log('=== Bulk upload process completed ===');
    console.log(`Successfully processed: ${results.length} students`);
    console.log(`Errors encountered: ${errors.length}`);

    res.json(successResponse(
      { results, errors, total: studentData.length, successful: results.length, failed: errors.length },
      'Bulk upload completed.'
    ));

  } catch (error) {
    console.error('Bulk upload error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json(errorResponse(
      `Bulk upload failed: ${error.message}`,
      500
    ));
  } finally {
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('Temp file cleaned up:', tempFilePath);
      } catch (cleanupError) {
        console.error('Failed to clean up temp file:', cleanupError);
      }
    }
  }
});

// Helper function for processing bulk students
async function processBulkStudents(studentData, coachId, results, errors) {
  console.log(`--- Processing ${studentData.length} student records ---`);

  for (let i = 0; i < studentData.length; i++) {
    const row = studentData[i];
    console.log(`\n--- Processing row ${i + 1} ---`);
    console.log('Raw row data:', row);

    try {
      console.log('Available row keys:', Object.keys(row));
      console.log('Row values:', Object.values(row));

      // Extract and normalize field names (handle different case variations)
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        const normalizedKey = key.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
        normalizedRow[normalizedKey] = row[key] ? row[key].toString().trim() : '';
        console.log(`Normalized "${key}" -> "${normalizedKey}" = "${normalizedRow[normalizedKey]}"`);
      });

      console.log('Normalized row:', normalizedRow);

      // Map fields according to Prisma schema with multiple possible field name variations
      const name = normalizedRow['name'] || normalizedRow['student name'] || normalizedRow['full name'];
      const email = normalizedRow['email'] || normalizedRow['email address'] || normalizedRow['e mail'];
      const phone = normalizedRow['phone'] || normalizedRow['mobile'] || normalizedRow['phone number'] || normalizedRow['contact'];
      const sport = normalizedRow['sport'] || normalizedRow['game'] || normalizedRow['sports'];
      const level = normalizedRow['level'] || normalizedRow['skill level'] || normalizedRow['grade'];
      const dateOfBirth = normalizedRow['date of birth'] || normalizedRow['dob'] || normalizedRow['birth date'];
      const fatherName = normalizedRow['father name'] || normalizedRow['fathers name'] || normalizedRow['parent name'];
      const aadhaar = normalizedRow['aadhaar'] || normalizedRow['aadhar'] || normalizedRow['aadhaar number'];
      const gender = normalizedRow['gender'] || normalizedRow['sex'];
      const address = normalizedRow['address'] || normalizedRow['full address'];
      const city = normalizedRow['city'] || normalizedRow['town'];
      const state = normalizedRow['state'] || normalizedRow['province'];
      const district = normalizedRow['district'];
      const pincode = normalizedRow['pincode'] || normalizedRow['pin code'] || normalizedRow['postal code'] || normalizedRow['zip'];
      const sport2 = normalizedRow['sport 2'] || normalizedRow['sport2'] || normalizedRow['second sport'];
      const sport3 = normalizedRow['sport 3'] || normalizedRow['sport3'] || normalizedRow['third sport'];
      const school = normalizedRow['school'] || normalizedRow['institution'] || normalizedRow['college'];
      const club = normalizedRow['club'] || normalizedRow['sports club'];
      const coachName = normalizedRow['coach name'] || normalizedRow['coach'];
      const coachMobile = normalizedRow['coach mobile'] || normalizedRow['coach phone'] || normalizedRow['emergency contact'];
      const achievements = normalizedRow['achievements'] || normalizedRow['awards'];

      console.log('Extracted fields:', {
        name,
        email,
        phone,
        sport,
        level,
        dateOfBirth,
        fatherName,
        aadhaar,
        gender,
        address,
        city,
        state
      });

      // Validate required fields
      if (!name || !email || !phone || !sport) {
        const missingFields = [];
        if (!name) missingFields.push('name');
        if (!email) missingFields.push('email');
        if (!phone) missingFields.push('phone');
        if (!sport) missingFields.push('sport');

        console.log(`ERROR: Missing required fields: ${missingFields.join(', ')}`);
        errors.push({
          row: i + 1,
          name: name || 'Unknown',
          email: email || 'No email',
          error: `Missing required fields: ${missingFields.join(', ')}`
        });
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('ERROR: Invalid email format:', email);
        errors.push({
          row: i + 1,
          name,
          email,
          error: 'Invalid email format'
        });
        continue;
      }

      // Check if user already exists
      console.log('Checking for existing user...');
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email },
            { phone: phone }
          ]
        }
      });

      // Check if Aadhaar already exists (if provided)
      let aadhaarExists = false;
      if (aadhaar) {
        const existingAadhaar = await prisma.student.findFirst({
          where: { aadhaar: aadhaar }
        });
        if (existingAadhaar) {
          console.log('WARNING: Aadhaar number already exists, will be set to null for this student');
          aadhaarExists = true;
        }
      }

      let student;
      let tempPassword = null;
      let isNewUser = false;

      if (user) {
        console.log('Existing user found:', user.id, user.role);
        if (user.role === 'STUDENT') {
          student = await prisma.student.findUnique({
            where: { userId: user.id }
          });
          console.log('Existing student profile found:', student?.id);
        } else {
          console.log('ERROR: User exists but is not a student, role:', user.role);
          errors.push({
            row: i + 1,
            name,
            email,
            error: `User exists with role: ${user.role}, cannot create student profile`
          });
          continue;
        }
      }

      if (!student) {
        console.log('Creating new user and student profile...');
        isNewUser = true;

        // Generate temporary password
        tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        console.log('Generated temp password:', tempPassword);

        const hashedPassword = await require('../utils/helpers').hashPassword(tempPassword);

        // Parse date of birth if provided
        let parsedDateOfBirth = null;
        if (dateOfBirth) {
          try {
            parsedDateOfBirth = new Date(dateOfBirth);
            if (isNaN(parsedDateOfBirth.getTime())) {
              console.log('WARNING: Invalid date format for dateOfBirth:', dateOfBirth);
              parsedDateOfBirth = null;
            }
          } catch (error) {
            console.log('WARNING: Error parsing dateOfBirth:', error.message);
            parsedDateOfBirth = null;
          }
        }

        // Generate UID with format: A0001DL1124 (Type + Serial + State + MMYY)
        const uniqueId = await generateUID('STUDENT', state || 'Delhi');
        console.log('Generated UID for student:', uniqueId);

        // Create user with student profile according to Prisma schema
        try {
          user = await prisma.user.create({
            data: {
              uniqueId,
              email,
              phone,
              password: hashedPassword,
              role: 'STUDENT',
              isActive: true,
              isVerified: true,
              studentProfile: {
                create: {
                  name,
                  fatherName: fatherName || null,
                  aadhaar: (aadhaar && !aadhaarExists) ? aadhaar : null, // Only set if unique
                  gender: gender || null,
                  dateOfBirth: parsedDateOfBirth,
                  state: state || null,
                  district: district || null,
                  address: address || null,
                  pincode: pincode || null,
                  sport: sport,
                  sport2: sport2 || null,
                  sport3: sport3 || null,
                  level: level || 'BEGINNER',
                  school: school || null,
                  club: club || null,
                  coachName: coachName || null,
                  coachMobile: coachMobile || null,
                  achievements: achievements ? JSON.stringify([achievements]) : null,
                  profileCompletion: calculateProfileCompletion({
                    name, email, phone, sport, fatherName,
                    dateOfBirth: parsedDateOfBirth, address, city, state
                  })
                }
              }
            },
            include: {
              studentProfile: true
            }
          });

          student = user.studentProfile;
          console.log('Created new user and student:', {
            userId: user.id,
            studentId: student.id,
            profileCompletion: student.profileCompletion,
            aadhaarSkipped: aadhaarExists
          });
        } catch (createError) {
          // Handle unique constraint errors gracefully
          if (createError.code === 'P2002') {
            const field = createError.meta?.target?.[0] || 'unknown field';
            console.log(`ERROR: Duplicate ${field} detected for row ${i + 1}`);
            errors.push({
              row: i + 1,
              name,
              email,
              error: `Duplicate ${field} - this ${field} is already in use`
            });
            continue;
          }
          throw createError; // Re-throw if not a unique constraint error
        }
      }

      // Create connection between coach and student
      console.log('Creating coach-student connection...');
      const existingConnection = await prisma.studentCoachConnection.findUnique({
        where: {
          studentId_coachId: {
            studentId: student.id,
            coachId: coachId
          }
        }
      });

      if (!existingConnection) {
        await prisma.studentCoachConnection.create({
          data: {
            studentId: student.id,
            coachId: coachId,
            status: 'ACCEPTED',
            initiatedBy: 'COACH'
          }
        });
        console.log('Created new coach-student connection');
      } else {
        console.log('Connection already exists, skipping...');
      }

      // Add to results with temporary password if new user
      const resultEntry = {
        row: i + 1,
        name,
        email,
        phone,
        sport,
        status: 'success',
        isNewUser,
        studentId: student.id
      };

      if (isNewUser && tempPassword) {
        resultEntry.tempPassword = tempPassword;
      }

      results.push(resultEntry);
      console.log('Successfully processed row:', i + 1);

    } catch (error) {
      console.error(`ERROR processing row ${i + 1}:`, error);
      errors.push({
        row: i + 1,
        name: row.name || row.Name || 'Unknown',
        email: row.email || row.Email || 'No email',
        error: error.message
      });
    }
  }

  console.log(`\n=== Processing Summary ===`);
  console.log(`Total processed: ${studentData.length}`);
  console.log(`Successful: ${results.length}`);
  console.log(`Errors: ${errors.length}`);
}

// Helper function to calculate profile completion percentage
function calculateProfileCompletion(data) {
  const requiredFields = ['name', 'email', 'phone', 'sport'];
  const optionalFields = ['fatherName', 'dateOfBirth', 'address', 'city', 'state', 'district', 'pincode', 'gender', 'school', 'club', 'level'];

  let completedRequired = 0;
  let completedOptional = 0;

  requiredFields.forEach(field => {
    if (data[field] && data[field] !== null && data[field] !== '') completedRequired++;
  });

  optionalFields.forEach(field => {
    if (data[field] && data[field] !== null && data[field] !== '') completedOptional++;
  });

  // Required fields are 60% of total, optional are 40%
  const requiredPercentage = (completedRequired / requiredFields.length) * 60;
  const optionalPercentage = (completedOptional / optionalFields.length) * 40;

  return Math.min(Math.round(requiredPercentage + optionalPercentage), 100);
}

// Create event
router.post('/events', authenticate, requireCoach, async (req, res) => {
  try {
    const {
      name,
      description,
      sport,
      venue,
      address,
      city,
      state,
      latitude,
      longitude,
      startDate,
      endDate,
      maxParticipants
      // Removed eventFee parameter
    } = req.body;

    // Check if coach is active (payment completed)
    const coach = await prisma.coach.findUnique({
      where: { userId: req.user.id }
    });

    if (!coach || !coach.isActive) {
      return res.status(403).json(errorResponse('Your account is not active. Please complete payment to create events.', 403));
    }

    // Validation
    if (!name || !description || !sport || !venue || !startDate) {
      return res.status(400).json(errorResponse('Name, description, sport, venue, and start date are required.', 400));
    }

    // Parse dates for India (IST) only platform
    // Frontend sends: YYYY-MM-DDTHH:mm:ss (IST time, no timezone)
    // We append IST offset before parsing to preserve the time correctly in PostgreSQL
    let startDateObj, endDateObj;
    
    // Helper: Add IST timezone offset to date string
    const parseAsIST = (dateString) => {
      if (!dateString) return null;
      // If it already has timezone, use as-is
      if (dateString.includes('+') || dateString.includes('Z')) {
        return new Date(dateString);
      }
      // Append IST offset (+05:30) so JavaScript knows it's IST time
      return new Date(dateString + '+05:30');
    };
    
    if (startDate) {
      startDateObj = parseAsIST(startDate);
      console.log('📅 Start date for event creation:', {
        input: startDate,
        withIST: startDate + '+05:30',
        parsed: startDateObj,
        iso: startDateObj.toISOString()
      });
    }
    
    if (endDate) {
      endDateObj = parseAsIST(endDate);
      console.log('📅 End date for event creation:', {
        input: endDate,
        withIST: endDate + '+05:30',
        parsed: endDateObj,
        iso: endDateObj.toISOString()
      });
    }

    if (!startDateObj || startDateObj <= new Date()) {
      return res.status(400).json(errorResponse('Event start date must be in the future.', 400));
    }

    if (endDateObj && endDateObj <= startDateObj) {
      return res.status(400).json(errorResponse('Event end date must be after start date.', 400));
    }

    // Generate unique event ID (format: EVT-0001-FB-DL-071125)
    const eventUniqueId = await generateEventUID(sport, state || 'Delhi');

    const event = await prisma.event.create({
      data: {
        coachId: coach.id,
        name,
        description,
        sport,
        venue,
        address,
        city,
        state,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        startDate: startDateObj,
        endDate: endDateObj || null,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : 50,
        eventFee: 0, // Set to 0 since we're not collecting fees anymore
        status: 'PENDING',
        uniqueId: eventUniqueId
      }
    });

    res.status(201).json(successResponse({
      event,
      message: 'Event created successfully. It will be reviewed by admin before activation.'
      // Removed requiresPayment field
    }, 'Event created successfully.', 201));

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json(errorResponse('Failed to create event.', 500));
  }
});

// Remove the event payment processing endpoint entirely
// router.post('/events/:eventId/payment', ...) - DELETE THIS ENTIRE ROUTE

// Get coach events - FIXED
router.get('/events', authenticate, requireCoach, async (req, res) => {
  try {
    const { status, sport, search, page = 1, limit = 10 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    // Get coach ID
    const coach = await prisma.coach.findUnique({
      where: { userId: req.user.id }
    });

    if (!coach) {
      return res.status(404).json(errorResponse('Coach profile not found.', 404));
    }

    const where = {
      coachId: coach.id,
      ...(status && { status: status.toUpperCase() }),
      ...(sport && { sport: { contains: sport, mode: 'insensitive' } })
    };

    // Add search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          registrations: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              registrations: true
            }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.event.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    // Helper function to compute dynamic status
    const computeDynamicStatus = (event) => {
      const now = new Date();
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      
      console.log(`🔍 Computing status for event: ${event.name}`);
      console.log(`   Current time: ${now.toISOString()}`);
      console.log(`   Start time: ${start.toISOString()}`);
      console.log(`   End time: ${end.toISOString()}`);
      console.log(`   Database status: ${event.status}`);
      
      if (event.status !== 'APPROVED' && event.status !== 'ACTIVE') {
        console.log(`   → Keeping status: ${event.status} (not APPROVED/ACTIVE)`);
        return event.status;
      }
      
      if (now < start) {
        console.log(`   → Status: about to start`);
        return 'about to start';
      } else if (now >= start && now <= end) {
        console.log(`   → Status: ongoing`);
        return 'ongoing';
      } else if (now > end) {
        console.log(`   → Status: ended`);
        return 'ended';
      }
      console.log(`   → Keeping status: ${event.status}`);
      return event.status;
    };

    // Helper to format date as IST string (India-only platform)
    // Database stores dates in UTC, but we need to return IST for frontend
    const formatDateAsIST = (date) => {
      if (!date) return null;
      
      // Convert UTC date to IST by adding 5 hours 30 minutes
      const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
      
      // Format as YYYY-MM-DDTHH:mm:ss (IST time)
      const year = istDate.getUTCFullYear();
      const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(istDate.getUTCDate()).padStart(2, '0');
      const hours = String(istDate.getUTCHours()).padStart(2, '0');
      const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
      const seconds = String(istDate.getUTCSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    // Format events with registration count and dynamic status
    const formattedEvents = events.map(event => {
      const dynamicStatus = computeDynamicStatus(event);
      
      console.log(`📅 Formatting event "${event.name}" dates:`, {
        raw_startDate_UTC: event.startDate.toISOString(),
        formatted_startDate_IST: formatDateAsIST(event.startDate),
        raw_endDate_UTC: event.endDate ? event.endDate.toISOString() : null,
        formatted_endDate_IST: formatDateAsIST(event.endDate)
      });
      
      return {
        id: event.id,
        uniqueId: event.uniqueId, // Custom event UID (e.g., 01-FB-EVT-DL-112025)
        name: event.name,
        description: event.description,
        sport: event.sport,
        venue: event.venue,
        address: event.address,
        city: event.city,
        state: event.state,
        latitude: event.latitude,
        longitude: event.longitude,
        startDate: formatDateAsIST(event.startDate),
        endDate: formatDateAsIST(event.endDate),
        maxParticipants: event.maxParticipants,
        currentParticipants: event._count.registrations,
        eventFee: event.eventFee,
        status: event.status,
        dynamicStatus: dynamicStatus,
        adminNotes: event.adminNotes,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        registrations: event.registrations.map(reg => ({
          id: reg.id,
          studentId: reg.studentId,
          studentName: reg.student.name,
          registrationDate: reg.createdAt,
          status: reg.status
        }))
      };
    });

    console.log(`✅ Returning ${formattedEvents.length} events with dynamic status`);

    res.json(successResponse({
      events: formattedEvents,
      pagination
    }, 'Events retrieved successfully.'));

  } catch (error) {
    console.error('Get coach events error:', error);
    res.status(500).json(errorResponse('Failed to retrieve events.', 500));
  }
});

// Update event - ENHANCED
router.put('/events/:eventId', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      name,
      description,
      sport,
      venue,
      address,
      city,
      state,
      latitude,
      longitude,
      startDate,
      endDate,
      maxParticipants
    } = req.body;

    // Get coach
    const coach = await prisma.coach.findUnique({
      where: { userId: req.user.id }
    });

    if (!coach) {
      return res.status(404).json(errorResponse('Coach profile not found.', 404));
    }

    // Check if event exists and belongs to coach
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!existingEvent) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    if (existingEvent.coachId !== coach.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    // Check if event can be modified (only PENDING, APPROVED, ACTIVE events can be modified)
    if (!['PENDING', 'APPROVED', 'ACTIVE'].includes(existingEvent.status)) {
      return res.status(400).json(errorResponse('This event cannot be modified.', 400));
    }

    // Helper: Add IST timezone offset to date string
    // Frontend sends: "2025-11-08T10:00:00" (IST time, no timezone)
    // We append "+05:30" so JavaScript knows it's IST: "2025-11-08T10:00:00+05:30"
    const parseAsIST = (dateString) => {
      if (!dateString) return null;
      // If it already has timezone, use as-is
      if (dateString.includes('+') || dateString.includes('Z')) {
        return new Date(dateString);
      }
      // Append IST offset
      return new Date(dateString + '+05:30');
    };

    // Validate dates if provided (IST only platform)
    if (startDate) {
      const startDateObj = parseAsIST(startDate);
      console.log('📅 Updating start date:', {
        input: startDate,
        withIST: startDate + '+05:30',
        parsed: startDateObj,
        iso: startDateObj.toISOString()
      });
      if (startDateObj <= new Date()) {
        return res.status(400).json(errorResponse('Event start date must be in the future.', 400));
      }
    }

    if (endDate && startDate) {
      const startDateObj = parseAsIST(startDate);
      const endDateObj = parseAsIST(endDate);
      console.log('📅 Validating end date:', {
        endInput: endDate,
        endWithIST: endDate + '+05:30',
        endParsed: endDateObj,
        endISO: endDateObj.toISOString()
      });
      if (endDateObj <= startDateObj) {
        return res.status(400).json(errorResponse('Event end date must be after start date.', 400));
      }
    }

    // Prepare update data object
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (sport !== undefined) updateData.sport = sport;
    if (venue !== undefined) updateData.venue = venue;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (startDate !== undefined) updateData.startDate = parseAsIST(startDate);
    if (endDate !== undefined) updateData.endDate = parseAsIST(endDate);
    if (maxParticipants !== undefined) updateData.maxParticipants = parseInt(maxParticipants);
    
    // Reset to PENDING if it was APPROVED/ACTIVE and significant changes were made
    if (existingEvent.status === 'APPROVED' || existingEvent.status === 'ACTIVE') {
      updateData.status = 'PENDING';
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        _count: {
          select: {
            registrations: true
          }
        }
      }
    });

    res.json(successResponse({
      ...updatedEvent,
      currentParticipants: updatedEvent._count.registrations
    }, 'Event updated successfully.'));

  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json(errorResponse('Failed to update event.', 500));
  }
});

// Delete event - ENHANCED
router.delete('/events/:eventId', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get coach
    const coach = await prisma.coach.findUnique({
      where: { userId: req.user.id }
    });

    if (!coach) {
      return res.status(404).json(errorResponse('Coach profile not found.', 404));
    }

    // Check if event exists and belongs to coach
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            registrations: true
          }
        }
      }
    });

    if (!existingEvent) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    if (existingEvent.coachId !== coach.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    // Only allow deletion of PENDING events or events with no registrations
    if (existingEvent.status !== 'PENDING' && existingEvent._count.registrations > 0) {
      return res.status(400).json(errorResponse('Cannot delete event with registrations. You can cancel it instead.', 400));
    }

    await prisma.event.delete({
      where: { id: eventId }
    });

    res.json(successResponse(null, 'Event deleted successfully.'));

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json(errorResponse('Failed to delete event.', 500));
  }
});

// Cancel event (alternative to delete)
router.put('/events/:eventId/cancel', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { reason } = req.body;

    // Get coach
    const coach = await prisma.coach.findUnique({
      where: { userId: req.user.id }
    });

    if (!coach) {
      return res.status(404).json(errorResponse('Coach profile not found.', 404));
    }

    // Check if event exists and belongs to coach
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!existingEvent) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    if (existingEvent.coachId !== coach.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    // Only allow cancellation of future events
    if (new Date(existingEvent.startDate) <= new Date()) {
      return res.status(400).json(errorResponse('Cannot cancel past events.', 400));
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: 'CANCELLED',
        adminNotes: reason || 'Cancelled by coach'
      }
    });

    // TODO: Notify registered students about cancellation

    res.json(successResponse(updatedEvent, 'Event cancelled successfully.'));

  } catch (error) {
    console.error('Cancel event error:', error);
    res.status(500).json(errorResponse('Failed to cancel event.', 500));
  }
});

// Get event registrations
router.get('/events/:eventId/registrations', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    // Check if event belongs to coach
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    if (event.coachId !== req.coach.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    const [registrations, total] = await Promise.all([
      prisma.eventRegistration.findMany({
        where: { eventId },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              sport: true,
              level: true,
              school: true,
              club: true,
              dateOfBirth: true,
              address: true,
              state: true,
              district: true,
              pincode: true,
              fatherName: true,
              achievements: true,
              coachName: true,
              coachMobile: true,
              user: {
                select: {
                  email: true,
                  phone: true
                }
              }
            }
          }
        },
        skip,
        take,
        orderBy: {
          createdAt: 'asc'
        }
      }),
      prisma.eventRegistration.count({ where: { eventId } })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      event: {
        id: event.id,
        uniqueId: event.uniqueId, // Custom event UID
        name: event.name,
        startDate: event.startDate,
        maxParticipants: event.maxParticipants,
        currentParticipants: total
      },
      registrations,
      pagination
    }, 'Event registrations retrieved successfully.'));

  } catch (error) {
    console.error('Get event registrations error:', error);
    res.status(500).json(errorResponse('Failed to retrieve event registrations.', 500));
  }
});

/**
 * Event Orders Management
 */

// Create order for event (certificates, medals, trophies)
router.post('/events/:eventId/orders', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { certificates = 0, medals = 0, trophies = 0, specialInstructions = '', urgentDelivery = false } = req.body;

    console.log(`📦 Creating order for event ${eventId}:`, { certificates, medals, trophies, urgentDelivery });

    // Resolve event ID (supports both database ID and uniqueId formats)
    let event;
    try {
      event = await eventService.resolveEventId(eventId);
    } catch (err) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    // Verify event belongs to coach
    const eventBelongsToCoach = await prisma.event.findFirst({
      where: {
        id: event.id,
        coachId: req.coach.id
      }
    });

    if (!eventBelongsToCoach) {
      return res.status(404).json(errorResponse('Event not found or access denied.', 404));
    }
    
    // Use resolved event ID for subsequent queries
    const resolvedEventId = event.id;

    // Validate quantities
    const totalQuantity = parseInt(certificates) + parseInt(medals) + parseInt(trophies);
    if (totalQuantity === 0) {
      return res.status(400).json(errorResponse('At least one item must be ordered.', 400));
    }

    // Check if order already exists for this event and coach
    const existingOrder = await prisma.eventOrder.findFirst({
      where: { 
        eventId: resolvedEventId,
        coachId: req.coach.id 
      }
    });

    if (existingOrder) {
      return res.status(400).json(errorResponse('You already have an order for this event. Please edit or delete the existing order first.', 400));
    }

    // Generate order number
    const orderCount = await prisma.eventOrder.count();
    const orderNumber = `ORD-${Date.now()}-${String(orderCount + 1).padStart(4, '0')}`;

    // Create order
    const order = await prisma.eventOrder.create({
      data: {
        orderNumber,
        eventId: resolvedEventId,
        coachId: req.coach.id,
        certificates: parseInt(certificates),
        medals: parseInt(medals),
        trophies: parseInt(trophies),
        specialInstructions,
        urgentDelivery,
        status: 'PENDING',
        totalAmount: 0 // Will be updated by admin
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true
          }
        },
        coach: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    console.log(`✅ Order created: ${orderNumber} for coach ${req.coach.id}`);

    res.status(201).json(successResponse(order, 'Order created successfully. Admin will review and provide pricing.', 201));

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json(errorResponse('Failed to create order.', 500));
  }
});

// Get orders for coach's events
router.get('/events/:eventId/orders', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId } = req.params;

    console.log(`📦 Getting orders for event ${eventId}, coach ${req.coach.id}`);

    // Resolve event ID (supports both database ID and uniqueId formats)
    let event;
    try {
      event = await eventService.resolveEventId(eventId);
    } catch (err) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    // Verify event belongs to coach
    const eventBelongsToCoach = await prisma.event.findFirst({
      where: {
        id: event.id,
        coachId: req.coach.id
      }
    });

    if (!eventBelongsToCoach) {
      console.log(`❌ Event ${event.id} not found for coach ${req.coach.id}`);
      return res.status(404).json(errorResponse('Event not found or access denied.', 404));
    }

    const resolvedEventId = event.id;

    const orders = await prisma.eventOrder.findMany({
      where: { eventId: resolvedEventId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${orders.length} orders for event ${event.id}`);

    res.json(successResponse({
      event: {
        id: event.id,
        uniqueId: event.uniqueId, // Custom event UID
        name: event.name,
        startDate: event.startDate,
        endDate: event.endDate
      },
      orders
    }, 'Orders retrieved successfully.'));

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json(errorResponse('Failed to retrieve orders.', 500));
  }
});

// Update order (before admin pricing)
router.put('/events/:eventId/orders/:orderId', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId, orderId } = req.params;
    const { certificates = 0, medals = 0, trophies = 0, specialInstructions = '', urgentDelivery = false } = req.body;

    // Resolve event ID (supports both database ID and uniqueId formats)
    let event;
    try {
      event = await eventService.resolveEventId(eventId);
    } catch (err) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    // Verify event belongs to coach
    const eventBelongsToCoach = await prisma.event.findFirst({
      where: {
        id: event.id,
        coachId: req.coach.id
      }
    });

    if (!eventBelongsToCoach) {
      return res.status(404).json(errorResponse('Event not found or access denied.', 404));
    }

    const resolvedEventId = event.id;

    // Verify order exists and is still pending
    const order = await prisma.eventOrder.findFirst({
      where: {
        id: orderId,
        eventId: resolvedEventId,
        status: 'PENDING' // Only allow updates for pending orders
      }
    });

    if (!order) {
      return res.status(404).json(errorResponse('Order not found or cannot be modified.', 404));
    }

    // Validate quantities
    const totalQuantity = parseInt(certificates) + parseInt(medals) + parseInt(trophies);
    if (totalQuantity === 0) {
      return res.status(400).json(errorResponse('At least one item must be ordered.', 400));
    }

    // Update order
    const updatedOrder = await prisma.eventOrder.update({
      where: { id: orderId },
      data: {
        certificates: parseInt(certificates),
        medals: parseInt(medals),
        trophies: parseInt(trophies),
        specialInstructions,
        urgentDelivery
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true
          }
        }
      }
    });

    res.json(successResponse(updatedOrder, 'Order updated successfully.'));

  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json(errorResponse('Failed to update order.', 500));
  }
});

// Delete order (before admin pricing)
router.delete('/events/:eventId/orders/:orderId', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId, orderId } = req.params;

    // Resolve event ID (supports both database ID and uniqueId formats)
    let event;
    try {
      event = await eventService.resolveEventId(eventId);
    } catch (err) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    // Verify event belongs to coach
    const eventBelongsToCoach = await prisma.event.findFirst({
      where: {
        id: event.id,
        coachId: req.coach.id
      }
    });

    if (!eventBelongsToCoach) {
      return res.status(404).json(errorResponse('Event not found or access denied.', 404));
    }

    const resolvedEventId = event.id;

    // Verify order exists and can be deleted
    const order = await prisma.eventOrder.findFirst({
      where: {
        id: orderId,
        eventId: resolvedEventId,
        status: { in: ['PENDING', 'QUOTED'] } // Can only delete pending or quoted orders
      }
    });

    if (!order) {
      return res.status(404).json(errorResponse('Order not found or cannot be deleted.', 404));
    }

    await prisma.eventOrder.delete({
      where: { id: orderId }
    });

    res.json(successResponse(null, 'Order deleted successfully.'));

  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json(errorResponse('Failed to delete order.', 500));
  }
});

// Get dashboard analytics
router.get('/dashboard', authenticate, requireCoach, async (req, res) => {
  try {
    if (!req.coach || !req.coach.id) {
      return res.status(401).json(errorResponse('Coach profile not found. Please log in as a coach.', 401));
    }
    const coachId = req.coach.id;

    // Get various analytics
    const [
      totalStudents,
      pendingRequests,
      totalEvents,
      upcomingEvents,
      totalEarnings,
      activeEvents
    ] = await Promise.all([
      prisma.studentCoachConnection.count({
        where: { coachId, status: 'ACCEPTED' }
      }),
      prisma.studentCoachConnection.count({
        where: { coachId, status: 'PENDING' }
      }),
      prisma.event.count({
        where: { coachId }
      }),
      prisma.event.count({
        where: {
          coachId,
          startDate: { gte: new Date() },
          status: { in: ['APPROVED', 'ACTIVE'] }
        }
      }),
      prisma.payment.aggregate({
        where: { 
          coachId, 
          status: 'SUCCESS'  // String comparison, not enum
        },
        _sum: { amount: true }
      }),
      prisma.event.count({
        where: { coachId, status: 'ACTIVE' }
      })
    ]);

    // Monthly earnings for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyEarnings = await prisma.payment.groupBy({
      by: ['createdAt'],
      where: {
        coachId,
        status: 'SUCCESS',
        createdAt: { gte: sixMonthsAgo }
      },
      _sum: { amount: true }
    });

    // Get coach profile for rating info
    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
      select: {
        rating: true,
        totalStudents: true,
        name: true,
        specialization: true,
        createdAt: true,
        paymentStatus: true,
        isActive: true,
        user: {
          select: {
            createdAt: true
          }
        }
      }
    });

    // Get ALL students (not just recent 5)
    const allStudents = await prisma.studentCoachConnection.findMany({
      where: { coachId, status: 'ACCEPTED' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            sport: true,
            level: true,
            achievements: true,
            profileCompletion: true,
            user: {
              select: {
                email: true,
                phone: true,
                uniqueId: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get recent students (last 5) for overview
    const recentStudents = allStudents.slice(0, 5);

    // Get recent events (last 5)
    const recentEvents = await prisma.event.findMany({
      where: { coachId },
      select: {
        id: true,
        name: true,
        startDate: true,
        status: true,
        currentParticipants: true,
        maxParticipants: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get recent notifications/activities
    const notifications = [
      {
        id: 1,
        type: 'student',
        message: `You have ${pendingRequests} pending connection request${pendingRequests !== 1 ? 's' : ''}`,
        time: '1 hour ago'
      },
      {
        id: 2,
        type: 'event',
        message: `You have ${upcomingEvents} upcoming event${upcomingEvents !== 1 ? 's' : ''}`,
        time: '2 hours ago'
      },
      {
        id: 3,
        type: 'payment',
        message: `Total earnings: ₹${totalEarnings._sum.amount || 0}`,
        time: '1 day ago'
      }
    ];

    res.json(successResponse({
      // Coach basic info
      coach: {
        name: coach?.name || 'Coach',
        specialization: coach?.specialization || 'Sports Training',
        studentsCount: totalStudents,
        eventsCreated: totalEvents,
        rating: coach?.rating || 0,
        totalRevenue: totalEarnings._sum.amount || 0,
        joinedDate: coach?.user?.createdAt || coach?.createdAt,
        paymentStatus: coach?.paymentStatus || 'PENDING',
        isActive: coach?.isActive || false
      },
      // Students data - ALL students for "My Athletes" tab
      students: allStudents.map(conn => ({
        id: conn.student.id,
        name: conn.student.name,
        sport: conn.student.sport || 'General',
        level: conn.student.level || 'Beginner',
        achievements: conn.student.achievements ? (typeof conn.student.achievements === 'string' ? JSON.parse(conn.student.achievements) : conn.student.achievements) : [],
        profileCompletion: conn.student.profileCompletion || 0,
        email: conn.student.user?.email,
        phone: conn.student.user?.phone,
        uniqueId: conn.student.user?.uniqueId,
        joinedDate: conn.createdAt,
        connectionId: conn.id,
        connectionStatus: conn.status
      })),
      // Recent students for overview
      recentStudents: recentStudents.map(conn => ({
        id: conn.student.id,
        name: conn.student.name,
        sport: conn.student.sport || 'General',
        level: conn.student.level || 'Beginner',
        achievements: conn.student.achievements ? (typeof conn.student.achievements === 'string' ? JSON.parse(conn.student.achievements) : conn.student.achievements) : [],
        joinedDate: conn.createdAt
      })),
      // Events data
      recentEvents: recentEvents.map(event => ({
        id: event.id,
        uniqueId: event.uniqueId, // Custom event UID
        name: event.name,
        date: event.startDate,
        participants: event.currentParticipants || 0,
        maxParticipants: event.maxParticipants || 50,
        status: event.status === 'APPROVED' || event.status === 'ACTIVE' ? 'upcoming' :
          event.status === 'COMPLETED' ? 'completed' : 'pending'
      })),
      // Notifications
      notifications,
      // Analytics data
      totalStudents,
      pendingRequests,
      totalEvents,
      upcomingEvents,
      activeEvents,
      totalEarnings: totalEarnings._sum.amount || 0,
      averageRating: coach?.rating || 0,
      totalReviews: 0, // Will be implemented when review system is added
      recentReviews: [],
      monthlyEarnings
    }, 'Analytics retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get coach analytics error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Coach ID:', coachId);
    console.error('Request headers:', req.headers);
    
    // Return detailed error in development
    const errorMsg = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Failed to retrieve analytics';
    
    res.status(500).json(errorResponse(errorMsg, 500));
  }
});// Get payment history
router.get('/payments', authenticate, requireCoach, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      coachId: req.coach.id,
      ...(status && { status: status.toUpperCase() })
    };

    const [payments, total] = await Promise.all([
      prisma.Payment.findMany({
        where,
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.payment.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      payments,
      pagination
    }, 'Payment history retrieved successfully.'));

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json(errorResponse('Failed to retrieve payment history.', 500));
  }
});

// Create payment order for coach subscription
router.post('/create-payment-order', authenticate, requireCoach, async (req, res) => {
  try {
    const { planId, amount } = req.body;

    if (!planId || !amount) {
      return res.status(400).json(errorResponse('Plan ID and amount are required.', 400));
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `c${req.coach.id}_${Date.now()}`.slice(0, 40),
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    // Store order details in database
    await prisma.payment.create({
      data: {
        coachId: req.coach.id,
        type: 'SUBSCRIPTION_MONTHLY',
        amount: amount,
        currency: 'INR',
        razorpayOrderId: order.id,
        status: 'PENDING',
        description: `${planId} plan subscription`,
        metadata: JSON.stringify({ planId })
      }
    });

    res.json(successResponse({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    }, 'Payment order created successfully.'));

  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json(errorResponse('Failed to create payment order.', 500));
  }
});

// Verify payment and update coach status
router.post('/verify-payment', authenticate, requireCoach, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json(errorResponse('Invalid payment signature.', 400));
    }

    // Update payment record
    const payment = await prisma.payment.updateMany({
      where: {
        coachId: req.coach.id,
        razorpayOrderId: razorpay_order_id,
        status: 'PENDING'
      },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        status: 'SUCCESS'
      }
    });

    if (payment.count === 0) {
      return res.status(404).json(errorResponse('Payment record not found.', 404));
    }

    // Update coach status with proration logic
    const coach = await prisma.coach.findUnique({
      where: { id: req.coach.id },
      select: { subscriptionExpiresAt: true, subscriptionType: true }
    });

    const now = new Date();
    let subscriptionExpiresAt = new Date();
    subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 1);

    // Proration: If coach has active subscription, extend from current expiry
    if (coach?.subscriptionExpiresAt && coach.subscriptionExpiresAt > now) {
      subscriptionExpiresAt = new Date(coach.subscriptionExpiresAt);
      subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 1);
      console.log(`📅 Proration: Extending subscription from ${coach.subscriptionExpiresAt.toISOString()} to ${subscriptionExpiresAt.toISOString()}`);
    }

    await prisma.coach.update({
      where: { id: req.coach.id },
      data: {
        paymentStatus: 'SUCCESS',
        isActive: true,
        subscriptionType: 'MONTHLY',
        subscriptionExpiresAt
      }
    });

    res.json(successResponse({
      paymentId: razorpay_payment_id,
      status: 'SUCCESS'
    }, 'Payment verified and coach activated successfully.'));

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json(errorResponse('Payment verification failed.', 500));
  }
});

// Create payment order for event order
router.post('/orders/:orderId/create-payment', authenticate, requireCoach, async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log(`💳 Creating payment order for event order ${orderId}`);
    console.log(`👤 Coach ID: ${req.coach?.id}`);
    console.log(`👤 User ID: ${req.user?.id}`);

    // Get the order details
    const order = await prisma.eventOrder.findUnique({
      where: { id: orderId },
      include: {
        event: { select: { name: true } },
        coach: { select: { name: true } }
      }
    });

    console.log(`📋 Order found:`, order ? 'Yes' : 'No');

    if (!order) {
      console.log(`❌ Order not found: ${orderId}`);
      return res.status(404).json(errorResponse('Order not found.', 404));
    }

    if (order.coachId !== req.coach.id) {
      console.log(`❌ Access denied. Order coachId: ${order.coachId}, Request coachId: ${req.coach.id}`);
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    if (order.status !== 'CONFIRMED') {
      console.log(`❌ Order status is ${order.status}, expected CONFIRMED`);
      return res.status(400).json(errorResponse('Order must be confirmed by admin before payment.', 400));
    }

    if (!order.totalAmount || order.totalAmount <= 0) {
      console.log(`❌ Invalid total amount: ${order.totalAmount}`);
      return res.status(400).json(errorResponse('Order total amount is required.', 400));
    }

    if (order.paymentStatus === 'SUCCESS') {
      console.log(`❌ Payment already completed for order: ${orderId}`);
      return res.status(400).json(errorResponse('Order payment already completed.', 400));
    }

    console.log(`✅ Order validation passed. Creating Razorpay order...`);

    // Create Razorpay order
    const options = {
      amount: Math.round(order.totalAmount * 100), // Amount in paise
      currency: 'INR',
      receipt: `order_${orderId}_${Date.now()}`.slice(0, 40),
      payment_capture: 1,
      notes: {
        orderId: orderId,
        eventName: order.event.name,
        coachName: order.coach.name,
        type: 'EVENT_ORDER'
      }
    };

    console.log(`📋 Razorpay options:`, options);

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create(options);
      console.log(`✅ Razorpay order created:`, razorpayOrder.id);
    } catch (razorpayError) {
      console.error(`❌ Razorpay order creation failed:`, razorpayError);
      throw new Error(`Razorpay order creation failed: ${razorpayError.message}`);
    }

    // Update the event order with payment details
    const updatedOrder = await prisma.eventOrder.update({
      where: { id: orderId },
      data: {
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: 'PENDING',
        status: 'PAYMENT_PENDING'
      }
    });

    console.log(`✅ Payment order created: ${razorpayOrder.id} for ₹${order.totalAmount}`);

    res.json(successResponse({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderDetails: {
        id: order.id,
        orderNumber: order.orderNumber,
        eventName: order.event.name,
        totalAmount: order.totalAmount,
        certificates: order.certificates,
        medals: order.medals,
        trophies: order.trophies
      }
    }, 'Payment order created successfully.'));

  } catch (error) {
    console.error('❌ Create order payment error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    res.status(500).json(errorResponse('Failed to create payment order.', 500));
  }
});

// Verify order payment
router.post('/orders/:orderId/verify-payment', authenticate, requireCoach, async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    console.log(`💳 Verifying payment for order ${orderId}`);

    // Get the order
    const order = await prisma.eventOrder.findUnique({
      where: { id: orderId },
      include: {
        event: { select: { name: true } },
        coach: { select: { name: true } }
      }
    });

    if (!order) {
      return res.status(404).json(errorResponse('Order not found.', 404));
    }

    if (order.coachId !== req.coach.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    if (order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json(errorResponse('Invalid order ID.', 400));
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.log('❌ Payment signature verification failed');
      return res.status(400).json(errorResponse('Invalid payment signature.', 400));
    }

    // Update order with payment details
    const updatedOrder = await prisma.eventOrder.update({
      where: { id: orderId },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        paymentStatus: 'SUCCESS',
        status: 'PAID',
        paymentDate: new Date(),
        paymentMethod: 'razorpay'
      },
      include: {
        event: { select: { name: true } },
        coach: { select: { name: true } }
      }
    });

    console.log(`✅ Payment verified for order ${order.orderNumber}: ${razorpay_payment_id}`);

    // Get coach details for invoice
    const coach = await prisma.coach.findUnique({
      where: { id: req.coach.id },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    // Create invoice and send receipt email
    if (coach && coach.user) {
      try {
        await createOrderInvoice({
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          userEmail: coach.user.email,
          userName: coach.name || coach.user.name || 'Coach',
          amount: order.totalAmount || 0,
          currency: 'INR',
          description: `Order ${order.orderNumber} - ${order.event?.name || 'Event'}`,
          metadata: {
            orderNumber: order.orderNumber,
            eventName: order.event?.name,
            certificates: order.certificates,
            medals: order.medals,
            trophies: order.trophies
          }
        });
      } catch (invoiceError) {
        console.error('⚠️ Invoice generation failed (non-critical):', invoiceError);
      }
    }

    // Send notification to all admins about completed payment
    try {
      const admins = await prisma.admin.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });

      // Create notifications for all admins
      const notificationPromises = admins.map(admin =>
        prisma.notification.create({
          data: {
            userId: admin.user.id,
            type: 'ORDER_COMPLETED',
            title: '💰 New Order Payment Received',
            message: `Order ${order.orderNumber} payment completed for event "${order.event?.name || 'Unknown'}". Total: ₹${order.totalAmount || 0}. Items: ${order.certificates} certificates, ${order.medals} medals, ${order.trophies} trophies.`,
            data: JSON.stringify({
              orderId: updatedOrder.id,
              orderNumber: order.orderNumber,
              eventId: order.eventId,
              eventName: order.event?.name,
              totalAmount: order.totalAmount,
              certificates: order.certificates,
              medals: order.medals,
              trophies: order.trophies
            })
          }
        })
      );

      await Promise.all(notificationPromises);
      console.log(`✅ Notified ${admins.length} admin(s) about order payment`);
    } catch (notifError) {
      console.error('⚠️ Failed to send admin notifications (non-critical):', notifError);
    }

    res.json(successResponse({
      paymentId: razorpay_payment_id,
      status: 'COMPLETED',
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        eventName: updatedOrder.event.name,
        totalAmount: updatedOrder.totalAmount,
        paymentDate: updatedOrder.paymentDate,
        status: updatedOrder.status
      }
    }, 'Payment verified successfully. Admin has been notified to process your order.'));

  } catch (error) {
    console.error('❌ Verify order payment error:', error);
    res.status(500).json(errorResponse('Payment verification failed.', 500));
  }
});

/**
 * Event Result Files Management for Coaches
 */

// Get all result files uploaded by this coach
router.get('/event-results', authenticate, requireCoach, async (req, res) => {
  try {
    console.log('🔍 Coach fetching their event result files...');
    
    const { page = 1, limit = 20, eventId, search, dateRange } = req.query;
    const { skip, take } = getPaginationParams(page, limit);
    const coachId = req.coach.id;

    // Build where clause
    let where = {
      coachId: coachId
    };

    // Filter by specific event
    if (eventId && eventId !== '') {
      where.eventId = eventId;
    }

    // Search filter (by original file name or event name)
    if (search && search !== '') {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { 
          event: {
            name: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    // Date range filter
    if (dateRange && dateRange !== '') {
      const now = new Date();
      let dateFilter = {};
      
      switch (dateRange) {
        case 'today':
          dateFilter = {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          };
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = { gte: weekAgo };
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFilter = { gte: monthAgo };
          break;
      }
      
      if (Object.keys(dateFilter).length > 0) {
        where.uploadedAt = dateFilter;
      }
    }

    // Get files with event details
    const [files, totalCount] = await Promise.all([
      prisma.eventResultFile.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              name: true,
              sport: true,
              startDate: true,
              location: true,
              status: true
            }
          }
        },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take
      }),
      prisma.eventResultFile.count({ where })
    ]);

    // Format response
    const formattedFiles = files.map(file => ({
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      description: file.description,
      uploadedAt: file.uploadedAt,
      downloadUrl: `/uploads/event-results/${file.filename}`,
      event: {
        id: file.event.id,
        uniqueId: file.event.uniqueId, // Custom event UID
        name: file.event.name,
        sport: file.event.sport,
        startDate: file.event.startDate,
        location: file.event.location,
        status: file.event.status
      }
    }));

    const pagination = getPaginationMeta(totalCount, page, limit);

    console.log(`✅ Found ${totalCount} result files for coach ${coachId}`);

    res.json(successResponse({
      files: formattedFiles,
      pagination,
      totalCount
    }, 'Event result files retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get coach event result files error:', error);
    res.status(500).json(errorResponse('Failed to retrieve event result files.', 500));
  }
});

// Get result files for a specific event (coach's own event)
router.get('/events/:eventId/results', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId } = req.params;
    const coachId = req.coach.id;
    
    console.log(`🔍 Coach ${coachId} fetching result files for event ${eventId}`);

    // Verify the event belongs to this coach
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        coachId: coachId
      },
      select: {
        id: true,
        name: true,
        sport: true,
        startDate: true,
        status: true
      }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found or you do not have access to it.', 404));
    }

    // Get result files for this event
    const files = await prisma.eventResultFile.findMany({
      where: {
        eventId: eventId,
        coachId: coachId
      },
      orderBy: { uploadedAt: 'desc' }
    });

    // Format response
    const formattedFiles = files.map(file => ({
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      uploadedAt: file.uploadedAt,
      downloadUrl: `/uploads/event-results/${file.filename}`,
      isExcel: file.mimeType.includes('spreadsheet') || file.originalName.toLowerCase().endsWith('.xlsx') || file.originalName.toLowerCase().endsWith('.xls')
    }));

    res.json(successResponse({
      event,
      files: formattedFiles,
      totalCount: files.length
    }, 'Event result files retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get event result files error:', error);
    res.status(500).json(errorResponse('Failed to retrieve event result files.', 500));
  }
});

// Download a specific result file (coach's own file)
router.get('/event-results/:fileId/download', authenticate, requireCoach, async (req, res) => {
  try {
    const { fileId } = req.params;
    const coachId = req.coach.id;

    console.log(`📥 Coach ${coachId} downloading result file ${fileId}`);

    // Get file details and verify ownership
    const file = await prisma.eventResultFile.findFirst({
      where: {
        id: fileId,
        coachId: coachId
      },
      include: {
        event: {
          select: {
            name: true
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json(errorResponse('File not found or you do not have access to it.', 404));
    }

    const filePath = path.join(__dirname, '../../../uploads/event-results', file.filename);
    
    // Check if file exists on disk
    if (!require('fs').existsSync(filePath)) {
      return res.status(404).json(errorResponse('File not found on server.', 404));
    }

    // Set appropriate headers for Excel files
    const isExcel = file.mimeType.includes('spreadsheet') || file.originalName.toLowerCase().endsWith('.xlsx') || file.originalName.toLowerCase().endsWith('.xls');
    
    if (isExcel) {
      if (file.originalName.toLowerCase().endsWith('.xlsx')) {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      } else if (file.originalName.toLowerCase().endsWith('.xls')) {
        res.setHeader('Content-Type', 'application/vnd.ms-excel');
      }
    } else {
      res.setHeader('Content-Type', file.mimeType);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.sendFile(filePath);

    console.log(`✅ File ${file.originalName} downloaded by coach ${coachId}`);

  } catch (error) {
    console.error('❌ Download result file error:', error);
    res.status(500).json(errorResponse('Failed to download file.', 500));
  }
});

/**
 * STUDENT REGISTRATION FOR EVENTS WITH FEE MANAGEMENT
 */

// Bulk register students for an event with fee tracking
router.post('/events/:eventId/registrations/bulk', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { studentIds = [], eventFeePerStudent = 0 } = req.body;

    console.log(`📋 Coach ${req.coach.id} registering ${studentIds.length} students for event ${eventId}`);

    // Validate
    if (!studentIds || studentIds.length === 0) {
      return res.status(400).json(errorResponse('At least one student must be selected.', 400));
    }

    if (eventFeePerStudent < 0) {
      return res.status(400).json(errorResponse('Event fee cannot be negative.', 400));
    }

    // Check if event exists and belongs to coach
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { coach: true }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    if (event.coachId !== req.coach.id) {
      return res.status(403).json(errorResponse('You can only register students for your own events.', 403));
    }

    // Check if event is APPROVED or ACTIVE
    if (!['APPROVED', 'ACTIVE'].includes(event.status)) {
      return res.status(400).json(errorResponse(`Cannot register students for event with status: ${event.status}`, 400));
    }

    // Check all students exist and belong to this coach
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        coachConnections: {
          some: { coachId: req.coach.id, status: 'ACCEPTED' }
        }
      }
    });

    if (students.length !== studentIds.length) {
      const missingStudents = studentIds.filter(id => !students.find(s => s.id === id));
      return res.status(400).json(errorResponse(
        `Some students do not exist or are not connected to you. Missing: ${missingStudents.length} student(s).`,
        400
      ));
    }

    // Check for duplicate order (same event + coach combination)
    const existingOrder = await prisma.eventRegistrationOrder.findUnique({
      where: {
        eventId_coachId: {
          eventId,
          coachId: req.coach.id
        }
      }
    });

    if (existingOrder && existingOrder.paymentStatus !== 'PAID') {
      return res.status(400).json(errorResponse(
        `You already have a pending registration order for this event (Order: ${existingOrder.orderNumber}). Please complete payment or cancel the existing order first.`,
        400
      ));
    }

    // Check if students are already registered for this event
    const existingRegistrations = await prisma.eventRegistration.findMany({
      where: {
        eventId,
        studentId: { in: studentIds }
      },
      select: { studentId: true }
    });

    if (existingRegistrations.length > 0) {
      const alreadyRegistered = existingRegistrations.map(r => r.studentId);
      return res.status(400).json(errorResponse(
        `Some students are already registered for this event. Already registered: ${alreadyRegistered.length} student(s).`,
        400
      ));
    }

    // Validate event fee
    const feeFromEvent = event.eventFee || 0;
    const finalFeePerStudent = eventFeePerStudent > 0 ? eventFeePerStudent : feeFromEvent;
    
    if (finalFeePerStudent < 0) {
      return res.status(400).json(errorResponse('Event fee cannot be negative.', 400));
    }

    // Calculate total fee with proper validation
    const totalFeeAmount = Number((studentIds.length * finalFeePerStudent).toFixed(2));
    
    if (!isFinite(totalFeeAmount) || totalFeeAmount < 0) {
      return res.status(400).json(errorResponse('Invalid fee calculation.', 400));
    }

    // Generate unique order number with retry logic
    let orderNumber;
    let attempts = 0;
    const maxAttempts = 10;
    do {
      const orderCount = await prisma.eventRegistrationOrder.count();
      const timestamp = Date.now().toString().slice(-6);
      orderNumber = `REG-${event.uniqueId || 'EVT'}-${timestamp}-${String(orderCount + 1).padStart(4, '0')}`;
      attempts++;
      
      // Check if order number already exists
      const existing = await prisma.eventRegistrationOrder.findUnique({
        where: { orderNumber }
      });
      
      if (!existing) break;
      
      if (attempts >= maxAttempts) {
        return res.status(500).json(errorResponse('Failed to generate unique order number. Please try again.', 500));
      }
    } while (attempts < maxAttempts);

    // Create registration order with transaction for data consistency
    const registrationOrder = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.eventRegistrationOrder.create({
        data: {
          orderNumber,
          eventId,
          coachId: req.coach.id,
          eventFeePerStudent: finalFeePerStudent,
          totalStudents: studentIds.length,
          totalFeeAmount,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          registrationItems: {
            createMany: {
              data: studentIds.map(studentId => ({
                eventId,
                studentId,
                status: 'REGISTERED'
              }))
            }
          }
        },
        include: {
          registrationItems: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  sport: true
                }
              }
            }
          },
          event: {
            select: {
              id: true,
              name: true,
              uniqueId: true
            }
          }
        }
      });

      // Verify all items were created
      if (order.registrationItems.length !== studentIds.length) {
        throw new Error(`Failed to create all registration items. Expected ${studentIds.length}, created ${order.registrationItems.length}`);
      }

      return order;
    });

    console.log(`✅ Registration order created:`, {
      orderNumber: registrationOrder.orderNumber,
      totalStudents: registrationOrder.totalStudents,
      totalFee: registrationOrder.totalFeeAmount,
      eventId: registrationOrder.eventId
    });

    res.status(201).json(successResponse(registrationOrder, 'Bulk registration created successfully. Please proceed to payment.'));

  } catch (error) {
    console.error('❌ Bulk registration error:', error);
    res.status(500).json(errorResponse('Failed to create bulk registration: ' + error.message, 500));
  }
});

// Get registration orders for a coach's event
router.get('/events/:eventId/registrations/orders', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify event belongs to coach
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event || event.coachId !== req.coach.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    const orders = await prisma.eventRegistrationOrder.findMany({
      where: {
        eventId,
        coachId: req.coach.id
      },
      include: {
        registrationItems: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                sport: true,
                level: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(successResponse(orders, 'Registration orders retrieved successfully.'));

  } catch (error) {
    console.error('❌ Get registration orders error:', error);
    res.status(500).json(errorResponse('Registration orders not found.', 500));
  }
});

// Initiate payment for student registration order
router.post('/events/:eventId/registrations/orders/:orderId/payment', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId, orderId } = req.params;

    // Verify order exists and belongs to coach
    const registrationOrder = await prisma.eventRegistrationOrder.findUnique({
      where: { id: orderId },
      include: {
        event: true,
        registrationItems: {
          include: { student: true }
        }
      }
    });

    if (!registrationOrder) {
      return res.status(404).json(errorResponse('Registration order not found.', 404));
    }

    if (registrationOrder.coachId !== req.coach.id || registrationOrder.eventId !== eventId) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    if (registrationOrder.paymentStatus === 'PAID') {
      return res.status(400).json(errorResponse('This order has already been paid.', 400));
    }

    // Initialize Razorpay order
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const options = {
      amount: Math.round(registrationOrder.totalFeeAmount * 100), // Convert to paise
      currency: 'INR',
      receipt: registrationOrder.orderNumber,
      notes: {
        orderId: registrationOrder.id,
        eventId: registrationOrder.eventId,
        coachId: registrationOrder.coachId,
        studentCount: registrationOrder.totalStudents,
        orderType: 'student_registration'
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Update registration order with Razorpay order ID
    await prisma.eventRegistrationOrder.update({
      where: { id: orderId },
      data: {
        razorpayOrderId: razorpayOrder.id,
        status: 'PAYMENT_PENDING'
      }
    });

    console.log(`💳 Razorpay order created for registration ${orderId}:`, razorpayOrder.id);

    res.json(successResponse({
      razorpayOrderId: razorpayOrder.id,
      amount: registrationOrder.totalFeeAmount,
      studentCount: registrationOrder.totalStudents,
      eventName: registrationOrder.event.name
    }, 'Payment initiated. Complete payment to register students.'));

  } catch (error) {
    console.error('❌ Payment initiation error:', error);
    res.status(500).json(errorResponse('Failed to initiate payment: ' + error.message, 500));
  }
});

// Verify and complete payment for registration order
router.post('/events/:eventId/registrations/orders/:orderId/payment-success', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId, orderId } = req.params;
    const { razorpayPaymentId, razorpaySignature } = req.body;

    // Verify order belongs to coach
    const registrationOrder = await prisma.eventRegistrationOrder.findUnique({
      where: { id: orderId }
    });

    if (!registrationOrder || registrationOrder.coachId !== req.coach.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${registrationOrder.razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json(errorResponse('Payment signature verification failed.', 400));
    }

    // Update order with payment details
    const updatedOrder = await prisma.eventRegistrationOrder.update({
      where: { id: orderId },
      data: {
        razorpayPaymentId,
        paymentStatus: 'PAID',
        status: 'PAID',
        paymentDate: new Date(),
        paymentMethod: 'RAZORPAY'
      },
      include: {
        registrationItems: {
          include: { student: true }
        },
        event: true
      }
    });

    // Register each student in the event
    const registrationPromises = updatedOrder.registrationItems.map(item =>
      prisma.eventRegistration.upsert({
        where: {
          eventId_studentId: {
            eventId: updatedOrder.eventId,
            studentId: item.studentId
          }
        },
        create: {
          eventId: updatedOrder.eventId,
          studentId: item.studentId,
          status: 'REGISTERED'
        },
        update: {
          status: 'REGISTERED'
        }
      })
    );

    await Promise.all(registrationPromises);

    // Update event currentParticipants
    await prisma.event.update({
      where: { id: updatedOrder.eventId },
      data: {
        currentParticipants: {
          increment: updatedOrder.registrationItems.length
        }
      }
    });

    console.log(`✅ Payment successful for order ${orderId}. ${updatedOrder.registrationItems.length} students registered.`);

    // Get coach details for invoice
    const coach = await prisma.coach.findUnique({
      where: { id: req.coach.id },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    // Create invoice and send receipt email
    if (coach && coach.user) {
      try {
        await createEventPaymentInvoice({
          razorpayPaymentId: razorpayPaymentId,
          razorpayOrderId: registrationOrder.razorpayOrderId,
          userEmail: coach.user.email,
          userName: coach.name || coach.user.name || 'Coach',
          amount: updatedOrder.totalFeeAmount || 0,
          currency: 'INR',
          description: `Event Registration Payment - ${updatedOrder.event?.name || 'Event'}`,
          eventName: updatedOrder.event?.name,
          metadata: {
            eventId: updatedOrder.eventId,
            eventName: updatedOrder.event?.name,
            studentsCount: updatedOrder.registrationItems.length,
            orderId: orderId
          }
        });
      } catch (invoiceError) {
        console.error('⚠️ Invoice generation failed (non-critical):', invoiceError);
      }
    }

    res.json(successResponse(updatedOrder, 'Payment successful! Students have been registered for the event. Receipt has been sent to your email.'));

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json(errorResponse('Failed to verify payment: ' + error.message, 500));
  }
});

module.exports = router;