const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireInstitute, requireApproved } = require('../utils/authMiddleware');
const { 
  successResponse, 
  errorResponse, 
  getPaginationParams, 
  getPaginationMeta,
  validateEmail,
  validatePhone,
  hashPassword,
  isValidExcelFile
} = require('../utils/helpers');
const { generateUID } = require('../utils/uidGenerator');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/bulk');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (isValidExcelFile(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) and CSV files are allowed'));
    }
  }
});

// Get institute profile
router.get('/profile', authenticate, requireInstitute, async (req, res) => {
  try {
    const institute = await prisma.institute.findUnique({
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
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                sport: true,
                level: true,
                user: {
                  select: {
                    email: true,
                    phone: true,
                    isActive: true,
                    isVerified: true
                  }
                }
              }
            }
          },
          take: 10,
          orderBy: {
            createdAt: 'desc'
          }
        },
        coaches: {
          include: {
            coach: {
              select: {
                id: true,
                name: true,
                specialization: true,
                paymentStatus: true,
                user: {
                  select: {
                    email: true,
                    phone: true
                  }
                }
              }
            }
          },
          take: 10,
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            students: true,
            coaches: true
          }
        }
      }
    });

    if (!institute) {
      return res.status(404).json(errorResponse('Institute profile not found.', 404));
    }

    // Transform database field names to match frontend expectations
    const transformedInstitute = {
      ...institute,
      institutionType: institute.type,
      address: institute.location,
      establishedYear: institute.established,
      // Keep original fields for backward compatibility
      type: institute.type,
      location: institute.location,
      established: institute.established
    };

    res.json(successResponse(transformedInstitute, 'Institute profile retrieved successfully.'));

  } catch (error) {
    console.error('Get institute profile error:', error);
    res.status(500).json(errorResponse('Failed to retrieve profile.', 500));
  }
});

// Update institute profile
router.put('/profile', authenticate, requireInstitute, async (req, res) => {
  try {
    const {
      name,
      phone,
      institutionType,
      affiliatedBody,  // Not in schema, ignore
      principalName,  // Not in schema, ignore
      establishedYear,
      address,
      city,
      state,
      district,  // Not in schema, ignore
      pincode,
      description,  // Not in schema, ignore
      facilities,  // Not in schema, ignore
      sportsOffered,
      website  // Not in schema, ignore
    } = req.body;

    console.log('Updating institute profile:', req.body);

    // Update user phone if provided
    if (phone) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { phone }
      });
    }

    // Prepare update data, only include fields that exist in schema
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (institutionType !== undefined) updateData.type = institutionType || null;
    if (address !== undefined) updateData.location = address || null;
    if (city !== undefined) updateData.city = city || null;
    if (state !== undefined) updateData.state = state || null;
    if (pincode !== undefined) updateData.pincode = pincode || null;
    if (establishedYear !== undefined) updateData.established = establishedYear || null;
    if (sportsOffered !== undefined) updateData.sportsOffered = sportsOffered || null;
    // Note: affiliatedBody, principalName, district, description, facilities, website are not in schema

    console.log('Update data:', updateData);

    const updatedInstitute = await prisma.institute.update({
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

    res.json(successResponse(updatedInstitute, 'Profile updated successfully.'));

  } catch (error) {
    console.error('Update institute profile error:', error);
    res.status(500).json(errorResponse('Failed to update profile.', 500));
  }
});

