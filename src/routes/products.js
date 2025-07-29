const express = require('express');
const ProductController = require('../controllers/productController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateRequest, validateObjectId, validateQueryParams } = require('../middleware/validation');
const  ValidationUtils  = require('../utils/validation');

const router = express.Router();

/**
 * Product Routes
 * Product management endpoints
 */

// @route   GET /api/products
// @desc    Get product list
// @access  Public
router.get('/', validateQueryParams, ProductController.getProducts);

// @route   GET /api/products/categories
// @desc    Get product categories
// @access  Public
router.get('/categories', ProductController.getCategories);

// @route   GET /api/products/brands
// @desc    Get product brands
// @access  Public
router.get('/brands', ProductController.getBrands);

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', ProductController.getFeaturedProducts);

// @route   GET /api/products/:id
// @desc    Get product details
// @access  Public
router.get('/:id', validateObjectId(), ProductController.getProductById);

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin)
router.post('/', 
  authenticateToken,
  requireAdmin,
  validateRequest(ValidationUtils.productSchemas.create),
  ProductController.createProduct
);

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin)
router.put('/:id', 
  authenticateToken,
  requireAdmin,
  validateObjectId(),
  validateRequest(ValidationUtils.productSchemas.update),
  ProductController.updateProduct
);

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Admin)
router.delete('/:id', 
  authenticateToken,
  requireAdmin,
  validateObjectId(),
  ProductController.deleteProduct
);

// @route   PATCH /api/products/:id/stock
// @desc    Update product stock
// @access  Private (Admin)
router.patch('/:id/stock', 
  authenticateToken,
  requireAdmin,
  validateObjectId(),
  ProductController.updateStock
);

module.exports = router;