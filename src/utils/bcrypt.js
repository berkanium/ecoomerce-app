const bcrypt = require("bcryptjs");
const config = require("../config");

/*
 *Helper function for Bcrypt
 */

class BcryptUtils {
  /*
   *Hash password
   *@param {String} password
   *@returns {String} hashed password
   */
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(config.security.bcryptSaltRounts);
    return await bcrypt.hash(password, salt);
  }

  /*
   *verify password
   *@param {String} password
   *@param {String} HashedPassword
   *@returns {Boolean} verify password
   */
  static async comporePassword(password, hashPassword) {
    return await bcrypt.compare(password, hashPassword);
  }

  /*
   *check password
   *@param {String} password
   *@returns {Object}
   */

  static checkPasswordStrength(password) {
    const result = {
      score: 0,
      requirements: {
        minLength: password.length >= 8,
        hasLowerCase: /[a-z]/.test(password),
        hasUpperCase: /[A-Z]/.test(password),
        hasNumbers: /\d/.test(password),
        hasSpecialChars: /[!@#$%&*(),.?":{}|<>]/.test(password),
      },
    };

    //calculate score
    Object.values(result.requirements).forEach((c) => {
      if (c) result.score++;
    });

    //score level
    if (result.score < 3) {
      result.strength = "Weak";
    } else if (result.score < 4) {
      result.strength = "Medium";
    } else {
      result.strength = "Strong";
    }

    return result;
  }
}

module.exports = BcryptUtils;
