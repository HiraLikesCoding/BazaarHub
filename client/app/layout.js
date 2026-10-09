import './globals.css';
import { Providers } from '@/components/providers/Providers';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'BazaarHub - Everything You Need, All in One Place',
    template: '%s | BazaarHub',
  },
  description:
    'Shop electronics, fashion, beauty, home essentials, sports gear and books at BazaarHub. Free shipping on orders over $75 and cash on delivery.',
  keywords: [
    'BazaarHub',
    'online shopping',
    'electronics',
    'fashion',
    'beauty',
    'home and living',
    'sports',
    'books',
  ],
  authors: [{ name: 'BazaarHub' }],
  openGraph: {
    title: 'BazaarHub - Everything You Need, All in One Place',
    description: 'A modern online marketplace for everyday essentials.',
    siteName: 'BazaarHub',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
};

// Applies the saved theme before first paint so the page never flashes
// the wrong colours while React hydrates (see ThemeProvider).
const THEME_SCRIPT = `(function(){try{var k='bazaarhub-theme';var s=null;try{s=localStorage.getItem(k);}catch(e){}var t=(s==='light'||s==='dark')?s:((window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');var r=document.documentElement;r.classList.toggle('dark',t==='dark');r.style.colorScheme=t;}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
