'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Surface unexpected render errors in the console for debugging
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[55vh] flex-col items-center justify-center py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft-2 text-2xl" aria-hidden="true">
        !
      </span>
      <h1 className="mt-4 text-2xl font-bold text-ink">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-ink-subtle">
        An unexpected error occurred while loading this page. Please try again.
      </p>
      <button type="button" onClick={() => reset()} className="btn-primary mt-7">
        Try again
      </button>
    </div>
  );
}
