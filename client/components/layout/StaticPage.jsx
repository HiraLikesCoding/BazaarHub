/** Consistent wrapper for the informational pages (about, faq, policies...). */
export default function StaticPage({ title, intro, children, aside }) {
  return (
    <div className="container-page py-10 sm:py-14">
      <header className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
        {intro && <p className="mt-3 text-ink-muted">{intro}</p>}
      </header>

      <div className="mx-auto mt-10 max-w-3xl space-y-6">{children}</div>

      {aside && <div className="mx-auto mt-8 max-w-3xl">{aside}</div>}
    </div>
  );
}

export function Section({ heading, children }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
      {heading && <h2 className="mb-3 text-lg font-semibold text-ink">{heading}</h2>}
      <div className="space-y-3 text-sm leading-relaxed text-ink-muted">{children}</div>
    </section>
  );
}

export function List({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
