'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';
import {
  BoxesIcon,
  ChartIcon,
  ClipboardIcon,
  DashboardIcon,
  LogoutIcon,
  PackageIcon,
  TagIcon,
  UsersIcon,
} from '@/components/ui/Icons';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: DashboardIcon, exact: true },
  { href: '/admin/products', label: 'Products', icon: PackageIcon },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardIcon },
  { href: '/admin/customers', label: 'Customers', icon: UsersIcon },
  { href: '/admin/categories', label: 'Categories', icon: TagIcon },
  { href: '/admin/inventory', label: 'Inventory', icon: BoxesIcon },
];

export default function AdminShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, loading, logout } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) router.replace('/login?next=/admin');
    else if (!isAdmin) router.replace('/');
  }, [loading, isAuthenticated, isAdmin, router]);

  if (loading || !isAuthenticated || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-2">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <p className="mt-3 text-sm text-ink-subtle">Checking admin access…</p>
        </div>
      </div>
    );
  }

  function handleLogout() {
    logout();
    toast.info('Signed out.');
    router.replace('/login');
  }

  return (
    <div className="min-h-screen bg-surface-2">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="border-b border-line bg-surface lg:min-h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3 px-4 py-4 lg:block lg:px-5">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-black text-white">
                B
              </span>
              <span>
                <span className="block text-sm font-bold leading-4 text-ink">BazaarHub</span>
                <span className="block text-[11px] text-ink-faint">Admin panel</span>
              </span>
            </Link>

            <div className="flex items-center gap-2 lg:hidden">
              <Link href="/" className="text-xs font-semibold text-brand-link">
                View store
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg p-2 text-ink-faint hover:bg-surface-3"
                aria-label="Sign out"
              >
                <LogoutIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-4" aria-label="Admin">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition',
                    active
                      ? 'bg-brand-soft text-brand-ink'
                      : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden border-t border-line-soft p-4 lg:block">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft-2 text-xs font-bold text-brand-ink">
                {initials(user?.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-ink">{user?.name}</p>
                <p className="truncate text-[11px] text-ink-faint">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg p-1.5 text-ink-faint transition hover:bg-surface-3 hover:text-danger-ink"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogoutIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3.5 sm:px-6">
            <p className="text-sm font-medium text-ink-subtle">Manage your store</p>
            <div className="flex items-center gap-3">
              <ChartIcon className="hidden h-4 w-4 text-ink-faint sm:block" />
              <Link href="/" className="btn-outline px-3 py-1.5 text-xs">
                View store
              </Link>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
