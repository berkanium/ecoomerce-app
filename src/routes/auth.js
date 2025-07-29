const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const  ValidationUtils  = require('../utils/validation');

const router = express.Router();

/**
 * Authentication Routes - User auth endpoints
 */

// @route   POST /api/auth/register
// @desc    User registration
// @access  Public
router.post('/register', 
  validateRequest(ValidationUtils.userSchemas.register),
  AuthController.register
);

// @route   POST /api/auth/login
// @desc    User login
// @access  Public
router.post('/login', 
  validateRequest(ValidationUtils.userSchemas.login),
  AuthController.login
);

// @route   POST /api/auth/refresh
// @desc    Token refresh
// @access  Public
router.post('/refresh', AuthController.refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout
// @access  Private
router.post('/logout', authenticateToken, AuthController.logout);

// @route   POST /api/auth/logout-all
// @desc    Logout from all devices
// @access  Private
router.post('/logout-all', authenticateToken, AuthController.logoutAll);

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', authenticateToken, AuthController.getMe);

// @route   PUT /api/auth/profile
// @desc    Update profile
// @access  Private
router.put('/profile', 
  authenticateToken,
  validateRequest(ValidationUtils.userSchemas.updateProfile),
  AuthController.updateProfile
);

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', authenticateToken, AuthController.changePassword);

module.exports = router;