// Get bulk upload template
router.get('/bulk-upload/template', authenticate, requireInstitute, (req, res) => {
  try {
    const { type } = req.query; // 'students' or 'coaches'

    let headers;
    if (type === 'coaches') {
      headers = [
        'firstName',
        'lastName', 
        'email',
        'phone',
        'specialization',
        'experience',
        'hourlyRate',
        'location',
        'bio',
        'certifications' // comma-separated
      ];
    } else {
      headers = [
        'firstName',
        'lastName',
        'email', 
        'phone',
        'dateOfBirth', // YYYY-MM-DD format
        'sport',
        'level', // BEGINNER, INTERMEDIATE, ADVANCED, PROFESSIONAL
        'preferredLocation'
      ];
    }

    // Create sample data
    const sampleData = {};
    headers.forEach(header => {
      if (header === 'email') {
        sampleData[header] = 'example@email.com';
      } else if (header === 'phone') {
        sampleData[header] = '9876543210';
      } else if (header === 'dateOfBirth') {
        sampleData[header] = '2000-01-01';
      } else if (header === 'experience') {
        sampleData[header] = '5';
      } else if (header === 'hourlyRate') {
        sampleData[header] = '1000';
      } else if (header === 'level') {
        sampleData[header] = 'INTERMEDIATE';
      } else if (header === 'certifications') {
        sampleData[header] = 'Cert1, Cert2';
      } else {
        sampleData[header] = `Sample ${header}`;
      }
    });

    // Create Excel workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([sampleData]);
    XLSX.utils.book_append_sheet(wb, ws, type === 'coaches' ? 'Coaches' : 'Students');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename=${type}_template.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Generate template error:', error);
    res.status(500).json(errorResponse('Failed to generate template.', 500));
  }
});

// Bulk upload students
router.post('/bulk-upload/students', authenticate, requireInstitute, requireApproved, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('File is required.', 400));
    }

    const filePath = req.file.path;
    let studentsData = [];

    // Parse file based on extension
    if (req.file.originalname.endsWith('.csv')) {
      // Parse CSV
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => studentsData.push(data))
          .on('end', resolve)
          .on('error', reject);
      });
    } else {
      // Parse Excel
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      studentsData = XLSX.utils.sheet_to_json(worksheet);
    }

    if (studentsData.length === 0) {
      return res.status(400).json(errorResponse('No data found in file.', 400));
    }

    if (studentsData.length > 100) {
      return res.status(400).json(errorResponse('Maximum 100 records allowed per upload.', 400));
    }

    // Validate and process students
    const results = {
      successful: [],
      failed: [],
      total: studentsData.length
    };

    for (let i = 0; i < studentsData.length; i++) {
      const rowData = studentsData[i];
      const rowNumber = i + 2; // Excel row number (header is row 1)

      try {
        // Validate required fields
        if (!rowData.firstName || !rowData.lastName || !rowData.email || !rowData.phone) {
          results.failed.push({
            row: rowNumber,
            data: rowData,
            error: 'Missing required fields (firstName, lastName, email, phone)'
          });
          continue;
        }

        // Validate email
        if (!validateEmail(rowData.email)) {
          results.failed.push({
            row: rowNumber,
            data: rowData,
            error: 'Invalid email format'
          });
          continue;
        }

        // Validate phone
        if (!validatePhone(rowData.phone)) {
          results.failed.push({
            row: rowNumber,
            data: rowData,
            error: 'Invalid phone format'
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: rowData.email },
              { phone: rowData.phone }
            ]
          }
        });

        if (existingUser) {
          results.failed.push({
            row: rowNumber,
            data: rowData,
            error: 'User with this email or phone already exists'
          });
          continue;
        }

        // Generate password (first name + phone last 4 digits)
        const password = rowData.firstName.toLowerCase() + rowData.phone.slice(-4);
        const hashedPassword = await hashPassword(password);

        // Generate uniqueId with new UID format
        const studentState = rowData.state || 'Delhi'; // Default to Delhi if no state provided
        const uniqueId = await generateUID('STUDENT', studentState);
        console.log('Generated UID for student:', uniqueId);

        // Create user and student
        const user = await prisma.user.create({
          data: {
            uniqueId,
            email: rowData.email,
            phone: rowData.phone,
            password: hashedPassword,
            role: 'STUDENT',
            isActive: true,
            phoneVerified: true,
            student: {
              create: {
                firstName: rowData.firstName,
                lastName: rowData.lastName,
                dateOfBirth: rowData.dateOfBirth ? new Date(rowData.dateOfBirth) : null,
                sport: rowData.sport || null,
                level: rowData.level || 'BEGINNER',
                preferredLocation: rowData.preferredLocation || null,
              }
            }
          },
          include: {
            student: true
          }
        });

        // Create institute-student relationship
        await prisma.instituteStudent.create({
          data: {
            instituteId: req.institute.id,
            studentId: user.student.id
          }
        });

        results.successful.push({
          row: rowNumber,
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            tempPassword: password,
            student: user.student
          }
        });

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        results.failed.push({
          row: rowNumber,
          data: rowData,
          error: error.message || 'Failed to create student'
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json(successResponse(results, `Bulk upload completed. ${results.successful.length} successful, ${results.failed.length} failed.`));

  } catch (error) {
    console.error('Bulk upload students error:', error);
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json(errorResponse('Bulk upload failed.', 500));
  }
});

