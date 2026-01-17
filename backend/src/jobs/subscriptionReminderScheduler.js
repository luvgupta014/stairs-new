const prisma = require('../utils/prismaClient');
const { sendSubscriptionRenewalReminderEmail } = require('../utils/emailService');
const { getFinancialYearEnd, getFinancialYearLabel, getDaysRemainingInFinancialYear } = require('../utils/financialYear');

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Check and send subscription renewal reminders for premium members
 * Reminders sent at: 60 days, 30 days, 15 days, 7 days, 3 days, 1 day before expiry
 */
async function runSubscriptionReminders() {
  const now = new Date();
  const financialYearEnd = getFinancialYearEnd();
  const financialYearLabel = getFinancialYearLabel();
  
  // Reminder thresholds (days before expiry)
  const reminderDays = [60, 30, 15, 7, 3, 1];
  
  console.log(`🔄 Running subscription renewal reminder check for FY ${financialYearLabel}...`);

  // Get all active premium members (coaches with ANNUAL subscription)
  const premiumCoaches = await prisma.coach.findMany({
    where: {
      paymentStatus: 'SUCCESS',
      subscriptionType: 'ANNUAL',
      subscriptionExpiresAt: { 
        gte: now, // Not yet expired
        lte: financialYearEnd // Expires in current FY
      }
    },
    select: {
      id: true,
      name: true,
      subscriptionExpiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          uniqueId: true
        }
      }
    }
  });

  console.log(`📊 Found ${premiumCoaches.length} active premium members`);

  let remindersSent = 0;
  let remindersSkipped = 0;

  for (const coach of premiumCoaches) {
    if (!coach.user?.email) {
      console.warn(`⚠️ Skipping coach ${coach.id}: no email address`);
      remindersSkipped++;
      continue;
    }

    const expiryDate = new Date(coach.subscriptionExpiresAt);
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / DAY_MS);

    // Check if we should send a reminder today (within 1 day of a reminder threshold)
    const shouldRemind = reminderDays.some(threshold => {
      return daysRemaining <= threshold && daysRemaining >= threshold - 1;
    });

    if (!shouldRemind) {
      continue;
    }

    // Check if we already sent a reminder recently (check notifications)
    const recentReminder = await prisma.notification.findFirst({
      where: {
        userId: coach.user.id,
        type: 'GENERAL',
        title: { contains: 'Premium Membership Renewal' },
        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }
    });

    if (recentReminder) {
      console.log(`⏭️ Skipping ${coach.name}: reminder already sent in last 24 hours`);
      remindersSkipped++;
      continue;
    }

    // Send reminder email
    try {
      const result = await sendSubscriptionRenewalReminderEmail(
        coach.user.email,
        coach.name || 'Premium Member',
        expiryDate,
        daysRemaining,
        financialYearLabel
      );

      if (result.success) {
        // Create in-app notification
        await prisma.notification.create({
          data: {
            userId: coach.user.id,
            type: 'GENERAL',
            title: `🔄 Premium Membership Renewal Reminder - ${financialYearLabel}`,
            message: `Your premium membership expires in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}. Renew now to continue enjoying all premium features.`,
            data: JSON.stringify({
              kind: 'SUBSCRIPTION_RENEWAL_REMINDER',
              daysRemaining,
              expiryDate: expiryDate.toISOString(),
              financialYear: financialYearLabel
            })
          }
        }).catch(err => {
          console.warn(`⚠️ Failed to create notification for coach ${coach.id}:`, err.message);
        });

        console.log(`✅ Sent renewal reminder to ${coach.name} (${coach.user.email}) - ${daysRemaining} days remaining`);
        remindersSent++;
      } else {
        console.error(`❌ Failed to send reminder to ${coach.name}:`, result.error);
        remindersSkipped++;
      }
    } catch (error) {
      console.error(`❌ Error sending reminder to ${coach.name}:`, error.message);
      remindersSkipped++;
    }
  }

  console.log(`✅ Subscription reminder check completed: ${remindersSent} sent, ${remindersSkipped} skipped`);
}

function startSubscriptionReminderScheduler() {
  const enabled = process.env.ENABLE_SUBSCRIPTION_REMINDERS !== 'false';
  if (!enabled) {
    console.log('ℹ️ Subscription reminder scheduler disabled');
    return;
  }

  // Run once at startup (with delay to let server initialize)
  setTimeout(() => {
    runSubscriptionReminders().catch((e) => 
      console.error('❌ Subscription reminder scheduler run failed:', e)
    );
  }, 30000); // 30 seconds delay

  // Run daily at 9 AM IST (3:30 AM UTC)
  const dailyInterval = setInterval(() => {
    const now = new Date();
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();
    
    // Run around 3:30 AM UTC (9:00 AM IST)
    if (hour === 3 && minute >= 30 && minute < 40) {
      runSubscriptionReminders().catch((e) => 
        console.error('❌ Subscription reminder scheduler run failed:', e)
      );
    }
  }, 60 * 60 * 1000); // Check every hour

  dailyInterval.unref?.();
  console.log('✅ Subscription reminder scheduler started (daily at 9 AM IST)');
}

module.exports = { 
  startSubscriptionReminderScheduler,
  runSubscriptionReminders 
};
