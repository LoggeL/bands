import Skeleton, { UserCardSkeleton } from '@/components/shared/Skeleton';

export default function ExploreLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 pb-16">
      <div className="py-5 mb-4 flex items-baseline justify-between flex-wrap gap-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <UserCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
