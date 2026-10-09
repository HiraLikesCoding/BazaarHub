import RegisterForm from '@/components/auth/RegisterForm';
import AuthShell from '@/components/auth/AuthShell';
import Link from 'next/link';

export const metadata = {
  title: 'Create account',
  description: 'Create a free BazaarHub account.',
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Save your wishlist, track orders and checkout in seconds."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand-link hover:text-brand-ink">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
