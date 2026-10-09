import Link from 'next/link';
import Button from './Button';

/**
 * Friendly empty state - used for empty carts, no search results, etc.
 */
export default function EmptyState({
  icon = '🛍️',
  title = 'Nothing here yet',
  description = '',
  actionLabel,
  actionHref,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface-2/60 px-6 py-14 text-center ${className}`}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface text-3xl shadow-sm">
        <span aria-hidden="true">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-ink-subtle">{description}</p>}

      {(actionLabel && actionHref) || onAction ? (
        <div className="mt-6">
          {onAction ? (
            <Button onClick={onAction}>{actionLabel}</Button>
          ) : (
            <Link href={actionHref} className="btn-primary">
              {actionLabel}
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Friendly error state with a retry button. */
export function ErrorState({ title = 'Something went wrong', message = '', onRetry, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-danger-ink/25 bg-danger-soft/60 px-6 py-14 text-center ${className}`}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface text-2xl">
        <span aria-hidden="true">⚠️</span>
      </div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {message && <p className="mt-2 max-w-md text-sm text-ink-muted">{message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-outline mt-6">
          Try again
        </button>
      )}
    </div>
  );
}
