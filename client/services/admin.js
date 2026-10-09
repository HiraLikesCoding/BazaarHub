import { get, buildQuery } from '@/lib/api';

export async function fetchDashboardStats() {
  const data = await get('/api/admin/stats');
  return data.data;
}

export async function fetchInventory(params = {}) {
  const data = await get(`/api/admin/inventory${buildQuery(params)}`);
  return data.data; // { products, total, page, pages, counts }
}

export async function fetchCustomers(params = {}) {
  const data = await get(`/api/admin/customers${buildQuery(params)}`);
  return data.data; // { customers, total, page, pages }
}
