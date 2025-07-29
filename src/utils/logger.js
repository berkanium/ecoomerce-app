const fs = require('fs');
const path = require('path');

/** Simple Logger class - Handles log management for development and production environments */
class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
  }

  /** Create log directory if it doesn't exist */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Format the log message
   * @param {String} level - Log level
   * @param {String} message - Log message
   * @param {Object} meta - Additional information
   * @returns {String} Formatted log
   */


  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaString}\n`;
  }

  /** Write log to file */
  writeToFile(filename, content) {
    const filepath = path.join(this.logDir, filename);
    fs.appendFileSync(filepath, content);
  }

  /** Info log method */
  info(message, meta = {}) {
    const formattedMessage = this.formatMessage('info', message, meta);
    console.log(formattedMessage.trim());
    //this.writeToFile('development-app.log', formattedMessage);

    if (process.env.NODE_ENV === 'production') {
      this.writeToFile('app.log', formattedMessage);
    }
  }

  /** Error log method */
  error(message, meta = {}) {
    const formattedMessage = this.formatMessage('error', message, meta);
    console.error(formattedMessage.trim());
    
    if (process.env.NODE_ENV === 'production') {
      this.writeToFile('error.log', formattedMessage);
    }
  }

  /** Warning log method */
  warn(message, meta = {}) {
    const formattedMessage = this.formatMessage('warn', message, meta);
    console.warn(formattedMessage.trim());
    
    if (process.env.NODE_ENV === 'production') {
      this.writeToFile('app.log', formattedMessage);
    }
  }

  /** Debug log method */
  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      const formattedMessage = this.formatMessage('debug', message, meta);
      console.debug(formattedMessage.trim());
    }
  }
}

module.exports = new Logger();