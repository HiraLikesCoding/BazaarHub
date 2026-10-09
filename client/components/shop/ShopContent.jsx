'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import FilterPanel from './FilterPanel';
import ProductGrid from '@/components/product/ProductGrid';
import Pagination from '@/components/ui/Pagination';
import EmptyState, { ErrorState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/LoadingSpinner';
import { useFetch } from '@/hooks/useFetch';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchProducts } from '@/services/products';
import { fetchCategories } from '@/services/categories';
import { SORT_OPTIONS } from '@/lib/constants';
import { SearchIcon, SlidersIcon } from './ShopIcons';

const PAGE_SIZE = 12;

export default function ShopContent({ initialProducts = null, initialCategories = null, initialQuery = '' }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 400);

  const queryKey = searchParams.toString();

  /** Adds / removes query params and keeps the URL shareable. */
  const updateParams = useCallback(
    (patch, { replace = false, keepPage = false } = {}) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([key, value]) => {
        if (value === '' || value === undefined || value === null) next.delete(key);
        else next.set(key, value);
      });
      if (!keepPage && !('page' in patch)) next.delete('page');
      const url = next.toString() ? `${pathname}?${next.toString()}` : pathname;
      if (replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Keep the URL in sync while the user types in the search box
  useEffect(() => {
    const value = debouncedSearch.trim();
    const current = searchParams.get('search') || '';
    if (value !== current) updateParams({ search: value }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const apiParams = useMemo(() => {
    const params = { limit: PAGE_SIZE };
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  // When the URL matches what the server already rendered, reuse that data
  // instead of refetching on mount - instant paint, one less request.
  const isInitial = queryKey === initialQuery && !!initialProducts;

  const { data: categoryData } = useFetch(() => fetchCategories(), [], {
    initial: initialCategories,
    enabled: initialCategories == null,
  });

  const { data, loading, error, refetch } = useFetch(() => fetchProducts(apiParams), [queryKey], {
    enabled: !isInitial,
    initial: initialProducts,
  });

  const shownData = isInitial ? initialProducts : data;
  const shownLoading = isInitial ? false : loading;
  const shownError = isInitial ? null : error;

  const products = shownData?.products || [];
  const page = shownData?.page || Number(searchParams.get('page')) || 1;
  const pages = shownData?.pages || 1;
  const total = shownData?.total || 0;

  const activeFilterCount = ['category', 'minRating', 'minPrice', 'maxPrice', 'inStock', 'onSale', 'search'].filter(
    (key) => searchParams.get(key)
  ).length;

  return (
    <div className="container-page py-8 sm:py-10">
      {/* Breadcrumb */}
      <nav className="mb-5 text-sm text-ink-subtle" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-link">
          Home
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="font-medium text-ink">Shop</span>
        {searchParams.get('category') && (
          <>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <span className="font-medium text-ink">{searchParams.get('category')}</span>
          </>
        )}
      </nav>

      {/* Search + sort bar */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <label htmlFor="shop-search" className="sr-only">
            Search products
          </label>
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            id="shop-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name, brand or category..."
            className="input rounded-full pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="btn-outline flex-1 lg:hidden"
            aria-expanded={filtersOpen}
          >
            <SlidersIcon className="h-4 w-4" />
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>

          <label htmlFor="shop-sort" className="sr-only">
            Sort products
          </label>
          <select
            id="shop-sort"
            value={searchParams.get('sort') || 'newest'}
            onChange={(event) => updateParams({ sort: event.target.value })}
            className="select w-full lg:w-56"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filters - desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-line bg-surface p-5">
            <FilterPanel
              params={searchParams}
              categories={categoryData || []}
              onChange={(patch) => updateParams(patch)}
              onClear={() => router.push(pathname)}
            />
          </div>
        </aside>

        {/* Filters - mobile */}
        {filtersOpen && (
          <div className="rounded-2xl border border-line bg-surface p-5 lg:hidden">
            <FilterPanel
              params={searchParams}
              categories={categoryData || []}
              onChange={(patch) => updateParams(patch, { replace: true })}
              onClear={() => router.push(pathname)}
            />
          </div>
        )}

        {/* Results */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-muted" role="status">
              {shownLoading ? 'Loading products…' : `${total} product${total === 1 ? '' : 's'} found`}
            </p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => router.push(pathname)}
                className="text-sm font-semibold text-brand-link hover:text-brand-ink"
              >
                Clear filters
              </button>
            )}
          </div>

          {shownLoading && <CardSkeleton count={PAGE_SIZE} />}

          {!shownLoading && shownError && (
            <ErrorState
              title="We could not load the products"
              message={shownError}
              onRetry={refetch}
            />
          )}

          {!shownLoading && !shownError && products.length === 0 && (
            <EmptyState
              icon="🔍"
              title="No products match your search"
              description="Try a different keyword, remove a filter, or browse all categories."
              actionLabel="Clear all filters"
              actionHref="/shop"
            />
          )}

          {!shownLoading && !shownError && products.length > 0 && (
            <>
              <ProductGrid products={products} />
              <Pagination
                page={page}
                pages={pages}
                onChange={(nextPage) => updateParams({ page: String(nextPage) }, { keepPage: true })}
                className="mt-8"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
