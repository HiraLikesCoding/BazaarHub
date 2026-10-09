const router = require('express').Router();
const { body } = require('express-validator');
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/', listCategories);

router.post(
  '/',
  protect,
  adminOnly,
  [body('name').trim().isLength({ min: 2, max: 40 }).withMessage('Name must be 2-40 characters')],
  validate,
  createCategory
);

router.put('/:id', protect, adminOnly, updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
