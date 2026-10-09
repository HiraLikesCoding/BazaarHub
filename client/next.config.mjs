/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Images live in /public, so no remote image hosts need to be allowed.
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  // Helpful when the API runs on a different origin during development
  env: {
    NEXT_PUBLIC_APP_NAME: 'BazaarHub',
  },
};

export default nextConfig;
