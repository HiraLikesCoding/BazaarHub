import Link from 'next/link';
import ProductImage from '@/components/product/ProductImage';
import { ShieldIcon, TruckIcon, RefreshIcon, TagIcon } from '@/components/ui/Icons';

const HIGHLIGHTS = [
  { icon: TruckIcon, title: 'Free shipping', text: 'On orders over $75' },
  { icon: ShieldIcon, title: 'Secure checkout', text: 'Your data stays safe' },
  { icon: RefreshIcon, title: '30-day returns', text: 'No questions asked' },
  { icon: TagIcon, title: 'Best prices', text: 'Deals updated daily' },
];

export default function Hero({ images = [] }) {
  const collage = images.filter(Boolean).slice(0, 3);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-700 text-white">
      {/* soft decorative shapes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-accent-400/20 blur-3xl"
      />

      <div className="container-page relative grid items-center gap-10 py-14 sm:py-16 lg:grid-cols-2 lg:gap-8 lg:py-24">
        <div className="animate-fade-up text-center lg:text-left">
          <span className="badge bg-white/15 text-white ring-1 ring-white/20">
            New season · Up to 40% off
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Everything You Need,
            <br className="hidden sm:block" /> All in One Place.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-indigo-100 sm:text-lg lg:mx-0">
            From everyday essentials to the latest tech - discover thousands of products from brands
            you love, delivered to your door with cash on delivery.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link href="/shop" className="btn-lg w-full bg-white text-brand-700 shadow-lg hover:bg-indigo-50 sm:w-auto">
              Shop Now
            </Link>
            <Link
              href="/shop?onSale=true"
              className="btn-lg w-full border border-white/40 text-white hover:bg-white/10 sm:w-auto"
            >
              Browse Deals
            </Link>
          </div>

          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-white/20 pt-6 text-center lg:text-left">
            {[
              ['20K+', 'Happy customers'],
              ['2K+', 'Products'],
              ['4.8', 'Average rating'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="text-2xl font-bold">{value}</dd>
                <dd className="text-xs text-indigo-200">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Product collage */}
        <div className="relative mx-auto hidden w-full max-w-lg lg:block">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-3xl bg-white/10 p-2 ring-1 ring-white/20">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/10">
                  {collage[0] && (
                    <ProductImage src={collage[0]} alt="" fill sizes="300px" className="opacity-95" />
                  )}
                </div>
              </div>
              <div className="overflow-hidden rounded-3xl bg-white/10 p-2 ring-1 ring-white/20">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/10">
                  {collage[1] && (
                    <ProductImage src={collage[1]} alt="" fill sizes="300px" className="opacity-95" />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              <div className="overflow-hidden rounded-3xl bg-white/10 p-2 ring-1 ring-white/20">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/10">
                  {collage[2] && (
                    <ProductImage src={collage[2]} alt="" fill sizes="300px" className="opacity-95" />
                  )}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-4 text-slate-900 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                  Today only
                </p>
                <p className="mt-1 text-2xl font-extrabold">Up to 40% off</p>
                <p className="mt-1 text-sm text-slate-500">On selected electronics & fashion</p>
                <Link href="/shop?onSale=true" className="btn-primary mt-3 w-full">
                  Shop deals
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust bar */}
      <div className="relative border-t border-white/15 bg-black/10">
        <div className="container-page grid grid-cols-2 gap-4 py-5 sm:grid-cols-4">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <Icon className="h-4.5 w-4.5 text-white" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{title}</p>
                <p className="truncate text-xs text-indigo-200">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
