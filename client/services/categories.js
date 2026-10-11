/**
 * Category data access - fully on Supabase.
 *
 * Reads shape to what the components expect (`_id`, `productCount`, ...).
 * Writes are covered by the admin RLS policies; deleting a category that is
 * still in use is refused (same rule the Express controller enforced).
 */
import { getSupabase, isBuilding } from '@/lib/supabase';

function toCategoryDto(row, productCount = 0) {
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    slug: row.slug,
    image: row.image,
    icon: row.icon,
    description: row.description,
    productCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** GET /api/categories - categories plus live product counts (category_counts view). */
export async function fetchCategories() {
  if (isBuilding()) throw new Error('API is not available while building');

  const sb = getSupabase();
  const [categoriesRes, countsRes] = await Promise.all([
    sb.from('categories').select('id,name,slug,image,icon,description').order('name'),
    sb.from('category_counts').select('category_id,product_count'),
  ]);

  if (categoriesRes.error) throw new Error(categoriesRes.error.message);
  if (countsRes.error) throw new Error(countsRes.error.message);

  const counts = new Map(
    (countsRes.data || []).map((row) => [row.category_id, row.product_count])
  );
  return (categoriesRes.data || []).map((row) =>
    toCategoryDto(row, counts.get(row.id) || 0)
  );
}

async function productCountFor(categoryId) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('category_counts')
    .select('product_count')
    .eq('category_id', categoryId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data && data.product_count) || 0;
}

export async function createCategory(body) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('categories')
    .insert({
      name: body.name,
      description: body.description || '',
      image: body.image || '',
      icon: body.icon || '🛍️',
    })
    .select('id,name,slug,image,icon,description,created_at,updated_at')
    .single();
  if (error) {
    throw new Error(
      error.code === '23505' ? 'Category already exists.' : error.message || 'Could not create the category.'
    );
  }
  return toCategoryDto(data, 0);
}

export async function updateCategory(id, body) {
  const sb = getSupabase();
  const patch = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.description !== undefined) patch.description = body.description;
  if (body.image !== undefined) patch.image = body.image;
  if (body.icon !== undefined) patch.icon = body.icon;

  const { data, error } = await sb
    .from('categories')
    .update(patch)
    .eq('id', id)
    .select('id,name,slug,image,icon,description,created_at,updated_at')
    .single();
  if (error) {
    throw new Error(
      error.code === '23505' ? 'Category already exists.' : error.message || 'Could not update the category.'
    );
  }
  return toCategoryDto(data, await productCountFor(id));
}

export async function deleteCategory(id) {
  const used = await productCountFor(id);
  if (used > 0) {
    throw new Error(`Cannot delete: ${used} product(s) still use this category.`);
  }

  const sb = getSupabase();
  const { error } = await sb.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message || 'Could not delete the category.');
  return { success: true };
}