// Bulk upload coaches
router.post('/bulk-upload/coaches', authenticate, requireInstitute, requireApproved, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('File is required.', 400));
    }

    const filePath = req.file.path;
    let coachesData = [];

    // Parse file based on extension
    if (req.file.originalname.endsWith('.csv')) {
      // Parse CSV
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => coachesData.push(data))
          .on('end', resolve)
          .on('error', reject);
      });
    } else {
      // Parse Excel
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      coachesData = XLSX.utils.sheet_to_json(worksheet);
    }

    if (coachesData.length === 0) {
      return res.status(400).json(errorResponse('No data found in file.', 400));
    }

    if (coachesData.length > 50) {
      return res.status(400).json(errorResponse('Maximum 50 coach records allowed per upload.', 400));
    }

    // Validate and process coaches
    const results = {
      successful: [],
      failed: [],
      total: coachesData.length
    };

    for (let i = 0; i < coachesData.length; i++) {
      const rowData = coachesData[i];
      const rowNumber = i + 2;

      try {
        // Validate required fields
        if (!rowData.firstName || !rowData.lastName || !rowData.email || !rowData.phone || !rowData.specialization) {
          results.failed.push({
            row: rowNumber,
            data: rowData,
            error: 'Missing required fields (firstName, lastName, email, phone, specialization)'
          });
          continue;
        }

        // Validate email
        if (!validateEmail(rowData.email)) {
          results.failed.push({
            row: rowNumber,
            data: rowData,
            error: 'Invalid email format'
          });
          continue;
        }

        // Validate phone
        if (!validatePhone(rowData.phone)) {
          results.failed.push({
            row: rowNumber,
            data: rowData,
            error: 'Invalid phone format'
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: rowData.email },
              { phone: rowData.phone }
            ]
          }
        });

        if (existingUser) {
          results.failed.push({
            row: rowNumber,
            data: rowData,
            error: 'User with this email or phone already exists'
          });
          continue;
        }

        // Generate password
        const password = rowData.firstName.toLowerCase() + rowData.phone.slice(-4);
        const hashedPassword = await hashPassword(password);

        // Process certifications
        const certifications = rowData.certifications ? 
          rowData.certifications.split(',').map(cert => cert.trim()).filter(cert => cert) : [];

        // Generate uniqueId with new UID format
        const coachState = rowData.state || 'Delhi'; // Default to Delhi if no state provided
        const uniqueId = await generateUID('COACH', coachState);
        console.log('Generated UID for coach:', uniqueId);

        // Create user and coach
        const user = await prisma.user.create({
          data: {
            uniqueId,
            email: rowData.email,
            phone: rowData.phone,
            password: hashedPassword,
            role: 'COACH',
            isActive: true,
            coach: {
              create: {
                firstName: rowData.firstName,
                lastName: rowData.lastName,
                specialization: rowData.specialization,
                experience: rowData.experience ? parseInt(rowData.experience) : 0,
                hourlyRate: rowData.hourlyRate ? parseFloat(rowData.hourlyRate) : 0,
                location: rowData.location || null,
                bio: rowData.bio || null,
                certifications: certifications,
                approvalStatus: 'PENDING'
              }
            }
          },
          include: {
            coach: true
          }
        });

        results.successful.push({
          row: rowNumber,
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            tempPassword: password,
            coach: user.coach
          }
        });

      } catch (error) {
        console.error(`Error processing coach row ${rowNumber}:`, error);
        results.failed.push({
          row: rowNumber,
          data: rowData,
          error: error.message || 'Failed to create coach'
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json(successResponse(results, `Bulk coach upload completed. ${results.successful.length} successful, ${results.failed.length} failed.`));

  } catch (error) {
    console.error('Bulk upload coaches error:', error);
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json(errorResponse('Bulk coach upload failed.', 500));
  }
});

