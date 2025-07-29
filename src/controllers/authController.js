const AuthService = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Authentication controller - delegates HTTP requests to AuthService
 */
class AuthController {
  /**
   * User registration
   * @route POST /api/auth/register
   * @access Public
   */
  register = asyncHandler(async (req, res) => {
    const result = await AuthService.register(req.validated.body);
    
    res.status(201).json(result);
  });

  /**
   * User login
   * @route POST /api/auth/login
   * @access Public
   */
  login = asyncHandler(async (req, res) => {
    const result = await AuthService.login(req.validated.body);
    
    res.json(result);
  });

  /**
   * Token refresh
   * @route POST /api/auth/refresh
   * @access Public
   */
  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const result = await AuthService.refreshToken(refreshToken);
    
    res.json(result);
  });

  /**
   * Logout
   * @route POST /api/auth/logout
   * @access Private
   */
  logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const result = await AuthService.logout(req.user._id, refreshToken);
    
    res.json(result);
  });

  /**
   * Logout from all devices
   * @route POST /api/auth/logout-all
   * @access Private
   */
  logoutAll = asyncHandler(async (req, res) => {
    const result = await AuthService.logoutAll(req.user._id);
    
    res.json(result);
  });

  /**
   * Get current user
   * @route GET /api/auth/me
   * @access Private
   */
  getMe = asyncHandler(async (req, res) => {
    res.json({
      success: true,
      user: req.user
    });
  });

  /**
   * Update profile
   * @route PUT /api/auth/profile
   * @access Private
   */
  updateProfile = asyncHandler(async (req, res) => {
    const result = await AuthService.updateProfile(req.user._id, req.validated.body);
    
    res.json(result);
  });

  /**
   * Change password
   * @route PUT /api/auth/change-password
   * @access Private
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required'
      });
    }

    const result = await AuthService.changePassword(
      req.user._id,
      currentPassword,
      newPassword
    );
    
    res.json(result);
  });
}

module.exports = new AuthController();