'use client';

/** - 1 + quantity control with stock aware limits. */
export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  ariaLabel = 'Quantity',
}) {
  const current = Math.min(Math.max(Number(value) || 1, min), max);
  const small = size === 'sm';

  const baseButton = `${
    small ? 'h-8 w-8 text-base' : 'h-10 w-10 text-lg'
  } inline-flex items-center justify-center border border-line-strong bg-surface text-ink-muted transition hover:bg-surface-2 disabled:opacity-40`;

  const buttonClass = (side) =>
    `${baseButton} ${side === 'left' ? 'rounded-l-xl border-r-0' : 'rounded-r-xl border-l-0'}`;

  return (
    <div className="inline-flex items-stretch">
      <button
        type="button"
        onClick={() => onChange(current - 1)}
        disabled={current <= min}
        className={buttonClass('left')}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={current}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (!Number.isNaN(next)) onChange(next);
        }}
        onBlur={() => onChange(current)}
        aria-label={ariaLabel}
        className={`${
          small ? 'h-8 w-12 text-sm' : 'h-10 w-14 text-sm'
        } border-y border-line-strong bg-surface text-center text-ink outline-none`}
      />
      <button
        type="button"
        onClick={() => onChange(current + 1)}
        disabled={current >= max}
        aria-label="Increase quantity"
        className={buttonClass('right')}
      >
        +
      </button>
    </div>
  );
}
