'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { fetchOrder } from '@/services/orders';
import { formatDateTime, formatPrice } from '@/lib/format';
import { ORDER_STATUS_STYLES } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { CardSkeleton } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/EmptyState';
import ProductImage from '@/components/product/ProductImage';
import { CheckCircleIcon } from '@/components/ui/Icons';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (authLoading) return () => {};

    setLoading(true);
    fetchOrder(id)
      .then((data) => {
        if (active) setOrder(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, authLoading, isAuthenticated]);

  if (authLoading || loading) {
    return (
      <div className="container-page py-12">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="skeleton h-28 rounded-2xl" />
          <CardSkeleton count={3} />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-page py-12">
        <div className="mx-auto max-w-2xl">
          <ErrorState
            title="We could not load this order"
            message={error || 'Order not found.'}
            onRetry={() => window.location.reload()}
          />
          <div className="mt-6 text-center">
            <Link href="/account?tab=orders" className="btn-outline">
              View my orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const address = order.shippingAddress || {};

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-3xl">
        {/* Success banner */}
        <div className="rounded-3xl border border-ok-ink/30 bg-ok-soft p-6 text-center sm:p-8">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ok-soft-2">
            <CheckCircleIcon className="h-9 w-9 text-ok-ink" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">Thank you for your order!</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Your order <span className="font-semibold text-ink">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</span>{' '}
            has been placed and is now being prepared.
          </p>
          <p className="mt-1 text-xs text-ink-subtle">Confirmation sent to {address.email || 'your email'}</p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="btn-primary">
              Continue shopping
            </Link>
            <Link href="/account?tab=orders" className="btn-outline bg-surface">
              View order history
            </Link>
          </div>
        </div>

        {/* Details */}
        <div className="mt-8 space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Info label="Order date" value={formatDateTime(order.createdAt)} />
            <Info label="Payment method" value={(order.paymentMethod || 'cod').toUpperCase()} />
            <Info label="Status" value={order.status || 'Pending'} badge={ORDER_STATUS_STYLES[order.status] || 'badge-brand'} />
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-ink">Items</h2>
            <ul className="divide-y divide-line-soft">
              {(order.items || []).map((item, index) => (
                <li key={item.product || index} className="flex items-center gap-4 py-3">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line-soft bg-surface-2">
                    <ProductImage src={item.image} alt={item.name} fill sizes="56px" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-medium text-ink">{item.name}</span>
                    <span className="text-xs text-ink-subtle">Qty {item.quantity} × {formatPrice(item.price)}</span>
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-line-soft pt-4 text-sm">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              <Row label="Shipping" value={order.shipping === 0 ? 'Free' : formatPrice(order.shipping)} />
              <div className="flex justify-between border-t border-line pt-2.5 text-base font-bold text-ink">
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-ink">Shipping address</h2>
            <address className="not-italic text-sm leading-relaxed text-ink-muted">
              <span className="font-semibold text-ink">{address.fullName}</span>
              <br />
              {address.address}
              <br />
              {address.city}, {address.province} {address.postalCode}
              <br />
              {address.country}
              <br />
              <span className="text-ink-subtle">{address.phone}</span>
            </address>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, badge }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p>
      {badge ? (
        <p className={cn('mt-1.5 inline-block', badge)}>{value}</p>
      ) : (
        <p className="mt-1.5 text-sm font-semibold text-ink">{value}</p>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-subtle">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
