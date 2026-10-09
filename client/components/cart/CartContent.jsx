'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/useToast';
import { formatPrice } from '@/lib/format';
import { FREE_SHIPPING_OVER, SHIPPING_FLAT } from '@/lib/constants';
import EmptyState from '@/components/ui/EmptyState';
import QuantityStepper from '@/components/ui/QuantityStepper';
import ProductImage from '@/components/product/ProductImage';
import { CartIcon, ChevronRightIcon, TrashIcon } from '@/components/ui/Icons';

export default function CartContent() {
  const { items, hydrated, setQuantity, removeItem, clearCart, subtotal, shipping, total, count, freeShippingRemaining } =
    useCart();
  const toast = useToast();

  if (!hydrated) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon="🛒"
        title="Your cart is empty"
        description="Browse the shop and add products you love - they will show up here."
        actionLabel="Start shopping"
        actionHref="/shop"
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      {/* Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-ink">
            Shopping Cart <span className="text-sm font-medium text-ink-subtle">({count} items)</span>
          </h1>
          <button
            type="button"
            onClick={() => {
              clearCart();
              toast.info('Cart cleared.');
            }}
            className="text-sm font-semibold text-ink-subtle hover:text-danger-ink"
          >
            Clear cart
          </button>
        </div>

        {items.map((item) => {
          const lineTotal = item.price * item.quantity;
          return (
            <article
              key={item.id}
              className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center"
            >
              <Link
                href={item.slug ? `/products/${item.slug}` : `/products/${item.id}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-line-soft bg-surface-2 sm:h-20 sm:w-20"
              >
                <ProductImage src={item.image} alt={item.name} fill sizes="96px" />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={item.slug ? `/products/${item.slug}` : `/products/${item.id}`}
                  className="line-clamp-2 font-semibold text-ink hover:text-brand-link"
                >
                  {item.name}
                </Link>
                {item.category && <p className="mt-0.5 text-xs text-ink-faint">{item.category}</p>}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-bold text-ink">{formatPrice(item.price)}</span>
                  {item.listPrice > item.price && (
                    <span className="text-xs text-ink-faint line-through">{formatPrice(item.listPrice)}</span>
                  )}
                  <span className="text-xs text-ink-subtle">each</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                <QuantityStepper
                  value={item.quantity}
                  onChange={(next) => setQuantity(item.id, next)}
                  max={item.stock || 99}
                  size="sm"
                />
                <div className="flex items-center gap-3">
                  <span className="font-bold text-ink">{formatPrice(lineTotal)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      removeItem(item.id);
                      toast.info('Item removed from cart.');
                    }}
                    aria-label={`Remove ${item.name}`}
                    className="rounded-lg p-1.5 text-ink-faint transition hover:bg-danger-soft hover:text-danger-ink"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-link hover:text-brand-ink"
        >
          <ChevronRightIcon className="h-4 w-4 rotate-180" />
          Continue shopping
        </Link>
      </div>

      {/* Summary */}
      <aside>
        <div className="sticky top-24 space-y-4 rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-base font-semibold text-ink">Order Summary</h2>

          {/* Free shipping progress */}
          <div className="rounded-xl bg-surface-2 p-3">
            {freeShippingRemaining > 0 ? (
              <p className="text-xs text-ink-muted">
                Add <span className="font-semibold text-brand-ink">{formatPrice(freeShippingRemaining)}</span> more
                to get <span className="font-semibold text-ok-ink">free shipping</span>.
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-xs font-medium text-ok-ink">
                🎉 You have unlocked free shipping!
              </p>
            )}
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-3"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={FREE_SHIPPING_OVER}
              aria-valuenow={Math.min(subtotal, FREE_SHIPPING_OVER)}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-500"
                style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_OVER) * 100)}%` }}
              />
            </div>
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-subtle">Subtotal</dt>
              <dd className="font-medium text-ink">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-subtle">Shipping</dt>
              <dd className={shipping === 0 ? 'font-medium text-ok-ink' : 'font-medium text-ink'}>
                {shipping === 0 ? 'Free' : formatPrice(shipping || SHIPPING_FLAT)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2.5 text-base">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="font-bold text-ink">{formatPrice(total)}</dd>
            </div>
          </dl>

          <Link
            href="/checkout"
            className="btn-lg w-full bg-brand-600 text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-700 hover:shadow-brand-600/40 active:scale-[0.99]"
          >
            <CartIcon className="h-5 w-5" />
            Proceed to Checkout <span aria-hidden="true">→</span>
          </Link>

          <p className="text-center text-xs text-ink-faint">Cash on delivery · 30-day returns</p>
        </div>
      </aside>
    </div>
  );
}
