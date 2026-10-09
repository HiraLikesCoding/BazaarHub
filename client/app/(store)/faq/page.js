import StaticPage, { Section, List } from '@/components/layout/StaticPage';

export const metadata = {
  title: 'Frequently Asked Questions',
  description: 'Answers to the most common questions about orders, payments, shipping and returns.',
};

const FAQS = [
  {
    q: 'How do I track my order?',
    a: 'Sign in and open My Account → Orders. Every order shows its live status, and we also email you a tracking link when the parcel ships.',
  },
  {
    q: 'Which payment methods do you accept?',
    a: 'Cash on Delivery is available everywhere. Card and wallet payments run in demo mode in this build - no real charge is ever made.',
  },
  {
    q: 'When is shipping free?',
    a: 'Any order of $75 or more ships free. Below that, a flat $6.99 fee applies.',
  },
  {
    q: 'Can I change or cancel an order?',
    a: 'Yes - contact support within 2 hours of ordering. Once an order is marked as shipped it can no longer be changed, but you can still return it.',
  },
  {
    q: 'How do returns work?',
    a: 'You have 30 days from delivery. Email support with your order number, we send a return label, and your refund lands within 5 business days of us receiving the item.',
  },
  {
    q: 'Do I need an account to shop?',
    a: 'No - you can check out as a guest. An account just makes it easier to track orders and keep a wishlist.',
  },
];

export default function FaqPage() {
  return (
    <StaticPage
      title="FAQ"
      intro="Quick answers to the questions we hear most often."
    >
      <Section heading="Orders & delivery">
        <dl className="space-y-4">
          {FAQS.slice(0, 3).map((item) => (
            <div key={item.q}>
              <dt className="font-semibold text-ink">{item.q}</dt>
              <dd className="mt-1">{item.a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section heading="Payments & returns">
        <dl className="space-y-4">
          {FAQS.slice(3).map((item) => (
            <div key={item.q}>
              <dt className="font-semibold text-ink">{item.q}</dt>
              <dd className="mt-1">{item.a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section heading="Still need help?">
        <List
          items={[
            'Email support@bazaarhub.com',
            'Call +1 (555) 012-3456 between 9am and 8pm',
            'Or use the contact form - we reply within one business day',
          ]}
        />
      </Section>
    </StaticPage>
  );
}
