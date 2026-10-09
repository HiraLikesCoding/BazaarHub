import Link from 'next/link';
import ProductImage from '@/components/product/ProductImage';

/** Category tile used on the home page and /categories. */
export default function CategoryCard({ category }) {
  const href = `/shop?category=${encodeURIComponent(category.name)}`;

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border border-line/80 bg-surface transition duration-300 hover:-translate-y-1 hover:border-brand-line hover:shadow-soft"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-3">
        <ProductImage
          src={category.image}
          alt={category.name}
          fill
          sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 45vw"
          className="group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface/95 text-lg shadow-sm">
            {category.icon || '🛍️'}
          </span>
          <h3 className="mt-2 text-base font-bold text-white">{category.name}</h3>
          <p className="text-xs text-slate-200">
            {category.productCount ?? 0} product{(category.productCount ?? 0) === 1 ? '' : 's'}
          </p>
        </div>
      </div>
    </Link>
  );
}
