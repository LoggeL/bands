import Skeleton, { DiaryCardSkeleton } from '@/components/shared/Skeleton';

export default function ProfileLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 pb-16">
      {/* Profile header skeleton */}
      <header className="rule-2 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 py-5">
          <div className="flex items-center gap-4 min-w-0">
            <Skeleton className="w-16 h-16 sm:w-20 sm:h-20" />
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-9 w-48 max-w-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-9 w-28 shrink-0" variant="pill" />
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 -mb-px pt-1 pb-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-5 w-20" />
          ))}
        </nav>
      </header>

      {/* Content skeleton */}
      <div className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <DiaryCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
