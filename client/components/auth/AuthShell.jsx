/** Shared layout for the login and register screens. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-line bg-surface shadow-sm lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-10 text-white lg:block">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" aria-hidden="true" />
          <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-white/5" aria-hidden="true" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              ✦ BazaarHub
            </span>
            <h2 className="mt-6 text-3xl font-bold leading-snug">
              Everything you love,
              <br />
              delivered to your door.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/80">
              Shop thousands of products, track your orders and enjoy free shipping on orders over $75.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-white/90">
              {['Free shipping over $75', '30-day easy returns', 'Order tracking in your account'].map(
                (perk) => (
                  <li key={perk} className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px]">
                      ✓
                    </span>
                    {perk}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        {/* Form panel */}
        <div className="p-6 sm:p-10">
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-subtle">{subtitle}</p>}
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 border-t border-line-soft pt-5 text-center text-sm text-ink-subtle">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
