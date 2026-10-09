import Link from 'next/link';

/** Promotional banner between the product sections. */
export default function PromoBanner() {
  return (
    <section className="container-page">
      <div className="relative overflow-hidden rounded-3xl bg-promo px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl"
        />

        <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="badge bg-accent-500/20 text-accent-400 ring-1 ring-accent-500/30">
              Limited time
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
              Big Deals. Better Prices.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              Save up to 40% on selected electronics, fashion and home favourites. New deals drop
              every week - and shipping is free when you spend over $75.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/shop?onSale=true" className="btn-lg bg-white text-slate-900 hover:bg-slate-100">
                Shop Deals
              </Link>
              <Link
                href="/shop"
                className="btn-lg border border-white/30 text-white hover:bg-white/10"
              >
                Browse all products
              </Link>
            </div>
          </div>

          <div className="grid w-full grid-cols-3 gap-3 lg:w-auto">
            {[
              ['40%', 'Max discount'],
              ['75$', 'Free shipping'],
              ['24h', 'Fast dispatch'],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-2xl bg-white/5 px-3 py-4 text-center ring-1 ring-white/10 backdrop-blur"
              >
                <p className="text-xl font-extrabold text-white sm:text-2xl">{value}</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
