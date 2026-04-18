type Variant = 'block' | 'circle' | 'pill';

export default function Skeleton({
  className = '',
  variant = 'block',
  style,
}: {
  className?: string;
  variant?: Variant;
  style?: React.CSSProperties;
}) {
  const variantClass =
    variant === 'circle' ? 'skeleton-circle' : variant === 'pill' ? 'skeleton-pill' : '';
  return (
    <div
      aria-hidden
      className={`skeleton ${variantClass} ${className}`.trim()}
      style={style}
    />
  );
}

/** Pre-composed diary / feed card skeleton. */
export function DiaryCardSkeleton() {
  return (
    <article className="block p-2.5">
      <div className="flex items-center gap-1.5 pb-1 mb-1.5 rule">
        <Skeleton className="w-[18px] h-[18px]" variant="circle" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex gap-2.5">
        <Skeleton className="w-11 h-11" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="w-8 h-8" variant="circle" />
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" variant="pill" />
            <Skeleton className="h-3 w-20" variant="pill" />
          </div>
        </div>
      </div>
    </article>
  );
}

/** Profile/user card skeleton for the Explore grid. */
export function UserCardSkeleton() {
  return (
    <div className="block p-4">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-11 h-11" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-5/6 mb-3" />
      <div className="grid grid-cols-3 gap-2 rule-t pt-3">
        <div className="space-y-1">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-2 w-12" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-2 w-12" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-2 w-12" />
        </div>
      </div>
    </div>
  );
}
