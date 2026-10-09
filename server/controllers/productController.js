const mongoose = require('mongoose');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');
const { computeEffectivePrice } = Product;

/** Escapes user input so it can safely be used inside a regular expression. */
const escapeRegex = (str = '') => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { effectivePrice: 1 },
  price_desc: { effectivePrice: -1 },
  rating: { rating: -1, numReviews: -1 },
  popular: { sold: -1, rating: -1 },
};

/**
 * GET /api/products
 * Supports search, category, price range, rating, stock, featured,
 * sorting and pagination - everything the shop page needs in one call.
 */
const listProducts = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    minRating,
    featured,
    inStock,
    sort = 'newest',
    page = 1,
    limit = 12,
    onSale,
    ids,
  } = req.query;

  const filter = {};
  const andConditions = [];

  if (search) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
    andConditions.push({ $or: [{ name: rx }, { category: rx }, { brand: rx }, { description: rx }] });
  }

  if (category) {
    // Accept either the display name ("Home & Living") or the slug ("home-living")
    const rx = new RegExp('^' + escapeRegex(String(category).trim()) + '$', 'i');
    andConditions.push({ category: rx });
  }

  if (andConditions.length) filter.$and = andConditions;

  if (minPrice !== undefined || maxPrice !== undefined) {
    const range = {};
    if (minPrice !== undefined && minPrice !== '') range.$gte = Number(minPrice);
    if (maxPrice !== undefined && maxPrice !== '' && Number(maxPrice) >= 0) range.$lte = Number(maxPrice);
    if (Object.keys(range).length) filter.effectivePrice = range;
  }

  if (minRating !== undefined && minRating !== '') {
    filter.rating = { $gte: Number(minRating) };
  }

  if (featured === 'true') filter.featured = true;
  if (inStock === 'true') filter.stock = { $gt: 0 };

  // Comma separated ids - used by the wishlist to hydrate saved products
  if (ids) {
    const idList = String(ids)
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id && mongoose.isValidObjectId(id));
    if (idList.length === 0) {
      return res.json({
        success: true,
        data: { products: [], total: 0, page: 1, pages: 1, limit: 12 },
      });
    }
    filter._id = { $in: idList };
  }

  if (onSale === 'true') {
    andConditions.push({
      $expr: { $and: [{ $gt: ['$discountPrice', 0] }, { $lt: ['$discountPrice', '$price'] }] },
    });
  }
  if (andConditions.length) filter.$and = andConditions;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const sortObj = SORTS[sort] || SORTS.newest;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortObj).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      products,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
    },
  });
});

/** GET /api/products/featured - shortcut used by the home page. */
const listFeatured = asyncHandler(async (req, res) => {
  const limit = Math.min(24, parseInt(req.query.limit, 10) || 8);
  const products = await Product.find({ featured: true }).sort({ createdAt: -1 }).limit(limit).lean();
  res.json({ success: true, data: { products, total: products.length } });
});

/** GET /api/products/:id - accepts a Mongo id or a product slug. */
const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let product = null;

  if (mongoose.isValidObjectId(id)) {
    product = await Product.findById(id).lean();
  }
  if (!product) {
    product = await Product.findOne({ slug: id }).lean();
  }
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  res.json({ success: true, data: { product } });
});

/** GET /api/products/:id/related - other products in the same category. */
const getRelated = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

  const products = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
  })
    .sort({ rating: -1 })
    .limit(8)
    .lean();

  res.json({ success: true, data: { products } });
});

/** POST /api/products (admin) */
const createProduct = asyncHandler(async (req, res) => {
  const body = { ...req.body };

  if (Array.isArray(body.specifications)) {
    body.specifications = body.specifications.filter((s) => s && s.key && s.value);
  }
  body.effectivePrice = computeEffectivePrice(body.price, body.discountPrice);

  const product = await Product.create(body);
  res.status(201).json({ success: true, message: 'Product created.', data: { product } });
});

/** PUT /api/products/:id (admin) - supports partial updates. */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

  const editable = [
    'name',
    'description',
    'price',
    'discountPrice',
    'category',
    'brand',
    'sku',
    'images',
    'stock',
    'rating',
    'featured',
    'specifications',
  ];

  editable.forEach((key) => {
    if (req.body[key] !== undefined) product[key] = req.body[key];
  });

  if (Array.isArray(req.body.specifications)) {
    product.specifications = req.body.specifications.filter((s) => s && s.key && s.value);
  }

  // Re-sync when price or discount changed
  if (req.body.price !== undefined || req.body.discountPrice !== undefined) {
    product.effectivePrice = computeEffectivePrice(product.price, product.discountPrice);
  }

  await product.save();
  res.json({ success: true, message: 'Product updated.', data: { product } });
});

/** DELETE /api/products/:id (admin) */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
  res.json({ success: true, message: 'Product deleted.' });
});

/** POST /api/products/:id/reviews (logged in users) */
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

  const existing = product.reviews.find((r) => r.user && r.user.toString() === req.user._id.toString());

  if (existing) {
    existing.rating = rating;
    existing.comment = comment;
  } else {
    product.reviews.push({
      user: req.user._id,
      name: req.user.name,
      rating,
      comment,
    });
  }

  product.numReviews = product.reviews.length;
  product.rating =
    Math.round((product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length) * 10) / 10;

  await product.save();

  res.status(201).json({
    success: true,
    message: existing ? 'Review updated.' : 'Review added.',
    data: { reviews: product.reviews, rating: product.rating, numReviews: product.numReviews },
  });
});

module.exports = {
  listProducts,
  listFeatured,
  getProduct,
  getRelated,
  createProduct,
  updateProduct,
  deleteProduct,
  createReview,
};
