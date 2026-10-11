/**
 * Product data access - fully on Supabase.
 *
 * Reads are public catalog queries (RLS) shaped like the old Mongo documents
 * (`_id`, `discountPrice`, `numReviews`, ...) so no component had to change.
 * Writes are covered by the admin RLS policies; reviews go through the
 * add_product_review() RPC because they carry the signed-in user's id.
 */
import { getSupabase, isBuilding, isUuid, escapeFilterValue } from '@/lib/supabase';

/** Selects the product plus its category name in one round trip. */
const PRODUCT_COLUMNS = '*,categories(name)';

// Same orders the Mongo controller offered (server/controllers/productController.js).
const SORTS = {
  newest: [['created_at', false]],
  oldest: [['created_at', true]],
  price_asc: [['effective_price', true]],
  price_desc: [['effective_price', false]],
  rating: [
    ['rating', false],
    ['num_reviews', false],
  ],
  popular: [
    ['sold', false],
    ['rating', false],
  ],
};

const EMPTY_PAGE = (limit) => ({ products: [], total: 0, page: 1, pages: 1, limit });

function fail(error) {
  throw new Error(error.message || 'Supabase request failed.');
}

/** Row -> the product shape every component already knows. */
export function toProductDto(row) {
  if (!row) return null;
  return {
    _id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    discountPrice: Number(row.discount_price),
    effectivePrice: Number(row.effective_price),
    category: (row.categories && row.categories.name) || '',
    categoryId: row.category_id,
    brand: row.brand,
    sku: row.sku,
    images: row.images || [],
    stock: row.stock,
    sold: row.sold,
    rating: Number(row.rating),
    numReviews: row.num_reviews,
    featured: row.featured,
    specifications: row.specifications || [],
    reviews: row.reviews || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Case-insensitive exact match on category name, plus exact slug. */
async function findCategoryIds(term, { contains = false } = {}) {
  const escaped = escapeFilterValue(term);
  const pattern = contains ? `%${escaped}%` : escaped;
  const sb = getSupabase();
  const { data, error } = await sb
    .from('categories')
    .select('id')
    .or(`name.ilike."${pattern}",slug.ilike."${pattern}"`);
  if (error) fail(error);
  return (data || []).map((row) => row.id);
}

/**
 * GET /api/products equivalent.
 * Accepts the same params the shop URL uses: search, category (name or slug),
 * minPrice, maxPrice, minRating, featured, inStock, onSale, ids, sort, page,
 * limit. Returns { products, total, page, pages, limit }.
 */
export async function fetchProducts(params = {}) {
  if (isBuilding()) throw new Error('API is not available while building');

  const {
    search,
    category,
    minPrice,
    maxPrice,
    minRating,
    featured,
    inStock,
    onSale,
    ids,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = params;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const sb = getSupabase();

  let query = sb.from('products').select(PRODUCT_COLUMNS, { count: 'exact' });

  // Wishlist hydration: comma separated ids, invalid ones dropped like before.
  if (ids !== undefined && ids !== null && ids !== '') {
    const idList = String(ids)
      .split(',')
      .map((id) => id.trim())
      .filter(isUuid);
    if (idList.length === 0) return EMPTY_PAGE(limitNum);
    query = query.in('id', idList);
  }

  if (category) {
    const term = String(category).trim();
    if (term) {
      const categoryIds = await findCategoryIds(term);
      if (categoryIds.length === 0) return EMPTY_PAGE(limitNum);
      query = query.in('category_id', categoryIds);
    }
  }

  if (search) {
    const term = String(search).trim();
    if (term) {
      const pattern = `%${escapeFilterValue(term)}%`;
      const categoryIds = await findCategoryIds(term, { contains: true });
      const branches = [
        `name.ilike."${pattern}"`,
        `brand.ilike."${pattern}"`,
        `description.ilike."${pattern}"`,
      ];
      if (categoryIds.length) branches.push(`category_id=in.(${categoryIds.join(',')})`);
      query = query.or(branches.join(','));
    }
  }

  const toNumber = (value) =>
    value === undefined || value === null || value === '' ? null : Number(value);

  const min = toNumber(minPrice);
  if (min !== null && Number.isFinite(min)) query = query.gte('effective_price', min);

  const max = toNumber(maxPrice);
  if (max !== null && Number.isFinite(max) && max >= 0) query = query.lte('effective_price', max);

  const rating = toNumber(minRating);
  if (rating !== null && Number.isFinite(rating)) query = query.gte('rating', rating);

  if (featured === true || featured === 'true') query = query.eq('featured', true);
  if (inStock === true || inStock === 'true') query = query.gt('stock', 0);
  if (onSale === true || onSale === 'true') {
    // discountPrice > 0 and actually below the list price - same as before.
    query = query.and('discount_price=gt.0,discount_price=lt.price');
  }

  const sortKey = Object.prototype.hasOwnProperty.call(SORTS, sort) ? sort : 'newest';
  for (const [column, ascending] of SORTS[sortKey]) {
    query = query.order(column, { ascending });
  }

  const offset = (pageNum - 1) * limitNum;
  const { data, error, count } = await query.range(offset, offset + limitNum - 1);
  if (error) fail(error);

  const total = count || 0;
  return {
    products: (data || []).map(toProductDto),
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    limit: limitNum,
  };
}

/** Fetches a specific set of products by id (used by the wishlist). */
export async function fetchProductsByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const { products } = await fetchProducts({ ids: ids.join(','), limit: 50 });
  return products;
}

export async function fetchFeaturedProducts(limit = 8) {
  return fetchProducts({ featured: true, limit: Math.min(24, parseInt(limit, 10) || 8) });
}

/** GET /api/products/:id - accepts a product slug or a uuid. */
export async function fetchProduct(id) {
  if (isBuilding()) throw new Error('API is not available while building');

  const key = String(id || '').trim();
  if (!key) return null;

  const sb = getSupabase();
  let query = sb.from('products').select(PRODUCT_COLUMNS);
  query = isUuid(key) ? query.eq('id', key) : query.eq('slug', key);

  const { data, error } = await query.maybeSingle();
  if (error) fail(error);
  return toProductDto(data);
}

/** GET /api/products/:id/related - other products in the same category. */
export async function fetchRelatedProducts(id) {
  if (isBuilding()) throw new Error('API is not available while building');

  const sb = getSupabase();
  const { data: product, error } = await sb
    .from('products')
    .select('category_id')
    .eq('id', String(id))
    .maybeSingle();
  if (error) fail(error);
  if (!product) return [];

  const { data, error: relatedError } = await sb
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('category_id', product.category_id)
    .neq('id', id)
    .order('rating', { ascending: false })
    .limit(8);
  if (relatedError) fail(relatedError);
  return (data || []).map(toProductDto);
}

// ---------------------------------------------------------------------------
// Writes - all on Supabase now. Admin RLS covers product changes; the form
// still sends the category by name, so it is resolved to a category_id here.
// ---------------------------------------------------------------------------

function describeError(error, fallback) {
  if (error.code === '23505') return 'A product with this SKU or slug already exists.';
  return error.message || fallback;
}

async function resolveCategoryId(categoryName) {
  const term = String(categoryName || '').trim();
  if (!term) throw new Error('Pick a category.');
  const sb = getSupabase();
  const { data, error } = await sb
    .from('categories')
    .select('id')
    .ilike('name', escapeFilterValue(term))
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Category "${term}" was not found.`);
  return data.id;
}

export async function createProduct(body) {
  const sb = getSupabase();
  const categoryId = await resolveCategoryId(body.category);

  const { data, error } = await sb
    .from('products')
    .insert({
      name: body.name,
      description: body.description,
      price: body.price,
      discount_price: body.discountPrice || 0,
      category_id: categoryId,
      brand: body.brand || '',
      sku: body.sku || '',
      images: body.images || [],
      stock: body.stock ?? 0,
      featured: !!body.featured,
      specifications: Array.isArray(body.specifications)
        ? body.specifications.filter((s) => s && s.key && s.value)
        : [],
    })
    .select('*,categories(name)')
    .single();
  if (error) throw new Error(describeError(error, 'Could not create the product.'));
  return toProductDto(data);
}

export async function updateProduct(id, body) {
  const sb = getSupabase();
  const patch = {};

  if (body.name !== undefined) patch.name = body.name;
  if (body.description !== undefined) patch.description = body.description;
  if (body.price !== undefined) patch.price = body.price;
  if (body.discountPrice !== undefined) patch.discount_price = body.discountPrice;
  if (body.brand !== undefined) patch.brand = body.brand;
  if (body.sku !== undefined) patch.sku = body.sku;
  if (body.images !== undefined) patch.images = body.images;
  if (body.stock !== undefined) patch.stock = body.stock;
  if (body.featured !== undefined) patch.featured = body.featured;
  if (body.specifications !== undefined) {
    patch.specifications = Array.isArray(body.specifications)
      ? body.specifications.filter((s) => s && s.key && s.value)
      : [];
  }
  if (body.category !== undefined) patch.category_id = await resolveCategoryId(body.category);

  if (Object.keys(patch).length === 0) {
    const { data, error } = await sb
      .from('products')
      .select('*,categories(name)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Product not found.');
    return toProductDto(data);
  }

  const { data, error } = await sb
    .from('products')
    .update(patch)
    .eq('id', id)
    .select('*,categories(name)')
    .single();
  if (error) throw new Error(describeError(error, 'Could not update the product.'));
  return toProductDto(data);
}

export async function deleteProduct(id) {
  const sb = getSupabase();
  const { error } = await sb.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message || 'Could not delete the product.');
  return { success: true };
}

/** Reviews - the add_product_review() RPC carries the signed-in user's id. */
export async function addReview(id, body) {
  const sb = getSupabase();
  const { data, error } = await sb.rpc('add_product_review', {
    p_product_id: id,
    p_rating: Number(body.rating),
    p_comment: body.comment || '',
  });
  if (error) throw new Error(error.message || 'Could not save your review.');
  return {
    reviews: data.reviews || [],
    rating: Number(data.rating),
    numReviews: data.num_reviews,
  };
}
