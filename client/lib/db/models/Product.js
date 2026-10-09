import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: [1000, 'Comment is too long'] },
  },
  { timestamps: { createdAt: 'createdAt' } }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [120, 'Product name must be at most 120 characters'],
    },
    slug: { type: String, unique: true, lowercase: true, index: true },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [3000, 'Description must be at most 3000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      default: 0,
      min: [0, 'Discount price cannot be negative'],
    },
    // Price the customer actually pays - kept in sync so we can filter and sort by it
    effectivePrice: { type: Number, default: 0, index: true },
    category: {
      type: String,
      required: [true, 'Category is required'],
      index: true,
      trim: true,
    },
    brand: { type: String, default: '', trim: true },
    sku: { type: String, default: '', trim: true, index: true },
    images: {
      type: [String],
      default: [],
      validate: [(v) => v.length <= 8, 'A product can have at most 8 images'],
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    reviews: [reviewSchema],
    specifications: [
      {
        _id: false,
        key: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    featured: { type: Boolean, default: false, index: true },
    sold: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/** Returns the price the customer pays: the discount only counts when it is lower. */
export function computeEffectivePrice(price, discountPrice) {
  const p = Number(price) || 0;
  const d = Number(discountPrice) || 0;
  return d > 0 && d < p ? d : p;
}

// Generate a url friendly slug and keep the payable price up to date
productSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug =
      this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      this._id.toString().slice(-6);
  }
  if (this.isModified('price') || this.isModified('discountPrice') || !this.effectivePrice) {
    this.effectivePrice = computeEffectivePrice(this.price, this.discountPrice);
  }
  next();
});

// In stock / low stock / out of stock label used by the UI and admin inventory
productSchema.virtual('stockStatus').get(function () {
  if (this.stock <= 0) return 'Out of Stock';
  if (this.stock <= 10) return 'Low Stock';
  return 'In Stock';
});

productSchema.index({ name: 'text', description: 'text', category: 'text', brand: 'text' });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
