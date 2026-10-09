/** Formatting helpers shared across the whole app. */

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatPrice(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return '$0.00';
  return currency.format(num);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value) || 0);
}

export function formatDate(value, options = { dateStyle: 'medium' }) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', options);
}

export function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export function discountPercent(price, discountPrice) {
  const p = Number(price);
  const d = Number(discountPrice);
  if (!p || !d || d <= 0 || d >= p) return 0;
  return Math.round(((p - d) / p) * 100);
}

export function stockStatus(stock) {
  const s = Number(stock) || 0;
  if (s <= 0) return 'Out of Stock';
  if (s <= 10) return 'Low Stock';
  return 'In Stock';
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural || `${singular}s`}`;
}
