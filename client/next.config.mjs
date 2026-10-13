/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Product and category images live in /public; images.unsplash.com is the
  // documented fallback for seed rows whose local files are missing.
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  // NEXT_PUBLIC_* values are read at build time; when they are missing the
  // data layers throw and every server page falls back to its empty state.
  env: {
    NEXT_PUBLIC_APP_NAME: 'BazaarHub',
  },
};

export default nextConfig;
