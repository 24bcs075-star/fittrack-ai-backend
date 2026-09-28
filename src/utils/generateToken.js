const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT token for the given user ID.
 * Uses JWT_SECRET and JWT_EXPIRES_IN from environment variables.
 *
 * @param {string} id - MongoDB user ObjectId
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
