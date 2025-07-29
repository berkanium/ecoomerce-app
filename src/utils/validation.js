const Joi = require('joi'); 
/**
 * Data validation schemas and helper functions
 */
class ValidationUtils {
  // User validation schemas
  static userSchemas = {
    register: Joi.object({
      firstName: Joi.string().min(2).max(50).required().messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name must be at most 50 characters long',
        'any.required': 'First name is required'
      }),
      lastName: Joi.string().min(2).max(50).required().messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name must be at most 50 characters long',
        'any.required': 'Last name is required'
      }),
      email: Joi.string().email().required().messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      }),
      password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
      }),
      phone: Joi.string().pattern(/^[\+]?[\d\s\-\(\)]+$/).messages({
        'string.pattern.base': 'Please enter a valid phone number'
      })
    }), 
    login: Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      }),
      password: Joi.string().required().messages({
        'any.required': 'Password is required'
      })
    }),

    updateProfile: Joi.object({
      firstName: Joi.string().min(2).max(50),
      lastName: Joi.string().min(2).max(50),
      phone: Joi.string().pattern(/^[\+]?[\d\s\-\(\)]+$/),
      address: Joi.object({
        street: Joi.string().max(200),
        city: Joi.string().max(100),
        state: Joi.string().max(100),
        zipCode: Joi.string().max(20),
        country: Joi.string().max(100)
      })
    })
  };

  // Product validation schemas
  static productSchemas = {
    create: Joi.object({
      name: Joi.string().min(2).max(100).required(),
      description: Joi.string().min(10).max(2000).required(),
      price: Joi.number().min(0).required(),
      discountPrice: Joi.number().min(0).less(Joi.ref('price')),
      category: Joi.string().required(),
      brand: Joi.string().required(),
      sku: Joi.string().required(),
      stock: Joi.number().integer().min(0).required(),
      images: Joi.array().items(
        Joi.object({
          url: Joi.string().uri().required(),
          alt: Joi.string(),
          isPrimary: Joi.boolean()
        })
      ).min(1).required(),
      specifications: Joi.object().pattern(Joi.string(), Joi.string()),
      tags: Joi.array().items(Joi.string()),
      weight: Joi.number().min(0),
      dimensions: Joi.object({
        length: Joi.number().min(0),
        width: Joi.number().min(0),
        height: Joi.number().min(0)
      })
    }),

    update: Joi.object({
      name: Joi.string().min(2).max(100),
      description: Joi.string().min(10).max(2000),
      price: Joi.number().min(0),
      discountPrice: Joi.number().min(0),
      category: Joi.string(),
      brand: Joi.string(),
      stock: Joi.number().integer().min(0),
      images: Joi.array().items(
        Joi.object({
          url: Joi.string().uri().required(),
          alt: Joi.string(),
          isPrimary: Joi.boolean()
        })
      ),
      specifications: Joi.object().pattern(Joi.string(), Joi.string()),
      tags: Joi.array().items(Joi.string()),
      isActive: Joi.boolean(),
      featured: Joi.boolean(),
      weight: Joi.number().min(0),
      dimensions: Joi.object({
        length: Joi.number().min(0),
        width: Joi.number().min(0),
        height: Joi.number().min(0)
      })
    })
  };

  // Cart validation schemas
  static cartSchemas = {
    addItem: Joi.object({
      productId: Joi.string().hex().length(24).required(),
      quantity: Joi.number().integer().min(1).required()
    }),

    updateItem: Joi.object({
      productId: Joi.string().hex().length(24).required(),
      quantity: Joi.number().integer().min(0).required()
    })
  }; 

  // Order validation schemas
  static orderSchemas = {
    create: Joi.object({
      shippingAddress: Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string(),
        zipCode: Joi.string().required(),
        country: Joi.string().required(),
        phone: Joi.string()
      }).required(),
      billingAddress: Joi.object({
        firstName: Joi.string(),
        lastName: Joi.string(),
        street: Joi.string(),
        city: Joi.string(),
        state: Joi.string(),
        zipCode: Joi.string(),
        country: Joi.string(),
        phone: Joi.string()
      }),
      paymentMethod: Joi.string().valid('credit_card', 'bank_transfer', 'cash_on_delivery').required(),
      notes: Joi.string().max(500)
    })
  };

  /**
   * Data validation
   * @param {Object} data - Data to validate
   * @param {Object} schema - Joi schema
   * @returns {Object} Validation result
   */
  static validate(data, schema) {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return {
        isValid: false,
        errors: errorDetails,
        data: null
      };
    }

    return {
      isValid: true,
      errors: null,
      data: value
    };
  }

  /**
   * MongoDB ObjectId validation
   * @param {String} id - ID to check
   * @returns {Boolean} Validity status
   */
  static isValidObjectId(id) {
    return /^[a-fA-F0-9]{24}$/.test(id);
  }

  /**
   * Email validation
   * @param {String} email - Email to check
   * @returns {Boolean} Validity status
   */
  static isValidEmail(email) {
    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
  }
}

module.exports = ValidationUtils;