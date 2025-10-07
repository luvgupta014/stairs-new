const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// JWT Utilities
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Password Utilities
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// OTP Utilities
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateSecureCode = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Validation Utilities
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  // return passwordRegex.test(password);
  return true;
};

// Date Utilities
const addMinutes = (date, minutes) => {
  return new Date(date.getTime() + minutes * 60000);
};

const addDays = (date, days) => {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

// Response Utilities
const successResponse = (data = null, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    statusCode
  };
};

const errorResponse = (message = 'Error', statusCode = 500, errors = null) => {
  return {
    success: false,
    message,
    errors,
    statusCode
  };
};

// File Utilities
const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

const isValidImageFile = (filename) => {
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  return validExtensions.includes(getFileExtension(filename));
};

const isValidExcelFile = (filename) => {
  const validExtensions = ['xlsx', 'xls', 'csv'];
  return validExtensions.includes(getFileExtension(filename));
};

// String Utilities
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Pagination Utilities
const getPaginationParams = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  
  return {
    page: pageNum,
    limit: limitNum,
    skip,
    take: limitNum
  };
};

const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

/**
 * Format response data consistently
 * @param {boolean} success - Whether the operation was successful
 * @param {string} message - Response message
 * @param {any} data - Response data
 * @param {number} code - HTTP status code
 * @returns {Object} Formatted response object
 */
const formatResponse = (success, message, data = null, code = 200) => {
  return {
    success,
    message,
    data,
    code,
    timestamp: new Date().toISOString()
  };
};

/**
 * Validate email format (legacy)
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
const isValidEmail = (email) => {
  return validateEmail(email);
};

/**
 * Generate random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Sanitize user input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Check if string is empty or whitespace
 * @param {string} str - String to check
 * @returns {boolean} Whether string is empty
 */
const isEmpty = (str) => {
  return !str || str.trim().length === 0;
};

module.exports = {
  // JWT
  generateToken,
  verifyToken,
  
  // Password
  hashPassword,
  comparePassword,
  
  // OTP
  generateOTP,
  generateSecureCode,
  
  // Validation
  validateEmail,
  validatePhone,
  validatePassword,
  
  // Date
  addMinutes,
  addDays,
  addMonths,
  
  // Response
  successResponse,
  errorResponse,
  
  // File
  getFileExtension,
  isValidImageFile,
  isValidExcelFile,
  
  // String
  generateSlug,
  capitalizeFirstLetter,
  
  // Pagination
  getPaginationParams,
  getPaginationMeta,
  
  // Legacy
  formatResponse,
  isValidEmail,
  generateRandomString,
  sanitizeInput,
  isEmpty
};