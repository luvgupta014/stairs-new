/**
 * Financial Year Utilities
 * Premium memberships are based on financial year: 1st April to 31st March
 */

/**
 * Get the current financial year start date (April 1st)
 * @param {Date} date - Optional date to calculate from (defaults to today)
 * @returns {Date} Start date of current financial year (April 1st)
 */
exports.getFinancialYearStart = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed: Jan=0, Mar=2, Apr=3
  // If before April, FY started last year; otherwise this year
  const fyYear = month < 3 ? year - 1 : year;
  return new Date(fyYear, 3, 1); // April 1st (month 3, day 1)
};

/**
 * Get the current financial year end date (March 31st)
 * @param {Date} date - Optional date to calculate from (defaults to today)
 * @returns {Date} End date of current financial year (March 31st)
 */
exports.getFinancialYearEnd = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  // If before April, FY ends this year; otherwise next year
  const fyYear = month < 3 ? year : year + 1;
  return new Date(fyYear, 2, 31, 23, 59, 59, 999); // March 31st, 11:59:59 PM
};

/**
 * Get financial year label (e.g., "2025-26")
 * @param {Date} date - Optional date to calculate from (defaults to today)
 * @returns {string} Financial year label
 */
exports.getFinancialYearLabel = (date = new Date()) => {
  const start = exports.getFinancialYearStart(date);
  const end = exports.getFinancialYearEnd(date);
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  return `${startYear}-${String(endYear).slice(-2)}`;
};

/**
 * Check if a date falls within the current financial year
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is within current FY
 */
exports.isInCurrentFinancialYear = (date) => {
  const start = exports.getFinancialYearStart();
  const end = exports.getFinancialYearEnd();
  return date >= start && date <= end;
};

/**
 * Get days remaining in current financial year
 * @returns {number} Days remaining until March 31st
 */
exports.getDaysRemainingInFinancialYear = () => {
  const end = exports.getFinancialYearEnd();
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
