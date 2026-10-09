'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/useToast';
import { initials } from '@/lib/format';
import { cn } from '@/lib/cn';
import ProfilePanel from './ProfilePanel';
import OrdersPanel from './OrdersPanel';
import WishlistPanel from './WishlistPanel';
import { LogoutIcon } from '@/components/ui/Icons';

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'orders', label: 'Orders' },
  { id: 'wishlist', label: 'Wishlist' },
];

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading, logout, isAdmin } = useAuth();
  const { count } = useCart();
  const toast = useToast();

  const active = TABS.some((tab) => tab.id === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'profile';

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login?next=/account');
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-16 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  function handleLogout() {
    logout();
    toast.info('You have been signed out.');
    router.replace('/');
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="space-y-4">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft-2 text-base font-bold text-brand-ink">
              {initials(user?.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-xs text-ink-subtle">{user?.email}</p>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-surface-2 p-2.5">
              <dt className="text-[11px] uppercase tracking-wide text-ink-faint">Cart</dt>
              <dd className="text-sm font-bold text-ink">{count}</dd>
            </div>
            <div className="rounded-xl bg-surface-2 p-2.5">
              <dt className="text-[11px] uppercase tracking-wide text-ink-faint">Role</dt>
              <dd className="text-sm font-bold capitalize text-ink">{user?.role || 'customer'}</dd>
            </div>
          </dl>
        </div>

        <nav className="rounded-2xl border border-line bg-surface p-2" aria-label="Account">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={`/account?tab=${tab.id}`}
              className={cn(
                'block rounded-xl px-4 py-2.5 text-sm font-medium transition',
                active === tab.id ? 'bg-brand-soft text-brand-ink' : 'text-ink-muted hover:bg-surface-2'
              )}
              aria-current={active === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-danger-ink transition hover:bg-danger-soft"
          >
            <LogoutIcon className="h-4 w-4" />
            Sign out
          </button>
        </nav>

        {isAdmin && (
          <Link href="/admin" className="btn-outline block w-full text-center text-sm">
            Admin dashboard
          </Link>
        )}
      </aside>

      {/* Panels */}
      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
        <h1 className="mb-5 text-xl font-bold text-ink">
          {active === 'profile' && 'My Profile'}
          {active === 'orders' && 'My Orders'}
          {active === 'wishlist' && 'My Wishlist'}
        </h1>

        {active === 'profile' && <ProfilePanel />}
        {active === 'orders' && <OrdersPanel />}
        {active === 'wishlist' && <WishlistPanel />}
      </section>
    </div>
  );
}

export default function AccountContentWithSuspense() {
  return (
    <Suspense fallback={<div className="skeleton h-64 rounded-2xl" />}>
      <AccountContent />
    </Suspense>
  );
}
