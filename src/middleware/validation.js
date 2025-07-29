const ValidationUtils = require('../utils/validation');
const logger = require('../utils/logger');

/**
 * Data validation middleware factory function
 * @param {Object} schema - Joi validation schema
 * @param {String} source - Data source ('body', 'params', 'query')
 * @returns {Function} Express middleware function
 */
const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    
    const validation = ValidationUtils.validate(dataToValidate, schema);
    
    if (!validation.isValid) {
      logger.warn('Validation error:', {
        source,
        errors: validation.errors,
        data: dataToValidate
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid data',
        errors: validation.errors
      });
    }

    // Attach validated data to request
    req.validated = req.validated || {};
    req.validated[source] = validation.data;
    
    next();
  };
};

/**
 * MongoDB ObjectId validation middleware
 * @param {String} paramName - Parameter name (default: 'id')
 * @returns {Function} Express middleware function
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!ValidationUtils.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

/**
 * File upload validation middleware
 * @param {Object} options - Upload options
 * @returns {Function} Express middleware function
 */
const validateFileUpload = (options = {}) => {
  const {
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxSize = 5 * 1024 * 1024, // 5MB
    required = false
  } = options;

  return (req, res, next) => {
    if (!req.files && required) {
      return res.status(400).json({
        success: false,
        message: 'File upload is required'
      });
    }

    if (req.files) {
      const files = Array.isArray(req.files) ? req.files : [req.files];
      
      for (const file of files) { 
        // File type check
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: `Unsupported file type: ${file.mimetype}`
          });
        }

        // File size check
        if (file.size > maxSize) {
          return res.status(400).json({
            success: false,
            message: `File tooooo large. Maximum size: ${maxSize / 1024 / 1024}MB`
          });
        }
      }
    }

    next();
  };
};

/**
 * Query parameter validation middleware
 */
const validateQueryParams = (req, res, next) => {
  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const maxLimit = 100;

  // Limit check
  if (limit > maxLimit) {
    return res.status(400).json({
      success: false,
      message: `Maximum limit: ${maxLimit}`
    });
  }

  // Page check
  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: 'Page number cannot be less than 1'
    });
  }

  // Sorting parameter check
  const allowedSortFields = ['createdAt', 'price', 'name', 'rating'];
  const allowedSortOrders = ['asc', 'desc', '1', '-1'];

  if (req.query.sortBy && !allowedSortFields.includes(req.query.sortBy)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid sort field'
    });
  }

  if (req.query.sortOrder && !allowedSortOrders.includes(req.query.sortOrder)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid sort order'
    });
  }

  // Attach validated parameters to request
  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit
  };

  req.sorting = {};
  if (req.query.sortBy) {
    const sortOrder = req.query.sortOrder === 'asc' || req.query.sortOrder === '1' ? 1 : -1;
    req.sorting[req.query.sortBy] = sortOrder;
  }

  next();
};

module.exports = {
  validateRequest,
  validateObjectId,
  validateFileUpload,
  validateQueryParams
};