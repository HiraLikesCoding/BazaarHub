import CartContent from '@/components/cart/CartContent';

export const metadata = {
  title: 'Shopping Cart',
  description: 'Review the products in your cart before checkout.',
};

export default function CartPage() {
  return (
    <div className="container-page py-8 sm:py-10">
      <CartContent />
    </div>
  );
}
