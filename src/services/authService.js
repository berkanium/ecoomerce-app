const User = require('../models/User');
const JWTUtils = require('../utils/jwt');
const BcryptUtils = require('../utils/bcrypt');
const logger = require('../utils/logger');

/**
 * Authentication service class
 * User registration, login, and token management
 */
class AuthService {
  /**
   * User registration
   * @param {Object} userData - User information
   * @returns {Object} Registration result
   */
  async register(userData) {
    try {
      const { firstName, lastName, email, password, phone } = userData;

      // Check email
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('This email address is already in use');
      }

      // Create user
      const user = new User({
        firstName,
        lastName,
        email,
        password, // Pre-save hook will automatically hash
        phone
      });

      await user.save();

      // Generate tokens
      const accessToken = JWTUtils.generateAccessToken({ userId: user._id });
      const refreshToken = JWTUtils.generateRefreshToken({ userId: user._id });

      // Save refresh token
      user.refreshTokens.push({ token: refreshToken });
      
      await user.save();

      logger.info('New user registration:', { userId: user._id, email });

      return {
        success: true,
        message: 'User registered successfully',
        user: user.toJSON(),
        tokens: {
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      logger.error('Registration error:', { error: error.message });
      throw error;
    }
  }

  /**
   * User login
   * @param {Object} credentials - Login credentials
   * @returns {Object} Login result
   */
  async login(credentials) {
    try {
      const { email, password } = credentials;

      // Find user (including password)
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Is account active?
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Password check
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate tokens
      const accessToken = JWTUtils.generateAccessToken({ userId: user._id });
      const refreshToken = JWTUtils.generateRefreshToken({ userId: user._id });

      // Save refresh token and update last login time
      user.refreshTokens.push({ token: refreshToken });
      user.lastLogin = new Date();
      await user.save();

      logger.info('User login:', { userId: user._id, email });

      return {
        success: true,
        message: 'Login successful',
        user: user.toJSON(),
        tokens: {
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      logger.error('Login error:', { error: error.message });
      throw error;
    }
  }

  /**
   * Token refresh
   * @param {String} refreshToken - Refresh token
   * @returns {Object} New tokens
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = JWTUtils.verifyRefreshToken(refreshToken);
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      // Check if refresh token exists in database
      const tokenExists = user.refreshTokens.some(
        tokenObj => tokenObj.token === refreshToken
      );

      if (!tokenExists) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const newAccessToken = JWTUtils.generateAccessToken({ userId: user._id });
      const newRefreshToken = JWTUtils.generateRefreshToken({ userId: user._id });

      // Remove old refresh token and add new one
      user.refreshTokens = user.refreshTokens.filter(
        tokenObj => tokenObj.token !== refreshToken
      );
      user.refreshTokens.push({ token: newRefreshToken });
      await user.save();

      return {
        success: true,
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      };
    } catch (error) {
      logger.error('Token refresh error:', { error: error.message });
      throw error;
    }
  }

  /**
   * Logout
   * @param {String} userId - User ID
   * @param {String} refreshToken - Refresh token
   * @returns {Object} Logout result
   */
  async logout(userId, refreshToken) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Remove refresh token
      user.refreshTokens = user.refreshTokens.filter(
        tokenObj => tokenObj.token !== refreshToken
      );
      await user.save();

      logger.info('User logout:', { userId });

      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      logger.error('Logout error:', { error: error.message });
      throw error;
    }
  }

  /**
   * Logout from all devices
   * @param {String} userId - User ID
   * @returns {Object} Logout result
   */
  async logoutAll(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Remove all refresh tokens
      user.refreshTokens = [];
      await user.save();

      logger.info('Logout from all devices:', { userId });

      return {
        success: true,
        message: 'Logged out from all devices'
      };
    } catch (error) {
      logger.error('Logout from all devices error:', { error: error.message });
      throw error;
    }
  }

  /**
   * Update profile
   * @param {String} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Update result
   */
  async updateProfile(userId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check allowed update fields
      const allowedUpdates = ['firstName', 'lastName', 'phone', 'address'];
      const updates = {};

      Object.keys(updateData).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = updateData[key];
        }
      });

      // Apply updates
      Object.assign(user, updates);
      await user.save();

      logger.info('Profile updated:', { userId });

      return {
        success: true,
        message: 'Profile updated successfully',
        user: user.toJSON()
      };
    } catch (error) {
      logger.error('Profile update error:', { error: error.message });
      throw error;
    }
  }

  /**
   * Change password
   * @param {String} userId - User ID
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   * @returns {Object} Change result
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new Error('User not found');
      }

      // Check current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Set new password
      user.password = newPassword; // Pre-save hook will hash
      user.refreshTokens = []; // Remove all tokens for security
      await user.save();

      logger.info('Password changed:', { userId });

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      logger.error('Password change error:', { error: error.message });
      throw error;
    }
  }
}

module.exports = new AuthService();