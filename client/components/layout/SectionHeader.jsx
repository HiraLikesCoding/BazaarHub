import Link from 'next/link';
import { cn } from '@/lib/cn';

/** Section heading with an optional "View all" link. */
export default function SectionHeader({ title, subtitle, actionLabel, actionHref, className = '' }) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        {subtitle && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-link">
            {subtitle}
          </p>
        )}
        <h2 className="text-2xl font-bold text-ink sm:text-[28px]">{title}</h2>
      </div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="group inline-flex items-center gap-1 text-sm font-semibold text-brand-link transition hover:text-brand-ink"
        >
          {actionLabel}
          <span className="transition group-hover:translate-x-0.5" aria-hidden="true">
            →
          </span>
        </Link>
      )}
    </div>
  );
}
