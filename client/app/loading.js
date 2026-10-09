import { CardSkeleton } from '@/components/ui/LoadingSpinner';

export default function Loading() {
  return (
    <div className="container-page py-10">
      <div className="skeleton mb-6 h-8 w-64" />
      <CardSkeleton count={8} />
    </div>
  );
}
