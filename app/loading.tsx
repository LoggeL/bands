import Skeleton, { DiaryCardSkeleton } from '@/components/shared/Skeleton';

export default function FeedLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 pb-24 md:pl-20">
      <section className="pt-8">
        {/* FeedHeader skeleton */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-10 w-80 max-w-full" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>

        {/* Volume strip */}
        <Skeleton className="mt-6 h-10 w-full" />

        {/* Day blocks */}
        <div className="space-y-10 mt-8">
          {[0, 1].map((d) => (
            <section key={d}>
              <header className="flex items-baseline gap-3 pb-2 rule">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-16" />
              </header>
              <ol className="setlist mt-4 space-y-4">
                {[0, 1, 2].map((i) => (
                  <li key={i}>
                    <DiaryCardSkeleton />
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
