import { cn } from '@/lib/cn';
import { discountPercent, formatPrice } from '@/lib/format';

/** Current price + crossed out list price when the product is on sale. */
export default function Price({ price, discountPrice, size = 'md', className = '' }) {
  const discounted = Number(discountPrice) > 0 && Number(discountPrice) < Number(price);
  const current = discounted ? discountPrice : price;
  const percent = discountPercent(price, discountPrice);

  const sizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-3xl',
  };

  return (
    <div className={cn('flex flex-wrap items-baseline gap-2', className)}>
      <span className={cn('font-bold text-ink', sizes[size] || sizes.md)}>
        {formatPrice(current)}
      </span>
      {discounted && (
        <>
          <span className="text-sm text-ink-faint line-through">{formatPrice(price)}</span>
          <span className="badge-danger">-{percent}%</span>
        </>
      )}
    </div>
  );
}
