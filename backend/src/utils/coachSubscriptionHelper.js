/**
 * Coach Subscription Helper
 * Automatically ensures coaches have ANNUAL subscription (Financial Year: Apr 1 - Mar 31)
 * This fixes existing coaches without requiring a migration script
 */

const { getFinancialYearEnd } = require('./financialYear');

/**
 * Normalize coach subscription - ensures paid coaches have ANNUAL subscription
 * @param {Object} coach - Coach object from database
 * @param {PrismaClient} prisma - Prisma client instance
 * @returns {Promise<Object>} - Updated coach object
 */
async function normalizeCoachSubscription(coach, prisma) {
  if (!coach || !coach.id) return coach;
  
  // Only update if coach has paid but subscription is not ANNUAL
  if (coach.paymentStatus === 'SUCCESS' && coach.subscriptionType !== 'ANNUAL') {
    const fyEnd = getFinancialYearEnd();
    
    try {
      // Update coach subscription to ANNUAL
      await prisma.coach.update({
        where: { id: coach.id },
        data: {
          subscriptionType: 'ANNUAL',
          subscriptionExpiresAt: fyEnd
        }
      });
      
      console.log(`✅ Auto-updated coach ${coach.id} subscription from ${coach.subscriptionType || 'null'} to ANNUAL`);
      
      // Return updated coach object
      return {
        ...coach,
        subscriptionType: 'ANNUAL',
        subscriptionExpiresAt: fyEnd
      };
    } catch (error) {
      console.error(`❌ Failed to auto-update coach ${coach.id} subscription:`, error);
      // Return original coach if update fails
      return coach;
    }
  }
  
  // If subscription is already ANNUAL or coach hasn't paid, return as-is
  return coach;
}

/**
 * Normalize multiple coaches at once
 * @param {Array} coaches - Array of coach objects
 * @param {PrismaClient} prisma - Prisma client instance
 * @returns {Promise<Array>} - Array of normalized coach objects
 */
async function normalizeCoachSubscriptions(coaches, prisma) {
  if (!Array.isArray(coaches) || coaches.length === 0) return coaches;
  
  const normalized = await Promise.all(
    coaches.map(coach => normalizeCoachSubscription(coach, prisma))
  );
  
  return normalized;
}

module.exports = {
  normalizeCoachSubscription,
  normalizeCoachSubscriptions
};
