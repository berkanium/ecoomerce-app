const Cart = require('../models/Cart');
const Product = require('../models/Product');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Cart management service class - session-based using Redis
 */
class CartService {
  /**
   * Get cart from Redis
   * @param {String} identifier - User ID or session ID
   * @returns {Object} Cart information
   */
  async getCart(identifier) {
    try {
      const redisKey = `cart:${identifier}`; //cart:684b33edb44924dd40dfc91e
      const cachedCart = await redisClient.getClient().get(redisKey);

      if (cachedCart) {
        return JSON.parse(cachedCart);
      }

      // Return empty cart if not found in Redis
      const emptyCart = {
        items: [],
        totalAmount: 0,
        totalItems: 0,
        lastUpdated: new Date()
      };

      // Save empty cart to Redis => timeout-based cart session. 
      await redisClient.getClient().setex(redisKey, 3600, JSON.stringify(emptyCart));

      return emptyCart;
    } catch (error) {
      logger.error('Error getting cart:', { error: error.message });
      throw error;
    }
  }

  /**
   * Add product to cart
   * @param {String} identifier - User ID or session ID
   * @param {String} productId - Product ID
   * @param {Number} quantity - Quantity
   * @returns {Object} Updated cart
   */
  async addToCart(identifier, productId, quantity) {
    try {
      // Check product
      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        throw new Error('Product not found');
      }

      if (product.stock < quantity) {
        throw new Error('Insufficient stock');
      }

      // Get current cart
      const cart = await this.getCart(identifier);

      // Check if product exists in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Increase quantity of existing product
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        
        if (product.stock < newQuantity) {
          throw new Error('Insufficient stock');
        }

        cart.items[existingItemIndex].quantity = newQuantity;
      } else {
        // Add new product
        cart.items.push({
          product: productId,
          name: product.name,
          price: product.finalPrice,
          quantity,
          image: product.images[0]?.url || null
        });
      }

      // Recalculate totals
      this.calculateCartTotals(cart);

      // Save to Redis
      await this.saveCartToRedis(identifier, cart);

      logger.info('Product added to cart:', { identifier, productId, quantity });

      return {
        success: true,
        message: 'Product added to cart',
        cart
      };
    } catch (error) {
      logger.error('Error adding product to cart:', { error: error.message });
      throw error;
    }
  }

  /**
   * Update cart item
   * @param {String} identifier - User ID or session ID
   * @param {String} productId - Product ID
   * @param {Number} quantity - New quantity
   * @returns {Object} Updated cart
   */
  async updateCartItem(identifier, productId, quantity) {
    try {
      const cart = await this.getCart(identifier);
      
      const itemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
      );

      if (itemIndex === -1) {
        throw new Error('Product not found in cart');
      }

      if (quantity <= 0) {
        // Remove product from cart
        cart.items.splice(itemIndex, 1);
      } else {
        // Stock check
        const product = await Product.findById(productId);
        if (product && product.stock < quantity) {
          throw new Error('Insufficient stock');
        }

        // Update quantity
        cart.items[itemIndex].quantity = quantity;
      }

      // Recalculate totals
      this.calculateCartTotals(cart);

      // Save to Redis
      await this.saveCartToRedis(identifier, cart);

      logger.info('Cart item updated:', { identifier, productId, quantity });

      return {
        success: true,
        message: 'Cart updated',
        cart
      };
    } catch (error) {
      logger.error('Error updating cart:', { error: error.message });
      throw error;
    }
  }

  /**
   * Remove product from cart
   * @param {String} identifier - User ID or session ID
   * @param {String} productId - Product ID
   * @returns {Object} Updated cart
   */
  async removeFromCart(identifier, productId) {
    try {
      const cart = await this.getCart(identifier);
      
      cart.items = cart.items.filter(
        item => item.product.toString() !== productId
      );

      // Recalculate totals
      this.calculateCartTotals(cart);

      // Save to Redis
      await this.saveCartToRedis(identifier, cart);

      logger.info('Product removed from cart:', { identifier, productId });

      return {
        success: true,
        message: 'Product removed from cart',
        cart
      };
    } catch (error) {
      logger.error('Error removing product from cart:', { error: error.message });
      throw error;
    }
  }

  /**
   * Clear cart
   * @param {String} identifier - User ID or session ID
   * @returns {Object} Empty cart
   */
  async clearCart(identifier) {
    try {
      const emptyCart = {
        items: [],
        totalAmount: 0,
        totalItems: 0,
        lastUpdated: new Date()
      };

      await this.saveCartToRedis(identifier, emptyCart);

      logger.info('Cart cleared:', { identifier });

      return {
        success: true,
        message: 'Cart cleared',
        cart: emptyCart
      };
    } catch (error) {
      logger.error('Error clearing cart:', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate cart totals
   * @param {Object} cart - Cart object
   */
  calculateCartTotals(cart) {
    cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    cart.lastUpdated = new Date();
  }

  /**
   * Save cart to Redis
   * @param {String} identifier - User ID or session ID
   * @param {Object} cart - Cart object
   */
  async saveCartToRedis(identifier, cart) {
    const redisKey = `cart:${identifier}`; //cart:684b33edb44924dd40dfc91e
    await redisClient.getClient().setex(redisKey, 3600, JSON.stringify(cart));
  }

  /**
   * Backup user cart to MongoDB
   * @param {String} userId - User ID
   * @returns {Object} Backup result
   */
  async backupCartToMongoDB(userId) {
    try {
      const cart = await this.getCart(userId);
      
      if (cart.items.length === 0) {
        return { success: true, message: 'Cart is empty' };
      }

      // Check if cart exists in MongoDB
      let dbCart = await Cart.findOne({ user: userId });

      if (dbCart) {
        // Update existing cart
        dbCart.items = cart.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price
        }));
      } else {
        // Create new cart
        dbCart = new Cart({
          user: userId,
          items: cart.items.map(item => ({
            product: item.product,
            quantity: item.quantity,
            price: item.price
          }))
        });
      }

      await dbCart.save();

      logger.info('Cart backed up to MongoDB:', { userId });

      return {
        success: true,
        message: 'Cart saved'
      };
    } catch (error) {
      logger.error('Cart backup error:', { error: error.message });
      throw error;
    }
  }
}

module.exports = new CartService();