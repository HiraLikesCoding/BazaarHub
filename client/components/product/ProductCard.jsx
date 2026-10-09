'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';
import { discountPercent, stockStatus } from '@/lib/format';
import { CartIcon, HeartIcon } from '@/components/ui/Icons';
import Price from './Price';
import ProductImage from './ProductImage';
import Rating from './Rating';

/**
 * The product card used on the home page, shop grid and related section.
 */
export default function ProductCard({ product, className = '' }) {
  const { addItem, toggleWishlist, isInWishlist } = useCart();
  const toast = useToast();

  if (!product) return null;

  const outOfStock = (Number(product.stock) || 0) <= 0;
  const discount = discountPercent(product.price, product.discountPrice);
  const wished = isInWishlist(product._id);
  const stockLabel = stockStatus(product.stock);
  const href = `/products/${product.slug || product._id}`;

  function handleAdd(event) {
    event.preventDefault();
    event.stopPropagation();
    const result = addItem(product, 1);
    if (result.ok) toast.success(`${product.name} added to cart.`);
    else toast.error(result.message);
  }

  function handleWishlist(event) {
    event.preventDefault();
    event.stopPropagation();
    toggleWishlist(product._id);
    toast.info(wished ? 'Removed from wishlist.' : 'Saved to wishlist.');
  }

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line/80 bg-surface transition duration-300 hover:-translate-y-1 hover:border-brand-line hover:shadow-soft',
        className
      )}
    >
      <Link href={href} className="relative block aspect-square overflow-hidden bg-surface-2" tabIndex={-1} aria-hidden="true">
        <ProductImage
          src={product.images?.[0]}
          alt={product.name}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          className="group-hover:scale-105"
        />

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {discount > 0 && <span className="badge-danger shadow-sm">-{discount}%</span>}
          {product.featured && <span className="badge-brand shadow-sm">Featured</span>}
          {outOfStock && <span className="badge-neutral shadow-sm">Sold out</span>}
        </div>

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wished}
          className={cn(
            'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 shadow-sm backdrop-blur transition hover:scale-110',
            wished ? 'text-danger-ink' : 'text-ink-subtle hover:text-danger-ink'
          )}
        >
          <HeartIcon className="h-4.5 w-4.5" filled={wished} />
        </button>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-link">
            {product.category}
          </span>
          {stockLabel === 'Low Stock' && (
            <span className="text-[11px] font-medium text-warn-ink">Only {product.stock} left</span>
          )}
        </div>

        <Link
          href={href}
          className="line-clamp-2 text-sm font-semibold leading-snug text-ink transition hover:text-brand-ink sm:text-[15px]"
        >
          {product.name}
        </Link>

        <div className="mt-2">
          <Rating value={product.rating} count={product.numReviews} />
        </div>

        <div className="mt-auto pt-3">
          <Price price={product.price} discountPrice={product.discountPrice} size="sm" />

          <button
            type="button"
            onClick={handleAdd}
            disabled={outOfStock}
            className="btn-primary mt-3 w-full"
          >
            <CartIcon className="h-4 w-4" />
            {outOfStock ? 'Out of stock' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
