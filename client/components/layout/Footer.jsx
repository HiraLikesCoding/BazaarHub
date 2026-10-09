import Link from 'next/link';
import { fetchCategories } from '@/services/categories';
import {
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TwitterIcon,
  YoutubeIcon,
} from '@/components/ui/Icons';

const PRODUCT_LINKS = [
  { href: '/shop', label: 'All Products' },
  { href: '/shop?sort=rating', label: 'Top Rated' },
  { href: '/shop?onSale=true', label: 'Deals & Offers' },
  { href: '/shop?sort=newest', label: 'New Arrivals' },
];

const HELP_LINKS = [
  { href: '/account?tab=orders', label: 'Track Your Order' },
  { href: '/cart', label: 'Shopping Cart' },
  { href: '/contact', label: 'Contact Us' },
  { href: '/faq', label: 'FAQ' },
];

const COMPANY_LINKS = [
  { href: '/about', label: 'About BazaarHub' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/shipping', label: 'Shipping & Returns' },
];

async function getCategories() {
  try {
    // Cached for 5 minutes so the footer does not hit the API on every request
    return await fetchCategories({ revalidate: 300 });
  } catch (err) {
    return [];
  }
}

export default async function Footer() {
  const categories = await getCategories();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-line bg-surface-2">
      <div className="container-page py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg font-black text-white">
                B
              </span>
              <span className="text-xl font-extrabold tracking-tight text-ink">
                Bazaar<span className="text-brand-link">Hub</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
              Everything you need, all in one place. Discover electronics, fashion, beauty, home
              essentials and more - at prices that make sense.
            </p>

            <ul className="mt-5 space-y-2.5 text-sm text-ink-muted">
              <li className="flex items-start gap-2.5">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-link" />
                <span>123 Market Street, Suite 400, Portland, OR 97205</span>
              </li>
              <li className="flex items-center gap-2.5">
                <PhoneIcon className="h-4 w-4 shrink-0 text-brand-link" />
                <a href="tel:+15550123456" className="hover:text-brand-ink">
                  +1 (555) 012-3456
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MailIcon className="h-4 w-4 shrink-0 text-brand-link" />
                <a href="mailto:support@bazaarhub.com" className="hover:text-brand-ink">
                  support@bazaarhub.com
                </a>
              </li>
            </ul>

            <div className="mt-5 flex items-center gap-2">
              {[
                { label: 'Facebook', href: '#', Icon: FacebookIcon },
                { label: 'Twitter', href: '#', Icon: TwitterIcon },
                { label: 'Instagram', href: '#', Icon: InstagramIcon },
                { label: 'YouTube', href: '#', Icon: YoutubeIcon },
              ].map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-subtle transition hover:border-brand-link hover:text-brand-link"
                >
                  <Icon className="h-4.5 w-4.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink">
              Categories
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
              {categories.length > 0
                ? categories.map((category) => (
                    <li key={category._id}>
                      <Link
                        href={`/shop?category=${encodeURIComponent(category.name)}`}
                        className="transition hover:text-brand-ink"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))
                : ['Electronics', 'Fashion', 'Beauty', 'Home & Living', 'Sports', 'Books'].map(
                    (name) => (
                      <li key={name}>
                        <Link
                          href={`/shop?category=${encodeURIComponent(name)}`}
                          className="transition hover:text-brand-ink"
                        >
                          {name}
                        </Link>
                      </li>
                    )
                  )}
            </ul>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink">Shop</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-brand-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink">
              Company
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
              {[...COMPANY_LINKS, ...HELP_LINKS].map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="transition hover:text-brand-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-6 sm:flex-row">
          <p className="text-sm text-ink-subtle">
            © {year} BazaarHub. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-ink-subtle">
            <span>Secure payments</span>
            <span aria-hidden="true">•</span>
            <span>Free shipping over $75</span>
            <span aria-hidden="true">•</span>
            <span>30-day returns</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
