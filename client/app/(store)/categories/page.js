import Link from 'next/link';
import CategoryCard from '@/components/product/CategoryCard';
import { fetchCategories } from '@/services/categories';

export const revalidate = 300;

export const metadata = {
  title: 'Categories',
  description: 'Browse every BazaarHub category - electronics, fashion, home, beauty, sports and groceries.',
};

export default async function CategoriesPage() {
  let categories = [];
  let failed = false;

  try {
    categories = await fetchCategories({ revalidate: 300 });
  } catch {
    failed = true;
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">Shop by Category</h1>
        <p className="mt-3 text-ink-muted">
          Six departments, hundreds of products. Pick a category to jump straight into the catalogue.
        </p>
      </header>

      {failed && (
        <div className="mt-10 rounded-2xl border border-warn-ink/30 bg-warn-soft px-5 py-6 text-center text-sm text-warn-ink">
          We could not load the categories right now.{' '}
          <Link href="/shop" className="font-semibold underline">
            Browse everything in the shop
          </Link>
          .
        </div>
      )}

      {!failed && categories.length === 0 && (
        <div className="mt-10 rounded-2xl border border-line bg-surface px-5 py-10 text-center text-sm text-ink-subtle">
          No categories available yet.
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div key={category._id || category.slug}>
            <CategoryCard category={category} />
            {category.description && (
              <p className="mt-3 line-clamp-2 text-sm text-ink-subtle">{category.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
