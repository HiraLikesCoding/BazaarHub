/**
 * Admin data access - fully on Supabase now.
 *
 * The RPC and the RLS admin policies do the heavy lifting:
 *   admin_stats()          dashboard numbers in one round trip
 *   customer_order_stats   per-customer order totals (view)
 *   products/profiles      list queries, admin RLS allows the reads
 */
import { getSupabase, escapeFilterValue } from '@/lib/supabase';
import { toProductDto } from '@/services/products';

/** Dashboard numbers - same shape the Mongo aggregation returned. */
export async function fetchDashboardStats() {
  const sb = getSupabase();
  const { data, error } = await sb.rpc('admin_stats');
  if (error) throw new Error(error.message || 'Could not load the dashboard.');
  return data;
}

const INVENTORY_SORTS = {
  stock_asc: [['stock', true]],
  stock_desc: [['stock', false]],
  name: [['name', true]],
  updated: [['updated_at', false]],
};

/** Flat stock list with in/low/out counters. */
export async function fetchInventory(params = {}) {
  const { search, status, sort = 'stock_asc', page = 1, limit = 20 } = params;
  const sb = getSupabase();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  let query = sb.from('products').select('*,categories(name)', { count: 'exact' });

  const term = String(search || '').trim();
  if (term) {
    const pattern = `%${escapeFilterValue(term)}%`;
    const { data: catRows, error: catError } = await sb
      .from('categories')
      .select('id')
      .ilike('name', pattern);
    if (catError) throw new Error(catError.message);

    const branches = [`name.ilike."${pattern}"`, `sku.ilike."${pattern}"`];
    const catIds = (catRows || []).map((row) => row.id);
    if (catIds.length) branches.push(`category_id=in.(${catIds.join(',')})`);
    query = query.or(branches.join(','));
  }

  if (status === 'in') query = query.gt('stock', 10);
  if (status === 'low') query = query.gt('stock', 0).lte('stock', 10);
  if (status === 'out') query = query.eq('stock', 0);

  const sortKey = Object.prototype.hasOwnProperty.call(INVENTORY_SORTS, sort)
    ? sort
    : 'stock_asc';
  for (const [column, ascending] of INVENTORY_SORTS[sortKey]) {
    query = query.order(column, { ascending });
  }

  const offset = (pageNum - 1) * limitNum;
  const [{ data, error, count }, outRes, lowRes, inRes] = await Promise.all([
    query.range(offset, offset + limitNum - 1),
    sb.from('products').select('id', { count: 'exact', head: true }).eq('stock', 0),
    sb.from('products').select('id', { count: 'exact', head: true }).gt('stock', 0).lte('stock', 10),
    sb.from('products').select('id', { count: 'exact', head: true }).gt('stock', 10),
  ]);
  if (error) throw new Error(error.message);

  const total = count || 0;
  return {
    products: (data || []).map(toProductDto),
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    counts: {
      in: inRes.count || 0,
      low: lowRes.count || 0,
      out: outRes.count || 0,
    },
  };
}

/** Every profile with their order totals (customer_order_stats view). */
export async function fetchCustomers(params = {}) {
  const { search, role, page = 1, limit = 20 } = params;
  const sb = getSupabase();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  let query = sb
    .from('profiles')
    .select('id,name,email,role,created_at', { count: 'exact' });

  const term = String(search || '').trim();
  if (term) {
    const pattern = `%${escapeFilterValue(term)}%`;
    query = query.or(`name.ilike."${pattern}",email.ilike."${pattern}"`);
  }
  if (role) query = query.eq('role', role);

  const offset = (pageNum - 1) * limitNum;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limitNum - 1);
  if (error) throw new Error(error.message);

  let stats = [];
  if (data && data.length) {
    const { data: statRows, error: statError } = await sb
      .from('customer_order_stats')
      .select('user_id,orders,spent,last_order')
      .in('user_id', data.map((row) => row.id));
    if (statError) throw new Error(statError.message);
    stats = statRows || [];
  }
  const statsById = new Map(stats.map((row) => [row.user_id, row]));

  const customers = (data || []).map((row) => {
    const statsRow = statsById.get(row.id) || {};
    return {
      _id: row.id,
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.created_at,
      orders: statsRow.orders || 0,
      spent: Number(statsRow.spent || 0),
      lastOrder: statsRow.last_order || null,
    };
  });

  const total = count || 0;
  return {
    customers,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
  };
}
