import ProductCard from './ProductCard';
import { cn } from '@/lib/cn';

/**
 * Responsive product grid:
 * 1 column on very small screens, 2 on phones, 3 on tablets, 4 on desktop.
 */
export default function ProductGrid({ products = [], className = '', variant = 'default' }) {
  if (!products.length) return null;

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 md:grid-cols-3 md:gap-6 xl:grid-cols-4',
        variant === 'compact' && 'gap-3 md:gap-4',
        className
      )}
    >
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