// Get institute students
router.get('/students', authenticate, requireInstitute, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sport, level } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      institutes: {
        some: {
          instituteId: req.institute.id
        }
      },
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ]
      }),
      ...(sport && { sport: { contains: sport, mode: 'insensitive' } }),
      ...(level && { level: level.toUpperCase() })
    };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              status: true,
              createdAt: true
            }
          },
          coachConnections: {
            where: { status: 'ACCEPTED' },
            include: {
              coach: {
                select: {
                  name: true,
                  specialization: true
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
      prisma.student.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      students,
      pagination
    }, 'Students retrieved successfully.'));

  } catch (error) {
    console.error('Get institute students error:', error);
    res.status(500).json(errorResponse('Failed to retrieve students.', 500));
  }
});

// Get institute coaches
router.get('/coaches', authenticate, requireInstitute, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, specialization, approvalStatus } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ]
      }),
      ...(specialization && { specialization: { contains: specialization, mode: 'insensitive' } }),
      ...(approvalStatus && { approvalStatus: approvalStatus.toUpperCase() })
    };

    const [coaches, total] = await Promise.all([
      prisma.coach.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              status: true,
              createdAt: true
            }
          },
          connections: {
            where: { status: 'ACCEPTED' },
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
              connections: true,
              events: true
            }
          }
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.coach.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      coaches,
      pagination
    }, 'Coaches retrieved successfully.'));

  } catch (error) {
    console.error('Get institute coaches error:', error);
    res.status(500).json(errorResponse('Failed to retrieve coaches.', 500));
  }
});

// Get dashboard analytics
router.get('/dashboard', authenticate, requireInstitute, async (req, res) => {
  try {
    const instituteId = req.institute.id;

    const [
      totalStudents,
      totalCoaches,
      activeConnections,
      pendingApprovals,
      recentRegistrations
    ] = await Promise.all([
      prisma.instituteStudent.count({
        where: { instituteId: instituteId }
      }),
      prisma.instituteCoach.count({
        where: { instituteId: instituteId }
      }),
      prisma.studentCoachConnection.count({
        where: {
          status: 'ACCEPTED',
          student: {
            instituteStudents: {
              some: {
                instituteId: instituteId
              }
            }
          }
        }
      }),
      prisma.coach.count({
        where: { 
          OR: [
            { paymentStatus: 'PENDING' },
            { isActive: false }
          ]
        }
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { 
              studentProfile: { 
                instituteStudents: {
                  some: {
                    instituteId: instituteId
                  }
                }
              } 
            },
            { role: 'COACH' }
          ]
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          studentProfile: {
            select: {
              name: true
            }
          },
          coachProfile: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    res.json(successResponse({
      totalStudents,
      totalCoaches,
      activeConnections,
      pendingApprovals,
      recentRegistrations
    }, 'Analytics retrieved successfully.'));

  } catch (error) {
    console.error('Get institute analytics error:', error);
    res.status(500).json(errorResponse('Failed to retrieve analytics.', 500));
  }
});

module.exports = router;