/** Tiny className joiner (keeps JSX readable without extra dependencies). */
export function cn(...values) {
  return values.filter(Boolean).join(' ');
}
