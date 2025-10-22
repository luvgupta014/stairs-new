const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const { authenticate, requireCoach, requireAdmin } = require('../utils/authMiddleware');
const { successResponse, errorResponse, getPaginationParams, getPaginationMeta } = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/event-results');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload result files for an event
router.post('/:eventId/results', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId } = req.params;
    const description = req.body?.description || '';
    
    console.log(`📁 Uploading result files for event ${eventId}`);
    console.log(`📋 Coach ID: ${req.coach?.id}`);
    console.log(`📋 User ID: ${req.user?.id}`);
    console.log(`📋 User Role: ${req.user?.role}`);
    console.log('📄 Files object:', req.files);
    console.log('📄 Body:', req.body);
    console.log('📄 Description:', description);

    if (!req.coach || !req.coach.id) {
      console.log('❌ Coach not found in request');
      return res.status(403).json(errorResponse('Coach authentication failed.', 403));
    }

    // Verify event exists and belongs to coach
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        coach: {
          select: { name: true }
        }
      }
    });

    if (!event) {
      console.log('❌ Event not found');
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    if (event.coachId !== req.coach.id) {
      console.log('❌ Access denied - event does not belong to coach');
      return res.status(403).json(errorResponse('Access denied. Event does not belong to you.', 403));
    }

    if (!req.files || !req.files.files) {
      console.log('❌ No files uploaded');
      return res.status(400).json(errorResponse('Please select files to upload.', 400));
    }

    // Handle both single and multiple files
    const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
    
    console.log(`✅ Event verified: ${event.name}`);
    console.log(`👤 Coach: ${event.coach.name}`);
    console.log(`📄 Processing ${files.length} file(s)`);

    const uploadedFiles = [];
    const errors = [];

    // Process each uploaded file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        console.log(`📁 Processing file ${i + 1}: ${file.name}`);
        
        // Validate file type
        const allowedTypes = [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
          'application/csv'
        ];
        
        if (!allowedTypes.includes(file.mimetype) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
          throw new Error('Only Excel files (.xlsx, .xls) and CSV files are allowed');
        }

        // Generate unique filename
        const timestamp = Date.now();
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `event_${eventId}_${timestamp}_${cleanName}`;
        const filePath = path.join(uploadsDir, filename);

        // Move file to uploads directory
        await file.mv(filePath);
        console.log(`✅ File moved to: ${filePath}`);
        
        // Save file info to database
        const resultFile = await prisma.eventResultFile.create({
          data: {
            eventId: eventId,
            coachId: req.coach.id,
            filename: filename,
            originalName: file.name,
            size: file.size,
            mimeType: file.mimetype
          }
        });

        uploadedFiles.push({
          id: resultFile.id,
          originalName: file.name,
          filename: filename,
          fileSize: file.size,
          downloadUrl: `/uploads/event-results/${filename}`,
          uploadedAt: resultFile.uploadedAt
        });

        console.log(`✅ File ${i + 1} saved to database with ID: ${resultFile.id}`);

      } catch (error) {
        console.error(`❌ Error processing file ${file.name}:`, error);
        errors.push({
          filename: file.name,
          error: error.message
        });
      }
    }

    console.log(`📊 Upload summary:`);
    console.log(`✅ Successful uploads: ${uploadedFiles.length}`);
    console.log(`❌ Failed uploads: ${errors.length}`);

    res.json(successResponse({
      event: {
        id: event.id,
        name: event.name
      },
      uploadedFiles,
      errors,
      summary: {
        total: files.length,
        successful: uploadedFiles.length,
        failed: errors.length
      }
    }, `Successfully uploaded ${uploadedFiles.length} result file(s) for event "${event.name}".`));

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    res.status(500).json(errorResponse(
      error.message || 'Failed to upload result files.',
      500
    ));
  }
});

// Get result files for an event (Coach access)
router.get('/:eventId/results', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    console.log(`📁 Getting result files for event ${eventId}`);
    console.log(`📋 Coach ID: ${req.coach?.id}`);

    // Verify event belongs to coach
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, coachId: true }
    });

    if (!event) {
      console.log('❌ Event not found');
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    if (event.coachId !== req.coach.id) {
      console.log('❌ Access denied - event does not belong to coach');
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    console.log(`✅ Event verified: ${event.name}`);

    const [files, total] = await Promise.all([
      prisma.eventResultFile.findMany({
        where: { eventId },
        include: {
          coach: {
            select: { name: true }
          }
        },
        skip,
        take,
        orderBy: { uploadedAt: 'desc' }
      }),
      prisma.eventResultFile.count({ where: { eventId } })
    ]);

    console.log(`📄 Found ${files.length} result files`);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    const formattedFiles = files.map(file => ({
      id: file.id,
      originalName: file.originalName,
      filename: file.filename,
      fileSize: file.size,
      size: file.size, // Add both for compatibility
      downloadUrl: `/uploads/event-results/${file.filename}`,
      uploadedAt: file.uploadedAt,
      uploadedBy: file.coach.name
    }));

    res.json(successResponse({
      event: {
        id: event.id,
        name: event.name
      },
      files: formattedFiles,
      pagination
    }, 'Event result files retrieved successfully.'));

  } catch (error) {
    console.error('Get event files error:', error);
    res.status(500).json(errorResponse('Failed to retrieve result files.', 500));
  }
});

