const jwt = require('jsonwebtoken');

/** Creates a signed JWT that expires after 7 days. */
function generateToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing. Add it to your server/.env file.');
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

module.exports = generateToken;
