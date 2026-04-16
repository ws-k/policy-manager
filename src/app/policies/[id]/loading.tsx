export default function PolicyDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Back link skeleton */}
      <div className="h-3 w-20 rounded bg-surface-tertiary animate-pulse mb-6" />

      <div className="flex gap-8 mt-6">
        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-6 w-64 rounded bg-surface-tertiary animate-pulse" />
                <div className="h-5 w-14 rounded-full bg-surface-tertiary animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-20 rounded bg-surface-tertiary animate-pulse" />
                <div className="h-3 w-8 rounded bg-surface-tertiary animate-pulse" />
                <div className="h-3 w-16 rounded bg-surface-tertiary animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-20 rounded-md bg-surface-tertiary animate-pulse" />
              <div className="h-7 w-20 rounded-md bg-surface-tertiary animate-pulse" />
              <div className="h-7 w-16 rounded-md bg-surface-tertiary animate-pulse" />
            </div>
          </div>

          {/* Content body skeleton */}
          <div className="rounded-lg border border-line-primary bg-surface-primary p-6 space-y-3">
            <div className="h-4 w-10 rounded bg-surface-tertiary animate-pulse mb-4" />
            {[100, 90, 95, 70, 85, 88, 60, 92, 78, 65].map((w, i) => (
              <div
                key={i}
                className="h-3 rounded bg-surface-tertiary animate-pulse"
                style={{ width: `${w}%` }}
              />
            ))}
            <div className="pt-2" />
            {[80, 75, 88, 50].map((w, i) => (
              <div
                key={i + 10}
                className="h-3 rounded bg-surface-tertiary animate-pulse"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>

        {/* Right sidebar skeleton */}
        <div className="w-52 shrink-0 space-y-4">
          <div className="rounded-lg border border-line-primary bg-surface-primary p-4 space-y-2">
            <div className="h-3 w-16 rounded bg-surface-tertiary animate-pulse" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-7 w-full rounded-md bg-surface-tertiary animate-pulse" />
            ))}
          </div>
          <div className="rounded-lg border border-line-primary bg-surface-primary p-4 space-y-2">
            <div className="h-3 w-12 rounded bg-surface-tertiary animate-pulse" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-3 rounded bg-surface-tertiary animate-pulse" style={{ width: `${[80, 65, 70, 55][i]}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
