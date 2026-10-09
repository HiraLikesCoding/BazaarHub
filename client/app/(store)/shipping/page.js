import StaticPage, { Section, List } from '@/components/layout/StaticPage';

export const metadata = {
  title: 'Shipping & Returns',
  description: 'Shipping rates, delivery times and the BazaarHub return policy.',
};

export default function ShippingPage() {
  return (
    <StaticPage
      title="Shipping & Returns"
      intro="Straightforward rates, tracked deliveries and 30-day returns."
    >
      <Section heading="Shipping rates">
        <List
          items={[
            'Flat rate of $6.99 on all orders under $75',
            'Free standard shipping on orders of $75 or more',
            'Orders placed before 2pm ship the same business day',
            'Standard delivery takes 3 - 5 business days',
            'Every order includes tracking sent to your email',
          ]}
        />
      </Section>

      <Section heading="Delivery areas">
        <p>
          We currently deliver across the United States. Remote areas may take an extra 1 - 2 business
          days. You will receive a tracking link as soon as your parcel leaves our warehouse.
        </p>
      </Section>

      <Section heading="Returns">
        <List
          items={[
            '30 days from delivery to start a return',
            'Items must be unused and in original packaging',
            'Refunds are issued to the original payment method within 5 business days',
            'Damaged or wrong items are replaced for free',
          ]}
        />
        <p>
          To start a return, email <span className="font-medium text-ink">support@bazaarhub.com</span> with
          your order number.
        </p>
      </Section>
    </StaticPage>
  );
}
