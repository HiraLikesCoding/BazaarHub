import Image from 'next/image';
import { cn } from '@/lib/cn';

/**
 * Product image with graceful fallbacks:
 * - missing image  -> branded placeholder
 * - local .svg      -> plain <img> (Next optimiser skips SVGs)
 * - normal photo    -> optimised <Image>
 */
export default function ProductImage({
  src,
  alt = '',
  fill = false,
  sizes,
  className = '',
  priority = false,
  objectClassName = 'object-cover',
}) {
  const common = cn('transition duration-300', objectClassName, className);

  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 text-4xl dark:from-brand-900 dark:to-brand-800',
          common
        )}
        aria-hidden="true"
      >
        🛍️
      </div>
    );
  }

  if (src.endsWith('.svg')) {
    return fill ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} loading="lazy" className={cn('absolute inset-0 h-full w-full', common)} />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} loading="lazy" className={common} />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={cn(fill && 'absolute inset-0', common)}
    />
  );
}
