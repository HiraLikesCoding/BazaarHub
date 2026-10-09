import StaticPage, { Section, List } from '@/components/layout/StaticPage';

export const metadata = {
  title: 'Terms of Service',
  description: 'The terms that apply when you use BazaarHub.',
};

export default function TermsPage() {
  return (
    <StaticPage title="Terms of Service" intro="Last updated: October 2026">
      <Section heading="1. Using BazaarHub">
        <p>
          By creating an account or placing an order you agree to these terms. You must provide accurate
          information and keep your login credentials secure.
        </p>
      </Section>

      <Section heading="2. Orders and pricing">
        <List
          items={[
            'All prices are shown in USD and include applicable taxes',
            'An order is confirmed once you receive an order confirmation email',
            'We may cancel and refund an order if an item is out of stock or priced in error',
            'Promotional codes cannot be combined unless stated otherwise',
          ]}
        />
      </Section>

      <Section heading="3. Delivery">
        <p>
          Delivery estimates are guidance, not guarantees. Risk of loss passes to you when the order is
          delivered to the address you provided.
        </p>
      </Section>

      <Section heading="4. Returns">
        <p>
          Unused items in their original packaging can be returned within 30 days of delivery. See our{' '}
          <a href="/shipping" className="font-medium text-brand-link">
            shipping and returns page
          </a>{' '}
          for the full policy.
        </p>
      </Section>

      <Section heading="5. Liability">
        <p>
          To the maximum extent permitted by law, BazaarHub is not liable for indirect or consequential
          losses arising from your use of the site. Nothing in these terms limits rights you have under
          consumer law.
        </p>
      </Section>

      <Section heading="6. Contact">
        <p>
          Questions about these terms: <span className="font-medium text-ink">legal@bazaarhub.com</span>.
        </p>
      </Section>
    </StaticPage>
  );
}
