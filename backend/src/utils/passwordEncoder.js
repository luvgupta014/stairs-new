// Simple password encoding utility
// This is obfuscation, not encryption - still keep files secure!

const crypto = require('crypto');

// Simple encoding function
function encodePassword(password) {
  return Buffer.from(password).toString('base64');
}

// Simple decoding function  
function decodePassword(encodedPassword) {
  return Buffer.from(encodedPassword, 'base64').toString('utf8');
}

// For your .env file, you can store the encoded version
// Then decode it when creating the email transporter

module.exports = {
  encodePassword,
  decodePassword
};

// Example usage:
// const encoded = encodePassword('your-app-password');
// console.log('Put this in .env:', encoded);
// const decoded = decodePassword(encoded);
// console.log('Decoded:', decoded);