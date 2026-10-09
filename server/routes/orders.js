const router = require('express').Router();
const { body } = require('express-validator');
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');

const addressRules = [
  body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required'),
  body('shippingAddress.email').isEmail().withMessage('A valid email is required'),
  body('shippingAddress.phone').trim().isLength({ min: 6 }).withMessage('Phone number is required'),
  body('shippingAddress.address').trim().notEmpty().withMessage('Address is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.province').trim().notEmpty().withMessage('Province / state is required'),
  body('shippingAddress.postalCode').trim().notEmpty().withMessage('Postal code is required'),
  body('shippingAddress.country').trim().notEmpty().withMessage('Country is required'),
  body('items').isArray({ min: 1 }).withMessage('Cart is empty'),
  body('paymentMethod').optional().isIn(['cod', 'card', 'wallet']).withMessage('Unsupported payment method'),
];

// Place a new order (logged in users only)
router.post('/', protect, addressRules, validate, createOrder);

// Order history: customers see their own orders, admins see everything
router.get('/', protect, async (req, res, next) => {
  if (req.user.role === 'admin') return getAllOrders(req, res, next);
  return getMyOrders(req, res, next);
});

router.get('/mine', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;
