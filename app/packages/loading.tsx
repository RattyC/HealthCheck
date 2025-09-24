export default function LoadingPackages() {
  return (
    <section className="space-y-4">
      <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
              <div className="ml-auto h-5 w-20 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="mt-3 h-5 w-24 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </section>
  );
}

