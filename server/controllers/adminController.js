const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

/** GET /api/admin/stats (admin) - numbers used on the dashboard. */
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalProducts, totalOrders, totalUsers, lowStock, statusAgg, revenueAgg, recentOrders] =
    await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments(),
      // Low stock = more than 0 but 10 or fewer left
      Product.find({ stock: { $gt: 0, $lte: 10 } })
        .select('name stock sku price images')
        .sort({ stock: 1 })
        .limit(8)
        .lean(),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, revenue: { $sum: '$total' }, avgOrder: { $avg: '$total' } } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(6).populate('user', 'name').lean(),
    ]);

  // Revenue for the last 7 days - powers the small bar chart
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const dailySales = await Order.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo }, status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const statusCounts = Object.fromEntries(statusAgg.map((s) => [s._id, s.count]));

  res.json({
    success: true,
    data: {
      totals: {
        products: totalProducts,
        orders: totalOrders,
        users: totalUsers,
        revenue: Math.round((revenueAgg[0]?.revenue || 0) * 100) / 100,
        averageOrder: Math.round((revenueAgg[0]?.avgOrder || 0) * 100) / 100,
        outOfStock: await Product.countDocuments({ stock: 0 }),
        lowStock: await Product.countDocuments({ stock: { $gt: 0, $lte: 10 } }),
        pending: statusCounts.Pending || 0,
      },
      statusCounts,
      dailySales,
      lowStockProducts: lowStock,
      recentOrders,
    },
  });
});

/** GET /api/admin/inventory (admin) - flat list of every product's stock info. */
const getInventory = asyncHandler(async (req, res) => {
  const { search, status, sort = 'stock_asc', page = 1, limit = 20 } = req.query;

  const filter = {};
  if (search) {
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { sku: rx }, { category: rx }];
  }
  if (status === 'in') filter.stock = { $gt: 10 };
  if (status === 'low') filter.stock = { $gt: 0, $lte: 10 };
  if (status === 'out') filter.stock = 0;

  const sorts = {
    stock_asc: { stock: 1 },
    stock_desc: { stock: -1 },
    name: { name: 1 },
    updated: { updatedAt: -1 },
  };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [products, total, counts] = await Promise.all([
    Product.find(filter)
      .sort(sorts[sort] || sorts.stock_asc)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('name sku stock price discountPrice effectivePrice category images updatedAt sold')
      .lean(),
    Product.countDocuments(filter),
    Product.aggregate([
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $eq: ['$stock', 0] }, then: 'out' },
                { case: { $lte: ['$stock', 10] }, then: 'low' },
              ],
              default: 'in',
            },
          },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      products,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      counts: Object.fromEntries(counts.map((c) => [c._id, c.count])),
    },
  });
});

/** GET /api/admin/customers (admin) - every customer with their order totals. */
const getCustomers = asyncHandler(async (req, res) => {
  const { search = '', role = '', page = 1, limit = 20 } = req.query;

  const filter = {};
  if (search) {
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  if (role) filter.role = role;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [users, total, orderStats] = await Promise.all([
    User.find(filter)
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    User.countDocuments(filter),
    Order.aggregate([
      {
        $group: {
          _id: '$user',
          orders: { $sum: 1 },
          spent: { $sum: '$total' },
          lastOrder: { $max: '$createdAt' },
        },
      },
    ]),
  ]);

  const statsById = Object.fromEntries(orderStats.map((s) => [String(s._id), s]));

  const customers = users.map((u) => {
    const stats = statsById[String(u._id)] || {};
    return {
      ...u,
      orders: stats.orders || 0,
      spent: Math.round((stats.spent || 0) * 100) / 100,
      lastOrder: stats.lastOrder || null,
    };
  });

  res.json({
    success: true,
    data: { customers, total, page: pageNum, pages: Math.ceil(total / limitNum) || 1 },
  });
});

module.exports = { getDashboardStats, getInventory, getCustomers };
