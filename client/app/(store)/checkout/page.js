import CheckoutContent from '@/components/checkout/CheckoutContent';

export const metadata = {
  title: 'Checkout',
  description: 'Enter your shipping details and place your BazaarHub order.',
};

export default function CheckoutPage() {
  return (
    <div className="container-page py-8 sm:py-10">
      <h1 className="mb-6 text-2xl font-bold text-ink sm:text-3xl">Checkout</h1>
      <CheckoutContent />
    </div>
  );
}
