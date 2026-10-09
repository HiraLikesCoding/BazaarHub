'use client';

import Link from 'next/link';
import { useFetch } from '@/hooks/useFetch';
import { fetchDashboardStats } from '@/services/admin';
import { formatDateTime, formatNumber, formatPrice } from '@/lib/format';
import { ORDER_STATUS_STYLES } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { ErrorState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/LoadingSpinner';
import { ChevronRightIcon } from '@/components/ui/Icons';

export default function AdminDashboard() {
  const { data, loading, error, refetch } = useFetch(() => fetchDashboardStats(), []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <CardSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Could not load the dashboard" message={error} onRetry={refetch} />;
  }

  const totals = data.totals;
  const sales = data.dailySales || [];
  const maxRevenue = Math.max(...sales.map((d) => d.revenue), 1);

  const stats = [
    { label: 'Total revenue', value: formatPrice(totals.revenue), hint: `${formatPrice(totals.averageOrder)} avg. order`, dot: 'bg-ok-ink', bg: 'bg-ok-soft' },
    { label: 'Orders', value: formatNumber(totals.orders), hint: `${totals.pending} pending`, dot: 'bg-brand-ink', bg: 'bg-brand-soft' },
    { label: 'Products', value: formatNumber(totals.products), hint: `${totals.lowStock} low stock · ${totals.outOfStock} out`, dot: 'bg-warn-ink', bg: 'bg-warn-soft' },
    { label: 'Customers', value: formatNumber(totals.users), hint: 'registered accounts', dot: 'bg-brand-link', bg: 'bg-brand-soft' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-subtle">Store performance at a glance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products" className="btn-outline px-3 py-2 text-xs">
            Manage products
          </Link>
          <Link href="/admin/orders" className="btn-primary px-3 py-2 text-xs">
            View orders
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl text-sm', stat.bg)}>
                <span className={cn('h-2.5 w-2.5 rounded-full', stat.dot)} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-ink">{stat.value}</p>
            <p className="mt-0.5 text-xs font-medium text-ink-subtle">{stat.label}</p>
            <p className="mt-1 text-[11px] text-ink-faint">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Sales chart */}
        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Last 7 days</h2>
            <span className="text-xs text-ink-faint">Revenue per day</span>
          </div>

          {sales.length === 0 ? (
            <p className="rounded-xl bg-surface-2 px-4 py-8 text-center text-sm text-ink-subtle">
              No sales in the last 7 days.
            </p>
          ) : (
            <div className="flex h-48 items-end gap-3">
              {sales.map((day) => (
                <div key={day._id} className="flex h-full flex-1 flex-col justify-end gap-2">
                  <span className="text-center text-[10px] font-semibold text-ink-subtle">
                    {formatPrice(day.revenue).replace('.00', '')}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400 transition-all hover:from-brand-700 hover:to-brand-500"
                    style={{ height: `${Math.max(6, (day.revenue / maxRevenue) * 100)}%` }}
                    title={`${day._id}: ${formatPrice(day.revenue)} (${day.orders} orders)`}
                  />
                  <span className="text-center text-[10px] text-ink-faint">
                    {new Date(day._id + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Low stock */}
        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Low stock</h2>
            <Link href="/admin/inventory" className="text-xs font-semibold text-brand-link hover:text-brand-ink">
              Inventory →
            </Link>
          </div>

          {data.lowStockProducts?.length ? (
            <ul className="divide-y divide-line-soft">
              {data.lowStockProducts.map((product) => (
                <li key={product._id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{product.name}</span>
                    <span className="text-xs text-ink-faint">{product.sku || product.category}</span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded-lg px-2 py-1 text-xs font-bold',
                      product.stock <= 5 ? 'bg-danger-soft text-danger-ink' : 'bg-warn-soft text-warn-ink'
                    )}
                  >
                    {product.stock} left
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-surface-2 px-4 py-6 text-center text-sm text-ink-subtle">
              Every product is well stocked.
            </p>
          )}
        </section>
      </div>

      {/* Recent orders */}
      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Recent orders</h2>
          <Link href="/admin/orders" className="text-xs font-semibold text-brand-link hover:text-brand-ink">
            All orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line-soft text-xs uppercase tracking-wide text-ink-faint">
                <th className="py-2.5 pr-4 font-medium">Order</th>
                <th className="py-2.5 pr-4 font-medium">Customer</th>
                <th className="py-2.5 pr-4 font-medium">Date</th>
                <th className="py-2.5 pr-4 font-medium">Status</th>
                <th className="py-2.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {(data.recentOrders || []).map((order) => (
                <tr key={order._id} className="hover:bg-surface-2/70">
                  <td className="py-3 pr-4 font-medium text-ink">
                    #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                  </td>
                  <td className="py-3 pr-4 text-ink-muted">{order.user?.name || 'Guest'}</td>
                  <td className="py-3 pr-4 text-ink-subtle">{formatDateTime(order.createdAt)}</td>
                  <td className="py-3 pr-4">
                    <span className={cn('badge', ORDER_STATUS_STYLES[order.status] || 'badge-brand')}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-semibold text-ink">{formatPrice(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.recentOrders?.length === 0 && (
          <p className="rounded-xl bg-surface-2 px-4 py-6 text-center text-sm text-ink-subtle">
            No orders yet.
          </p>
        )}
      </section>

      <p className="flex items-center justify-center gap-1 text-xs text-ink-faint">
        <ChevronRightIcon className="h-3 w-3" /> Data refreshes every time this page loads.
      </p>
    </div>
  );
}
