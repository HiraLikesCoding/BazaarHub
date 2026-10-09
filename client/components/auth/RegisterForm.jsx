'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import AuthShell from './AuthShell';

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const set = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  function validate() {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Please enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address';
    if (form.password.length < 6) next.password = 'Password must be at least 6 characters';
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success('Account created - welcome to BazaarHub!');
      router.replace('/');
    } catch (err) {
      setSubmitError(err.message || 'Could not create your account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="reg-name" className="label">
          Full name
        </label>
        <input
          id="reg-name"
          className="input"
          placeholder="Jane Doe"
          autoComplete="name"
          value={form.name}
          onChange={set('name')}
        />
        {errors.name && <p className="mt-1.5 text-xs font-medium text-danger-ink">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="reg-email" className="label">
          Email address
        </label>
        <input
          id="reg-email"
          type="email"
          className="input"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
        />
        {errors.email && <p className="mt-1.5 text-xs font-medium text-danger-ink">{errors.email}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="reg-password" className="label">
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            className="input"
            placeholder="Min. 6 characters"
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
          />
          {errors.password && <p className="mt-1.5 text-xs font-medium text-danger-ink">{errors.password}</p>}
        </div>
        <div>
          <label htmlFor="reg-confirm" className="label">
            Confirm password
          </label>
          <input
            id="reg-confirm"
            type="password"
            className="input"
            placeholder="Repeat password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={set('confirm')}
          />
          {errors.confirm && <p className="mt-1.5 text-xs font-medium text-danger-ink">{errors.confirm}</p>}
        </div>
      </div>

      {submitError && (
        <p className="rounded-lg bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger-ink" role="alert">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-lg w-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {submitting ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-xs text-ink-faint">
        By signing up you agree to our{' '}
        <Link href="/terms" className="text-ink-subtle underline">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-ink-subtle underline">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
