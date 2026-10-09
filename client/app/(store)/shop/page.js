import { Suspense } from 'react';
import ShopContent from '@/components/shop/ShopContent';
import { fetchProducts } from '@/services/products';
import { fetchCategories } from '@/services/categories';

export const metadata = {
  title: 'Shop',
  description:
    'Browse the full BazaarHub catalogue - filter by category, price and rating, and find your next favourite product.',
};

/** Turns the URL query string into the API query the shop page needs. */
function toApiParams(params) {
  const apiParams = { limit: 12 };
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') apiParams[key] = value;
  });
  return apiParams;
}

export default async function ShopPage({ searchParams }) {
  const params = await searchParams;
  const queryKey = new URLSearchParams(
    Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();

  let initialProducts = null;
  let initialCategories = null;

  try {
    const [products, categories] = await Promise.all([
      fetchProducts(toApiParams(params)),
      fetchCategories(),
    ]);
    initialProducts = products;
    initialCategories = categories;
  } catch {
    // API offline - the client component falls back to its own fetch / error state
  }

  // useSearchParams() needs a Suspense boundary during prerendering
  return (
    <Suspense
      fallback={
        <div className="container-page py-10">
          <div className="skeleton mb-4 h-4 w-40" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-72 rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <ShopContent initialProducts={initialProducts} initialCategories={initialCategories} initialQuery={queryKey} />
    </Suspense>
  );
}
