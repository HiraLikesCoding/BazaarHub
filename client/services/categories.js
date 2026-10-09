import { get, post, put, del } from '@/lib/api';

export async function fetchCategories(options) {
  const data = await get('/api/categories', options);
  return data.data.categories;
}

export async function createCategory(body) {
  const data = await post('/api/categories', body);
  return data.data.category;
}

export async function updateCategory(id, body) {
  const data = await put(`/api/categories/${encodeURIComponent(id)}`, body);
  return data.data.category;
}

export async function deleteCategory(id) {
  return del(`/api/categories/${encodeURIComponent(id)}`);
}
