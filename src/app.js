const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const config = require('./config');
const redisClient = require('./config/redis');
const corsMiddleware = require('./middleware/cors');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { extractUserForRateLimit } = require('./middleware/auth');
const logger = require('./utils/logger');

// Route importları
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

/**
 * Express application configuration
 * Brings together all middlewares and routes
 */
const createApp = async () => {
  const app = express();

  // Trust proxy (for nginx, load balancer, etc.)
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false
  }));

  // Compression middleware
  app.use(compression());

  // CORS middleware
  app.use(corsMiddleware);

  // Body parser middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Session middleware (with Redis)
  // Ensure Redis client is available before creating RedisStore
  const client = redisClient.getClient();
  if (!client) {
    throw new Error('Redis client is not connected. Make sure Redis connection is established before creating the app.');
  }

  app.use(session({
    store: new RedisStore({ 
      client: client,  
      prefix: 'ecommerce:sess:' // Optional: add a prefix for your sessions
    }),
    secret: config.session.secret,
    resave: config.session.resave,
    saveUninitialized: config.session.saveUninitialized,
    cookie: config.session.cookie,
    name: 'sessionId' // Instead of default 'connect.sid'
  }));

  // Logging middleware
  if (config.env === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', {
      stream: {
        write: (message) => {
          logger.info(message.trim());
        }
      }
    }));
  }

  // Rate limiting middleware
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
      success: false,
      message: 'Too many requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID or IP address for rate limiting
      return req.userIdentifier || req.ip;
    },
    skip: (req) => {
      // Skip rate limiting for static assets
      return req.path.startsWith('/static/');
    }
  });

  app.use(extractUserForRateLimit);
  app.use(limiter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);

  // API documentation endpoint
  app.get('/api', (req, res) => {
    res.json({
      message: 'E-commerce API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        products: '/api/products',
        cart: '/api/cart',
        orders: '/api/orders',
        health: '/health'
      },
      documentation: ''
    });
  });

  // 404 handler
  app.use(notFound);

  // Global error handler
  app.use(errorHandler);

  return app;
};

module.exports = createApp;