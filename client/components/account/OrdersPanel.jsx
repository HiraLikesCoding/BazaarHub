'use client';

import Link from 'next/link';
import { useFetch } from '@/hooks/useFetch';
import { fetchMyOrders } from '@/services/orders';
import { formatDateTime, formatPrice } from '@/lib/format';
import { ORDER_STATUS_STYLES } from '@/lib/constants';
import { cn } from '@/lib/cn';
import EmptyState, { ErrorState } from '@/components/ui/EmptyState';
import { LoadingBlock } from '@/components/ui/LoadingSpinner';
import { ChevronRightIcon } from '@/components/ui/Icons';

export default function OrdersPanel() {
  const { data: orders, loading, error, refetch } = useFetch(() => fetchMyOrders(), []);

  if (loading) return <LoadingBlock label="Loading your orders…" />;
  if (error) return <ErrorState title="Could not load your orders" message={error} onRetry={refetch} />;
  if (!orders?.length) {
    return (
      <EmptyState
        icon="📦"
        title="No orders yet"
        description="When you place an order it will show up here with live status updates."
        actionLabel="Start shopping"
        actionHref="/shop"
      />
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <article key={order._id} className="rounded-2xl border border-line bg-surface p-5">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink">
                #{order.orderNumber || order._id.slice(-8).toUpperCase()}
              </p>
              <p className="text-xs text-ink-faint">{formatDateTime(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn('badge', ORDER_STATUS_STYLES[order.status] || 'badge-brand')}>
                {order.status}
              </span>
              <span className="font-bold text-ink">{formatPrice(order.total)}</span>
            </div>
          </header>

          <ul className="mt-4 flex flex-wrap gap-3 border-t border-line-soft pt-4">
            {(order.items || []).slice(0, 4).map((item, index) => (
              <li key={item.product || index} className="flex items-center gap-2 rounded-lg bg-surface-2 px-2.5 py-1.5">
                <span className="max-w-[10rem] truncate text-xs font-medium text-ink-muted">{item.name}</span>
                <span className="text-xs text-ink-faint">×{item.quantity}</span>
              </li>
            ))}
            {(order.items || []).length > 4 && (
              <li className="self-center text-xs text-ink-faint">+{order.items.length - 4} more</li>
            )}
          </ul>

          <div className="mt-4 flex items-center justify-between text-xs text-ink-subtle">
            <span>
              Payment: {(order.paymentMethod || 'cod').toUpperCase()} · {order.paymentStatus || 'Unpaid'}
            </span>
            <Link
              href={`/order-confirmation/${order._id}`}
              className="inline-flex items-center gap-1 font-semibold text-brand-link hover:text-brand-ink"
            >
              View details
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
