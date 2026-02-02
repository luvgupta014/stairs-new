/**
 * UID Generator - Custom Format
 * 
 * User Format: <Type><Serial><StateCode><DDMMYY>
 * Example: A0001DL071125 (Student #1 from Delhi, 07 Nov 2025)
 * 
 * Event Format: EVT-<Serial>-<SportCode>-<StateCode>-<DDMMYY>
 * Example: EVT-0001-FB-DL-071125
 * 
 * Certificate Format: STAIRS-CERT-<EventUID>-<StudentUID>
 * Example: STAIRS-CERT-EVT-0001-FB-DL-071125-A0001DL071125
 * 
 * EventOrder Format: EVT-ORDR-<EventUID>-<CoachUID>
 * Example: EVT-ORDR-EVT-0001-FB-DL-071125-C0001DL071125
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
  'Telangana': 'TG',
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

// Sport codes mapping
const SPORT_CODES = {
  'Football': 'FB',
  'Cricket': 'CR',
  'Basketball': 'BB',
  'Basketball 3x3': 'BB3',
  'Volleyball': 'VB',
  'Beach Volleyball': 'BVB',
  'Badminton': 'BD',
  'Tennis': 'TN',
  'Tennis Cricket': 'TCR',
  'Table Tennis': 'TT',
  'Hockey': 'HK',
  'Kabaddi': 'KB',
  'Athletics': 'AT',
  'Swimming (Artistic, Marathon, Regular)': 'SW',
  'Swimming': 'SW',
  'Chess': 'CH',
  'Boxing': 'BX',
  'Kick Boxing': 'KBX',
  'Wrestling': 'WR',
  'Archery': 'AR',
  'Shooting': 'SH',
  'Gymnastics (Rhythmic, Artistic, trampoline)': 'GM',
  'Gymnastics': 'GM',
  'Cycling Track': 'CY',
  'Road Cycling': 'RC',
  'Mountain Biking': 'MB',
  'Bmx Freestyle, Racing': 'BMX',
  'Cycling': 'CY',
  'Weightlifting': 'WL',
  'Judo': 'JD',
  'Karate': 'KR',
  'Taekwondo': 'TK',
  'Atya Patya': 'AP',
  'Kho Kho': 'KK',
  'Silambam': 'SL',
  'Wushu': 'WS',
  'Yogasana': 'YG',
  'Throwball': 'TB',
  'Tug Of War': 'TOW',
  'Jump Rope': 'JR',
  'Skating': 'SK',
  'Skateboarding': 'SB',
  'Sport Climbing': 'SC',
  'Surfing': 'SF',
  'Diving': 'DV',
  'Rowing': 'RW',
  'Sailing': 'SA',
  'Water Polo': 'WP',
  'Canoe Slalom, Sprint': 'CS',
  'Handball': 'HB',
  'Rugby': 'RG',
  'Golf': 'GF',
  'Breaking': 'BR',
  'Modern Pentathlon': 'MP',
  'Triathlon': 'TR',
  'Dance Sports': 'DS',
  'Cultural Activities': 'CA',
  'Physical Education & Sports Sciences': 'PE',
  'Other': 'OT'
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
 * Get sport code from sport name
 */
const getSportCode = (sportName) => {
  if (!sportName) return 'OT'; // Default to Other
  
  const code = SPORT_CODES[sportName];
  if (code) return code;
  
  // Fallback: use first 2 letters uppercase
  return sportName.substring(0, 2).toUpperCase();
};

/**
 * Format date as DDMMYY
 */
const formatDateDDMMYY = (date = new Date()) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
};

/**
 * Get next serial number for a user type, state, and date (DDMMYY)
 */
const getNextUserSerial = async (prefix, stateCode, ddmmyy) => {
  try {
    // Pattern to match: A0001DL071125
    // Using exact format: <prefix><4digits><stateCode><ddmmyy>
    const pattern = `${prefix}____${stateCode}${ddmmyy}`;
    
    const result = await prisma.$queryRaw`
      SELECT "unique_id" 
      FROM "users" 
      WHERE "unique_id" LIKE ${pattern}
      ORDER BY "unique_id" DESC 
      LIMIT 1
    `;
    
    if (!result || result.length === 0) {
      return 1; // First user
    }
    
    const lastUID = result[0].unique_id;
    // Extract serial: A0001DL071125 -> 0001
    const serialStr = lastUID.substring(1, 5); // Characters 1-4 (0001)
    const lastSerial = parseInt(serialStr, 10);
    
    return lastSerial + 1;
  } catch (error) {
    console.error('Error getting next user serial:', error);
    return 1;
  }
};

