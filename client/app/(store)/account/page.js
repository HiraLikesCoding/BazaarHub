import AccountContent from '@/components/account/AccountContent';

export const metadata = {
  title: 'My Account',
  description: 'Manage your profile, orders and wishlist.',
};

export default function AccountPage() {
  return (
    <div className="container-page py-8 sm:py-10">
      <AccountContent />
    </div>
  );
}
