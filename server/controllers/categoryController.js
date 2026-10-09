const Category = require('../models/Category');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

/** GET /api/categories - categories together with how many products they contain. */
const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 }).lean();

  const counts = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toLowerCase(), c.count]));

  const data = categories.map((c) => ({
    ...c,
    productCount: countMap[(c.name || '').toLowerCase()] || 0,
  }));

  res.json({ success: true, data: { categories: data } });
});

/** POST /api/categories (admin) */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description = '', image = '', icon = '🛍️' } = req.body;

  const exists = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  if (exists) return res.status(409).json({ success: false, message: 'Category already exists.' });

  const category = await Category.create({ name, description, image, icon });
  res.status(201).json({ success: true, message: 'Category created.', data: { category } });
});

/** PUT /api/categories/:id (admin) */
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });

  ['name', 'description', 'image', 'icon'].forEach((key) => {
    if (req.body[key] !== undefined) category[key] = req.body[key];
  });

  await category.save();
  res.json({ success: true, message: 'Category updated.', data: { category } });
});

/** DELETE /api/categories/:id (admin) */
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });

  const used = await Product.countDocuments({ category: category.name });
  if (used > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete: ${used} product(s) still use this category.`,
    });
  }

  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted.' });
});

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
