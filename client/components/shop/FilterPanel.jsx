'use client';

import { cn } from '@/lib/cn';

const PRICE_PRESETS = [
  { label: 'Under $25', min: '', max: 25 },
  { label: '$25 - $50', min: 25, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: 'Over $100', min: 100, max: '' },
];

const RATINGS = [4, 3, 2];

/**
 * All shop filters. The parent owns the URL params - this component only
 * reports changes, so the browser back button keeps working.
 */
export default function FilterPanel({ params, categories, onChange, onClear, className = '' }) {
  const activeCategory = params.get('category') || '';
  const activeRating = params.get('minRating') || '';
  const inStock = params.get('inStock') === 'true';
  const onSale = params.get('onSale') === 'true';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';

  const hasFilters = ['category', 'minRating', 'minPrice', 'maxPrice', 'inStock', 'onSale', 'search'].some(
    (key) => params.get(key)
  );

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">Filters</h2>
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-brand-link hover:text-brand-ink"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category */}
      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold text-ink">Category</legend>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => onChange({ category: '' })}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition',
              !activeCategory ? 'bg-brand-soft font-semibold text-brand-ink' : 'text-ink-muted hover:bg-surface-2'
            )}
          >
            All categories
            {!activeCategory && <span aria-hidden="true">✓</span>}
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              type="button"
              onClick={() => onChange({ category: category.name })}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition',
                activeCategory === category.name
                  ? 'bg-brand-soft font-semibold text-brand-ink'
                  : 'text-ink-muted hover:bg-surface-2'
              )}
            >
              <span className="truncate">{category.name}</span>
              <span className="ml-2 text-xs text-ink-faint">{category.productCount ?? 0}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Price */}
      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold text-ink">Price</legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={minPrice}
            onChange={(event) => onChange({ minPrice: event.target.value })}
            className="input py-2"
            aria-label="Minimum price"
          />
          <span className="text-ink-faint">-</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={maxPrice}
            onChange={(event) => onChange({ maxPrice: event.target.value })}
            className="input py-2"
            aria-label="Maximum price"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRICE_PRESETS.map((preset) => {
            const active = String(preset.min) === minPrice && String(preset.max) === maxPrice;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  onChange({
                    minPrice: String(preset.min),
                    maxPrice: String(preset.max),
                  })
                }
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition',
                  active
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-line bg-surface text-ink-muted hover:border-brand-300'
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Rating */}
      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold text-ink">Customer rating</legend>
        <div className="space-y-1.5">
          {RATINGS.map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange({ minRating: activeRating === String(rating) ? '' : String(rating) })}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition',
                activeRating === String(rating)
                  ? 'bg-brand-soft font-semibold text-brand-ink'
                  : 'text-ink-muted hover:bg-surface-2'
              )}
            >
              <span className="text-accent-500" aria-hidden="true">
                {'★'.repeat(rating)}
                {'☆'.repeat(5 - rating)}
              </span>
              <span>& up</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Availability */}
      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold text-ink">Availability</legend>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-muted hover:bg-surface-2">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(event) => onChange({ inStock: event.target.checked ? 'true' : '' })}
            className="h-4 w-4 rounded border-line-strong text-brand-link focus:ring-brand-500"
          />
          In stock only
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-muted hover:bg-surface-2">
          <input
            type="checkbox"
            checked={onSale}
            onChange={(event) => onChange({ onSale: event.target.checked ? 'true' : '' })}
            className="h-4 w-4 rounded border-line-strong text-brand-link focus:ring-brand-500"
          />
          On sale
        </label>
      </fieldset>
    </div>
  );
}
