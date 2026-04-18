import Skeleton from '@/components/shared/Skeleton';

export default function SettingsLoading() {
  return (
    <div className="max-w-xl mx-auto px-4 pb-16 pt-8">
      <div className="flex items-center justify-between gap-3 mb-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-9 w-60 mb-10" />

      {/* 3 sections */}
      <div className="space-y-10">
        {[0, 1, 2].map((s) => (
          <section key={s} className="space-y-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </section>
        ))}
      </div>

      <div className="flex items-center justify-end rule-t pt-4 mt-6">
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}
