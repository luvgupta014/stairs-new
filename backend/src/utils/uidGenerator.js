/**
 * UID Generator - Custom Format
 * Format: <Type><Serial><StateCode><MMYY>
 * Example: A0001DL1124 (Student #1 from Delhi, Nov 2024)
 * 
 * Type Prefixes:
 * - Students: A
 * - Coaches: C
 * - Institutes: I
 * - Clubs: B
 * - Admin: ADMIN
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// State codes mapping
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

/**
 * Get state code from state name
 */
const getStateCode = (stateName) => {
  if (!stateName) return 'DL'; // Default to Delhi
  
  const code = STATE_CODES[stateName];
  if (code) return code;
  
  // Fallback: use first 2 letters uppercase
  return stateName.substring(0, 2).toUpperCase();
};

/**
 * Get next serial number for a user type, state, and month/year
 */
const getNextSerial = async (prefix, stateCode, mmyy) => {
  try {
    // Pattern to match: A0001DL1124
    const pattern = `${prefix}%${stateCode}${mmyy}`;
    
    const result = await prisma.$queryRaw`
      SELECT unique_id 
      FROM users 
      WHERE unique_id LIKE ${pattern}
      ORDER BY unique_id DESC 
      LIMIT 1
    `;
    
    if (!result || result.length === 0) {
      return 1; // First user
    }
    
    const lastUID = result[0].unique_id;
    // Extract serial: A0001DL1124 -> 0001
    const serialStr = lastUID.substring(1, 5); // Characters 1-4 (0001)
    const lastSerial = parseInt(serialStr, 10);
    
    return lastSerial + 1;
  } catch (error) {
    console.error('Error getting next serial:', error);
    return 1;
  }
};

/**
 * Generate UID
 * @param {string} userType - STUDENT, COACH, INSTITUTE, CLUB, ADMIN
 * @param {string} state - State name (e.g., "Delhi", "Maharashtra")
 * @param {Date} registrationDate - Date of registration (optional, defaults to now)
 * @returns {Promise<string>} Generated UID (e.g., A0001DL1124)
 */
const generateUID = async (userType, state = 'Delhi', registrationDate = null) => {
  // Admin gets special UID
  if (userType === 'ADMIN') {
    return 'ADMIN';
  }
  
  // Get prefix
  let prefix;
  switch (userType) {
    case 'STUDENT':
      prefix = 'A';
      break;
    case 'COACH':
      prefix = 'C';
      break;
    case 'INSTITUTE':
      prefix = 'I';
      break;
    case 'CLUB':
      prefix = 'B';
      break;
    default:
      throw new Error(`Invalid user type: ${userType}`);
  }
  
  // Get state code
  const stateCode = getStateCode(state);
  
  // Get MMYY from registration date
  const date = registrationDate || new Date();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 01-12
  const year = date.getFullYear().toString().slice(-2); // Last 2 digits: 24, 25
  const mmyy = month + year;
  
  // Get next serial number
  const serial = await getNextSerial(prefix, stateCode, mmyy);
  const serialStr = serial.toString().padStart(4, '0'); // 0001, 0002, etc.
  
  // Construct UID: A0001DL1124
  const uid = `${prefix}${serialStr}${stateCode}${mmyy}`;
  
  return uid;
};

module.exports = {
  generateUID,
  getStateCode,
  STATE_CODES
};
