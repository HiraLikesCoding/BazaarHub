import Link from 'next/link';
import { cn } from '@/lib/cn';

const VARIANTS = {
  primary: 'btn-primary',
  dark: 'btn-dark',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

const SIZES = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

/**
 * One button for the whole app.
 * Pass `href` to render a Next.js link that looks like a button.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  className = '',
  type = 'button',
  children,
  ...props
}) {
  const classes = cn(VARIANTS[variant] || VARIANTS.primary, SIZES[size], className);

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
