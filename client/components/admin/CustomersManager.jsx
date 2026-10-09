'use client';

import { useEffect, useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchCustomers } from '@/services/admin';
import { formatDate, formatPrice, initials } from '@/lib/format';
import { cn } from '@/lib/cn';
import Pagination from '@/components/ui/Pagination';
import { CardSkeleton } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/EmptyState';
import { EmptyRow, PageHeader, Panel, SearchField, Td, Th } from './Table';

const PAGE_SIZE = 10;

export default function CustomersManager() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 350);

  const { data, loading, error, refetch } = useFetch(
    () => fetchCustomers({ search: debouncedSearch, role, page, limit: PAGE_SIZE }),
    [debouncedSearch, role, page]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role]);

  const customers = data?.customers || [];

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={data ? `${data.total} registered accounts` : 'Everyone who has signed up'}
      />

      <Panel className="p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchField value={search} onChange={setSearch} placeholder="Search name or email…" />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="select w-full sm:w-44"
            aria-label="Filter by role"
          >
            <option value="">All roles</option>
            <option value="customer">Customers</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line-soft">
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th>Role</Th>
                <Th>Joined</Th>
                <Th className="text-center">Orders</Th>
                <Th className="text-right">Total spent</Th>
                <Th>Last order</Th>
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
                    <ErrorState title="Could not load customers" message={error} onRetry={refetch} />
                  </td>
                </tr>
              )}

              {!loading && !error && customers.length === 0 && (
                <EmptyRow colSpan={6} message="No customers match your search." />
              )}

              {!loading &&
                !error &&
                customers.map((customer) => (
                  <tr key={customer._id} className="transition hover:bg-surface-2/70">
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft-2 text-xs font-bold text-brand-ink">
                          {initials(customer.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-ink">{customer.name}</span>
                          <span className="block truncate text-xs text-ink-faint">{customer.email}</span>
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          'badge',
                          customer.role === 'admin' ? 'badge-brand' : 'badge-neutral'
                        )}
                      >
                        {customer.role}
                      </span>
                    </Td>
                    <Td className="text-ink-subtle">{formatDate(customer.createdAt)}</Td>
                    <Td className="text-center font-semibold text-ink-muted">{customer.orders}</Td>
                    <Td className="text-right font-semibold text-ink">{formatPrice(customer.spent)}</Td>
                    <Td className="text-ink-subtle">{customer.lastOrder ? formatDate(customer.lastOrder) : '—'}</Td>
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
