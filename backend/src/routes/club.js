const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireClub } = require('../utils/authMiddleware');
const { 
  successResponse, 
  errorResponse, 
  getPaginationParams, 
  getPaginationMeta 
} = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

// Get club profile
router.get('/profile', authenticate, requireClub, async (req, res) => {
  try {
    const club = await prisma.club.findUnique({
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
        members: {
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
          },
          orderBy: {
            joinedAt: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    if (!club) {
      return res.status(404).json(errorResponse('Club profile not found.', 404));
    }

    res.json(successResponse(club, 'Club profile retrieved successfully.'));

  } catch (error) {
    console.error('Get club profile error:', error);
    res.status(500).json(errorResponse('Failed to retrieve profile.', 500));
  }
});

// Update club profile
router.put('/profile', authenticate, requireClub, async (req, res) => {
  try {
    const {
      name,
      address,
      website,
      description,
      sportsOffered,
      contactPerson,
      establishedYear
    } = req.body;

    const updatedClub = await prisma.club.update({
      where: { userId: req.user.id },
      data: {
        name,
        address,
        website,
        description,
        sportsOffered: sportsOffered || undefined,
        contactPerson,
        establishedYear: establishedYear ? parseInt(establishedYear) : undefined
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

    res.json(successResponse(updatedClub, 'Profile updated successfully.'));

  } catch (error) {
    console.error('Update club profile error:', error);
    res.status(500).json(errorResponse('Failed to update profile.', 500));
  }
});

// Get club members
router.get('/members', authenticate, requireClub, async (req, res) => {
  try {
    const { 
      status, 
      sport, 
      search, 
      page = 1, 
      limit = 10 
    } = req.query;

    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      clubId: req.club.id,
      ...(status && { status: status.toUpperCase() }),
      ...(search && {
        OR: [
          { student: { name: { contains: search, mode: 'insensitive' } } },
          { student: { user: { email: { contains: search, mode: 'insensitive' } } } }
        ]
      })
    };

    const [members, total] = await Promise.all([
      prisma.clubMember.findMany({
        where,
        include: {
          student: {
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
          }
        },
        skip,
        take,
        orderBy: { joinedAt: 'desc' }
      }),
      prisma.clubMember.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    // Transform members data to match frontend expectations
    const transformedMembers = members.map(member => ({
      id: member.id,
      name: member.student.name || 'Unknown',
      email: member.student.user.email,
      phone: member.student.user.phone,
      membershipType: member.membershipType || 'REGULAR',
      status: member.status.toLowerCase(),
      joinedDate: member.joinedAt.toISOString().split('T')[0],
      lastActivity: member.joinedAt.toISOString().split('T')[0], // Using joinedAt as placeholder
      isActive: member.student.user.isActive
    }));

    res.json(successResponse({
      members: transformedMembers,
      pagination
    }, 'Club members retrieved successfully.'));

  } catch (error) {
    console.error('Get club members error:', error);
    res.status(500).json(errorResponse('Failed to retrieve club members.', 500));
  }
});

// Add member to club
router.post('/members', authenticate, requireClub, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      sport,
      membershipType = 'REGULAR', // REGULAR, PREMIUM, VIP
      fees
    } = req.body;

    // Validation
    if (!name || !email || !phone) {
      return res.status(400).json(errorResponse('All required fields must be provided.', 400));
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

    let userId;
    if (user) {
      userId = user.id;
      
      // Check if already a member
      const existingMember = await prisma.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: userId,
            clubId: req.club.id
          }
        }
      });

      if (existingMember) {
        return res.status(409).json(errorResponse('User is already a member of this club.', 409));
      }
    } else {
      // Create new user without password (they can set it later)
      const newUser = await prisma.user.create({
        data: {
          email,
          phone,
          role: 'STUDENT',
          status: 'PENDING_VERIFICATION'
        }
      });
      userId = newUser.id;
    }

    // Create club membership
    const member = await prisma.clubMember.create({
      data: {
        userId: userId,
        clubId: req.club.id,
        name,
        sport,
        membershipType: membershipType.toUpperCase(),
        fees: fees ? parseFloat(fees) : 0,
        status: 'ACTIVE',
        joinedAt: new Date()
      },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
            status: true
          }
        }
      }
    });

    res.status(201).json(successResponse(member, 'Member added successfully.', 201));

  } catch (error) {
    console.error('Add club member error:', error);
    res.status(500).json(errorResponse('Failed to add member.', 500));
  }
});

// Update member
router.put('/members/:memberId', authenticate, requireClub, async (req, res) => {
  try {
    const { memberId } = req.params;
    const {
      name,
      sport,
      membershipType,
      fees,
      status
    } = req.body;

    // Check if member belongs to this club
    const existingMember = await prisma.clubMember.findUnique({
      where: { id: memberId }
    });

    if (!existingMember) {
      return res.status(404).json(errorResponse('Member not found.', 404));
    }

    if (existingMember.clubId !== req.club.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    const updatedMember = await prisma.clubMember.update({
      where: { id: memberId },
      data: {
        name,
        sport,
        membershipType: membershipType ? membershipType.toUpperCase() : undefined,
        fees: fees !== undefined ? parseFloat(fees) : undefined,
        status: status ? status.toUpperCase() : undefined
      },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
            status: true
          }
        }
      }
    });

    res.json(successResponse(updatedMember, 'Member updated successfully.'));

  } catch (error) {
    console.error('Update club member error:', error);
    res.status(500).json(errorResponse('Failed to update member.', 500));
  }
});

