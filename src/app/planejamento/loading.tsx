export default function PlanejamentoLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Availability skeleton */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-12 animate-pulse rounded bg-muted" />
              <div className="h-9 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Weekly view skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card shadow-sm">
            <div className="border-b px-4 py-3">
              <div className="h-4 w-10 animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-2 p-3">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
