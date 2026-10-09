const mongoose = require('mongoose');

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const PAYMENT_METHODS = ['cod', 'card', 'wallet'];

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 }, // price paid per unit
  quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
  stockAtOrder: { type: Number, default: 0 },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, 'An order must contain at least one item'],
    },
    shippingAddress: {
      fullName: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      province: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'cod',
    },
    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Paid', 'Refunded'],
      default: 'Unpaid',
    },
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'Pending', index: true },
    statusHistory: [
      {
        _id: false,
        status: { type: String, enum: ORDER_STATUSES },
        at: { type: Date, default: Date.now },
        by: { type: String, default: 'system' },
      },
    ],
    note: { type: String, default: '', maxlength: 500 },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

// BZH-20261003-XXXX style order number. The 4 digit suffix is small enough to
// collide with an existing order, so keep drawing until the number is free.
orderSchema.pre('save', async function () {
  if (this.orderNumber) return;

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  for (let attempt = 0; attempt < 25; attempt++) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const candidate = `BZH-${date}-${rand}`;
    const taken = await Order.exists({ orderNumber: candidate });
    if (!taken) {
      this.orderNumber = candidate;
      break;
    }
  }

  if (!this.orderNumber) {
    throw new Error('Could not generate a unique order number.');
  }
  this.statusHistory = [{ status: this.status, at: new Date(), by: 'system' }];
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
module.exports.ORDER_STATUSES = ORDER_STATUSES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
