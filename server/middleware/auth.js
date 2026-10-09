const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies the "Authorization: Bearer <token>" header and loads the user.
 * Protected routes call this first, then (optionally) adminOnly.
 */
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
    }
    next(err);
  }
}

/** Only allows users with role === "admin". Must run after protect. */
function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin access required.' });
}

module.exports = { protect, adminOnly };
