export default function LoadingPackageDetail() {
  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="h-7 w-72 animate-pulse rounded bg-gray-200" />
        <div className="h-7 w-24 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded border bg-gray-50" />
        ))}
      </div>
    </section>
  );
}

