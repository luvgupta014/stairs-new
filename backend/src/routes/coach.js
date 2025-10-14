const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { authenticate, requireCoach, requireApproved } = require('../utils/authMiddleware');
const {
  successResponse,
  errorResponse,
  getPaginationParams,
  getPaginationMeta
} = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

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
            createdAt: true
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
        payments: {
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
      specialization,
      experience,
      certifications,
      bio,
      location
    } = req.body;

    const updatedCoach = await prisma.coach.update({
      where: { userId: req.user.id },
      data: {
        name,
        specialization,
        experience: experience ? parseInt(experience) : undefined,
        certifications: certifications || undefined,
        bio,
        location
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            status: true
          }
        }
      }
    });

    res.json(successResponse(updatedCoach, 'Profile updated successfully.'));

  } catch (error) {
    console.error('Update coach profile error:', error);
    res.status(500).json(errorResponse('Failed to update profile.', 500));
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
              institute: true,
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
        status: action === 'ACCEPT' ? 'ACTIVE' : 'REJECTED',
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
      status: 'ACTIVE',
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
              institute: true,
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
      level,
      dateOfBirth,
      address,
      city,
      state,
      pincode
    } = req.body;

    // Check if coach has completed payment or has active subscription
    const coach = await prisma.coach.findUnique({
      where: { userId: req.user.id }
    });

    if (!coach || (coach.paymentStatus === 'PENDING' && !coach.isActive)) {
      return res.status(403).json(errorResponse('Please complete payment to add students. If you chose "Pay Later", please complete the payment to access this feature.', 403));
    }

    if (!name || !email || !phone || !sport) {
      return res.status(400).json(errorResponse('Name, email, phone, and sport are required.', 400));
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

    let student;
    if (user) {
      // User exists, check if they have a student profile
      student = await prisma.student.findUnique({
        where: { userId: user.id }
      });

      if (!student) {
        // Create student profile for existing user
        student = await prisma.student.create({
          data: {
            userId: user.id,
            name,
            sport,
            level: level || 'BEGINNER',
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            address,
            city,
            state,
            pincode
          }
        });
      }
    } else {
      // Create new user and student profile
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await require('../utils/helpers').hashPassword(tempPassword);

      user = await prisma.user.create({
        data: {
          email,
          phone,
          password: hashedPassword,
          role: 'STUDENT',
          isActive: true,
          isVerified: true,
          studentProfile: {
            create: {
              name,
              sport,
              level: level || 'BEGINNER',
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
              address,
              city,
              state,
              pincode
            }
          }
        },
        include: {
          studentProfile: true
        }
      });

      student = user.studentProfile;

      // TODO: Send login credentials to student via email/SMS
      console.log(`Temporary password for ${email}: ${tempPassword}`);
    }

    // Create direct connection between coach and student
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
                phone: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(successResponse(connection, 'Student added and connected successfully.', 201));

  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json(errorResponse('Failed to add student.', 500));
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
    console.log('=== Starting bulk upload process ===');
    console.log('Coach ID:', req.coach.id);
    console.log('Coach Name:', req.coach.name);

    // Validate file upload
    if (!req.files || !req.files.file) {
      console.log('ERROR: No file uploaded');
      return res.status(400).json(errorResponse('Please upload a file.', 400));
    }

    const file = req.files.file;
    tempFilePath = file.tempFilePath; // Store for cleanup

    console.log('File details:', {
      name: file.name,
      size: file.size,
      mimetype: file.mimetype,
      tempFilePath: file.tempFilePath
    });

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

        // Create user with student profile according to Prisma schema
        user = await prisma.user.create({
          data: {
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
  const optionalFields = ['fatherName', 'dateOfBirth', 'address', 'city', 'state'];

  let completedRequired = 0;
  let completedOptional = 0;

  requiredFields.forEach(field => {
    if (data[field]) completedRequired++;
  });

  optionalFields.forEach(field => {
    if (data[field]) completedOptional++;
  });

  // Required fields are 70% of total, optional are 30%
  const requiredPercentage = (completedRequired / requiredFields.length) * 70;
  const optionalPercentage = (completedOptional / optionalFields.length) * 30;

  return Math.round(requiredPercentage + optionalPercentage);
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

    if (new Date(startDate) <= new Date()) {
      return res.status(400).json(errorResponse('Event start date must be in the future.', 400));
    }

    if (endDate && new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json(errorResponse('Event end date must be after start date.', 400));
    }

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
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : 50,
        eventFee: 0, // Set to 0 since we're not collecting fees anymore
        status: 'PENDING'
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

// Get coach events
router.get('/events', authenticate, requireCoach, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      organizerId: req.coach.id,
      ...(status && { status: status.toUpperCase() })
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          registrations: {
            include: {
              student: {
                select: {
                  firstName: true,
                  lastName: true
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
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.event.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      events,
      pagination
    }, 'Events retrieved successfully.'));

  } catch (error) {
    console.error('Get coach events error:', error);
    res.status(500).json(errorResponse('Failed to retrieve events.', 500));
  }
});

// Update event
router.put('/events/:eventId', authenticate, requireCoach, requireApproved, async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      title,
      description,
      sport,
      startDate,
      endDate,
      location,
      fees,
      maxParticipants,
      registrationDeadline,
      requirements,
      status
    } = req.body;

    // Check if event exists and belongs to coach
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!existingEvent) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    if (existingEvent.organizerId !== req.coach.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    // Validate dates if provided
    if (startDate && new Date(startDate) <= new Date()) {
      return res.status(400).json(errorResponse('Event start date must be in the future.', 400));
    }

    if (endDate && startDate && new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json(errorResponse('Event end date must be after start date.', 400));
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title,
        description,
        sport,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        location,
        fees: fees !== undefined ? parseFloat(fees) : undefined,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
        requirements: requirements || undefined,
        status: status || undefined
      },
      include: {
        registrations: {
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    res.json(successResponse(updatedEvent, 'Event updated successfully.'));

  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json(errorResponse('Failed to update event.', 500));
  }
});

// Delete event
router.delete('/events/:eventId', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId } = req.params;

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

    if (existingEvent.organizerId !== req.coach.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    if (existingEvent._count.registrations > 0) {
      return res.status(400).json(errorResponse('Cannot delete event with registrations.', 400));
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

    if (event.organizerId !== req.coach.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    const [registrations, total] = await Promise.all([
      prisma.eventRegistration.findMany({
        where: { eventId },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              sport: true,
              level: true,
              institute: true,
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
          registrationDate: 'asc'
        }
      }),
      prisma.eventRegistration.count({ where: { eventId } })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      event: {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        maxParticipants: event.maxParticipants,
        currentParticipants: event.currentParticipants
      },
      registrations,
      pagination
    }, 'Event registrations retrieved successfully.'));

  } catch (error) {
    console.error('Get event registrations error:', error);
    res.status(500).json(errorResponse('Failed to retrieve event registrations.', 500));
  }
});

