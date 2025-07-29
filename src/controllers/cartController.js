const CartService = require('../services/cartService');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Cart management controller
 * Routes HTTP requests to CartService
 */
class CartController {
  /**
   * Get cart
   * @route GET /api/cart
   * @access Public (Session or User)
   */
  getCart = asyncHandler(async (req, res) => {
    const identifier = req.user ? req.user._id : req.sessionID;
    const cart = await CartService.getCart(identifier);
    
    res.json({
      success: true,
      cart
    });
  });

  /**
   * Add product to cart
   * @route POST /api/cart/add
   * @access Public (Session or User)
   */
  addToCart = asyncHandler(async (req, res) => {
    const identifier = req.user ? req.user._id : req.sessionID;
    const { productId, quantity } = req.validated.body;
    
    const result = await CartService.addToCart(identifier, productId, quantity);
    
    res.status(201).json(result);
  });

  /**
   * Update cart item
   * @route PUT /api/cart/update
   * @access Public (Session or User)
   */
  updateCartItem = asyncHandler(async (req, res) => {
    const identifier = req.user ? req.user._id : req.sessionID;
    const { productId, quantity } = req.validated.body;
    
    const result = await CartService.updateCartItem(identifier, productId, quantity);
    
    res.json(result);
  });

  /**
   * Remove product from cart
   * @route DELETE /api/cart/remove/:productId
   * @access Public (Session or User)
   */
  removeFromCart = asyncHandler(async (req, res) => {
    const identifier = req.user ? req.user._id : req.sessionID;
    const { productId } = req.params;
    
    const result = await CartService.removeFromCart(identifier, productId);
    
    res.json(result);
  });

  /**
   * Clear cart
   * @route DELETE /api/cart/clear
   * @access Public (Session or User)
   */
  clearCart = asyncHandler(async (req, res) => {
    const identifier = req.user ? req.user._id : req.sessionID;
    const result = await CartService.clearCart(identifier);
    
    res.json(result);
  });

  /**
   * Save cart (after login)
   * @route POST /api/cart/save
   * @access Private
   */
  saveCart = asyncHandler(async (req, res) => {
    const result = await CartService.backupCartToMongoDB(req.user._id);
    
    res.json(result);
  });

  /**
   * Merge session cart with user cart
   * @route POST /api/cart/merge
   * @access Private
   */
  mergeCart = asyncHandler(async (req, res) => {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    try {
      // Get session cart
      const sessionCart = await CartService.getCart(sessionId);
      
      if (sessionCart.items.length > 0) {
        // Add each item to user cart
        for (const item of sessionCart.items) {
          await CartService.addToCart(req.user._id, item.product, item.quantity);
        }

        // Clear session cart
        await CartService.clearCart(sessionId);
      }

      // Get updated cart
      const updatedCart = await CartService.getCart(req.user._id);
      
      res.json({
        success: true,
        message: 'Carts merged successfully',
        cart: updatedCart
      });
    } catch (error) {
      logger.error('Cart merge error:', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Cart merge error'
      });
    }
  });
}

module.exports = new CartController();