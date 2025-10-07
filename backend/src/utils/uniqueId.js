/**
 * Utility functions for generating unique numeric IDs
 */

/**
 * Generate a unique numeric ID based on role and timestamp
 * Format: [ROLE_PREFIX][YEAR][MONTH][DAY][RANDOM_4_DIGITS]
 * 
 * @param {string} role - User role (STUDENT, COACH, INSTITUTE, CLUB, ADMIN)
 * @returns {string} - Unique numeric ID
 */
const generateUniqueId = (role) => {
  const rolePrefix = {
    STUDENT: '10',
    COACH: '20',
    INSTITUTE: '30',
    CLUB: '40',
    ADMIN: '90'
  };

  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  // Generate 4 random digits
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  
  const prefix = rolePrefix[role] || '99';
  
  return `${prefix}${year}${month}${day}${randomPart}`;
};

/**
 * Validate if a unique ID is valid format
 * @param {string} uniqueId - The unique ID to validate
 * @returns {boolean} - Whether the ID is valid
 */
const validateUniqueId = (uniqueId) => {
  // Should be exactly 12 digits
  if (!/^\d{12}$/.test(uniqueId)) {
    return false;
  }
  
  // Check if prefix is valid
  const prefix = uniqueId.substring(0, 2);
  const validPrefixes = ['10', '20', '30', '40', '90'];
  
  return validPrefixes.includes(prefix);
};

/**
 * Get role from unique ID
 * @param {string} uniqueId - The unique ID
 * @returns {string} - The role
 */
const getRoleFromUniqueId = (uniqueId) => {
  const prefix = uniqueId.substring(0, 2);
  const roleMap = {
    '10': 'STUDENT',
    '20': 'COACH',
    '30': 'INSTITUTE',
    '40': 'CLUB',
    '90': 'ADMIN'
  };
  
  return roleMap[prefix] || 'UNKNOWN';
};

/**
 * Format unique ID for display (with dashes for readability)
 * @param {string} uniqueId - The unique ID
 * @returns {string} - Formatted ID
 */
const formatUniqueId = (uniqueId) => {
  if (!uniqueId || uniqueId.length !== 12) return uniqueId;
  
  return `${uniqueId.substring(0, 2)}-${uniqueId.substring(2, 8)}-${uniqueId.substring(8, 12)}`;
};

module.exports = {
  generateUniqueId,
  validateUniqueId,
  getRoleFromUniqueId,
  formatUniqueId
};