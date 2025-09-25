import Skeleton from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white/60 p-5 dark:border-slate-700 dark:bg-slate-900/40">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-2xl border border-slate-200 bg-white/60 p-5 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, row) => (
                <Skeleton key={row} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
