const express = require('express');
const axios = require('axios');
const router = express.Router();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// CORS middleware for maps routes - ensure portal.stairs.org.in is allowed
router.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://portal.stairs.org.in',
    'https://www.portal.stairs.org.in',
    'https://stairs.astroraag.com',
    'http://localhost:5173',
    'http://localhost:5174'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Proxy endpoint for Google Places Autocomplete
router.get('/places/autocomplete', async (req, res) => {
  try {
    const { input, types = 'establishment' } = req.query;
    
    if (!input) {
      return res.status(400).json({ error: 'Input parameter required' });
    }
    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(503).json({
        error: 'Google Maps API key not configured on server.',
        code: 'MAPS_KEY_MISSING',
        fallback: true
      });
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
      params: {
        input,
        types,
        key: GOOGLE_MAPS_API_KEY,
        language: 'en'
      }
    });

    if (response?.data?.status && response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      console.error('Google Places Autocomplete returned:', response.data.status, response.data.error_message || '');
      return res.status(502).json({
        error: 'Google Places API returned an error.',
        status: response.data.status,
        error_message: response.data.error_message,
        fallback: true
      });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Google Places API error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch place suggestions',
      fallback: true 
    });
  }
});

// Proxy endpoint for Place Details
router.get('/places/details', async (req, res) => {
  try {
    const { place_id } = req.query;
    
    if (!place_id) {
      return res.status(400).json({ error: 'place_id parameter required' });
    }
    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(503).json({
        error: 'Google Maps API key not configured on server.',
        code: 'MAPS_KEY_MISSING',
        fallback: true
      });
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id,
        fields: 'place_id,name,formatted_address,geometry,address_components',
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response?.data?.status && response.data.status !== 'OK') {
      console.error('Google Places Details returned:', response.data.status, response.data.error_message || '');
      return res.status(502).json({
        error: 'Google Place Details API returned an error.',
        status: response.data.status,
        error_message: response.data.error_message,
        fallback: true
      });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Google Place Details API error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch place details',
      fallback: true 
    });
  }
});

module.exports = router;