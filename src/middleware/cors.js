const cors = require('cors');
const config = require('../config');

/**
 * CORS configuration - Enables secure communication between frontend and backend
 */
const corsOptions = {
  origin: (origin, callback) => {
    // Allow all origins in development
    if (config.env === 'development') {
      return callback(null, true);
    }

    // Only allow whitelisted origins in production
    const allowedOrigins = [
      config.cors.origin,
      'https://berkanium.com'
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: config.cors.credentials,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

module.exports = cors(corsOptions);