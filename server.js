const createApp = require('./src/app');
const connectDB = require('./src/config/database');
const redisClient = require('./src/config/redis');
const config = require('./src/config');
const logger = require('./src/utils/logger');

/**
 * Server start function with enhanced error handling and debugging
 */
const startServer = async () => {
  try {
    logger.info('=== Server Startup Process Started ===');
    
    // Validate configuration
    logger.info(' Validating configuration...');
    if (!config) {
      throw new Error('Configuration not loaded');
    }
    if (!config.port) {
      throw new Error('Port not configured');
    }
    logger.info(`Configuration loaded - Port: ${config.port}, Environment: ${config.env}`);

    //Database connections
    logger.info('Starting database connections...');
    
    try {
      await connectDB();
      logger.info('MongoDB connection successful');
    } catch (dbError) {
      logger.error('MongoDB connection failed:', dbError.message);
      throw new Error(`MongoDB connection failed: ${dbError.message}`);
    }
    
    try {
      await redisClient.connect();
      logger.info('Redis connection successful');
    } catch (redisError) {
      logger.error('Redis connection failed:', redisError.message);
      throw new Error(`Redis connection failed: ${redisError.message}`);
    }

    //Create Express application
    logger.info('Creating Express application...');
    let app;
    try {
      app = await createApp();
      if (!app) {
        throw new Error('createApp returned null/undefined');
      }
      logger.info('Express application created successfully');
    } catch (appError) {
      logger.error('App creation failed:', appError.message);
      throw new Error(`App creation failed: ${appError.message}`);
    }

    // Check if port is available
    logger.info(` Attempting to start server on port ${config.port}...`);
    
    // Start the server with detailed error handling
    const server = app.listen(config.port, (err) => {
      if (err) {
        logger.error('Server failed to start:', err.message);
        throw err;
      }
      
      logger.info('=== Server Started Successfully ===');
      logger.info(`Server running in ${config.env} mode on port ${config.port}`);
      logger.info(`API: http://localhost:${config.port}/api`);
      logger.info(`Health: http://localhost:${config.port}/health`);
    });

    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
        throw new Error(`Port ${config.port} is already in use. Try a different port or kill the process using this port.`);
      } else if (err.code === 'EACCES') {
        logger.error(`Permission denied to bind to port ${config.port}`);
        throw new Error(`Permission denied to bind to port ${config.port}. Try using a port > 1024 or run with sudo.`);
      } else {
        logger.error('Server error:', err);
        throw err;
      }
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);
      
      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          // Close database connections
          if (redisClient && redisClient.disconnect) {
            await redisClient.disconnect();
            logger.info('Redis connection closed');
          }
          
          // MongoDB connection will be closed automatically by mongoose
          
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown if not closed within 10 seconds
      setTimeout(() => {
        logger.error('Graceful shutdown failed, forcing shutdown...');
        process.exit(1);
      }, 10000);
    };

    // Signal handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Unhandled promise rejection handler
    process.on('unhandledRejection', (err, promise) => {
      logger.error('Unhandled Promise Rejection at:', promise, 'reason:', err);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    // Uncaught exception handler
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    return server;

  } catch (error) { 
    logger.error('=== Server Startup Failed ===');
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    // Attempt to clean up any partial connections
    try {
      if (redisClient && redisClient.disconnect) {
        await redisClient.disconnect();
        logger.info('Redis cleanup completed');
      }
    } catch (cleanupError) {
      logger.error('Cleanup error:', cleanupError.message);
    }
    
    process.exit(1);
  }
};

// In development environment, start the server directly
if (require.main === module) {
  startServer();
}

module.exports = startServer;