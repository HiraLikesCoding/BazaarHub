'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/useToast';
import { placeOrder } from '@/services/orders';
import { formatPrice } from '@/lib/format';
import EmptyState from '@/components/ui/EmptyState';
import ProductImage from '@/components/product/ProductImage';
import { CheckCircleIcon } from '@/components/ui/Icons';

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  province: '',
  postalCode: '',
  country: 'United States',
  note: '',
  paymentMethod: 'cod',
};

const PAYMENT_OPTIONS = [
  { value: 'cod', label: 'Cash on Delivery', hint: 'Pay when your order arrives' },
  { value: 'card', label: 'Card (demo)', hint: 'No real charge - demo mode' },
];

export default function CheckoutContent() {
  const router = useRouter();
  const { items, hydrated, subtotal, shipping, total, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Prefill from the account details
  useEffect(() => {
    if (user) {
      setForm((current) => ({
        ...current,
        fullName: current.fullName || user.name || '',
        email: current.email || user.email || '',
      }));
    }
  }, [user]);

  const set = (field) => (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address';
    if (form.phone.trim().length < 6) next.phone = 'Phone number is required';
    if (!form.address.trim()) next.address = 'Street address is required';
    if (!form.city.trim()) next.city = 'City is required';
    if (!form.province.trim()) next.province = 'Province / state is required';
    if (!form.postalCode.trim()) next.postalCode = 'Postal code is required';
    if (!form.country.trim()) next.country = 'Country is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');

    if (!isAuthenticated) {
      toast.info('Please log in to place your order.');
      router.push('/login?next=/checkout');
      return;
    }
    if (!validate()) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    if (items.length === 0) return;

    setSubmitting(true);
    try {
      const order = await placeOrder({
        items: items.map((item) => ({ product: item.id, quantity: item.quantity })),
        shippingAddress: {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          province: form.province.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim(),
        },
        paymentMethod: form.paymentMethod,
        note: form.note.trim(),
      });
      clearCart();
      toast.success('Order placed successfully!');
      router.push(`/order-confirmation/${order._id}`);
    } catch (err) {
      setSubmitError(err.message || 'Could not place the order. Please try again.');
      toast.error('Could not place the order.');
    } finally {
      setSubmitting(false);
    }
  }

  const field = (name) => ({
    value: form[name],
    onChange: set(name),
    error: errors[name],
  });

  if (hydrated && items.length === 0) {
    return (
      <EmptyState
        icon="🧾"
        title="Your cart is empty"
        description="Add some products before heading to checkout."
        actionLabel="Browse the shop"
        actionHref="/shop"
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <form id="checkout-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        {!isAuthenticated && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warn-ink/30 bg-warn-soft px-4 py-3 text-sm">
            <p className="text-warn-ink">
              You are checking out as a guest - logging in keeps your order history.
            </p>
            <Link href="/login?next=/checkout" className="font-semibold text-warn-ink underline">
              Log in
            </Link>
          </div>
        )}

        {/* Contact */}
        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-ink">1. Contact information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" id="fullName" error={errors.fullName}>
              <input id="fullName" className="input" placeholder="Jane Doe" autoComplete="name" {...field('fullName')} />
            </Field>
            <Field label="Email address" id="email" error={errors.email}>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="jane@example.com"
                autoComplete="email"
                {...field('email')}
              />
            </Field>
          </div>
        </section>

        {/* Shipping */}
        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-ink">2. Shipping address</h2>
          <div className="grid gap-4">
            <Field label="Phone number" id="phone" error={errors.phone}>
              <input
                id="phone"
                type="tel"
                className="input"
                placeholder="+1 555 000 1234"
                autoComplete="tel"
                {...field('phone')}
              />
            </Field>
            <Field label="Street address" id="address" error={errors.address}>
              <input
                id="address"
                className="input"
                placeholder="221B Market Street, Apt 4"
                autoComplete="street-address"
                {...field('address')}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" id="city" error={errors.city}>
                <input id="city" className="input" autoComplete="address-level2" {...field('city')} />
              </Field>
              <Field label="Province / State" id="province" error={errors.province}>
                <input id="province" className="input" autoComplete="address-level1" {...field('province')} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Postal code" id="postalCode" error={errors.postalCode}>
                <input id="postalCode" className="input" autoComplete="postal-code" {...field('postalCode')} />
              </Field>
              <Field label="Country" id="country" error={errors.country}>
                <input id="country" className="input" autoComplete="country-name" {...field('country')} />
              </Field>
            </div>
            <div>
              <label htmlFor="note" className="label">
                Order notes <span className="font-normal text-ink-faint">(optional)</span>
              </label>
              <textarea
                id="note"
                rows={3}
                className="input resize-y"
                placeholder="Delivery instructions, gate code, etc."
                {...field('note')}
              />
            </div>
          </div>
        </section>

        {/* Payment */}
        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-ink">3. Payment method</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PAYMENT_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  form.paymentMethod === option.value
                    ? 'border-brand-600 bg-brand-soft ring-1 ring-brand-600'
                    : 'border-line hover:border-brand-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.value}
                  checked={form.paymentMethod === option.value}
                  onChange={set('paymentMethod')}
                  className="mt-1 h-4 w-4 accent-brand-600"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">{option.label}</span>
                  <span className="block text-xs text-ink-subtle">{option.hint}</span>
                </span>
              </label>
            ))}
          </div>

          {submitError && (
            <p className="mt-4 rounded-lg bg-danger-soft px-4 py-3 text-sm font-medium text-danger-ink" role="alert">
              {submitError}
            </p>
          )}
        </section>
      </form>

      {/* Summary */}
      <aside>
        <div className="sticky top-24 space-y-4 rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-base font-semibold text-ink">Order Summary</h2>

          <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-line-soft bg-surface-2">
                  <ProductImage src={item.image} alt={item.name} fill sizes="48px" />
                  <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-bl-md bg-brand-600 px-1 text-[11px] font-bold text-white">
                    {item.quantity}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-sm font-medium text-ink">{item.name}</span>
                </span>
                <span className="text-sm font-semibold text-ink">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-subtle">Subtotal</dt>
              <dd className="font-medium text-ink">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-subtle">Shipping</dt>
              <dd className={shipping === 0 ? 'font-medium text-ok-ink' : 'font-medium text-ink'}>
                {shipping === 0 ? 'Free' : formatPrice(shipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2.5 text-base">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="font-bold text-ink">{formatPrice(total)}</dd>
            </div>
          </dl>

          <button
            type="submit"
            form="checkout-form"
            disabled={submitting || !hydrated || items.length === 0}
            className="btn-lg w-full bg-brand-600 text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-700 hover:shadow-brand-600/40 active:scale-[0.99] disabled:opacity-60 disabled:shadow-none"
          >
            {submitting ? 'Placing order…' : 'Place Order'}
          </button>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-ink-faint">
            <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
            Secure checkout · 30-day returns
          </p>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, id, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-danger-ink" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
