'use client';

/** Compact pagination control used by the shop and admin tables. */
export default function Pagination({ page, pages, onChange, className = '' }) {
  if (!pages || pages <= 1) return null;

  const current = Math.max(1, Number(page) || 1);
  const window = [];
  const from = Math.max(1, current - 2);
  const to = Math.min(pages, current + 2);
  for (let i = from; i <= to; i++) window.push(i);

  const base =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium transition';

  return (
    <nav className={`flex flex-wrap items-center justify-center gap-2 ${className}`} aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className={`${base} border-line bg-surface text-ink-muted hover:border-brand-300 hover:text-brand-ink disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-muted`}
      >
        ← Prev
      </button>

      {from > 1 && (
        <>
          <button
            type="button"
            onClick={() => onChange(1)}
            className={`${base} border-line bg-surface text-ink-muted hover:border-brand-300`}
          >
            1
          </button>
          {from > 2 && <span className="px-1 text-ink-faint">…</span>}
        </>
      )}

      {window.map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onChange(num)}
          aria-current={num === current ? 'page' : undefined}
          className={`${base} ${
            num === current
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-line bg-surface text-ink-muted hover:border-brand-300 hover:text-brand-ink'
          }`}
        >
          {num}
        </button>
      ))}

      {to < pages && (
        <>
          {to < pages - 1 && <span className="px-1 text-ink-faint">…</span>}
          <button
            type="button"
            onClick={() => onChange(pages)}
            className={`${base} border-line bg-surface text-ink-muted hover:border-brand-300`}
          >
            {pages}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => onChange(current + 1)}
        disabled={current === pages}
        className={`${base} border-line bg-surface text-ink-muted hover:border-brand-300 hover:text-brand-ink disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-muted`}
      >
        Next →
      </button>
    </nav>
  );
}
