/**
 * Test Data Factory
 * Generates fake but realistic test data using faker
 */

const faker = require('@faker-js/faker').faker;

/**
 * Generate random Indian phone number
 */
const generateIndianPhone = () => {
  return `${Math.floor(6000000000 + Math.random() * 3999999999)}`;
};

/**
 * Generate random state from Indian states
 */
const generateIndianState = () => {
  const states = [
    'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat',
    'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Punjab', 'Haryana'
  ];
  return faker.helpers.arrayElement(states);
};

/**
 * Generate random sport
 */
const generateSport = () => {
  const sports = [
    'Football', 'Cricket', 'Basketball', 'Volleyball', 'Badminton',
    'Tennis', 'Table Tennis', 'Hockey', 'Kabaddi', 'Athletics'
  ];
  return faker.helpers.arrayElement(sports);
};

/**
 * Generate user data
 */
const generateUserData = (role = 'STUDENT') => {
  return {
    email: faker.internet.email().toLowerCase(),
    phone: generateIndianPhone(),
    password: 'Test@1234',
    role,
    name: faker.person.fullName(),
    state: generateIndianState()
  };
};

/**
 * Generate student profile data
 */
const generateStudentData = () => {
  return {
    name: faker.person.fullName(),
    fatherName: faker.person.fullName(),
    gender: faker.helpers.arrayElement(['Male', 'Female', 'Other']),
    dateOfBirth: faker.date.birthdate({ min: 5, max: 25, mode: 'age' }),
    state: generateIndianState(),
    district: faker.location.city(),
    address: faker.location.streetAddress(),
    pincode: faker.location.zipCode('######'),
    sport: generateSport(),
    level: faker.helpers.arrayElement(['Beginner', 'Intermediate', 'Advanced']),
    school: faker.company.name() + ' School',
    achievements: faker.lorem.sentence()
  };
};

/**
 * Generate coach profile data
 */
const generateCoachData = () => {
  return {
    name: faker.person.fullName(),
    fatherName: faker.person.fullName(),
    motherName: faker.person.fullName(),
    gender: faker.helpers.arrayElement(['Male', 'Female', 'Other']),
    dateOfBirth: faker.date.birthdate({ min: 25, max: 60, mode: 'age' }),
    state: generateIndianState(),
    district: faker.location.city(),
    address: faker.location.streetAddress(),
    pincode: faker.location.zipCode('######'),
    primarySport: generateSport(),
    specialization: faker.lorem.sentence(),
    experience: faker.number.int({ min: 1, max: 20 }),
    certifications: faker.lorem.sentence(),
    bio: faker.lorem.paragraph(),
    location: faker.location.city(),
    city: faker.location.city()
  };
};

/**
 * Generate event data
 */
const generateEventData = (coachId) => {
  const startDate = faker.date.future({ years: 0.5 });
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + faker.number.int({ min: 1, max: 7 }));
  
  return {
    coachId,
    name: `${generateSport()} Championship ${faker.number.int({ min: 2024, max: 2025 })}`,
    description: faker.lorem.paragraph(),
    sport: generateSport(),
    venue: faker.company.name() + ' Stadium',
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: generateIndianState(),
    startDate,
    endDate,
    maxParticipants: faker.number.int({ min: 20, max: 200 }),
    eventFee: faker.number.float({ min: 0, max: 5000, precision: 0.01 }),
    status: 'PENDING'
  };
};

/**
 * Generate institute data
 */
const generateInstituteData = () => {
  return {
    name: faker.company.name() + ' Institute',
    type: faker.helpers.arrayElement(['School', 'College', 'University', 'Training Center']),
    location: faker.location.streetAddress(),
    city: faker.location.city(),
    state: generateIndianState(),
    pincode: faker.location.zipCode('######'),
    established: faker.date.past({ years: 50 }).getFullYear().toString(),
    sportsOffered: [generateSport(), generateSport()].join(', ')
  };
};

/**
 * Generate club data
 */
const generateClubData = () => {
  return {
    name: faker.company.name() + ' Sports Club',
    type: faker.helpers.arrayElement(['Sports Club', 'Athletic Club', 'Recreation Center']),
    location: faker.location.streetAddress(),
    city: faker.location.city(),
    state: generateIndianState(),
    established: faker.date.past({ years: 30 }).getFullYear().toString(),
    facilities: faker.lorem.sentence(),
    membershipTypes: 'Monthly, Quarterly, Annual'
  };
};

/**
 * Generate payment data
 */
const generatePaymentData = (userId, type = 'SUBSCRIPTION') => {
  return {
    userId,
    type,
    amount: faker.number.float({ min: 100, max: 10000, precision: 0.01 }),
    currency: 'INR',
    status: 'PENDING',
    description: faker.lorem.sentence()
  };
};

/**
 * Generate certificate data
 */
const generateCertificateData = (studentId, eventId) => {
  return {
    studentId,
    eventId,
    participantName: faker.person.fullName(),
    sportName: generateSport(),
    eventName: `${generateSport()} Championship`,
    certificateUrl: faker.internet.url(),
    issueDate: new Date()
  };
};

/**
 * Generate event order data
 */
const generateEventOrderData = (eventId, coachId) => {
  return {
    eventId,
    coachId,
    certificates: faker.number.int({ min: 10, max: 100 }),
    medals: faker.number.int({ min: 10, max: 100 }),
    trophies: faker.number.int({ min: 3, max: 20 }),
    certificatePrice: faker.number.float({ min: 50, max: 200, precision: 0.01 }),
    medalPrice: faker.number.float({ min: 100, max: 500, precision: 0.01 }),
    trophyPrice: faker.number.float({ min: 500, max: 2000, precision: 0.01 }),
    status: 'PENDING',
    paymentStatus: 'PENDING'
  };
};

/**
 * Generate multiple records
 */
const generateMultiple = (generator, count = 5) => {
  return Array.from({ length: count }, generator);
};

module.exports = {
  generateIndianPhone,
  generateIndianState,
  generateSport,
  generateUserData,
  generateStudentData,
  generateCoachData,
  generateEventData,
  generateInstituteData,
  generateClubData,
  generatePaymentData,
  generateCertificateData,
  generateEventOrderData,
  generateMultiple,
  faker
};
