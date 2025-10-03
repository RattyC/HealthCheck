import Skeleton from "@/components/Skeleton";

export default function LoadingPackageDetail() {
  return (
    <article className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-2 text-right">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <section className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      </section>
    </article>
  );
}
