/** Shared constants for the storefront and the admin panel. */

export const FREE_SHIPPING_OVER = 75;
export const SHIPPING_FLAT = 6.99;

export const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

export const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', description: 'Pay when your order arrives at your door.' },
  { id: 'card', label: 'Credit / Debit Card', description: 'Online payments coming soon.', disabled: true },
  { id: 'wallet', label: 'Digital Wallet', description: 'Online payments coming soon.', disabled: true },
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest arrivals' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'popular', label: 'Most popular' },
];

export const ORDER_STATUS_STYLES = {
  Pending: 'badge-warning',
  Confirmed: 'badge-brand',
  Processing: 'badge-brand',
  Shipped: 'badge-brand',
  Delivered: 'badge-success',
  Cancelled: 'badge-danger',
};

export const STOCK_STATUS_STYLES = {
  'In Stock': 'badge-success',
  'Low Stock': 'badge-warning',
  'Out of Stock': 'badge-danger',
};
