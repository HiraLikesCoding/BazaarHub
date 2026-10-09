import StaticPage, { Section, List } from '@/components/layout/StaticPage';

export const metadata = {
  title: 'Privacy Policy',
  description: 'How BazaarHub collects, uses and protects your personal data.',
};

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy" intro="Last updated: October 2026">
      <Section heading="Information we collect">
        <List
          items={[
            'Account details: name, email address and hashed password',
            'Order details: shipping address, phone number and items purchased',
            'Technical data: browser type and pages visited, used to improve the shop',
          ]}
        />
        <p>We never store payment card numbers - card payments are handled by our payment partner.</p>
      </Section>

      <Section heading="How we use your data">
        <List
          items={[
            'To process and deliver your orders',
            'To send order confirmations and tracking updates',
            'To respond to support requests',
            'To improve product recommendations and site performance',
          ]}
        />
        <p>We do not sell your personal information to anyone.</p>
      </Section>

      <Section heading="Cookies">
        <p>
          BazaarHub uses local storage to remember your cart and wishlist, and a token so you stay signed
          in. Clearing your browser data resets both.
        </p>
      </Section>

      <Section heading="Your rights">
        <p>
          You can request a copy of your data, ask for corrections, or ask us to delete your account at any
          time by emailing <span className="font-medium text-ink">privacy@bazaarhub.com</span>.
        </p>
      </Section>
    </StaticPage>
  );
}
