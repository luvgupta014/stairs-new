/**
 * UID Generator Utility
 * Generates unique IDs in format: [prefix][sequence][stateCode][month][year]
 * Example: a00001DL112025 (athlete from Delhi, November 2025)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// State and Union Territory codes
const STATE_CODES = {
  'Andhra Pradesh': 'AP',
  'Arunachal Pradesh': 'AR',
  'Assam': 'AS',
  'Bihar': 'BR',
  'Chhattisgarh': 'CG',
  'Goa': 'GA',
  'Gujarat': 'GJ',
  'Haryana': 'HR',
  'Himachal Pradesh': 'HP',
  'Jharkhand': 'JH',
  'Karnataka': 'KA',
  'Kerala': 'KL',
  'Madhya Pradesh': 'MP',
  'Maharashtra': 'MH',
  'Manipur': 'MN',
  'Meghalaya': 'ML',
  'Mizoram': 'MZ',
  'Nagaland': 'NL',
  'Odisha': 'OD',
  'Punjab': 'PB',
  'Rajasthan': 'RJ',
  'Sikkim': 'SK',
  'Tamil Nadu': 'TN',
  'Telangana': 'TS',
  'Tripura': 'TR',
  'Uttar Pradesh': 'UP',
  'Uttarakhand': 'UK',
  'West Bengal': 'WB',
  'Andaman and Nicobar Islands': 'AN',
  'Chandigarh': 'CH',
  'Dadra and Nagar Haveli and Daman and Diu': 'DD',
  'Delhi': 'DL',
  'Jammu and Kashmir': 'JK',
  'Ladakh': 'LA',
  'Lakshadweep': 'LD',
  'Puducherry': 'PY'
};

// User type prefixes
const USER_TYPE_PREFIX = {
  'STUDENT': 'a',  // athlete/student
  'COACH': 'c',    // coach/coordinator
  'INSTITUTE': 'i',
  'CLUB': 'b'
};

/**
 * Get state code from state name
 * @param {string} stateName - Full state name
 * @returns {string} Two-letter state code
 */
const getStateCode = (stateName) => {
  if (!stateName) {
    throw new Error('State name is required for UID generation');
  }
  
  const code = STATE_CODES[stateName];
  if (!code) {
    // Fallback: use first 2 letters in uppercase
    console.warn(`State code not found for: ${stateName}, using fallback`);
    return stateName.substring(0, 2).toUpperCase();
  }
  
  return code;
};

/**
 * Get user type prefix
 * @param {string} userType - User role (STUDENT, COACH, INSTITUTE, CLUB)
 * @returns {string} Single character prefix
 */
const getUserTypePrefix = (userType) => {
  const prefix = USER_TYPE_PREFIX[userType];
  
  if (!prefix) {
    throw new Error(`Invalid user type: ${userType}. Must be STUDENT, COACH, INSTITUTE, or CLUB`);
  }
  
  return prefix;
};

/**
 * Get next sequence number for the given combination
 * Uses database lock to ensure uniqueness
 * @param {string} prefix - User type prefix
 * @param {string} stateCode - Two-letter state code
 * @param {string} month - Two-digit month (01-12)
 * @param {string} year - Four-digit year
 * @returns {Promise<string>} Five-digit sequence number
 */
const getNextSequenceNumber = async (prefix, stateCode, month, year) => {
  try {
    // Pattern to match UIDs with same prefix, state, month, year
    // Format: a00001DL112025
    const pattern = `${prefix}%${stateCode}${month}${year}`;
    
    console.log(`🔍 Looking for existing UIDs matching pattern: ${pattern}`);
    
    // Query to get the latest UID with this pattern
    // Using raw query for better control and to ensure proper sorting
    const result = await prisma.$queryRaw`
      SELECT "uniqueId" 
      FROM users 
      WHERE "uniqueId" LIKE ${pattern}
      ORDER BY "uniqueId" DESC 
      LIMIT 1
    `;
    
    if (!result || result.length === 0) {
      // First user for this combination
      console.log('✨ First UID for this combination, starting at 00001');
      return '00001';
    }
    
    // Extract the sequence number from existing UID
    // Format: a00001DL112025
    //         ^^^^^
    const lastUID = result[0].uniqueId;
    console.log(`📋 Last UID found: ${lastUID}`);
    
    const sequenceStr = lastUID.substring(1, 6); // Get 5 digits after prefix
    const lastSequence = parseInt(sequenceStr, 10);
    
    // Increment and format
    const nextSequence = lastSequence + 1;
    
    if (nextSequence > 99999) {
      throw new Error(`Sequence number limit reached for ${prefix}${stateCode}${month}${year}. Maximum 99999 users per month/state/type.`);
    }
    
    const formattedSequence = nextSequence.toString().padStart(5, '0');
    console.log(`➕ Next sequence number: ${formattedSequence}`);
    
    return formattedSequence;
  } catch (error) {
    console.error('❌ Error getting sequence number:', error);
    throw error;
  }
};

