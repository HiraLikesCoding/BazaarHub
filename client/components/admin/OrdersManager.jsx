'use client';

import { useEffect, useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import { fetchAllOrders, updateOrderStatus } from '@/services/orders';
import { getSupabase } from '@/lib/supabase';
import { formatDateTime, formatPrice } from '@/lib/format';
import { ORDER_STATUSES } from '@/lib/constants';
import { cn } from '@/lib/cn';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import { CardSkeleton } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/EmptyState';
import { EmptyRow, PageHeader, Panel, SearchField, Td, Th } from './Table';
import ProductImage from '@/components/product/ProductImage';

const PAGE_SIZE = 8;

export default function OrdersManager() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const debouncedSearch = useDebounce(search, 350);

  const { data, loading, error, refetch } = useFetch(
    () => fetchAllOrders({ status, search: debouncedSearch, page, limit: PAGE_SIZE }),
    [status, debouncedSearch, page]
  );

  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch]);

  // Live updates: refresh the table whenever any order changes somewhere
  // else (a customer checking out, another admin updating a status).
  useEffect(() => {
    let sb;
    try {
      sb = getSupabase();
    } catch {
      return () => {};
    }

    let timer = null;
    const channel = sb
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        // collapse bursts (one checkout can touch several rows)
        clearTimeout(timer);
        timer = setTimeout(() => refetch(), 600);
      })
      .subscribe();

    return () => {
      clearTimeout(timer);
      sb.removeChannel(channel);
    };
  }, [refetch]);

  async function changeStatus(order, nextStatus) {
    try {
      const updated = await updateOrderStatus(order._id, nextStatus);
      setSelected((current) => (current && current._id === order._id ? updated : current));
      refetch();
      toast.success(`Order marked as ${nextStatus}.`);
    } catch (err) {
      toast.error(err.message || 'Could not update the order.');
    }
  }

  const orders = data?.orders || [];

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={data ? `${data.total} orders in total` : 'Track and fulfil customer orders'}
      />

      <Panel className="p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchField value={search} onChange={setSearch} placeholder="Search order # or customer…" />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="select w-full sm:w-48"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line-soft">
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Date</Th>
                <Th className="text-right">Total</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {loading && (
                <tr>
                  <td colSpan={6} className="p-0">
                    <CardSkeleton count={PAGE_SIZE} />
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={6} className="p-4">
                    <ErrorState title="Could not load orders" message={error} onRetry={refetch} />
                  </td>
                </tr>
              )}

              {!loading && !error && orders.length === 0 && (
                <EmptyRow colSpan={6} message="No orders match this filter." />
              )}

              {!loading &&
                !error &&
                orders.map((order) => (
                  <tr
                    key={order._id}
                    className="cursor-pointer transition hover:bg-surface-2/70"
                    onClick={() => setSelected(order)}
                  >
                    <Td className="font-semibold text-ink">
                      #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                    </Td>
                    <Td>
                      <p className="font-medium text-ink-muted">{order.shippingAddress?.fullName || order.user?.name}</p>
                      <p className="text-xs text-ink-faint">{order.shippingAddress?.email || order.user?.email}</p>
                    </Td>
                    <Td className="text-ink-subtle">{formatDateTime(order.createdAt)}</Td>
                    <Td className="text-right font-semibold text-ink">{formatPrice(order.total)}</Td>
                    <Td>
                      <span className="text-xs font-medium uppercase text-ink-subtle">
                        {order.paymentMethod} · {order.paymentStatus}
                      </span>
                    </Td>
                    <Td onClick={(event) => event.stopPropagation()}>
                      <select
                        value={order.status}
                        onChange={(event) => changeStatus(order, event.target.value)}
                        className={cn('w-32 rounded-lg border-0 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-inset', badgeClass(order.status))}
                        aria-label={`Status for order ${order._id}`}
                      >
                        {ORDER_STATUSES.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {data && data.pages > 1 && (
          <Pagination page={data.page} pages={data.pages} onChange={setPage} className="mt-4" />
        )}
      </Panel>

      {selected && (
        <Modal
          open
          onClose={() => setSelected(null)}
          size="lg"
          title={`Order #${selected.orderNumber || selected._id.slice(-8).toUpperCase()}`}
          description={`Placed ${formatDateTime(selected.createdAt)}`}
          footer={
            <>
              <button type="button" onClick={() => setSelected(null)} className="btn-outline">
                Close
              </button>
              <select
                value={selected.status}
                onChange={(event) => changeStatus(selected, event.target.value)}
                className="select w-44"
                aria-label="Update order status"
              >
                {ORDER_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    Mark as {value}
                  </option>
                ))}
              </select>
            </>
          }
        >
          <div className="space-y-5 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-surface-2 p-3">
                <p className="text-xs uppercase tracking-wide text-ink-faint">Customer</p>
                <p className="mt-1 font-semibold text-ink">
                  {selected.shippingAddress?.fullName || selected.user?.name || 'Guest'}
                </p>
                <p className="text-ink-subtle">{selected.shippingAddress?.email}</p>
                <p className="text-ink-subtle">{selected.shippingAddress?.phone}</p>
              </div>
              <div className="rounded-xl bg-surface-2 p-3">
                <p className="text-xs uppercase tracking-wide text-ink-faint">Ship to</p>
                <p className="mt-1 text-ink-muted">
                  {selected.shippingAddress?.address}
                  <br />
                  {selected.shippingAddress?.city}, {selected.shippingAddress?.province}{' '}
                  {selected.shippingAddress?.postalCode}
                  <br />
                  {selected.shippingAddress?.country}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 font-semibold text-ink">Items</p>
              <ul className="divide-y divide-line-soft rounded-xl border border-line-soft">
                {(selected.items || []).map((item, index) => (
                  <li key={item.product || index} className="flex items-center gap-3 p-3">
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-line-soft bg-surface-2">
                      <ProductImage src={item.image} alt="" fill sizes="44px" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{item.name}</span>
                      <span className="text-xs text-ink-faint">
                        {item.quantity} × {formatPrice(item.price)}
                      </span>
                    </span>
                    <span className="font-semibold text-ink">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <dl className="space-y-1.5 rounded-xl bg-surface-2 p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-subtle">Subtotal</dt>
                <dd className="font-medium text-ink">{formatPrice(selected.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-subtle">Shipping</dt>
                <dd className="font-medium text-ink">
                  {selected.shipping === 0 ? 'Free' : formatPrice(selected.shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-ink">
                <dt>Total</dt>
                <dd>{formatPrice(selected.total)}</dd>
              </div>
            </dl>

            {selected.note && (
              <p className="rounded-xl border border-warn-ink/30 bg-warn-soft p-3 text-warn-ink">
                <span className="font-semibold">Note:</span> {selected.note}
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function badgeClass(status) {
  const map = {
    Pending: 'bg-warn-soft text-warn-ink ring-warn-ink/30',
    Confirmed: 'bg-brand-soft text-brand-ink ring-brand-line',
    Processing: 'bg-brand-soft text-brand-ink ring-brand-line',
    Shipped: 'bg-brand-soft text-brand-ink ring-brand-line',
    Delivered: 'bg-ok-soft text-ok-ink ring-ok-ink/30',
    Cancelled: 'bg-danger-soft text-danger-ink ring-danger-ink/30',
  };
  return map[status] || map.Pending;
}
