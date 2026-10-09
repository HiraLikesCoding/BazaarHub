'use client';

import { useId } from 'react';
import { cn } from '@/lib/cn';

/** Label + control + error message, used by every form in the app. */
export function Field({ label, error, hint, htmlFor, required, children }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
          {required && <span className="ml-0.5 text-danger-ink">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-danger-ink" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-subtle">{hint}</p>
      )}
    </div>
  );
}

export function Input({ label, error, hint, required, className, id, ...props }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={inputId} required={required}>
      <input
        id={inputId}
        className={cn('input', error && 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20', className)}
        aria-invalid={error ? 'true' : undefined}
        required={required}
        {...props}
      />
    </Field>
  );
}

export function Textarea({ label, error, hint, required, className, id, rows = 4, ...props }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={inputId} required={required}>
      <textarea
        id={inputId}
        rows={rows}
        className={cn('input resize-y', error && 'border-rose-400', className)}
        aria-invalid={error ? 'true' : undefined}
        required={required}
        {...props}
      />
    </Field>
  );
}

export function Select({ label, error, hint, required, className, id, children, ...props }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={inputId} required={required}>
      <select
        id={inputId}
        className={cn('select', error && 'border-rose-400', className)}
        aria-invalid={error ? 'true' : undefined}
        required={required}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}
