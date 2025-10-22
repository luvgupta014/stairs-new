const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Clean up invalid student registrations
 * Removes registrations for events that have been cancelled, suspended, or deleted
 */
async function cleanupInvalidRegistrations() {
  try {
    console.log('🧹 Starting cleanup of invalid student registrations...\n');
    
    // Find registrations for events that should not be visible to students
    const invalidRegistrations = await prisma.eventRegistration.findMany({
      where: {
        event: {
          status: {
            in: ['CANCELLED', 'SUSPENDED', 'REJECTED']
          }
        }
      },
      include: {
        event: {
          select: {
            name: true,
            status: true
          }
        },
        student: {
          select: {
            name: true,
            user: {
              select: { email: true }
            }
          }
        }
      }
    });
    
    console.log(`📊 Found ${invalidRegistrations.length} invalid registrations`);
    
    if (invalidRegistrations.length > 0) {
      console.log('\n📋 Invalid registrations found:');
      invalidRegistrations.forEach(reg => {
        console.log(`   - ${reg.student.name} (${reg.student.user.email}) → ${reg.event.name} (${reg.event.status})`);
      });
      
      // Option 1: Delete these registrations (aggressive cleanup)
      // const deleteResult = await prisma.eventRegistration.deleteMany({
      //   where: {
      //     event: {
      //       status: {
      //         in: ['CANCELLED', 'SUSPENDED', 'REJECTED']
      //       }
      //     }
      //   }
      // });
      
      // Option 2: Update registration status to CANCELLED (safer approach)
      const updateResult = await prisma.eventRegistration.updateMany({
        where: {
          event: {
            status: {
              in: ['CANCELLED', 'SUSPENDED', 'REJECTED']
            }
          }
        },
        data: {
          status: 'REJECTED'
        }
      });
      
      console.log(`\n✅ Updated ${updateResult.count} registrations to REJECTED status`);
      console.log('   Students will no longer see these as active registrations');
      
    } else {
      console.log('✅ No invalid registrations found - all clean!');
    }
    
    // Also check for registrations to completely deleted events (if any exist)
    const allRegistrations = await prisma.eventRegistration.findMany({
      select: {
        id: true,
        eventId: true
      }
    });
    
    const orphanedCount = 0;
    for (const reg of allRegistrations) {
      const eventExists = await prisma.event.findUnique({
        where: { id: reg.eventId }
      });
      
      if (!eventExists) {
        console.log(`   Found orphaned registration for deleted event: ${reg.eventId}`);
        await prisma.eventRegistration.delete({
          where: { id: reg.id }
        });
        orphanedCount++;
      }
    }
    
    if (orphanedCount > 0) {
      console.log(`\n✅ Cleaned up ${orphanedCount} orphaned registrations for deleted events`);
    }
    
    console.log('\n🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupInvalidRegistrations();