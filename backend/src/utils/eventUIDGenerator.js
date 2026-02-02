const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Sport code mappings for common sports
 */
const SPORT_CODES = {
  'football': 'FB',
  'soccer': 'FB',
  'basketball': 'BB',
  'basketball 3x3': 'BB3',
  'cricket': 'CR',
  'tennis': 'TN',
  'tennis cricket': 'TCR',
  'badminton': 'BD',
  'volleyball': 'VB',
  'beach volleyball': 'BVB',
  'hockey': 'HK',
  'athletics': 'ATH',
  'swimming (artistic, marathon, regular)': 'SW',
  'swimming': 'SW',
  'boxing': 'BX',
  'kick boxing': 'KBX',
  'wrestling': 'WR',
  'kabaddi': 'KB',
  'table tennis': 'TT',
  'chess': 'CH',
  'archery': 'AR',
  'shooting': 'SH',
  'gymnastics (rhythmic, artistic, trampoline)': 'GYM',
  'gymnastics': 'GYM',
  'weightlifting': 'WL',
  'judo': 'JD',
  'taekwondo': 'TK',
  'karate': 'KR',
  'cycling track': 'CY',
  'road cycling': 'RC',
  'mountain biking': 'MB',
  'bmx freestyle, racing': 'BMX',
  'cycling': 'CY',
  'running': 'RN',
  'marathon': 'MR',
  'atya patya': 'AP',
  'kho kho': 'KK',
  'silambam': 'SL',
  'wushu': 'WS',
  'yogasana': 'YG',
  'throwball': 'TB',
  'tug of war': 'TOW',
  'jump rope': 'JR',
  'skating': 'SK',
  'skateboarding': 'SB',
  'sport climbing': 'SC',
  'surfing': 'SF',
  'diving': 'DV',
  'rowing': 'RW',
  'sailing': 'SA',
  'water polo': 'WP',
  'canoe slalom, sprint': 'CS',
  'handball': 'HB',
  'rugby': 'RG',
  'golf': 'GF',
  'breaking': 'BR',
  'modern pentathlon': 'MP',
  'triathlon': 'TR',
  'dance sports': 'DS',
  'cultural activities': 'CA',
  'physical education & sports sciences': 'PE'
};

/**
 * Location code mappings for Indian states and major cities
 */
const LOCATION_CODES = {
  // States
  'delhi': 'DL',
  'mumbai': 'MH',
  'bangalore': 'KA',
  'bengaluru': 'KA',
  'hyderabad': 'TS',
  'chennai': 'TN',
  'kolkata': 'WB',
  'pune': 'MH',
  'ahmedabad': 'GJ',
  'jaipur': 'RJ',
  'lucknow': 'UP',
  'kanpur': 'UP',
  'nagpur': 'MH',
  'indore': 'MP',
  'bhopal': 'MP',
  'patna': 'BR',
  'vadodara': 'GJ',
  'ghaziabad': 'UP',
  'ludhiana': 'PB',
  'agra': 'UP',
  'nashik': 'MH',
  'faridabad': 'HR',
  'meerut': 'UP',
  'rajkot': 'GJ',
  'varanasi': 'UP',
  'srinagar': 'JK',
  'aurangabad': 'MH',
  'dhanbad': 'JH',
  'amritsar': 'PB',
  'allahabad': 'UP',
  'ranchi': 'JH',
  'howrah': 'WB',
  'coimbatore': 'TN',
  'jabalpur': 'MP',
  'gwalior': 'MP',
  'vijayawada': 'AP',
  'jodhpur': 'RJ',
  'madurai': 'TN',
  'raipur': 'CG',
  'kota': 'RJ',
  'chandigarh': 'CH',
  'guwahati': 'AS',
  'hubli': 'KA',
  'mysore': 'KA',
  'mysuru': 'KA',
  'tiruchirappalli': 'TN',
  'bareilly': 'UP',
  'moradabad': 'UP',
  'gurgaon': 'HR',
  'gurugram': 'HR',
  'aligarh': 'UP',
  'jalandhar': 'PB',
  'bhubaneswar': 'OR',
  'salem': 'TN',
  'warangal': 'TS',
  'thiruvananthapuram': 'KL',
  'trivandrum': 'KL',
  'kochi': 'KL',
  'cochin': 'KL',
  // State codes
  'andhra pradesh': 'AP',
  'arunachal pradesh': 'AR',
  'assam': 'AS',
  'bihar': 'BR',
  'chhattisgarh': 'CG',
  'goa': 'GA',
  'gujarat': 'GJ',
  'haryana': 'HR',
  'himachal pradesh': 'HP',
  'jharkhand': 'JH',
  'karnataka': 'KA',
  'kerala': 'KL',
  'madhya pradesh': 'MP',
  'maharashtra': 'MH',
  'manipur': 'MN',
  'meghalaya': 'ML',
  'mizoram': 'MZ',
  'nagaland': 'NL',
  'odisha': 'OR',
  'punjab': 'PB',
  'rajasthan': 'RJ',
  'sikkim': 'SK',
  'tamil nadu': 'TN',
  'telangana': 'TS',
  'tripura': 'TR',
  'uttar pradesh': 'UP',
  'uttarakhand': 'UK',
  'west bengal': 'WB',
  'jammu and kashmir': 'JK',
  'ladakh': 'LA'
};

/**
 * Get sport code from sport name
 * @param {string} sportName - Full sport name
 * @returns {string} - 2-3 letter sport code
 */
function getSportCode(sportName) {
  const normalized = sportName.toLowerCase().trim();
  
  if (SPORT_CODES[normalized]) {
    return SPORT_CODES[normalized];
  }
  
  // If not found, generate code from first 2-3 letters
  return sportName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
}

/**
 * Get location code from city/state name
 * @param {string} cityOrState - City or state name
 * @returns {string} - 2 letter location code
 */
function getLocationCode(cityOrState) {
  const normalized = cityOrState.toLowerCase().trim();
  
  if (LOCATION_CODES[normalized]) {
    return LOCATION_CODES[normalized];
  }
  
  // If not found, generate code from first 2 letters
  return cityOrState.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, '');
}

/**
 * Generate a unique event UID with sequential numbering
 * Format: <serial>-<sportCode>-EVT-<locationCode>-<MMYYYY>
 * Example: 01-FB-EVT-DL-112025
 * 
 * @param {string} sport - Sport name
 * @param {string} city - City name
 * @param {Date} startDate - Event start date
 * @returns {Promise<string>} - Generated unique event UID
 */
async function generateEventUID(sport, city, startDate) {
  const sportCode = getSportCode(sport);
  const locationCode = getLocationCode(city);
  
  const date = new Date(startDate);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const dateCode = `${month}${year}`;
  
  // Pattern to match: %-<sportCode>-EVT-<locationCode>-<dateCode>
  // Example: 01-FB-EVT-DL-112025
  const pattern = `%-${sportCode}-EVT-${locationCode}-${dateCode}`;
  
  try {
    // Get the highest serial number for this sport-location-date combination
    const existingEvents = await prisma.$queryRaw`
      SELECT unique_id 
      FROM events 
      WHERE unique_id LIKE ${pattern}
      ORDER BY unique_id DESC 
      LIMIT 1
    `;
    
    let nextSerial = 1;
    
    if (existingEvents && existingEvents.length > 0) {
      // Extract the serial number from the last UID
      const lastUID = existingEvents[0].unique_id;
      const serialStr = lastUID.split('-')[0]; // Get first part before first dash
      const lastSerial = parseInt(serialStr, 10);
      
      if (!isNaN(lastSerial)) {
        nextSerial = lastSerial + 1;
      }
    }
    
    // Check if serial exceeds 99
    if (nextSerial > 99) {
      throw new Error(`Serial number limit reached for ${sportCode}-EVT-${locationCode}-${dateCode}. Maximum 99 events per sport/location/month.`);
    }
    
    // Format serial as 2-digit number
    const serial = String(nextSerial).padStart(2, '0');
    const uid = `${serial}-${sportCode}-EVT-${locationCode}-${dateCode}`;
    
    console.log(`✅ Generated sequential event UID: ${uid}`);
    return uid;
  } catch (error) {
    console.error('❌ Error generating event UID:', error);
    throw error;
  }
}

/**
 * Generate event UID for migration (for existing events without uniqueId)
 * @param {Object} event - Event object with sport, city, startDate
 * @returns {Promise<string>} - Generated unique event UID
 */
async function generateEventUIDForMigration(event) {
  return generateEventUID(event.sport, event.city, event.startDate);
}

module.exports = {
  generateEventUID,
  generateEventUIDForMigration,
  getSportCode,
  getLocationCode,
  SPORT_CODES,
  LOCATION_CODES
};
