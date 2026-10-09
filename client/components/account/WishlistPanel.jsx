'use client';

import { useCart } from '@/hooks/useCart';
import { useFetch } from '@/hooks/useFetch';
import { fetchProductsByIds } from '@/services/products';
import EmptyState, { ErrorState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/LoadingSpinner';
import ProductGrid from '@/components/product/ProductGrid';

export default function WishlistPanel() {
  const { wishlist, hydrated } = useCart();
  const key = wishlist.join(',');

  const { data: products, loading, error, refetch } = useFetch(
    () => fetchProductsByIds(wishlist),
    [key],
    { enabled: hydrated && wishlist.length > 0, initial: null }
  );

  if (!hydrated) return <CardSkeleton count={4} />;

  if (wishlist.length === 0) {
    return (
      <EmptyState
        icon="♡"
        title="Your wishlist is empty"
        description="Tap the heart on any product to save it here for later."
        actionLabel="Find something you love"
        actionHref="/shop"
      />
    );
  }

  if (loading) return <CardSkeleton count={4} />;
  if (error) return <ErrorState title="Could not load your wishlist" message={error} onRetry={refetch} />;
  if (!products?.length) {
    return (
      <EmptyState
        icon="♡"
        title="Saved products are unavailable"
        description="Some of your saved items may have been removed from the catalogue."
        actionLabel="Browse the shop"
        actionHref="/shop"
      />
    );
  }

  return <ProductGrid products={products} />;
}