// Delete result file (Coach access)
router.delete('/results/:fileId', authenticate, requireCoach, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Find file and verify ownership
    const file = await prisma.eventResultFile.findUnique({
      where: { id: fileId },
      include: {
        event: {
          select: { name: true }
        }
      }
    });

    if (!file) {
      return res.status(404).json(errorResponse('File not found.', 404));
    }

    if (file.coachId !== req.coach.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../uploads/event-results', file.filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted file: ${filePath}`);
      }
    } catch (fsError) {
      console.error('Failed to delete file from filesystem:', fsError);
    }

    // Delete from database
    await prisma.eventResultFile.delete({
      where: { id: fileId }
    });

    res.json(successResponse(null, `Result file "${file.originalName}" deleted successfully.`));

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json(errorResponse('Failed to delete result file.', 500));
  }
});

// Download result file
router.get('/:eventId/results/:fileId/download', async (req, res) => {
  try {
    const { fileId } = req.params;

    // Find file
    const file = await prisma.eventResultFile.findUnique({
      where: { id: fileId },
      include: {
        event: {
          select: { name: true }
        }
      }
    });

    if (!file) {
      return res.status(404).json(errorResponse('File not found.', 404));
    }

    // Build file path
    const filePath = path.join(__dirname, '../../uploads/event-results', file.filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json(errorResponse('File not found on server.', 404));
    }

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimeType);
    
    // Send file
    res.sendFile(filePath);

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json(errorResponse('Failed to download file.', 500));
  }
});

// Admin routes - Get all event result files
router.get('/results/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, eventId, coachId, search } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      ...(eventId && { eventId }),
      ...(coachId && { coachId }),
      ...(search && {
        OR: [
          { originalName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { event: { name: { contains: search, mode: 'insensitive' } } },
          { coach: { name: { contains: search, mode: 'insensitive' } } }
        ]
      })
    };

    const [files, total] = await Promise.all([
      prisma.eventResultFile.findMany({
        where,
        include: {
          event: {
            select: { id: true, name: true, sport: true, startDate: true }
          },
          coach: {
            select: { id: true, name: true, specialization: true }
          }
        },
        skip,
        take,
        orderBy: { uploadedAt: 'desc' }
      }),
      prisma.eventResultFile.count({ where })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    const formattedFiles = files.map(file => ({
      id: file.id,
      originalName: file.originalName,
      filename: file.filename,
      fileSize: file.size,
      downloadUrl: `/uploads/event-results/${file.filename}`,
      uploadedAt: file.uploadedAt,
      event: file.event,
      coach: file.coach
    }));

    res.json(successResponse({
      files: formattedFiles,
      pagination
    }, 'All event result files retrieved successfully.'));

  } catch (error) {
    console.error('Get all event files error:', error);
    res.status(500).json(errorResponse('Failed to retrieve event result files.', 500));
  }
});

// Create order for event (Coach access)
router.post('/:eventId/orders', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { 
      certificates = 0, 
      medals = 0, 
      trophies = 0, 
      specialInstructions = '', 
      urgentDelivery = false 
    } = req.body;

    console.log(`📦 Creating order for event ${eventId}`);
    console.log(`📋 Coach ID: ${req.coach?.id}`);
    console.log(`📦 Order data:`, { certificates, medals, trophies, specialInstructions, urgentDelivery });

    // Verify event exists and belongs to coach
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        coach: { select: { name: true } }
      }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    if (event.coachId !== req.coach.id) {
      return res.status(403).json(errorResponse('Access denied. Event does not belong to you.', 403));
    }

    // Validate order quantities
    if (certificates < 0 || medals < 0 || trophies < 0) {
      return res.status(400).json(errorResponse('Order quantities cannot be negative.', 400));
    }

    if (certificates === 0 && medals === 0 && trophies === 0) {
      return res.status(400).json(errorResponse('Order must contain at least one item.', 400));
    }

    // Generate unique order number
    const orderNumber = `ORD-${eventId.slice(-6).toUpperCase()}-${Date.now()}`;

    // Create the order
    const order = await prisma.eventOrder.create({
      data: {
        orderNumber,
        eventId,
        coachId: req.coach.id,
        certificates: parseInt(certificates),
        medals: parseInt(medals),
        trophies: parseInt(trophies),
        specialInstructions: specialInstructions || null,
        urgentDelivery: Boolean(urgentDelivery)
      },
      include: {
        event: {
          select: { id: true, name: true, sport: true }
        },
        coach: {
          select: { id: true, name: true }
        }
      }
    });

    console.log(`✅ Order created with ID: ${order.id}`);

    res.status(201).json(successResponse({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        certificates: order.certificates,
        medals: order.medals,
        trophies: order.trophies,
        specialInstructions: order.specialInstructions,
        urgentDelivery: order.urgentDelivery,
        status: order.status,
        createdAt: order.createdAt,
        event: order.event,
        coach: order.coach
      }
    }, `Order created successfully for event "${event.name}".`));

  } catch (error) {
    console.error('❌ Create order error:', error);
    res.status(500).json(errorResponse('Failed to create order.', 500));
  }
});

