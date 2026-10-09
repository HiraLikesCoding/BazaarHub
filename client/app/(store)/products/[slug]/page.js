import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductDetail from '@/components/product/ProductDetail';
import ProductGrid from '@/components/product/ProductGrid';
import SectionHeader from '@/components/layout/SectionHeader';
import { fetchProduct, fetchRelatedProducts } from '@/services/products';

export const revalidate = 120;

async function getProduct(slug) {
  try {
    return await fetchProduct(slug, { revalidate: 120 });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Product not found' };
  return {
    title: product.name,
    description: (product.description || '').slice(0, 155),
    openGraph: {
      title: product.name,
      description: (product.description || '').slice(0, 155),
      images: product.images?.slice(0, 1),
    },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  let related = [];
  try {
    related = await fetchRelatedProducts(product._id, { revalidate: 300 });
  } catch {
    related = [];
  }

  return (
    <div className="container-page py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-ink-subtle" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-link">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/shop" className="hover:text-brand-link">
          Shop
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/shop?category=${encodeURIComponent(product.category)}`}
          className="hover:text-brand-link"
        >
          {product.category}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-ink">{product.name}</span>
      </nav>

      <ProductDetail product={product} />

      {related.length > 0 && (
        <section className="mt-16">
          <SectionHeader title="Related Products" subtitle="You may also like" />
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
