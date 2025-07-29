const express = require('express');
const CartController = require('../controllers/cartController');
const { optionalAuth, authenticateToken } = require('../middleware/auth');
const { validateRequest, validateObjectId } = require('../middleware/validation');
const  ValidationUtils  = require('../utils/validation');

const router = express.Router();

/**
 * Cart Routes
 * Cart management endpoints
 */

// @route   GET /api/cart
// @desc    Get cart
// @access  Public (Session veya User)
router.get('/', optionalAuth, CartController.getCart);

// @route   POST /api/cart/add
// @desc    Add product to cart
// @access  Public (Session veya User)
router.post('/add', 
  optionalAuth,
  validateRequest(ValidationUtils.cartSchemas.addItem),
  CartController.addToCart
);

// @route   PUT /api/cart/update
// @desc    Update cart item
// @access  Public (Session veya User)
router.put('/update', 
  optionalAuth,
  validateRequest(ValidationUtils.cartSchemas.updateItem),
  CartController.updateCartItem
);

// @route   DELETE /api/cart/remove/:productId
// @desc    Remove product from cart
// @access  Public (Session veya User)
router.delete('/remove/:productId', 
  optionalAuth,
  validateObjectId('productId'),
  CartController.removeFromCart
);

// @route   DELETE /api/cart/clear
// @desc    Clear cart
// @access  Public (Session veya User)
router.delete('/clear', optionalAuth, CartController.clearCart);

// @route   POST /api/cart/save
// @desc    Save cart (after login)
// @access  Private
router.post('/save', authenticateToken, CartController.saveCart);

// @route   POST /api/cart/merge
// @desc    Merge session cart with user cart
// @access  Private
router.post('/merge', authenticateToken, CartController.mergeCart);

module.exports = router;