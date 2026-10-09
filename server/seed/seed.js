/**
 * Seeds the database with categories, products, demo users and demo orders.
 *
 *   npm run seed          - resets data and inserts everything
 *
 * Images are downloaded once from Unsplash into client/public/images/products
 * so the site can serve them locally (no external requests at runtime).
 */
const fs = require('fs');
const mongoose = require('mongoose');

const { categories, products, users } = require('./data');
const { ensureImage, slugify, IMAGE_DIR } = require('./images');
const Category = require('../models/Category');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

/** Creates a couple of sample orders so the admin dashboard has data. */
async function seedDemoOrders(demoUser) {
  const someProducts = await Product.find().limit(8).lean();
  if (someProducts.length < 4) return 0;

  const statuses = ['Delivered', 'Delivered', 'Shipped', 'Processing', 'Confirmed', 'Pending'];
  const addresses = [
    { fullName: 'Demo Customer', email: 'customer@bazaarhub.com', phone: '+1 555 010 1234', address: '221B Maple Avenue', city: 'Portland', province: 'Oregon', postalCode: '97205', country: 'United States' },
    { fullName: 'Demo Customer', email: 'customer@bazaarhub.com', phone: '+1 555 010 1234', address: '88 Harbor Street', city: 'Seattle', province: 'Washington', postalCode: '98101', country: 'United States' },
  ];

  let created = 0;
  for (let i = 0; i < statuses.length; i++) {
    const count = 1 + (i % 3);
    const items = [];
    for (let j = 0; j < count; j++) {
      const prod = someProducts[(i * 2 + j) % someProducts.length];
      const qty = 1 + (j % 2);
      items.push({
        product: prod._id,
        name: prod.name,
        image: (prod.images && prod.images[0]) || '',
        price: prod.effectivePrice || prod.price,
        quantity: qty,
        stockAtOrder: prod.stock,
      });
    }

    const subtotal = Math.round(items.reduce((s, it) => s + it.price * it.quantity, 0) * 100) / 100;
    const shipping = subtotal >= 75 ? 0 : 6.99;
    const total = Math.round((subtotal + shipping) * 100) / 100;

    const daysAgo = i * 2;
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const order = new Order({
      user: demoUser._id,
      items,
      shippingAddress: addresses[i % addresses.length],
      paymentMethod: 'cod',
      paymentStatus: statuses[i] === 'Delivered' ? 'Paid' : 'Unpaid',
      subtotal,
      shipping,
      total,
      status: statuses[i],
      createdAt,
      deliveredAt: statuses[i] === 'Delivered' ? createdAt : undefined,
    });
    order.statusHistory = [{ status: statuses[i], at: createdAt, by: 'system' }];
    await order.save();
    created++;
  }
  return created;
}

async function runSeed({ quiet = false } = {}) {
  const log = (...a) => (quiet ? null : console.log(...a));

  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

  log('\nSeeding categories...');
  await Category.deleteMany({});
  const categoryDocs = [];
  for (const c of categories) {
    const image = await ensureImage('category-' + slugify(c.name), c.photo, c.name);
    categoryDocs.push(await Category.create({ name: c.name, description: c.description, icon: c.icon, image }));
  }
  log(`  ${categoryDocs.length} categories`);

  log('Downloading images and seeding products...');
  await Product.deleteMany({});
  const productDocs = [];
  for (let i = 0; i < products.length; i++) {
    const item = products[i];
    const images = [];
    for (let k = 0; k < item.photos.length; k++) {
      images.push(await ensureImage(`${slugify(item.name)}-${k + 1}`, item.photos[k], item.name));
    }

    productDocs.push(
      await Product.create({
        name: item.name,
        description: item.description,
        price: item.price,
        discountPrice: item.discountPrice || 0,
        category: item.category,
        brand: item.brand || '',
        sku: item.sku || `BZ-${String(i + 1).padStart(4, '0')}`,
        images,
        stock: item.stock,
        rating: item.rating || 0,
        numReviews: item.numReviews || 0,
        featured: !!item.featured,
        specifications: item.specifications || [],
        reviews: (item.reviews || []).map((r) => ({ ...r })),
        sold: item.numReviews ? Math.round(item.numReviews / 3) : 0,
      })
    );
    log(`  [${i + 1}/${products.length}] ${item.name}`);
  }

  log('Creating demo users...');
  await User.deleteMany({});
  const userDocs = {};
  for (const u of users) {
    userDocs[u.role] = await User.create(u);
    log(`  ${u.role}: ${u.email} / ${u.password}`);
  }

  log('Creating demo orders...');
  await Order.deleteMany({});
  const orderCount = await seedDemoOrders(userDocs.customer);

  log('\nSeed complete.');
  log(`  ${categoryDocs.length} categories, ${productDocs.length} products, ${Object.keys(userDocs).length} users, ${orderCount} orders`);
}

if (require.main === module) {
  (async () => {
    const pathMod = require('path');
    const fsMod = require('fs');
    const dotenv = require('dotenv');
    const localEnv = pathMod.join(__dirname, '..', '.env');
    const rootEnv = pathMod.join(__dirname, '..', '..', '.env');
    dotenv.config({ path: fsMod.existsSync(localEnv) ? localEnv : rootEnv });

    try {
      const connectDB = require('../config/db');
      await connectDB();
      await runSeed();
      await mongoose.connection.close();
      process.exit(0);
    } catch (err) {
      console.error('\nSeed failed:', err.message);
      process.exit(1);
    }
  })();
}

module.exports = { runSeed };
