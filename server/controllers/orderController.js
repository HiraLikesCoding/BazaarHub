const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

const SHIPPING_FLAT = 6.99;
const FREE_SHIPPING_OVER = 75;

/** Free shipping for bigger orders, flat fee otherwise. */
function calculateShipping(subtotal) {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FLAT;
}

/**
 * POST /api/orders (logged in)
 * Prices are re-read from the database so a manipulated client cannot change them.
 * Stock is decreased atomically and rolled back if any item is unavailable.
 */
const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod = 'cod', note = '' } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Your cart is empty.' });
  }

  const productIds = items.map((i) => i.product).filter((id) => mongoose.isValidObjectId(id));
  if (productIds.length !== items.length) {
    return res.status(400).json({ success: false, message: 'Cart contains an invalid product.' });
  }

  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    const product = productMap[item.product];

    if (!product) {
      return res.status(404).json({ success: false, message: 'One of the products is no longer available.' });
    }
    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        message:
          product.stock === 0
            ? `"${product.name}" is out of stock.`
            : `Only ${product.stock} unit(s) of "${product.name}" left in stock.`,
      });
    }

    const paidPrice = product.effectivePrice || product.price;
    subtotal += paidPrice * qty;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: (product.images && product.images[0]) || '',
      price: paidPrice,
      quantity: qty,
      stockAtOrder: product.stock,
    });
  }

  subtotal = Math.round(subtotal * 100) / 100;
  const shipping = calculateShipping(subtotal);
  const total = Math.round((subtotal + shipping) * 100) / 100;

  // Atomically decrease stock: only succeeds when enough stock is still available.
  const decremented = [];
  for (const item of orderItems) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity, sold: item.quantity } },
      { new: true }
    );

    if (!updated) {
      // Roll back the items we already decreased
      for (const done of decremented) {
        await Product.updateOne({ _id: done.id }, { $inc: { stock: done.qty, sold: -done.qty } });
      }
      const p = productMap[item.product.toString()];
      return res.status(400).json({
        success: false,
        message: `Not enough stock left for "${p ? p.name : 'an item'}". Please update your cart.`,
      });
    }
    decremented.push({ id: item.product, qty: item.quantity });
  }

  const orderPayload = {
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    subtotal,
    shipping,
    total,
    note,
    paymentStatus: paymentMethod === 'cod' ? 'Unpaid' : 'Paid',
  };

  // Rare duplicate order numbers are retried; anything else rolls the stock back
  // so a failed save never leaves inventory decreased.
  let order;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      order = await Order.create(orderPayload);
      break;
    } catch (err) {
      const duplicate = err && err.code === 11000;
      if (duplicate && attempt < 3) continue;

      for (const done of decremented) {
        await Product.updateOne({ _id: done.id }, { $inc: { stock: done.qty, sold: -done.qty } });
      }

      if (duplicate) {
        return res.status(500).json({
          success: false,
          message: 'Could not allocate an order number. Please try again.',
        });
      }
      throw err;
    }
  }

  res.status(201).json({
    success: true,
    message: 'Order placed successfully.',
    data: { order },
  });
});

/** GET /api/orders/mine - order history of the logged in user. */
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: { orders, total: orders.length } });
});

/** GET /api/orders (admin) - every order, optionally filtered by status. */
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ orderNumber: rx }, { 'shippingAddress.fullName': rx }, { 'shippingAddress.email': rx }];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'name email')
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { orders, total, page: pageNum, pages: Math.ceil(total / limitNum) || 1 },
  });
});

/** GET /api/orders/:id - the owner or an admin may view an order. */
const getOrderById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid order id.' });
  }

  const order = await Order.findById(req.params.id).populate('user', 'name email role').lean();
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

  const isOwner = order.user && order.user._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'You are not allowed to view this order.' });
  }

  res.json({ success: true, data: { order } });
});

/** PUT /api/orders/:id/status (admin) - changes the order status. */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, restoreStock } = req.body;

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid order id.' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

  if (status === order.status) {
    return res.json({ success: true, message: 'Status unchanged.', data: { order } });
  }

  order.status = status;
  order.statusHistory.push({ status, at: new Date(), by: req.user.name });
  if (status === 'Delivered') {
    order.deliveredAt = new Date();
    order.paymentStatus = 'Paid'; // cash collected on delivery
  }

  // When an order is cancelled, put the items back into stock (opt-in).
  if (status === 'Cancelled' && restoreStock !== false) {
    for (const item of order.items) {
      await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity, sold: -item.quantity } });
    }
  }

  await order.save();
  res.json({ success: true, message: `Order marked as ${status}.`, data: { order } });
});

module.exports = { createOrder, getMyOrders, getAllOrders, getOrderById, updateOrderStatus, calculateShipping };
