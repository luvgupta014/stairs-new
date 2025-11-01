/**
 * Migration Script: Generate new UIDs for existing users
 * This script generates UIDs in the format: [prefix][sequence][stateCode][month][year]
 * Example: a00001DL112025
 * 
 * Note: This updates the uniqueId field with the new UID format
 */

const { PrismaClient } = require('@prisma/client');
const { generateUID } = require('../src/utils/uidGenerator');

const prisma = new PrismaClient();

async function migrateUsers() {
  console.log('🚀 === STARTING UID MIGRATION ===\n');
  
  try {
    // Get all users - we'll regenerate all uniqueIds with the new format
    const users = await prisma.user.findMany({
      include: {
        studentProfile: true,
        coachProfile: true,
        instituteProfile: true,
        clubProfile: true
      }
    });

    console.log(`📊 Found ${users.length} users to migrate\n`);

    if (users.length === 0) {
      console.log('✅ No users to migrate.\n');
      return;
    }

    let successful = 0;
    let failed = 0;
    const errors = [];

    for (const user of users) {
      try {
        let state = null;

        // Get state based on user role
        if (user.role === 'STUDENT' && user.studentProfile) {
          state = user.studentProfile.state;
        } else if (user.role === 'COACH' && user.coachProfile) {
          state = user.coachProfile.state;
        } else if (user.role === 'INSTITUTE' && user.instituteProfile) {
          state = user.instituteProfile.state;
        } else if (user.role === 'CLUB' && user.clubProfile) {
          state = user.clubProfile.state;
        }

        // Skip if state is not available
        if (!state) {
          console.warn(`⚠️  Skipping user ${user.id} (${user.role}): No state information available`);
          failed++;
          errors.push({
            userId: user.id,
            role: user.role,
            error: 'No state information'
          });
          continue;
        }

        // Generate new UID
        const uniqueId = await generateUID(user.role, state);

        // Update user with new uniqueId
        await prisma.user.update({
          where: { id: user.id },
          data: { uniqueId }
        });

        console.log(`✅ Generated UID ${uniqueId} for user ${user.id} (${user.role}, ${state})`);
        successful++;

      } catch (error) {
        console.error(`❌ Failed to generate UID for user ${user.id}:`, error.message);
        failed++;
        errors.push({
          userId: user.id,
          role: user.role,
          error: error.message
        });
      }
    }

    console.log('\n🎉 === MIGRATION COMPLETED ===\n');
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (errors.length > 0) {
      console.log('\n📋 Errors:');
      errors.forEach(err => {
        console.log(`   - User ${err.userId} (${err.role}): ${err.error}`);
      });
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateUsers()
  .then(() => {
    console.log('\n✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
