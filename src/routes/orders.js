const express = require('express');
const OrderController = require('../controllers/orderController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateRequest, validateObjectId, validateQueryParams } = require('../middleware/validation');
const  ValidationUtils  = require('../utils/validation');

const router = express.Router();

/**
 * Order Routes
 * Order management endpoints
 */

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', 
  authenticateToken,
  validateRequest(ValidationUtils.orderSchemas.create),
  OrderController.createOrder
);

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', 
  authenticateToken,
  validateQueryParams,
  OrderController.getUserOrders
);

// @route   GET /api/orders/:id
// @desc    Get order details
// @access  Private
router.get('/:id', 
  authenticateToken,
  validateObjectId(),
  OrderController.getOrderById
);

// @route   PATCH /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.patch('/:id/cancel', 
  authenticateToken,
  validateObjectId(),
  OrderController.cancelOrder
);

// Admin Routes
// @route   GET /api/orders/admin/all
// @desc    Get all orders (Admin)
// @access  Private (Admin)
router.get('/admin/all', 
  authenticateToken,
  requireAdmin,
  validateQueryParams,
  OrderController.getAllOrders
);

// @route   GET /api/orders/admin/stats
// @desc    Order statistics (Admin)
// @access  Private (Admin)
router.get('/admin/stats', 
  authenticateToken,
  requireAdmin,
  OrderController.getOrderStats
);

// @route   PATCH /api/orders/:id/status
// @desc    Update order status (Admin)
// @access  Private (Admin)
router.patch('/:id/status', 
  authenticateToken,
  requireAdmin,
  validateObjectId(),
  OrderController.updateOrderStatus
);

module.exports = router;