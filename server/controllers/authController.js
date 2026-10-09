const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * POST /api/auth/register
 * Creates a new customer (or admin when role is passed by an existing admin).
 * The password is hashed by the User model before it is stored.
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  const user = await User.create({ name, email, password });

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: {
      token: generateToken(user._id),
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    },
  });
});

/**
 * POST /api/auth/login
 * Verifies email + password and returns a JWT.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  res.json({
    success: true,
    message: 'Logged in successfully.',
    data: {
      token: generateToken(user._id),
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    },
  });
});

/** GET /api/auth/me - returns the currently logged in user (requires token). */
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

/** PUT /api/auth/me - update name / phone / password of the logged in user. */
const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');

  if (req.body.name) user.name = req.body.name;
  if (req.body.phone !== undefined) user.phone = req.body.phone;
  if (req.body.email && req.body.email.toLowerCase() !== user.email) {
    const taken = await User.findOne({ email: req.body.email.toLowerCase() });
    if (taken) return res.status(409).json({ success: false, message: 'That email is already in use.' });
    user.email = req.body.email;
  }
  if (req.body.password) {
    if (req.body.password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    user.password = req.body.password;
  }

  await user.save();
  res.json({ success: true, message: 'Profile updated.', data: { user } });
});

module.exports = { register, login, getMe, updateMe };
