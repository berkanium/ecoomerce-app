const Product = require('../models/Product');
const logger = require('../utils/logger');

/**
 * Product management service class - handles product CRUD operations and search
 */
class ProductService {
  /**
   * Fetch product list with filtering, pagination, and sorting
   * @param {Object} options - Filtering and pagintion options
   * @returns {Object} Product list and meta information
   */
  async getProducts(options = {}) {
    try {
      const {
        page = 1,
        limit = 12,
        search,
        category,
        brand,
        minPrice,
        maxPrice,
        sortBy = 'createdAt',
        sortOrder = 'desc', 
        featured,
        inStock
      } = options;

      // Build filter object
      const filter = { isActive: true };

      if (search) {
        filter.$text = { $search: search };
      }

      if (category) {
        filter.category = category;
      }

      if (brand) {
        filter.brand = brand;
      }

      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = minPrice;
        if (maxPrice) filter.price.$lte = maxPrice;
      }

      if (featured !== undefined) {
        filter.featured = featured;
      }

      if (inStock) {
        filter.stock = { $gt: 0 };
      }

      // Sorting
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Pagination
      const skip = (page - 1) * limit;

      // Fetch products
      const products = await Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      // Total count
      const total = await Product.countDocuments(filter);

      return {
        success: true,
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      logger.error('Error fetching product list:', { error: error.message });
      throw error;
    }
  }

  /**
   * Fetch product details
   * @param {String} productId - Product ID
   * @returns {Object} Product details
   */
  async getProductById(productId) {
    try {
      const product = await Product.findById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }

      if (!product.isActive) {
        throw new Error('Product is not active');
      }

      return {
        success: true,
        product
      };
    } catch (error) {
      logger.error('Error fetching product details:', { error: error.message });
      throw error;
    }
  }

  /**
   * Create new product (Admin)
   * @param {Object} productData - Product information
   * @returns {Object} Created product
   */
  async createProduct(productData) {
    try {
      const product = new Product(productData);
      await product.save();

      logger.info('New product created:', { productId: product._id });

      return {
        success: true,
        message: 'Product created successfully',
        product
      };
    } catch (error) {
      logger.error('Error creating product:', { error: error.message });
      throw error;
    }
  }

  /**
   * Update product (Admin)
   * @param {String} productId - Product ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated product
   */
  async updateProduct(productId, updateData) {
    try {
      const product = await Product.findById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }

      Object.assign(product, updateData);
      await product.save();

      logger.info('Product updated:', { productId });

      return {
        success: true,
        message: 'Product updated successfully',
        product
      };
    } catch (error) {
      logger.error('Error updating product:', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete product (Admin)
   * @param {String} productId - Product ID
   * @returns {Object} Deletion result
   */
  async deleteProduct(productId) {
    try {
      const product = await Product.findById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }

      // Soft delete
      product.isActive = false;
      await product.save();

      logger.info('Product deleted:', { productId });

      return {
        success: true,
        message: 'Product deleted successfully'
      };
    } catch (error) {
      logger.error('Error deleting product:', { error: error.message });
      throw error;
    }
  }

  /**
   * Fetch categories
   * @returns {Object} Category list
   */
  async getCategories() {
    try {
      const categories = await Product.distinct('category', { isActive: true });
      
      return {
        success: true,
        categories
      };
    } catch (error) {
      logger.error('Error fetching category list:', { error: error.message });
      throw error;
    }
  }

  /**
   * Fetch brands
   * @returns {Object} Brand list
   */
  async getBrands() {
    try {
      const brands = await Product.distinct('brand', { isActive: true });
      
      return {
        success: true,
        brands
      };
    } catch (error) {
      logger.error('Error fetching brand list:', { error: error.message });
      throw error;
    }
  }

  /**
   * Fetch featured products
   * @param {Number} limit - Number of products to fetch
   * @returns {Object} Featured products
   */
  async getFeaturedProducts(limit = 8) {
    try {
      const products = await Product.find({
        isActive: true,
        featured: true,
        stock: { $gt: 0 }
      })
      .sort({ createdAt: -1 })
      .limit(limit);

      return {
        success: true,
        products
      };
    } catch (error) {
      logger.error('Error fetching featured products:', { error: error.message });
      throw error;
    }
  }

  /**
   * Update stock
   * @param {String} productId - Product ID
   * @param {Number} quantity - Amount (positive: increase, negative: decrease)
   * @returns {Object} Update result
   */
  async updateStock(productId, quantity) {
    try {
      const product = await Product.findById(productId);
      
      if (!product) {
        throw new Error('Prouct not found');
      }

      const newStock = product.stock + quantity;
      
      if (newStock < 0) {
        throw new Error('Insufficient stock');
      }

      product.stock = newStock;
      await product.save();

      logger.info('Stock updated:', { productId, oldStock: product.stock - quantity, newStock });

      return {
        success: true,
        message: 'Stock updated successfully',
        stock: newStock
      };
    } catch (error) {
      logger.error('Error updating stock:', { error: error.message });
      throw error;
    }
  }
}

module.exports = new ProductService();