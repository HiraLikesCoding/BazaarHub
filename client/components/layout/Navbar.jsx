'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';
import {
  CartIcon,
  ChevronDownIcon,
  CloseIcon,
  HeartIcon,
  LogoutIcon,
  MenuIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
  UserIcon,
} from '@/components/ui/Icons';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/categories', label: 'Categories' },
  { href: '/shop?onSale=true', label: 'Deals' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, logout, loading } = useAuth();
  const { count } = useCart();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const isDark = theme === 'dark';

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');

  const menuRef = useRef(null);

  // Close menus when the route changes
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Close the account dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  function submitSearch(event) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/shop?search=${encodeURIComponent(value)}` : '/shop');
    setSearchOpen(false);
    setMobileOpen(false);
  }

  function handleLogout() {
    logout();
    setMenuOpen(false);
    toast.success('You have been logged out.');
    router.push('/');
  }

  const isActive = (href) => {
    const path = href.split('?')[0];
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="container-page flex h-16 items-center gap-3 sm:gap-4">
        {/* Mobile: hamburger */}
        <button
          type="button"
          className="-ml-1 rounded-lg p-2 text-ink-muted transition hover:bg-surface-3 lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2" aria-label="BazaarHub home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg font-black text-white shadow-sm transition group-hover:bg-brand-700">
            B
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
            Bazaar<span className="text-brand-link">Hub</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition',
                isActive(link.href)
                  ? 'bg-brand-soft text-brand-ink'
                  : 'text-ink-muted hover:bg-surface-3 hover:text-ink'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop search */}
        <form onSubmit={submitSearch} className="ml-auto hidden md:block" role="search">
          <label htmlFor="nav-search" className="sr-only">
            Search products
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              id="nav-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products..."
              className="input h-10 w-44 rounded-full pl-9 pr-3 lg:w-64"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1 md:ml-3">
          {/* Mobile search toggle */}
          <button
            type="button"
            className="rounded-lg p-2 text-ink-muted transition hover:bg-surface-3 md:hidden"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search"
            aria-expanded={searchOpen}
          >
            <SearchIcon />
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg p-2 text-ink-muted transition hover:bg-surface-3"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Wishlist */}
          <Link
            href="/wishlist"
            className="hidden rounded-lg p-2 text-ink-muted transition hover:bg-surface-3 sm:block"
            aria-label="Wishlist"
          >
            <HeartIcon />
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="relative rounded-lg p-2 text-ink-muted transition hover:bg-surface-3"
            aria-label={`Cart with ${count} item${count === 1 ? '' : 's'}`}
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>

          {/* Account */}
          {!loading && !isAuthenticated ? (
            <div className="hidden items-center gap-2 pl-2 sm:flex">
              <Link href="/login" className="btn-ghost btn-sm">
                Log in
              </Link>
              <Link href="/register" className="btn-primary btn-sm">
                Sign up
              </Link>
            </div>
          ) : (
            <div className="relative pl-1" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg p-1.5 transition hover:bg-surface-3"
                aria-label="Account menu"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft-2 text-xs font-bold text-brand-ink">
                  {initials(user?.name || 'U')}
                </span>
                <ChevronDownIcon className="hidden h-4 w-4 text-ink-subtle sm:block" />
              </button>

              {menuOpen && (
                <div
                  className="animate-fade-in absolute right-0 top-12 w-56 overflow-hidden rounded-xl border border-line bg-surface py-1.5 shadow-soft"
                  role="menu"
                >
                  <div className="border-b border-line-soft px-4 pb-2.5 pt-2">
                    <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
                    <p className="truncate text-xs text-ink-subtle">{user?.email}</p>
                  </div>
                  <Link href="/account" className="block px-4 py-2.5 text-sm text-ink-muted hover:bg-surface-2" role="menuitem">
                    My Profile
                  </Link>
                  <Link href="/account?tab=orders" className="block px-4 py-2.5 text-sm text-ink-muted hover:bg-surface-2" role="menuitem">
                    My Orders
                  </Link>
                  <Link href="/wishlist" className="block px-4 py-2.5 text-sm text-ink-muted hover:bg-surface-2" role="menuitem">
                    Wishlist
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block border-t border-line-soft px-4 py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-soft"
                      role="menuitem"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 border-t border-line-soft px-4 py-2.5 text-sm text-danger-ink hover:bg-danger-soft"
                    role="menuitem"
                  >
                    <LogoutIcon className="h-4 w-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <form onSubmit={submitSearch} className="border-t border-line-soft px-4 py-3 md:hidden" role="search">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for products, brands..."
              className="input rounded-full pl-9"
              aria-label="Search products"
            />
          </div>
        </form>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <nav
          className="animate-fade-in max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-line-soft bg-surface px-4 py-4 lg:hidden"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-xl px-3 py-3 text-base font-medium transition',
                  isActive(link.href) ? 'bg-brand-soft text-brand-ink' : 'text-ink-muted hover:bg-surface-2'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-4 border-t border-line-soft pt-4">
            <button
              type="button"
              onClick={toggleTheme}
              className="mb-3 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-2"
            >
              <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
              {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            {!loading && !isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <Link href="/register" className="btn-primary w-full">
                  Create an account
                </Link>
                <Link href="/login" className="btn-outline w-full">
                  Log in
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <Link href="/account" className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-2">
                  My Profile
                </Link>
                <Link href="/account?tab=orders" className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-2">
                  My Orders
                </Link>
                <Link href="/wishlist" className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-2">
                  Wishlist
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-soft">
                    Admin Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-danger-ink hover:bg-danger-soft"
                >
                  <LogoutIcon className="h-4 w-4" /> Log out
                </button>
              </div>
            )}
          </div>
        </nav>
      )}

    </header>
  );
}