// Remove member
router.delete('/members/:memberId', authenticate, requireClub, async (req, res) => {
  try {
    const { memberId } = req.params;

    // Check if member belongs to this club
    const existingMember = await prisma.clubMember.findUnique({
      where: { id: memberId }
    });

    if (!existingMember) {
      return res.status(404).json(errorResponse('Member not found.', 404));
    }

    if (existingMember.clubId !== req.club.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    await prisma.clubMember.delete({
      where: { id: memberId }
    });

    res.json(successResponse(null, 'Member removed successfully.'));

  } catch (error) {
    console.error('Remove club member error:', error);
    res.status(500).json(errorResponse('Failed to remove member.', 500));
  }
});

// Get club facilities
router.get('/facilities', authenticate, requireClub, async (req, res) => {
  try {
    const { type, available, page = 1, limit = 10 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      clubId: req.club.id,
      ...(type && { type: { contains: type, mode: 'insensitive' } }),
      ...(available !== undefined && { available: available === 'true' })
    };

    const [facilities, total] = await Promise.all([
      prisma.clubFacility.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.clubFacility.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      facilities,
      pagination
    }, 'Club facilities retrieved successfully.'));

  } catch (error) {
    console.error('Get club facilities error:', error);
    res.status(500).json(errorResponse('Failed to retrieve facilities.', 500));
  }
});

// Add facility
router.post('/facilities', authenticate, requireClub, async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      capacity,
      hourlyRate,
      available = true,
      amenities
    } = req.body;

    // Validation
    if (!name || !type) {
      return res.status(400).json(errorResponse('Name and type are required.', 400));
    }

    const facility = await prisma.clubFacility.create({
      data: {
        clubId: req.club.id,
        name,
        type,
        description,
        capacity: capacity ? parseInt(capacity) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : 0,
        available,
        amenities: amenities || []
      }
    });

    res.status(201).json(successResponse(facility, 'Facility added successfully.', 201));

  } catch (error) {
    console.error('Add facility error:', error);
    res.status(500).json(errorResponse('Failed to add facility.', 500));
  }
});

// Update facility
router.put('/facilities/:facilityId', authenticate, requireClub, async (req, res) => {
  try {
    const { facilityId } = req.params;
    const {
      name,
      type,
      description,
      capacity,
      hourlyRate,
      available,
      amenities
    } = req.body;

    // Check if facility belongs to this club
    const existingFacility = await prisma.clubFacility.findUnique({
      where: { id: facilityId }
    });

    if (!existingFacility) {
      return res.status(404).json(errorResponse('Facility not found.', 404));
    }

    if (existingFacility.clubId !== req.club.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    const updatedFacility = await prisma.clubFacility.update({
      where: { id: facilityId },
      data: {
        name,
        type,
        description,
        capacity: capacity ? parseInt(capacity) : undefined,
        hourlyRate: hourlyRate !== undefined ? parseFloat(hourlyRate) : undefined,
        available,
        amenities: amenities || undefined
      }
    });

    res.json(successResponse(updatedFacility, 'Facility updated successfully.'));

  } catch (error) {
    console.error('Update facility error:', error);
    res.status(500).json(errorResponse('Failed to update facility.', 500));
  }
});

// Delete facility
router.delete('/facilities/:facilityId', authenticate, requireClub, async (req, res) => {
  try {
    const { facilityId } = req.params;

    // Check if facility belongs to this club
    const existingFacility = await prisma.clubFacility.findUnique({
      where: { id: facilityId }
    });

    if (!existingFacility) {
      return res.status(404).json(errorResponse('Facility not found.', 404));
    }

    if (existingFacility.clubId !== req.club.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    await prisma.clubFacility.delete({
      where: { id: facilityId }
    });

    res.json(successResponse(null, 'Facility deleted successfully.'));

  } catch (error) {
    console.error('Delete facility error:', error);
    res.status(500).json(errorResponse('Failed to delete facility.', 500));
  }
});

// Get club analytics
router.get('/dashboard', authenticate, requireClub, async (req, res) => {
  try {
    const clubId = req.club.id;

    const [
      totalMembers,
      activeMembers,
      membersByType,
      recentJoins
    ] = await Promise.all([
      prisma.clubMember.count({
        where: { clubId }
      }),
      prisma.clubMember.count({
        where: { clubId, status: 'ACTIVE' }
      }),
      prisma.clubMember.groupBy({
        by: ['membershipType'],
        where: { clubId },
        _count: { membershipType: true }
      }),
      prisma.clubMember.findMany({
        where: { clubId },
        orderBy: { joinedAt: 'desc' },
        take: 10,
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
      })
    ]);

    res.json(successResponse({
      totalMembers,
      activeMembers,
      monthlyRevenue: 0, // Since there's no fees field, set to 0
      membersByType,
      recentJoins
    }, 'Club dashboard data retrieved successfully.'));

  } catch (error) {
    console.error('Get club analytics error:', error);
    res.status(500).json(errorResponse('Failed to retrieve analytics.', 500));
  }
});

module.exports = router;