import Link from 'next/link';
import Hero from '@/components/home/Hero';
import PromoBanner from '@/components/home/PromoBanner';
import CategoryCard from '@/components/product/CategoryCard';
import ProductGrid from '@/components/product/ProductGrid';
import SectionHeader from '@/components/layout/SectionHeader';
import EmptyState from '@/components/ui/EmptyState';
import { fetchProducts } from '@/services/products';
import { fetchCategories } from '@/services/categories';

export const revalidate = 120; // refresh product data every 2 minutes

async function safeFetch(fn, fallback) {
  try {
    return await fn();
  } catch {
    // Keep the page usable when the API is not reachable (e.g. during build)
    return fallback;
  }
}

export default async function HomePage() {
  const [featured, categories, bestSellers, newArrivals] = await Promise.all([
    safeFetch(() => fetchProducts({ featured: true, limit: 8, sort: 'rating' }, { revalidate: 120 }), { products: [] }),
    safeFetch(() => fetchCategories({ revalidate: 300 }), []),
    safeFetch(() => fetchProducts({ sort: 'popular', limit: 4 }, { revalidate: 120 }), { products: [] }),
    safeFetch(() => fetchProducts({ sort: 'newest', limit: 4 }, { revalidate: 120 }), { products: [] }),
  ]);

  const featuredProducts = featured.products || [];
  const heroImages = featuredProducts.slice(0, 3).map((p) => p.images?.[0]).filter(Boolean);

  return (
    <>
      <Hero images={heroImages} />

      {/* Categories */}
      <section className="container-page py-12 sm:py-16">
        <SectionHeader
          subtitle="Browse by"
          title="Featured Categories"
          actionLabel="View all categories"
          actionHref="/categories"
        />

        {categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <CategoryCard key={category._id} category={category} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🗂️"
            title="Categories are not loaded yet"
            description="Start the API server and refresh this page to see the catalogue."
          />
        )}
      </section>

      {/* Featured products */}
      <section className="bg-surface-2 py-12 sm:py-16">
        <div className="container-page">
          <SectionHeader
            subtitle="Handpicked for you"
            title="Featured Products"
            actionLabel="Shop all products"
            actionHref="/shop"
          />

          {featuredProducts.length > 0 ? (
            <ProductGrid products={featuredProducts} />
          ) : (
            <EmptyState
              icon="🛍️"
              title="No products to show yet"
              description="Run the database seed and refresh to load the sample catalogue."
              actionLabel="Go to shop"
              actionHref="/shop"
            />
          )}
        </div>
      </section>

      {/* Promotion */}
      <section className="py-12 sm:py-16">
        <PromoBanner />
      </section>

      {/* Best sellers */}
      <section className="container-page pb-4">
        <SectionHeader
          subtitle="Loved by customers"
          title="Best Sellers"
          actionLabel="See more"
          actionHref="/shop?sort=popular"
        />
        {(bestSellers.products || []).length > 0 ? (
          <ProductGrid products={bestSellers.products} />
        ) : (
          <EmptyState icon="⭐" title="Best sellers will appear here" />
        )}
      </section>

      {/* New arrivals */}
      <section className="container-page py-12">
        <SectionHeader
          subtitle="Fresh in store"
          title="New Arrivals"
          actionLabel="Shop new arrivals"
          actionHref="/shop?sort=newest"
        />
        {(newArrivals.products || []).length > 0 ? (
          <ProductGrid products={newArrivals.products} />
        ) : (
          <EmptyState icon="🆕" title="New arrivals will appear here" />
        )}

        <div className="mt-10 flex justify-center">
          <Link href="/shop" className="btn-outline btn-lg">
            Explore the full catalogue
          </Link>
        </div>
      </section>
    </>
  );
}
