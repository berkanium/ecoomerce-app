const ProductService = require('../services/productService');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Product controller - handles HTTP requests and delegates to ProductService
 */
class ProductController {
  /**
   * Get product list
   * @route GET /api/products
   * @access Public
   */
  getProducts = asyncHandler(async (req, res) => {
    const options = {
      page: req.pagination.page,
      limit: req.pagination.limit,
      search: req.query.search,
      category: req.query.category,
      brand: req.query.brand,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      featured: req.query.featured === 'true' ? true : undefined,
      inStock: req.query.inStock === 'true' ? true : undefined
    };

    const result = await ProductService.getProducts(options);
    
    // Add pagination information to response headers
    res.set({
      'X-Total-Count': result.pagination.totalItems,
      'X-Page-Count': result.pagination.totalPages,
      'X-Current-Page': result.pagination.currentPage,
      'X-Per-Page': result.pagination.itemsPerPage
    });

    res.json(result);
  });

  /**
   * Get product details
   * @route GET /api/products/:id
   * @access Public
   */
  getProductById = asyncHandler(async (req, res) => {
    const result = await ProductService.getProductById(req.params.id);
    
    res.json(result);
  });

  /**
   * Create new product
   * @route POST /api/products
   * @access Private (Admin)
   */
  createProduct = asyncHandler(async (req, res) => {
    const result = await ProductService.createProduct(req.validated.body);
    
    res.status(201).json(result);
  });

  /**
   * Update product
   * @route PUT /api/products/:id
   * @access Private (Admin)
   */
  updateProduct = asyncHandler(async (req, res) => {
    const result = await ProductService.updateProduct(req.params.id, req.validated.body);
    
    res.json(result);
  });

  /**
   * Delete product
   * @route DELETE /api/products/:id
   * @access Private (Admin)
   */
  deleteProduct = asyncHandler(async (req, res) => {
    const result = await ProductService.deleteProduct(req.params.id);
    
    res.json(result);
  });

  /**
   * Get product categories
   * @route GET /api/products/categories
   * @access Public
   */
  getCategories = asyncHandler(async (req, res) => {
    const result = await ProductService.getCategories();
    
    res.json(result);
  });

  /**
   * Get product brands
   * @route GET /api/products/brands
   * @access Public
   */
  getBrands = asyncHandler(async (req, res) => {
    const result = await ProductService.getBrands();
    
    res.json(result);
  });

  /**
   * Get featured products
   * @route GET /api/products/featured
   * @access Public
   */
  getFeaturedProducts = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 8;
    const result = await ProductService.getFeaturedProducts(limit);
    
    res.json(result);
  });

  /**
   * Update product stock
   * @route PATCH /api/products/:id/stock
   * @access Private (Admin)
   */
  updateStock = asyncHandler(async (req, res) => {
    const { quantity } = req.body;
    
    if (typeof quantity !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid quantity'
      });
    }

    const result = await ProductService.updateStock(req.params.id, quantity);
    
    res.json(result);
  });
}

module.exports = new ProductController();