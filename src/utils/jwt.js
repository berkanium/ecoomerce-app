const jwt = require("jsonwebtoken");
const config = require("../config");

/*
 * Helper functions for JWT Token managment
 */
class JWTUtils {
  /*
   * Generate access token
   * @param {Object} => payload - data hidden in token
   * @returns {String} -> JWT token
   */

  static generateAccessToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: "ecoomerce-app",
      audience: "ecommerce-users",
    });
  }

  /*
   * Generate refresh token
   * @param {Object} => payload - data hidden in token
   * @returns {String} -> JWT token
   */

  static generateRefreshToken(payload) {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: "ecoomerce-app",
      audience: "ecommerce-users",
    });
  }

  /*
   * verify token
   * @param {String} => token => verify token
   * @param {String} => secret => token's secret
   * @returns {Object} -> Decoded token payload
   */

  static verifyToken(token, secret = config.jwt.secret) {
    try {
      return jwt.verify(token, secret, {
        issuer: "ecoomerce-app",
        audience: "ecommerce-users",
      });
    } catch (error) {
      throw new Error("Undefined token");
    }
  }

  /*
   * verify refresh token
   * @param {String} => token => verify refresh token
   * @param {String} => secret => token's secret
   * @returns {Object} -> Decoded token payload
   */

  static verifyRefreshToken(token) {
    return this.verifyToken(token, config.jwt.refreshSecret);
  }

  /*
   * Token payload decode
   * @param {String} => token =>  token
   * @returns {Object} -> token payload
   */

  static decodeToken(token) {
    return jwt.decode(token);
  }

  /*
   * check token expires time
   * @param {String} => token =>  token
   * @returns {Boolean} -> token state
   */

  static isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      return decoded.exp < Date.now() / 1000;
    } catch (error) {
      return true;
    }
  }
}

module.exports = JWTUtils;
