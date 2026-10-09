import Link from 'next/link';
import StaticPage, { Section, List } from '@/components/layout/StaticPage';

export const metadata = {
  title: 'About Us',
  description: 'BazaarHub is a modern online marketplace built for everyday shoppers.',
};

export default function AboutPage() {
  return (
    <StaticPage
      title="About BazaarHub"
      intro="A modern marketplace with honest prices, fast delivery and support that actually answers."
    >
      <Section heading="Our story">
        <p>
          BazaarHub started with a simple idea: online shopping should be fast, fair and frustration free.
          We bring together electronics, fashion, home essentials, beauty, sports gear and groceries in one
          place, with transparent pricing and real reviews from real customers.
        </p>
        <p>
          Every order is packed by our own team, tracked from warehouse to doorstep, and backed by a
          30-day return promise.
        </p>
      </Section>

      <Section heading="What we stand for">
        <List
          items={[
            'Honest prices - the price you see is the price you pay',
            'Free shipping on every order over $75',
            '30-day returns with no restocking fees',
            'Curated quality - every product is reviewed before it is listed',
            'Real human support, 7 days a week',
          ]}
        />
      </Section>

      <Section heading="By the numbers">
        <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
          {[
            ['25k+', 'Happy customers'],
            ['6', 'Departments'],
            ['98%', 'On-time delivery'],
            ['30d', 'Easy returns'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl bg-surface-2 p-4">
              <p className="text-2xl font-bold text-brand-ink">{value}</p>
              <p className="mt-1 text-xs text-ink-subtle">{label}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="text-center">
        <Link href="/shop" className="btn-primary">
          Start shopping
        </Link>
      </div>
    </StaticPage>
  );
}
