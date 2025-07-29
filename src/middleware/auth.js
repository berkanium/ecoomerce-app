const JWTUtils = require("../utils/jwt");
const User = require("../models/User");
const logger = require("../utils/logger");

/**
 * JWT token authentication middleware - extracts and verifies the token from Authorization header
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token is required",
      });
    }

    // Token'ı doğrula
    const decoded = JWTUtils.verifyToken(token);

    // Kullanıcıyı veritabanından al
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Request objesine kullanıcı bilgisini ekle
    req.user = user;
    next();
  } catch (error) {
    logger.error("Token doğrulama hatası:", { error: error.message });

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

/**
 * Admin authorization middleware - checks if user has admin privileges
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin privileges are required for this action",
    });
  }

  next();
};

/**
 * Optional authentication middleware - verifies token if provided, otherwise continues
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = JWTUtils.verifyToken(token);
      const user = await User.findById(decoded.userId).select("-password");

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // If token is invalid, set user to null and continue
    req.user = null;
    next();
  }
};

/**
 * Extract user identifier for rate limiting
 */
const extractUserForRateLimit = async (req, res, next) => {
  req.userIdentifier = req.ip; // Use IP by default

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    const decoded = JWTUtils.verifyToken(token);
    req.userIdentifier = decoded.userId;
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
  extractUserForRateLimit,
};
