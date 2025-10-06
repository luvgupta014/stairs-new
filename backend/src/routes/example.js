// Example route file
const express = require('express');
const router = express.Router();

// Import auth middleware
const { authenticateToken } = require('../utils/authMiddleware');

// Example protected route
router.get('/protected', authenticateToken, (req, res) => {
  res.json({
    message: 'This is a protected route',
    user: req.user
  });
});

// Example public route
router.get('/public', (req, res) => {
  res.json({
    message: 'This is a public route'
  });
});

module.exports = router;