/**
 * End-to-end API smoke test. Boots an in-memory MongoDB + the Express app,
 * seeds sample data and then calls every important endpoint.
 *
 *   npm test
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-do-not-use-in-production';
process.env.BCRYPT_SALT_ROUNDS = '4'; // faster tests

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const localEnv = path.join(__dirname, '..', '.env');
const rootEnv = path.join(__dirname, '..', '..', '.env');
dotenv.config({ path: fs.existsSync(localEnv) ? localEnv : rootEnv });
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-do-not-use-in-production';
require('../config/memoryMongo');

const results = [];
let baseUrl = '';
let adminToken = '';
let customerToken = '';
let productId = '';
let orderId = '';

function check(name, condition, extra = '') {
  results.push({ name, ok: !!condition, extra });
  console.log(`${condition ? '  PASS' : '  FAIL'} - ${name}${extra ? '  [' + extra + ']' : ''}`);
}

async function api(pathname, { method = 'GET', body, token } = {}) {
  const res = await fetch(baseUrl + pathname, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    /* non json */
  }
  return { status: res.status, body: json };
}

async function main() {
  const { MongoMemoryServer } = require('mongodb-memory-server');

  console.log('\n=== BazaarHub API smoke test ===\n');
  console.log('1. Starting in-memory MongoDB...');
  const memory = await MongoMemoryServer.create();
  process.env.MONGODB_URI = memory.getUri();

  const mongoose = require('mongoose');
  const connectDB = require('../config/db');
  await connectDB();

  const app = require('../app');
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  const { runSeed } = require('../seed/seed');
  console.log('2. Seeding sample data...');
  await runSeed({ quiet: true });
  console.log('   seeded.\n3. Calling API endpoints...\n');

  // ---- health
  const health = await api('/api/health');
  check('GET /api/health', health.status === 200 && health.body.success, `status ${health.status}`);

  // ---- products
  const all = await api('/api/products?limit=100');
  const count = all.body?.data?.total || 0;
  check('GET /api/products returns 20+ products', count >= 20, `${count} products`);

  const paged = await api('/api/products?page=2&limit=5');
  check('GET /api/products pagination', paged.body?.data?.products?.length === 5 && paged.body?.data?.page === 2);

  const search = await api('/api/products?search=headphones');
  check('GET /api/products?search=headphones', (search.body?.data?.total || 0) >= 1, `${search.body?.data?.total} hit(s)`);

  const byCat = await api('/api/products?category=Books');
  check('GET /api/products?category=Books', (byCat.body?.data?.total || 0) >= 4, `${byCat.body?.data?.total} books`);

  const byPrice = await api('/api/products?minPrice=20&maxPrice=50');
  check('GET /api/products price filter', (byPrice.body?.data?.total || 0) >= 1, `${byPrice.body?.data?.total} in range`);

  const sorted = await api('/api/products?sort=price_asc&limit=5');
  const prices = (sorted.body?.data?.products || []).map((p) => p.effectivePrice);
  check('GET /api/products sorted by price', prices.every((v, i) => i === 0 || v >= prices[i - 1]));

  const featured = await api('/api/products/featured');
  check('GET /api/products/featured', (featured.body?.data?.products || []).every((p) => p.featured), `${featured.body?.data?.products?.length} featured`);

  const first = (all.body?.data?.products || [])[0];
  productId = first?._id;
  const detail = await api(`/api/products/${productId}`);
  check('GET /api/products/:id', detail.status === 200 && detail.body?.data?.product?.name === first.name);

  const bySlug = await api(`/api/products/${detail.body.data.product.slug}`);
  check('GET /api/products/:slug', bySlug.status === 200);

  const related = await api(`/api/products/${productId}/related`);
  check('GET /api/products/:id/related', related.status === 200, `${related.body?.data?.products?.length} related`);

  const missing = await api('/api/products/does-not-exist-xyz');
  check('GET /api/products/:id -> 404 when missing', missing.status === 404);

  // ---- categories
  const cats = await api('/api/categories');
  const catList = cats.body?.data?.categories || [];
  check('GET /api/categories', catList.length === 6 && catList.every((c) => typeof c.productCount === 'number'), `${catList.length} categories`);

  // ---- auth
  const reg = await api('/api/auth/register', {
    method: 'POST',
    body: { name: 'Test User', email: 'test@example.com', password: 'secret123' },
  });
  check('POST /api/auth/register', reg.status === 201 && !!reg.body?.data?.token);
  customerToken = reg.body?.data?.token;

  const dup = await api('/api/auth/register', {
    method: 'POST',
    body: { name: 'Test User', email: 'test@example.com', password: 'secret123' },
  });
  check('POST /api/auth/register duplicate email -> 409', dup.status === 409);

  const badReg = await api('/api/auth/register', { method: 'POST', body: { name: 'X', email: 'nope', password: '1' } });
  check('POST /api/auth/register invalid input -> 400', badReg.status === 400);

  const login = await api('/api/auth/login', { method: 'POST', body: { email: 'test@example.com', password: 'secret123' } });
  check('POST /api/auth/login', login.status === 200 && !!login.body?.data?.token);

  const badLogin = await api('/api/auth/login', { method: 'POST', body: { email: 'test@example.com', password: 'wrongpass' } });
  check('POST /api/auth/login wrong password -> 401', badLogin.status === 401);

  const me = await api('/api/auth/me', { token: customerToken });
  check('GET /api/auth/me', me.status === 200 && me.body?.data?.user?.email === 'test@example.com');
  check('password never returned', JSON.stringify(me.body).indexOf('secret123') === -1);

  const noAuth = await api('/api/auth/me');
  check('GET /api/auth/me without token -> 401', noAuth.status === 401);

  const adminLogin = await api('/api/auth/login', { method: 'POST', body: { email: 'admin@bazaarhub.com', password: 'Admin@123' } });
  check('admin can log in', adminLogin.status === 200);
  adminToken = adminLogin.body?.data?.token;
  const adminMe = await api('/api/auth/me', { token: adminLogin.body?.data?.token });
  check('admin role is admin', adminMe.body?.data?.user?.role === 'admin');

  // ---- orders
  const productForOrder = (all.body?.data?.products || []).find((p) => p.stock > 3) || first;
  const orderRes = await api('/api/orders', {
    method: 'POST',
    token: customerToken,
    body: {
      items: [{ product: productForOrder._id, quantity: 2 }],
      shippingAddress: {
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '+1 555 010 0000',
        address: '10 Test Road',
        city: 'Austin',
        province: 'Texas',
        postalCode: '78701',
        country: 'United States',
      },
      paymentMethod: 'cod',
    },
  });
  check('POST /api/orders', orderRes.status === 201, `order ${orderRes.body?.data?.order?.orderNumber}`);
  orderId = orderRes.body?.data?.order?._id;

  const afterOrder = await api(`/api/products/${productForOrder._id}`);
  check('stock decreased after order', afterOrder.body?.data?.product?.stock === productForOrder.stock - 2,
    `${productForOrder.stock} -> ${afterOrder.body?.data?.product?.stock}`);

  const tooMany = await api('/api/orders', {
    method: 'POST',
    token: customerToken,
    body: {
      items: [{ product: productForOrder._id, quantity: 9999 }],
      shippingAddress: {
        fullName: 'Test User', email: 'test@example.com', phone: '+1 555 010 0000',
        address: '10 Test Road', city: 'Austin', province: 'Texas', postalCode: '78701', country: 'United States',
      },
    },
  });
  check('POST /api/orders more than stock -> 400', tooMany.status === 400, tooMany.body?.message);

  const stockRestored = await api(`/api/products/${productForOrder._id}`);
  check('stock restored after failed order', stockRestored.body?.data?.product?.stock === productForOrder.stock - 2);

  const myOrders = await api('/api/orders/mine', { token: customerToken });
  check('GET /api/orders/mine', myOrders.body?.data?.orders?.length === 1);

  const noOrders = await api('/api/orders/mine');
  check('GET /api/orders/mine without token -> 401', noOrders.status === 401);

  const orderDetail = await api(`/api/orders/${orderId}`, { token: customerToken });
  check('GET /api/orders/:id (owner)', orderDetail.status === 200);

  const otherUserOrder = await api('/api/orders', {
    method: 'POST',
    token: adminToken,
    body: {
      items: [{ product: productForOrder._id, quantity: 1 }],
      shippingAddress: {
        fullName: 'Admin', email: 'admin@bazaarhub.com', phone: '+1 555 010 0001',
        address: '1 Admin Way', city: 'Denver', province: 'Colorado', postalCode: '80201', country: 'United States',
      },
    },
  });
  check('admin can place an order too', otherUserOrder.status === 201);

  const foreign = await api(`/api/orders/${otherUserOrder.body?.data?.order?._id}`, { token: customerToken });
  check('customer cannot read someone else order -> 403', foreign.status === 403);

  const statusRes = await api(`/api/orders/${orderId}/status`, { method: 'PUT', token: adminToken, body: { status: 'Shipped' } });
  check('PUT /api/orders/:id/status (admin)', statusRes.status === 200 && statusRes.body?.data?.order?.status === 'Shipped');

  const statusNoAdmin = await api(`/api/orders/${orderId}/status`, { method: 'PUT', token: customerToken, body: { status: 'Delivered' } });
  check('customer cannot change status -> 403', statusNoAdmin.status === 403);

  const allOrders = await api('/api/orders?limit=100', { token: adminToken });
  check('GET /api/orders (admin sees all)', (allOrders.body?.data?.orders?.length || 0) >= 7, `${allOrders.body?.data?.orders?.length} orders`);

  // ---- reviews
  const review = await api(`/api/products/${productId}/reviews`, {
    method: 'POST',
    token: customerToken,
    body: { rating: 5, comment: 'Excellent quality, would buy again.' },
  });
  check('POST /api/products/:id/reviews', review.status === 201);

  const reviewNoAuth = await api(`/api/products/${productId}/reviews`, { method: 'POST', body: { rating: 5, comment: 'x' } });
  check('POST review without token -> 401', reviewNoAuth.status === 401);

  // ---- admin
  const noStats = await api('/api/admin/stats');
  check('GET /api/admin/stats without token -> 401', noStats.status === 401);

  const custStats = await api('/api/admin/stats', { token: customerToken });
  check('GET /api/admin/stats as customer -> 403', custStats.status === 403);

  const stats = await api('/api/admin/stats', { token: adminToken });
  check('GET /api/admin/stats (admin)', stats.status === 200 && stats.body?.data?.totals?.products >= 20,
    JSON.stringify(stats.body?.data?.totals));

  const inventory = await api('/api/admin/inventory', { token: adminToken });
  check('GET /api/admin/inventory', inventory.status === 200 && inventory.body?.data?.products?.length > 0);

  const customers = await api('/api/admin/customers', { token: adminToken });
  check(
    'GET /api/admin/customers (admin)',
    customers.status === 200 && (customers.body?.data?.customers?.length || 0) >= 2,
    `${customers.body?.data?.customers?.length} customers`
  );

  const customersNoAuth = await api('/api/admin/customers');
  check('GET /api/admin/customers without token -> 401', customersNoAuth.status === 401);

  const byIds = await api(`/api/products?ids=${productId}`);
  check(
    'GET /api/products?ids= returns only those products',
    byIds.status === 200 && byIds.body?.data?.total === 1,
    `${byIds.body?.data?.total} hit(s)`
  );

  const badIds = await api('/api/products?ids=definitely-not-an-id');
  check('GET /api/products?ids=invalid -> empty list', badIds.status === 200 && badIds.body?.data?.total === 0);

  const newProduct = await api('/api/products', {
    method: 'POST',
    token: adminToken,
    body: {
      name: 'Test Admin Product',
      description: 'A product created through the admin API during testing.',
      price: 19.99,
      discountPrice: 15.99,
      category: 'Electronics',
      stock: 3,
      featured: true,
      images: ['/images/products/test.svg'],
      specifications: [{ key: 'Colour', value: 'Black' }],
    },
  });
  check('POST /api/products (admin)', newProduct.status === 201 && newProduct.body?.data?.product?.effectivePrice === 15.99);

  const createNoAdmin = await api('/api/products', {
    method: 'POST',
    token: customerToken,
    body: { name: 'Nope', description: 'should not be created', price: 1, category: 'Books' },
  });
  check('POST /api/products as customer -> 403', createNoAdmin.status === 403);

  const invalidProduct = await api('/api/products', { method: 'POST', token: adminToken, body: { name: 'x', description: '', price: -5, category: '' } });
  check('POST /api/products invalid body -> 400', invalidProduct.status === 400);

  const updateProduct = await api(`/api/products/${newProduct.body?.data?.product?._id}`, {
    method: 'PUT',
    token: adminToken,
    body: { price: 25, stock: 12 },
  });
  check('PUT /api/products/:id (admin)', updateProduct.status === 200 && updateProduct.body?.data?.product?.stock === 12);

  const del = await api(`/api/products/${newProduct.body?.data?.product?._id}`, { method: 'DELETE', token: adminToken });
  check('DELETE /api/products/:id (admin)', del.status === 200);

  const newCat = await api('/api/categories', { method: 'POST', token: adminToken, body: { name: 'Test Category' } });
  check('POST /api/categories (admin)', newCat.status === 201);
  const delCat = await api(`/api/categories/${newCat.body?.data?.category?._id}`, { method: 'DELETE', token: adminToken });
  check('DELETE /api/categories/:id (admin)', delCat.status === 200);

  const badRoute = await api('/api/nope');
  check('unknown API route -> 404', badRoute.status === 404);

  // ---- summary
  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
  if (failed.length) {
    console.log('Failed:');
    failed.forEach((f) => console.log(`  - ${f.name} ${f.extra}`));
  }

  await mongoose.connection.close();
  await memory.stop();
  server.close();
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error('\nTest crashed:', err);
  process.exit(1);
});
