import ContactForm from '@/components/layout/ContactForm';
import StaticPage, { Section } from '@/components/layout/StaticPage';

export const metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the BazaarHub support team.',
};

export default function ContactPage() {
  return (
    <StaticPage
      title="Contact Us"
      intro="Questions about an order, a product or a return? We usually reply within one business day."
    >
      <div className="grid gap-6 sm:grid-cols-3">
        {[
          ['✉️', 'Email', 'support@bazaarhub.com'],
          ['📞', 'Phone', '+1 (555) 012-3456'],
          ['🕘', 'Hours', 'Mon - Sun, 9am - 8pm'],
        ].map(([icon, label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-surface p-5 text-center">
            <span className="text-2xl" aria-hidden="true">
              {icon}
            </span>
            <p className="mt-2 text-xs uppercase tracking-wide text-ink-faint">{label}</p>
            <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
          </div>
        ))}
      </div>

      <Section heading="Send us a message">
        <ContactForm />
      </Section>
    </StaticPage>
  );
}
