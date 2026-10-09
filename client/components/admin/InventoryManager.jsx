'use client';

import { useEffect, useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchInventory } from '@/services/admin';
import { formatDate, formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import Pagination from '@/components/ui/Pagination';
import { CardSkeleton } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/EmptyState';
import { EmptyRow, PageHeader, Panel, SearchField, Td, Th } from './Table';

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'in', label: 'In stock' },
  { id: 'low', label: 'Low stock' },
  { id: 'out', label: 'Out of stock' },
];

const PAGE_SIZE = 12;

export default function InventoryManager() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('stock_asc');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 350);

  const { data, loading, error, refetch } = useFetch(
    () => fetchInventory({ status, search: debouncedSearch, sort, page, limit: PAGE_SIZE }),
    [status, debouncedSearch, sort, page]
  );

  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch, sort]);

  const counts = data?.counts || {};
  const products = data?.products || [];

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Stock levels across the whole catalogue - restock before you sell out"
      />

      {/* Quick stat pills */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          ['In stock', counts.in || 0, 'bg-ok-soft text-ok-ink'],
          ['Low stock', counts.low || 0, 'bg-warn-soft text-warn-ink'],
          ['Out of stock', counts.out || 0, 'bg-danger-soft text-danger-ink'],
        ].map(([label, value, style]) => (
          <div key={label} className={cn('rounded-2xl p-4 text-center', style)}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="mt-0.5 text-xs font-medium opacity-80">{label}</p>
          </div>
        ))}
      </div>

      <Panel className="p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatus(filter.id)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                  status === filter.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-3 text-ink-muted hover:bg-surface-3'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchField value={search} onChange={setSearch} placeholder="Search name, SKU…" />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="select w-full sm:w-48"
              aria-label="Sort inventory"
            >
              <option value="stock_asc">Stock: low to high</option>
              <option value="stock_desc">Stock: high to low</option>
              <option value="name">Name A - Z</option>
              <option value="updated">Recently updated</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line-soft">
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th className="text-right">Price</Th>
                <Th className="text-center">Stock</Th>
                <Th className="text-center">Sold</Th>
                <Th>Updated</Th>
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
                    <ErrorState title="Could not load inventory" message={error} onRetry={refetch} />
                  </td>
                </tr>
              )}

              {!loading && !error && products.length === 0 && (
                <EmptyRow colSpan={6} message="No products match this filter." />
              )}

              {!loading &&
                !error &&
                products.map((product) => (
                  <tr key={product._id} className="transition hover:bg-surface-2/70">
                    <Td>
                      <p className="font-medium text-ink">{product.name}</p>
                      <p className="text-xs text-ink-faint">{product.sku}</p>
                    </Td>
                    <Td className="text-ink-muted">{product.category}</Td>
                    <Td className="text-right font-medium text-ink">
                      {formatPrice(product.effectivePrice ?? product.price)}
                    </Td>
                    <Td className="text-center">
                      <span
                        className={cn(
                          'rounded-lg px-2.5 py-1 text-xs font-bold',
                          product.stock === 0
                            ? 'bg-danger-soft text-danger-ink'
                            : product.stock <= 10
                              ? 'bg-warn-soft text-warn-ink'
                              : 'bg-ok-soft text-ok-ink'
                        )}
                      >
                        {product.stock}
                      </span>
                    </Td>
                    <Td className="text-center text-ink-muted">{product.sold || 0}</Td>
                    <Td className="text-ink-subtle">{formatDate(product.updatedAt)}</Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {data && data.pages > 1 && (
          <Pagination page={data.page} pages={data.pages} onChange={setPage} className="mt-4" />
        )}
      </Panel>
    </div>
  );
}
