import WishlistPanel from '@/components/account/WishlistPanel';

export const metadata = {
  title: 'Wishlist',
  description: 'Products you have saved for later.',
};

export default function WishlistPage() {
  return (
    <div className="container-page py-8 sm:py-10">
      <h1 className="mb-6 text-2xl font-bold text-ink sm:text-3xl">My Wishlist</h1>
      <WishlistPanel />
    </div>
  );
}
