const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migratePaymentData() {
  try {
    console.log('🔄 Starting payment data migration...');

    // Get all payments that have coachId but not userId
    const paymentsToMigrate = await prisma.payment.findMany({
      where: {
        AND: [
          { coachId: { not: null } },
          { userId: null }
        ]
      },
      include: {
        coach: {
          include: {
            user: true
          }
        }
      }
    });

    console.log(`📊 Found ${paymentsToMigrate.length} payments to migrate`);

    for (const payment of paymentsToMigrate) {
      if (payment.coach?.user) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            userId: payment.coach.user.id,
            userType: 'COACH'
          }
        });
        console.log(`✅ Migrated payment ${payment.id} for coach ${payment.coach.name}`);
      } else {
        console.log(`⚠️ Could not find user for coach in payment ${payment.id}`);
      }
    }

    console.log('✨ Payment migration completed successfully!');
  } catch (error) {
    console.error('❌ Error migrating payment data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migratePaymentData();