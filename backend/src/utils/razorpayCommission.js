/**
 * Razorpay Commission Calculator
 * Standard commission rate: 2% + GST (18% on commission) = ~2.36%
 * For simplicity, we use 2.5% as an approximation
 */

const COMMISSION_RATE = 0.025; // 2.5% commission

/**
 * Calculate Razorpay commission for a transaction amount
 * @param {number} amount - Transaction amount in rupees
 * @returns {number} Commission amount in rupees
 */
exports.calculateCommission = (amount) => {
  if (!amount || amount <= 0) return 0;
  return Math.round(amount * COMMISSION_RATE * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate net revenue after Razorpay commission
 * @param {number} amount - Gross transaction amount
 * @returns {number} Net revenue after commission
 */
exports.calculateNetRevenue = (amount) => {
  if (!amount || amount <= 0) return 0;
  return Math.round((amount - exports.calculateCommission(amount)) * 100) / 100;
};

/**
 * Calculate commission for multiple transactions
 * @param {Array<{amount: number}>} transactions - Array of transaction objects with amount
 * @returns {{totalGross: number, totalCommission: number, totalNet: number}}
 */
exports.calculateBulkCommission = (transactions = []) => {
  const totalGross = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalCommission = exports.calculateCommission(totalGross);
  const totalNet = totalGross - totalCommission;
  
  return {
    totalGross: Math.round(totalGross * 100) / 100,
    totalCommission: Math.round(totalCommission * 100) / 100,
    totalNet: Math.round(totalNet * 100) / 100
  };
};
