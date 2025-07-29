const Order = require('../models/Order');
const Product = require('../models/Product');
const CartService = require('./cartService');
const ProductService = require('./productService');
const logger = require('../utils/logger');

/**
 * Order management service class
 * Create, update and track orders
 */
class OrderService {
  /**
   * Create a new order
   * @param {String} userId - User ID
   * @param {Object} orderData - Order information
   * @returns {Object} Created order
   */
  async createOrder(userId, orderData) {
    try {
      // Fetch the user's cart
      const cart = await CartService.getCart(userId);
      
      if (!cart.items || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Check stock and prepare order item data
      const orderItems = [];
      let subtotal = 0;

      for (const item of cart.items) {
        const product = await Product.findById(item.product);
        
        if (!product || !product.isActive) {
          throw new Error(`Product not found: ${item.name}`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock: ${product.name}`);
        }

        const itemTotal = product.finalPrice * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          product: product._id,
          name: product.name,
          quantity: item.quantity,
          price: product.finalPrice,
          total: itemTotal
        });
      }

      // Calculate shipping and tax
      const shippingCost = this.calculateShipping(subtotal, orderData.shippingAddress);
      const tax = this.calculateTax(subtotal, orderData.shippingAddress);
      const total = subtotal + shippingCost + tax;

      // Create order
      const order = new Order({
        user: userId,
        items: orderItems,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress || orderData.shippingAddress,
        payment: {
          method: orderData.paymentMethod,
          status: 'pending'
        },
        subtotal,
        shipping: {
          cost: shippingCost,
          method: orderData.shippingMethod || 'standard'
        },
        tax,
        total,
        notes: orderData.notes
      });

      await order.save();

      // Update product stock
      for (const item of orderItems) {
        await ProductService.updateStock(item.product, -item.quantity);
      }        

      // Clear the cart
      await CartService.clearCart(userId);

      logger.info('New order created:', { orderId: order._id, userId, total });

      return {
        success: true,
        message: 'Order created successfully',
        order
      };
    } catch (error) {
      logger.error('Order creation error:', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user orders
   * @param {String} userId - User ID
   * @param {Object} options - Pagination options
   * @returns {Object} Order list
   */
  async getUserOrders(userId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      const orders = await Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('items.product', 'name images');

      const total = await Order.countDocuments({ user: userId });

      return {
        success: true,
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      logger.error('Error retrieving user orders:', { error: error.message });
      throw error;
    }
  }

  /**
   * Get order details
   * @param {String} orderId - Order ID
   * @param {String} userId - User ID
   * @returns {Object} Order details
   */
  async getOrderById(orderId, userId) {
    try {
      const order = await Order.findOne({ _id: orderId, user: userId })
        .populate('items.product', 'name images')
        .populate('user', 'firstName lastName phone email');

      if (!order) {
        throw new Error('Order not found');
      }

      return {
        success: true,
        order
      };
    } catch (error) {
      logger.error('Error retrieving order details:', { error: error.message });
      throw error;
    }
  }

  /**
   * Get all orders (Admin)
   * @param {Object} options - Filtering and pagination options
   * @returns {Object} Order list
   */
  async getAllOrders(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        paymentStatus,
        startDate,
        endDate
      } = options;

      const filter = {};

      if (status) {
        filter.status = status;
      }

      if (paymentStatus) {
        filter['payment.status'] = paymentStatus;
      }

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;

      const orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'firstName lastName phone email')
        .populate('items.product', 'name');

      const total = await Order.countDocuments(filter);

      return {
        success: true,
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      logger.error('Error retrieving all orders:', { error: error.message });
      throw error;
    }
  }

  /**
   * Update order status (Admin)
   * @param {String} orderId - Order ID
   * @param {String} status - New status
   * @param {String} note - Status note
   * @returns {Object} Update result
   */
  async updateOrderStatus(orderId, status, note = '') {
    try {
      const order = await Order.findById(orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }

      order.updateStatus(status, note);
      await order.save();

      logger.info('Order status updated:', { orderId, status });

      return {
        success: true,
        message: 'Order status updated',
        order
      };
    } catch (error) {
      logger.error('Error updating order status:', { error: error.message });
      throw error;
    }
  }

  /**
   * Cancel order
   * @param {String} orderId - Order ID
   * @param {String} userId - User ID
   * @param {String} reason - Cancellation reason
   * @returns {Object} Cancellation result
   */
  async cancelOrder(orderId, userId, reason = '') {
    try {
      const order = await Order.findOne({ _id: orderId, user: userId });
      
      if (!order) {
        throw new Error('Order not found');
      }

      if (!['pending', 'confirmed'].includes(order.status)) {
        throw new Error('This order cannot be cancelled');
      }

      // Restore product stock
      for (const item of order.items) {
        await ProductService.updateStock(item.product, item.quantity);
      }

      order.status = 'cancelled';
      order.cancelReason = reason;
      order.cancelledAt = new Date();
      await order.save();

      logger.info('Order cancelled:', { orderId, userId, reason });

      return {
        success: true,
        message: 'Order cancelled',
        order
      };
    } catch (error) {
      logger.error('Error cancelling order:', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate shipping cost
   * @param {Number} subtotal - Subtotal amount
   * @param {Object} address - Shipping address
   * @returns {Number} Shipping cost
   */
  calculateShipping(subtotal, address) {
    // Basic shipping cost calculation
    if (subtotal >= 500) {
      return 0; // Free shipping for orders over 500
    }

    return 29.99; // Standard shipping fee
  }

  /**
   * Calculate tax
   * @param {Number} subtotal - Subtotal amount
   * @param {Object} address - Shipping address
   * @returns {Number} Tax amount
   */
  calculateTax(subtotal, address) {
    // Default VAT 20%
    return subtotal * 0.20;
  }
}

module.exports = new OrderService();