/**
 * Main UID Generator Function
 * Format: [prefix][00001-99999][StateCode][MM][YYYY]
 * Example: a00001DL112025
 * 
 * @param {string} userType - User role (STUDENT, COACH, INSTITUTE, CLUB)
 * @param {string} state - Full state name
 * @returns {Promise<string>} Generated UID
 */
const generateUID = async (userType, state) => {
  try {
    console.log(`🆔 === GENERATING UID ===`);
    console.log(`User Type: ${userType}, State: ${state}`);
    
    // Get components
    const prefix = getUserTypePrefix(userType);
    const stateCode = getStateCode(state);
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 01-12
    const year = now.getFullYear().toString(); // 2025
    
    console.log(`📋 UID Components:`, {
      prefix,
      stateCode,
      month,
      year
    });
    
    // Get next sequence number (with retry logic for concurrency)
    let sequence;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      try {
        sequence = await getNextSequenceNumber(prefix, stateCode, month, year);
        break;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw error;
        }
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 100 * attempts));
      }
    }
    
    // Construct UID: a00001DL112025
    const uid = `${prefix}${sequence}${stateCode}${month}${year}`;
    
    console.log(`✅ Generated UID: ${uid}`);
    
    return uid;
  } catch (error) {
    console.error('❌ UID Generation Error:', error);
    throw new Error(`Failed to generate UID: ${error.message}`);
  }
};

/**
 * Validate UID format
 * @param {string} uid - UID to validate
 * @returns {object} Validation result with details
 */
const validateUID = (uid) => {
  // Pattern: a00001DL112025 (1 char + 5 digits + 2 chars + 2 digits + 4 digits = 14 chars)
  const uidPattern = /^[acib]\d{5}[A-Z]{2}\d{6}$/;
  
  if (!uidPattern.test(uid)) {
    return {
      valid: false,
      error: 'Invalid UID format. Expected format: [a/c/i/b][00001-99999][StateCode][MM][YYYY]'
    };
  }
  
  // Extract components for validation
  const prefix = uid[0];
  const sequence = uid.substring(1, 6);
  const stateCode = uid.substring(6, 8);
  const month = uid.substring(8, 10);
  const year = uid.substring(10, 14);
  
  // Validate month (01-12)
  const monthNum = parseInt(month, 10);
  if (monthNum < 1 || monthNum > 12) {
    return {
      valid: false,
      error: 'Invalid month in UID'
    };
  }
  
  // Validate year (reasonable range)
  const yearNum = parseInt(year, 10);
  if (yearNum < 2020 || yearNum > 2100) {
    return {
      valid: false,
      error: 'Invalid year in UID'
    };
  }
  
  return {
    valid: true,
    components: {
      userType: prefix === 'a' ? 'STUDENT' : prefix === 'c' ? 'COACH' : prefix === 'i' ? 'INSTITUTE' : 'CLUB',
      sequence,
      stateCode,
      month,
      year
    }
  };
};

/**
 * Parse UID to extract information
 * @param {string} uid - UID to parse
 * @returns {object} Parsed components
 */
const parseUID = (uid) => {
  const validation = validateUID(uid);
  
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  return validation.components;
};

/**
 * Format UID for display
 * @param {string} uid - UID to format
 * @returns {string} Formatted UID
 */
const formatUID = (uid) => {
  if (!uid || uid.length !== 14) return uid;
  
  // Format: a-00001-DL-11-2025
  return `${uid[0]}-${uid.substring(1, 6)}-${uid.substring(6, 8)}-${uid.substring(8, 10)}-${uid.substring(10, 14)}`;
};

module.exports = {
  generateUID,
  validateUID,
  parseUID,
  formatUID,
  getStateCode,
  getUserTypePrefix,
  STATE_CODES,
  USER_TYPE_PREFIX
};
