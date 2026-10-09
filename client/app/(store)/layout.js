import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

/**
 * Every storefront page shares the navbar and footer.
 * The admin panel lives in its own route group with a different shell.
 */
export default function StoreLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
