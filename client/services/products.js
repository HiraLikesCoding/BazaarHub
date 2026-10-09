import { get, post, put, del, buildQuery } from '@/lib/api';

/**
 * All product API calls.
 * The optional `options` argument is passed straight to the fetch wrapper
 * (e.g. `{ revalidate: 120 }` when called from a server component).
 */
export async function fetchProducts(params = {}, options) {
  const data = await get(`/api/products${buildQuery(params)}`, options);
  return data.data; // { products, total, page, pages, limit }
}

/** Fetches a specific set of products by id (used by the wishlist). */
export async function fetchProductsByIds(ids, options) {
  if (!ids || ids.length === 0) return [];
  const data = await get(`/api/products${buildQuery({ ids: ids.join(','), limit: 50 })}`, options);
  return data.data.products;
}

export async function fetchFeaturedProducts(limit = 8, options) {
  const data = await get(`/api/products/featured${buildQuery({ limit })}`, options);
  return data.data;
}

export async function fetchProduct(id, options) {
  const data = await get(`/api/products/${encodeURIComponent(id)}`, options);
  return data.data.product;
}

export async function fetchRelatedProducts(id, options) {
  const data = await get(`/api/products/${encodeURIComponent(id)}/related`, options);
  return data.data.products;
}

export async function createProduct(body) {
  const data = await post('/api/products', body);
  return data.data.product;
}

export async function updateProduct(id, body) {
  const data = await put(`/api/products/${encodeURIComponent(id)}`, body);
  return data.data.product;
}

export async function deleteProduct(id) {
  return del(`/api/products/${encodeURIComponent(id)}`);
}

export async function addReview(id, body) {
  const data = await post(`/api/products/${encodeURIComponent(id)}/reviews`, body);
  return data.data;
}
