export default function DashboardLoading() {
  return (
    <div className="space-y-8 p-6">
      {/* Summary cards skeleton */}
      <section>
        <div className="h-4 w-20 rounded bg-surface-tertiary animate-pulse mb-3" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-surface-secondary rounded-xl p-5 border border-line-primary space-y-2">
              <div className="h-3 w-16 rounded bg-surface-tertiary animate-pulse" />
              <div className="h-8 w-12 rounded bg-surface-tertiary animate-pulse" />
              <div className="h-3 w-10 rounded bg-surface-tertiary animate-pulse" />
            </div>
          ))}
        </div>
      </section>

      {/* Domain cards skeleton */}
      <section>
        <div className="h-4 w-24 rounded bg-surface-tertiary animate-pulse mb-3" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-surface-secondary rounded-xl p-5 border border-line-primary space-y-2">
              <div className="h-4 w-24 rounded bg-surface-tertiary animate-pulse" />
              <div className="h-7 w-14 rounded bg-surface-tertiary animate-pulse" />
              <div className="h-3 w-20 rounded bg-surface-tertiary animate-pulse" />
            </div>
          ))}
        </div>
      </section>

      {/* Recent changelog skeleton */}
      <section>
        <div className="h-4 w-28 rounded bg-surface-tertiary animate-pulse mb-3" />
        <ul className="space-y-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <li key={i} className="bg-surface-secondary rounded-xl px-5 py-4 border border-line-primary flex items-start gap-4">
              <div className="h-5 w-12 rounded-full bg-surface-tertiary animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-48 rounded bg-surface-tertiary animate-pulse" />
                <div className="h-3 w-64 rounded bg-surface-tertiary animate-pulse" />
              </div>
              <div className="h-3 w-14 rounded bg-surface-tertiary animate-pulse shrink-0" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