// Get dashboard analytics
router.get('/dashboard', authenticate, requireCoach, async (req, res) => {
  try {
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
        where: { coachId, status: 'SUCCESS' },
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

    // Get recent students (last 5 connections)
    const recentStudents = await prisma.studentCoachConnection.findMany({
      where: { coachId, status: 'ACCEPTED' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            sport: true,
            level: true,
            achievements: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

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
      // Students data
      students: recentStudents.map(conn => ({
        id: conn.student.id,
        name: conn.student.name,
        sport: conn.student.sport || 'General',
        level: conn.student.level || 'Beginner',
        achievements: conn.student.achievements ? JSON.parse(conn.student.achievements) : [],
        joinedDate: conn.createdAt,
        performance: Math.floor(Math.random() * 30) + 70 // Mock performance data
      })),
      // Events data
      recentEvents: recentEvents.map(event => ({
        id: event.id,
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
    console.error('Get coach analytics error:', error);
    res.status(500).json(errorResponse('Failed to retrieve analytics.', 500));
  }
});

// Get payment history
router.get('/payments', authenticate, requireCoach, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      coachId: req.coach.id,
      ...(status && { status: status.toUpperCase() })
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
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

    // Update coach status
    const subscriptionExpiresAt = new Date();
    subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 1);

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

module.exports = router;