// Get orders for an event (Coach access)
router.get('/:eventId/orders', authenticate, requireCoach, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const { skip, take } = getPaginationParams(page, limit);

    console.log(`📦 Getting orders for event ${eventId}`);

    // Verify event belongs to coach
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, coachId: true }
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found.', 404));
    }

    if (event.coachId !== req.coach.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    const [orders, total] = await Promise.all([
      prisma.eventOrder.findMany({
        where: { eventId },
        include: {
          event: {
            select: { id: true, name: true, sport: true }
          },
          coach: {
            select: { name: true }
          },
          admin: {
            select: { name: true }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.eventOrder.count({ where: { eventId } })
    ]);

    const pagination = getPaginationMeta(total, parseInt(page), parseInt(limit));

    res.json(successResponse({
      event: {
        id: event.id,
        name: event.name
      },
      orders,
      pagination
    }, 'Event orders retrieved successfully.'));

  } catch (error) {
    console.error('Get event orders error:', error);
    res.status(500).json(errorResponse('Failed to retrieve orders.', 500));
  }
});

// Update order (Coach access - only if order is still PENDING)
router.put('/orders/:orderId', authenticate, requireCoach, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { 
      certificates, 
      medals, 
      trophies, 
      specialInstructions, 
      urgentDelivery 
    } = req.body;

    // Find order and verify ownership
    const order = await prisma.eventOrder.findUnique({
      where: { id: orderId },
      include: {
        event: { select: { name: true } }
      }
    });

    if (!order) {
      return res.status(404).json(errorResponse('Order not found.', 404));
    }

    if (order.coachId !== req.coach.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json(errorResponse('Cannot modify order after it has been processed.', 400));
    }

    // Validate quantities if provided
    if ((certificates !== undefined && certificates < 0) || 
        (medals !== undefined && medals < 0) || 
        (trophies !== undefined && trophies < 0)) {
      return res.status(400).json(errorResponse('Order quantities cannot be negative.', 400));
    }

    const updatedOrder = await prisma.eventOrder.update({
      where: { id: orderId },
      data: {
        ...(certificates !== undefined && { certificates: parseInt(certificates) }),
        ...(medals !== undefined && { medals: parseInt(medals) }),
        ...(trophies !== undefined && { trophies: parseInt(trophies) }),
        ...(specialInstructions !== undefined && { specialInstructions }),
        ...(urgentDelivery !== undefined && { urgentDelivery: Boolean(urgentDelivery) })
      },
      include: {
        event: { select: { id: true, name: true, sport: true } },
        coach: { select: { name: true } }
      }
    });

    res.json(successResponse(updatedOrder, 'Order updated successfully.'));

  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json(errorResponse('Failed to update order.', 500));
  }
});

// Delete order (Coach access - only if order is still PENDING)
router.delete('/orders/:orderId', authenticate, requireCoach, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find order and verify ownership
    const order = await prisma.eventOrder.findUnique({
      where: { id: orderId },
      include: {
        event: { select: { name: true } }
      }
    });

    if (!order) {
      return res.status(404).json(errorResponse('Order not found.', 404));
    }

    if (order.coachId !== req.coach.id) {
      return res.status(403).json(errorResponse('Access denied.', 403));
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json(errorResponse('Cannot delete order after it has been processed.', 400));
    }

    await prisma.eventOrder.delete({
      where: { id: orderId }
    });

    res.json(successResponse(null, `Order "${order.orderNumber}" deleted successfully.`));

  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json(errorResponse('Failed to delete order.', 500));
  }
});

module.exports = router;