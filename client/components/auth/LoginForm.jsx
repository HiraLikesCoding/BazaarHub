'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import AuthShell from './AuthShell';

const DEMO_ACCOUNTS = [
  { label: 'Customer demo', email: 'customer@bazaarhub.com', password: 'Customer@123' },
  { label: 'Admin demo', email: 'admin@bazaarhub.com', password: 'Admin@123' },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, loading } = useAuth();
  const toast = useToast();

  const next = searchParams.get('next') || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !loading) router.replace(next);
  }, [isAuthenticated, loading, next, router]);

  const set = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.email.trim() || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      toast.success(`Welcome back, ${user.name?.split(' ')[0] || 'shopper'}!`);
      router.replace(next);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="login-email" className="label">
          Email address
        </label>
        <input
          id="login-email"
          type="email"
          className="input"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
        />
      </div>

      <div>
        <label htmlFor="login-password" className="label">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          className="input"
          placeholder="••••••••"
          autoComplete="current-password"
          value={form.password}
          onChange={set('password')}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger-ink" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-lg w-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60">
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>

      {/* Demo quick-fill */}
      <div className="rounded-xl border border-dashed border-line-strong bg-surface-2 p-3">
        <p className="text-xs font-semibold text-ink-subtle">Try a demo account</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setForm(account);
                setError('');
              }}
              className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:border-brand-link hover:text-brand-ink"
            >
              {account.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}

export default function Login() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to track orders, save favourites and checkout faster."
      footer={
        <>
          New to BazaarHub?{' '}
          <Link href="/register" className="font-semibold text-brand-link hover:text-brand-ink">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="skeleton h-64 rounded-2xl" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
