import { get, post, put, buildQuery } from '@/lib/api';

export async function placeOrder(payload) {
  const data = await post('/api/orders', payload);
  return data.data.order;
}

export async function fetchMyOrders() {
  const data = await get('/api/orders/mine');
  return data.data.orders;
}

export async function fetchOrder(id) {
  const data = await get(`/api/orders/${encodeURIComponent(id)}`);
  return data.data.order;
}

export async function fetchAllOrders(params = {}) {
  const data = await get(`/api/orders${buildQuery(params)}`);
  return data.data; // { orders, total, page, pages }
}

export async function updateOrderStatus(id, status) {
  const data = await put(`/api/orders/${encodeURIComponent(id)}/status`, { status });
  return data.data.order;
}
