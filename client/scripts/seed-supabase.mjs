#!/usr/bin/env node
/**
 * Seeds the Supabase project with the BazaarHub demo catalog.
 *
 *   npm run seed:supabase                      # write to the project
 *   node client/scripts/seed-supabase.mjs --dry-run   # print what would be written
 *   (npm on Windows eats flags after one `--`; via npm use: -- -- --dryrun)
 *
 * Needs two values in client/.env.local (Supabase > Project Settings > API):
 *   NEXT_PUBLIC_SUPABASE_URL    Project URL
 *   SUPABASE_SERVICE_ROLE_KEY   service_role secret (server only, never in the browser)
 *
 * Idempotent: categories match by name, products by sku, auth accounts by
 * email and demo orders by order number - re-running only fills in gaps.
 * Demo users are created through the Auth admin API, so the
 * handle_new_user() trigger builds their profiles exactly like a real signup.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { categories, products, users } from '../../supabase/seed-data.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const imageDir = path.join(repoRoot, 'client', 'public', 'images', 'products');

const dryRun = process.argv.includes('--dry-run') || process.argv.includes('--dryrun');

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(repoRoot, '.env'));
loadEnvFile(path.join(repoRoot, 'client', '.env'));
loadEnvFile(path.join(repoRoot, 'client', '.env.local'));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!dryRun && (!SUPABASE_URL || !SERVICE_KEY)) {
  console.error(
    '\nMissing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Add them to client/.env.local (Supabase dashboard > Project Settings > API).\n'
  );
  process.exit(1);
}

const slugify = (str) =>
  String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const round2 = (n) => Math.round(n * 100) / 100;

// Same rule as computeEffectivePrice() in the old Product model.
const effectivePrice = (p) =>
  p.discount_price > 0 && p.discount_price < p.price ? p.discount_price : p.price;

const seedSku = (item, i) => item.sku || `BZ-${String(i + 1).padStart(4, '0')}`;

// Local jpg/svg committed by the Mongo-era seeder; last resort Unsplash URL.
function localImage(fileBase, photoId) {
  if (fs.existsSync(path.join(imageDir, `${fileBase}.jpg`))) {
    return `/images/products/${fileBase}.jpg`;
  }
  if (fs.existsSync(path.join(imageDir, `${fileBase}.svg`))) {
    return `/images/products/${fileBase}.svg`;
  }
  return `https://images.unsplash.com/${photoId}?w=900&h=900&fit=crop&q=75&fm=jpg`;
}

function die(message) {
  console.error(`\nSeed failed: ${message}\n`);
  process.exit(1);
}

async function selectColumn(sb, table, column) {
  const { data, error } = await sb.from(table).select(column);
  if (error) die(`${table}: ${error.message}`);
  return new Set((data || []).map((row) => row[column]));
}

async function listAuthUsers(sb) {
  const all = [];
  for (let page = 1; ; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 100 });
    if (error) die(`auth admin listUsers: ${error.message}`);
    const batch = (data && data.users) || [];
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

// Port of seedDemoOrders() in server/seed/seed.js so the dashboard starts
// with the same six sample orders as the Mongo stack.
const DEMO_STATUSES = ['Delivered', 'Delivered', 'Shipped', 'Processing', 'Confirmed', 'Pending'];
const DEMO_ADDRESSES = [
  {
    fullName: 'Demo Customer',
    email: 'customer@bazaarhub.com',
    phone: '+1 555 010 1234',
    address: '221B Maple Avenue',
    city: 'Portland',
    province: 'Oregon',
    postalCode: '97205',
    country: 'United States',
  },
  {
    fullName: 'Demo Customer',
    email: 'customer@bazaarhub.com',
    phone: '+1 555 010 1234',
    address: '88 Harbor Street',
    city: 'Seattle',
    province: 'Washington',
    postalCode: '98101',
    country: 'United States',
  },
];

function buildDemoOrders(customerId, someProducts) {
  if (someProducts.length < 4) return [];
  const rows = [];
  for (let i = 0; i < DEMO_STATUSES.length; i++) {
    const status = DEMO_STATUSES[i];
    const count = 1 + (i % 3);
    const items = [];
    for (let j = 0; j < count; j++) {
      const prod = someProducts[(i * 2 + j) % someProducts.length];
      items.push({
        product: prod.id,
        name: prod.name,
        image: (prod.images && prod.images[0]) || '',
        price: effectivePrice(prod),
        quantity: 1 + (j % 2),
        stockAtOrder: prod.stock,
      });
    }

    const subtotal = round2(items.reduce((s, it) => s + it.price * it.quantity, 0));
    const shipping = subtotal >= 75 ? 0 : 6.99;
    const total = round2(subtotal + shipping);
    const createdAt = new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString();

    rows.push({
      order_number: `BZH-SEED-${String(i + 1).padStart(4, '0')}`,
      user_id: customerId,
      items,
      shipping_address: DEMO_ADDRESSES[i % DEMO_ADDRESSES.length],
      payment_method: 'cod',
      payment_status: status === 'Delivered' ? 'Paid' : 'Unpaid',
      subtotal,
      shipping,
      total,
      status,
      status_history: [{ status, at: createdAt, by: 'system' }],
      delivered_at: status === 'Delivered' ? createdAt : null,
      created_at: createdAt,
    });
  }
  return rows;
}

async function main() {
  const sb = dryRun
    ? null
    : createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

  console.log(dryRun ? '\nSeed (dry run - nothing is written)...' : '\nSeeding Supabase...');

  // ---------------------------------------------------------------- categories
  console.log('\nCategories...');
  const existingCategoryNames = dryRun
    ? new Set()
    : await selectColumn(sb, 'categories', 'name');
  const newCategories = categories.filter((c) => !existingCategoryNames.has(c.name));
  const categoryIds = new Map();

  if (dryRun) {
    console.log(`  would insert ${newCategories.length}/${categories.length}`);
    categories.forEach((c) => categoryIds.set(c.name, `dry-${slugify(c.name)}`));
  } else {
    if (newCategories.length) {
      const rows = newCategories.map((c) => ({
        name: c.name,
        description: c.description,
        icon: c.icon,
        image: localImage(`category-${slugify(c.name)}`, c.photo),
      }));
      const { error } = await sb.from('categories').insert(rows);
      if (error) die(`insert categories: ${error.message}`);
    }
    const { data, error } = await sb.from('categories').select('id,name');
    if (error) die(`read categories: ${error.message}`);
    (data || []).forEach((r) => categoryIds.set(r.name, r.id));
    console.log(`  inserted ${newCategories.length}, ${categoryIds.size} total`);
  }

  // ------------------------------------------------------------------ products
  console.log('\nProducts...');
  const existingSkus = dryRun ? new Set() : await selectColumn(sb, 'products', 'sku');
  const newProducts = products
    .map((item, i) => ({ item, sku: seedSku(item, i) }))
    .filter(({ sku }) => !existingSkus.has(sku));

  if (newProducts.length) {
    const rows = newProducts.map(({ item, sku }) => {
      const categoryId = categoryIds.get(item.category);
      if (!categoryId) die(`Unknown category "${item.category}" for "${item.name}"`);
      return {
        name: item.name,
        description: item.description,
        price: item.price,
        discount_price: item.discountPrice || 0,
        category_id: categoryId,
        brand: item.brand || '',
        sku,
        images: item.photos.map((photoId, k) => localImage(`${slugify(item.name)}-${k + 1}`, photoId)),
        stock: item.stock,
        sold: item.numReviews ? Math.round(item.numReviews / 3) : 0,
        rating: item.rating || 0,
        num_reviews: item.numReviews || 0,
        featured: !!item.featured,
        specifications: item.specifications || [],
        reviews: (item.reviews || []).map((r) => ({ ...r })),
      };
    });

    if (dryRun) {
      console.log(`  would insert ${rows.length}/${products.length}`);
    } else {
      const { error } = await sb.from('products').insert(rows);
      if (error) die(`insert products: ${error.message}`);
      console.log(`  inserted ${rows.length}`);
    }
  } else {
    console.log(`  ${existingSkus.size} already present, nothing to do`);
  }

  // ------------------------------------------------------------- demo accounts
  console.log('\nDemo accounts...');
  const authUsers = dryRun ? [] : await listAuthUsers(sb);
  const userByEmail = new Map(authUsers.map((u) => [u.email, u]));
  const userIdByRole = new Map();

  for (const u of users) {
    let authUser = userByEmail.get(u.email);

    if (dryRun) {
      console.log(`  would ensure ${u.role}: ${u.email} / ${u.password}`);
      userIdByRole.set(u.role, `dry-${u.role}`);
      continue;
    }

    if (!authUser) {
      const { data, error } = await sb.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name },
      });
      if (error) die(`create ${u.email}: ${error.message}`);
      authUser = data.user;
      console.log(`  created ${u.role}: ${u.email} / ${u.password}`);
    } else {
      console.log(`  exists  ${u.role}: ${u.email}`);
    }

    if (u.role === 'admin') {
      const { error } = await sb.from('profiles').update({ role: 'admin' }).eq('id', authUser.id);
      if (error) die(`promote ${u.email} to admin: ${error.message}`);
    }
    userIdByRole.set(u.role, authUser.id);
  }

  // ------------------------------------------------------------- demo orders
  console.log('\nDemo orders...');
  const customerId = userIdByRole.get('customer');
  if (!customerId) {
    console.log('  skipped (no demo customer)');
  } else {
    const seedSkus = products.map((item, i) => seedSku(item, i));
    let someProducts = [];

    if (dryRun) {
      someProducts = products.slice(0, 8).map((item, i) => ({
        id: `dry-${seedSku(item, i)}`,
        name: item.name,
        images: item.photos.map((photoId, k) => localImage(`${slugify(item.name)}-${k + 1}`, photoId)),
        price: item.price,
        discount_price: item.discountPrice || 0,
        stock: item.stock,
      }));
    } else {
      const { data, error } = await sb
        .from('products')
        .select('id,name,images,price,discount_price,stock,sku')
        .in('sku', seedSkus);
      if (error) die(`read products for orders: ${error.message}`);
      const rowBySku = new Map((data || []).map((r) => [r.sku, r]));
      someProducts = seedSkus.map((sku) => rowBySku.get(sku)).filter(Boolean).slice(0, 8);
    }

    const orders = buildDemoOrders(customerId, someProducts);
    const numbers = orders.map((o) => o.order_number);
    let missing = orders;

    if (!dryRun) {
      const { data, error } = await sb.from('orders').select('order_number').in('order_number', numbers);
      if (error) die(`read demo orders: ${error.message}`);
      const existing = new Set((data || []).map((o) => o.order_number));
      missing = orders.filter((o) => !existing.has(o.order_number));
    }

    if (!missing.length) {
      console.log('  all demo orders already present');
    } else if (dryRun) {
      console.log(`  would insert ${missing.length} orders (${missing.map((o) => o.order_number).join(', ')})`);
    } else {
      const { error } = await sb.from('orders').insert(missing);
      if (error) die(`insert demo orders: ${error.message}`);
      console.log(`  inserted ${missing.length} orders`);
    }
  }

  console.log(
    dryRun
      ? '\nDry run complete - nothing was written.\n'
      : '\nSeed complete.\n'
  );
}

main().catch((err) => die(err.message));
