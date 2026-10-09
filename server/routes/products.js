const router = require('express').Router();
const { body } = require('express-validator');
const {
  listProducts,
  listFeatured,
  getProduct,
  getRelated,
  createProduct,
  updateProduct,
  deleteProduct,
  createReview,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');

const productRules = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2-120 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number').toFloat(),
  body('discountPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Discount must be 0 or more').toFloat(),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be 0 or more').toInt(),
  body('images').optional().isArray().withMessage('Images must be an array'),
];

// Public
router.get('/', listProducts);
router.get('/featured', listFeatured);
router.get('/:id', getProduct);
router.get('/:id/related', getRelated);

// Admin
router.post('/', protect, adminOnly, productRules, validate, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

// Reviews (any logged in user)
router.post(
  '/:id/reviews',
  protect,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5').toInt(),
    body('comment').trim().isLength({ min: 3, max: 1000 }).withMessage('Comment must be 3-1000 characters'),
  ],
  validate,
  createReview
);

module.exports = router;
