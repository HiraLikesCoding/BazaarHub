import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[55vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-6xl font-black text-brand-100 dark:text-brand-900" aria-hidden="true">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-ink-subtle">
        The page you are looking for does not exist or may have been moved. Let&apos;s get you back to
        shopping.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Go home
        </Link>
        <Link href="/shop" className="btn-outline">
          Browse products
        </Link>
      </div>
    </div>
  );
}
