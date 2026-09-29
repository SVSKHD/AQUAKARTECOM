const ShimmerBlock = ({ className = "" }) => (
  <div className={`aqua-shimmer-block ${className}`} aria-hidden="true" />
);

export const AquaCardSkeleton = ({
  variant = "product",
  className = "",
}) => {
  if (variant === "hero") {
    return (
      <div
        className={`aqua-skeleton-card aqua-skeleton-hero grid gap-8 lg:grid-cols-2 ${className}`}
        aria-hidden="true"
      >
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-sm">
          <ShimmerBlock className="h-6 w-28 rounded-full" />
          <ShimmerBlock className="mt-6 h-10 w-4/5 rounded-2xl" />
          <ShimmerBlock className="mt-4 h-4 w-full rounded-full" />
          <ShimmerBlock className="mt-3 h-4 w-11/12 rounded-full" />
          <ShimmerBlock className="mt-3 h-4 w-3/4 rounded-full" />
          <div className="mt-8 flex gap-3">
            <ShimmerBlock className="h-12 w-36 rounded-full" />
            <ShimmerBlock className="h-12 w-32 rounded-full" />
          </div>
        </div>
        <ShimmerBlock className="min-h-[320px] rounded-[2rem]" />
      </div>
    );
  }

  if (variant === "article") {
    return (
      <article
        className={`aqua-skeleton-card overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm ${className}`}
        aria-hidden="true"
      >
        <ShimmerBlock className="h-52 w-full rounded-none" />
        <div className="p-5">
          <div className="flex gap-2">
            <ShimmerBlock className="h-3 w-20 rounded-full" />
            <ShimmerBlock className="h-3 w-16 rounded-full" />
          </div>
          <ShimmerBlock className="mt-5 h-6 w-4/5 rounded-xl" />
          <ShimmerBlock className="mt-4 h-3 w-full rounded-full" />
          <ShimmerBlock className="mt-2 h-3 w-11/12 rounded-full" />
          <ShimmerBlock className="mt-6 h-4 w-24 rounded-full" />
        </div>
      </article>
    );
  }

  if (variant === "category") {
    return (
      <div
        className={`aqua-skeleton-card overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-2 shadow-sm ${className}`}
        aria-hidden="true"
      >
        <ShimmerBlock className="h-60 w-full rounded-[1.35rem]" />
        <div className="p-3">
          <ShimmerBlock className="h-3 w-28 rounded-full" />
          <ShimmerBlock className="mt-3 h-6 w-4/5 rounded-xl" />
          <ShimmerBlock className="mt-3 h-4 w-1/2 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`aqua-skeleton-card flex min-h-[430px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm ${className}`}
      aria-hidden="true"
    >
      <div className="relative h-52 shrink-0 p-3">
        <ShimmerBlock className="h-full w-full rounded-[1.35rem]" />
        <ShimmerBlock className="absolute left-6 top-6 h-8 w-8 rounded-full" />
        <ShimmerBlock className="absolute right-6 top-6 h-8 w-8 rounded-full" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <ShimmerBlock className="h-3 w-24 rounded-full" />
        <ShimmerBlock className="mt-4 h-6 w-5/6 rounded-xl" />
        <ShimmerBlock className="mt-2 h-6 w-3/5 rounded-xl" />
        <div className="mt-5 flex items-end gap-3">
          <ShimmerBlock className="h-7 w-28 rounded-xl" />
          <ShimmerBlock className="h-4 w-16 rounded-full" />
        </div>
        <div className="mt-auto flex items-center justify-between pt-6">
          <ShimmerBlock className="h-4 w-32 rounded-full" />
          <ShimmerBlock className="h-8 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const AquaSkeletonGrid = ({
  count = 8,
  variant = "product",
  viewMode = "grid",
  className = "",
}) => {
  const gridClass =
    viewMode === "list"
      ? "mx-auto flex max-w-6xl flex-col gap-5"
      : variant === "category"
        ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        : "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 2xl:grid-cols-4";

  return (
    <div
      className={`${gridClass} ${className}`}
      aria-label="Loading content"
      role="status"
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, index) => (
        <AquaCardSkeleton
          key={`${variant}-skeleton-${index}`}
          variant={variant}
          className={viewMode === "list" ? "min-h-[220px]" : ""}
        />
      ))}
      <span className="sr-only">Loading Aquakart content…</span>
    </div>
  );
};

export default AquaCardSkeleton;
