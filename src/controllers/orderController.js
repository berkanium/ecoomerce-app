const OrderService = require('../services/orderService');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Order management controller
 * Routes HTTP requests to OrderService
 */
class OrderController {
  /**
   * Create new order
   * @route POST /api/orders
   * @access Private
   */
  createOrder = asyncHandler(async (req, res) => {
    const result = await OrderService.createOrder(req.user._id, req.validated.body);
    
    res.status(201).json(result);
  });

  /**
   * Get user orders
   * @route GET /api/orders
   * @access Private
   */
  getUserOrders = asyncHandler(async (req, res) => {
    const options = {
      page: req.pagination.page,
      limit: req.pagination.limit
    };

    const result = await OrderService.getUserOrders(req.user._id, options);
    
    res.json(result);
  });

  /**
   * Get order details
   * @route GET /api/orders/:id
   * @access Private
   */
  getOrderById = asyncHandler(async (req, res) => {
    const result = await OrderService.getOrderById(req.params.id, req.user._id);
    
    res.json(result);
  });

  /**
   * Cancel order
   * @route PATCH /api/orders/:id/cancel
   * @access Private
   */
  cancelOrder = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const result = await OrderService.cancelOrder(req.params.id, req.user._id, reason);
    
    res.json(result);
  });

  /**
   * Get all orders (Admin)
   * @route GET /api/orders/admin/all
   * @access Private (Admin)
   */
  getAllOrders = asyncHandler(async (req, res) => {
    const options = {
      page: req.pagination.page,
      limit: req.pagination.limit,
      status: req.query.status,
      paymentStatus: req.query.paymentStatus,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await OrderService.getAllOrders(options);
    
    res.json(result);
  });

  /**
   * Update order status (Admin)
   * @route PATCH /api/orders/:id/status
   * @access Private (Admin)
   */
  updateOrderStatus = asyncHandler(async (req, res) => {
    const { status, note } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status information is required'
      });
    }

    const allowedStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const result = await OrderService.updateOrderStatus(req.params.id, status, note);
    
    res.json(result);
  });

  /**
   * Order statistics (Admin)
   * @route GET /api/orders/admin/stats
   * @access Private (Admin)
   */
  getOrderStats = asyncHandler(async (req, res) => {
    try {
      const stats = await Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$total' }
          }
        }
      ]);

      const totalOrders = await Order.countDocuments();
      const totalRevenue = await Order.aggregate([
        {
          $match: { status: { $ne: 'cancelled' } }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ]);

      res.json({
        success: true,
        stats: {
          byStatus: stats,
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0
        }
      });
    } catch (error) {
      logger.error('Order statistics error:', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'An error occurred while retrieving statistics'
      });
    }
  });
}

module.exports = new OrderController();