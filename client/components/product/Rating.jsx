import { StarIcon } from '@/components/ui/Icons';
import { cn } from '@/lib/cn';

/** Star rating display (read only). */
export default function Rating({ value = 0, count, size = 'sm', className = '' }) {
  const rating = Math.round((Number(value) || 0) * 2) / 2;
  const starClass = size === 'sm' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4.5 w-4.5' : 'h-5 w-5';

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5 text-accent-500" aria-label={`Rated ${rating} out of 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={cn(starClass, rating >= star - 0.25 ? 'text-accent-500' : 'text-ink-faint')}
            filled={rating >= star - 0.25}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-ink-muted">{Number(value || 0).toFixed(1)}</span>
      {count !== undefined && <span className="text-xs text-ink-faint">({count})</span>}
    </div>
  );
}