/**
 * Get next serial number for events
 */
const getNextEventSerial = async () => {
  try {
    const result = await prisma.$queryRaw`
      SELECT unique_id 
      FROM events 
      WHERE unique_id LIKE 'EVT-%'
      ORDER BY unique_id DESC 
      LIMIT 1
    `;
    
    if (!result || result.length === 0) {
      return 1; // First event
    }
    
    const lastUID = result[0].unique_id;
    // Extract serial: EVT-0001-FB-DL-071125 -> 0001
    const parts = lastUID.split('-');
    if (parts.length >= 2) {
      const lastSerial = parseInt(parts[1], 10);
      return lastSerial + 1;
    }
    
    return 1;
  } catch (error) {
    console.error('Error getting next event serial:', error);
    return 1;
  }
};

/**
 * Generate User UID
 * Format: <Type><Serial><StateCode><DDMMYY>
 * Example: A0001DL071125
 * @param {string} userType - STUDENT, COACH, INSTITUTE, CLUB, ADMIN, EVENT_INCHARGE
 * @param {string} state - State name (e.g., "Delhi", "Maharashtra")
 * @param {Date} registrationDate - Date of registration (optional, defaults to now)
 * @returns {Promise<string>} Generated UID (e.g., A0001DL071125)
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
    case 'EVENT_INCHARGE':
      // Event incharge user UID prefix
      prefix = 'E';
      break;
    default:
      throw new Error(`Invalid user type: ${userType}`);
  }
  
  // Get state code
  const stateCode = getStateCode(state);
  
  // Get DDMMYY from registration date
  const ddmmyy = formatDateDDMMYY(registrationDate || new Date());
  
  // Get next serial number
  const serial = await getNextUserSerial(prefix, stateCode, ddmmyy);
  const serialStr = serial.toString().padStart(4, '0'); // 0001, 0002, etc.
  
  // Construct UID: A0001DL071125
  const uid = `${prefix}${serialStr}${stateCode}${ddmmyy}`;
  
  return uid;
};

/**
 * Generate Event UID
 * Format: EVT-<Serial>-<SportCode>-<StateCode>-<DDMMYY>
 * Example: EVT-0001-FB-DL-071125
 * @param {string} sport - Sport name
 * @param {string} state - State where event takes place
 * @param {Date} creationDate - Event creation date (optional, defaults to now)
 * @returns {Promise<string>} Generated Event UID
 */
const generateEventUID = async (sport, state, creationDate = null) => {
  const serial = await getNextEventSerial();
  const serialStr = serial.toString().padStart(4, '0');
  const sportCode = getSportCode(sport);
  const stateCode = getStateCode(state);
  const ddmmyy = formatDateDDMMYY(creationDate || new Date());
  
  return `EVT-${serialStr}-${sportCode}-${stateCode}-${ddmmyy}`;
};

/**
 * Generate Certificate UID
 * Format: STAIRS-CERT-<EventUID>-<StudentUID>
 * Example: STAIRS-CERT-EVT-0001-FB-DL-071125-A0001DL071125
 * @param {string} eventUID - Event's uniqueId
 * @param {string} studentUID - Student's uniqueId
 * @returns {string} Certificate UID
 */
const generateCertificateUID = (eventUID, studentUID) => {
  return `STAIRS-CERT-${eventUID}-${studentUID}`;
};

/**
 * Generate EventOrder UID
 * Format: EVT-ORDR-<EventUID>-<CoachUID>
 * Example: EVT-ORDR-EVT-0001-FB-DL-071125-C0001DL071125
 * @param {string} eventUID - Event's uniqueId
 * @param {string} coachUID - Coach's uniqueId
 * @returns {string} EventOrder UID
 */
const generateEventOrderUID = (eventUID, coachUID) => {
  return `EVT-ORDR-${eventUID}-${coachUID}`;
};

module.exports = {
  generateUID,
  generateEventUID,
  generateCertificateUID,
  generateEventOrderUID,
  getStateCode,
  getSportCode,
  STATE_CODES,
  SPORT_CODES
};
