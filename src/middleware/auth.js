const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: Protect routes requiring JWT authentication.
 * Verifies the Bearer token, fetches the user from MongoDB,
 * and attaches it to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // Extract token from "Bearer <token>"
      token = authHeader.split(' ')[1];

      // Verify the token signature and expiry
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request (password excluded via select: false in model)
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized — user account no longer exists',
        });
      }

      return next();
    } catch (error) {
      const message =
        error.name === 'TokenExpiredError'
          ? 'Not authorized — token has expired'
          : 'Not authorized — invalid token';

      return res.status(401).json({
        success: false,
        message,
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Not authorized — no token provided',
  });
};

module.exports = { protect };
