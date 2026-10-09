import { cn } from '@/lib/cn';

/** Full screen / inline loading indicator. */
export default function LoadingSpinner({ size = 'md', label = '', className = '' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-[3px]', lg: 'h-12 w-12 border-4' };
  return (
    <span className={cn('inline-flex items-center gap-3', className)} role="status" aria-live="polite">
      <span
        className={cn(
          'animate-spin rounded-full border-brand-line border-t-brand-600',
          sizes[size] || sizes.md
        )}
        aria-hidden="true"
      />
      {label && <span className="text-sm text-ink-subtle">{label}</span>}
      {!label && <span className="sr-only">Loading...</span>}
    </span>
  );
}

/** Centered block used as a page level loading state. */
export function LoadingBlock({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 py-16">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-ink-subtle">{label}</p>
    </div>
  );
}

/** Grey placeholders shown while product cards load. */
export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="skeleton aspect-square w-full rounded-none" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
