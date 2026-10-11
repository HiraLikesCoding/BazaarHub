/**
 * Order data access - fully on Supabase.
 *
 * Checkout goes through the transactional place_order() RPC, admin status
 * changes through set_order_status() (stock restore on cancel), and RLS
 * scopes reads: own orders for customers, everything for admins.
 */
import { getSupabase, escapeFilterValue } from '@/lib/supabase';

export function toOrderDto(row) {
  if (!row) return null;
  return {
    _id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    user: row.user || null,
    items: row.items || [],
    shippingAddress: row.shipping_address || {},
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total),
    status: row.status,
    statusHistory: row.status_history || [],
    note: row.note,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Checkout - one RPC does validation, stock and the order number. */
export async function placeOrder(payload) {
  const sb = getSupabase();
  const { data, error } = await sb.rpc('place_order', {
    p_items: (payload.items || []).map((item) => ({
      product: item.product,
      quantity: item.quantity,
    })),
    p_shipping_address: payload.shippingAddress,
    p_payment_method: payload.paymentMethod || 'cod',
    p_note: payload.note || '',
  });
  if (error) throw new Error(error.message || 'Could not place the order.');
  return toOrderDto(data);
}

/** RLS scopes this to the signed-in user's orders. */
export async function fetchMyOrders() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(toOrderDto);
}

export async function fetchOrder(id) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('orders')
    .select('*,user:profiles(name,email,role)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return toOrderDto(data);
}

/** Admin: every order, optional status filter / search, RLS allows it all. */
export async function fetchAllOrders(params = {}) {
  const { status, page = 1, limit = 20, search } = params;
  const sb = getSupabase();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  let query = sb
    .from('orders')
    .select('*,user:profiles(name,email)', { count: 'exact' });

  if (status) query = query.eq('status', status);

  const term = String(search || '').trim();
  if (term) {
    const pattern = `%${escapeFilterValue(term)}%`;
    query = query.or(
      `order_number.ilike."${pattern}",shipping_address->>fullName.ilike."${pattern}",shipping_address->>email.ilike."${pattern}"`
    );
  }

  const offset = (pageNum - 1) * limitNum;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limitNum - 1);
  if (error) throw new Error(error.message);

  const total = count || 0;
  return {
    orders: (data || []).map(toOrderDto),
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
  };
}

/** Admin: status change with history + stock restore on cancel (server side). */
export async function updateOrderStatus(id, status) {
  const sb = getSupabase();
  const { data, error } = await sb.rpc('set_order_status', {
    p_order_id: id,
    p_status: status,
  });
  if (error) throw new Error(error.message || 'Could not update the order.');
  return toOrderDto(data);
}
