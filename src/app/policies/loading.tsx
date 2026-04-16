export default function PoliciesLoading() {
  return (
    <div className="space-y-4 p-6">
      {/* Search bar skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-9 flex-1 rounded-lg bg-surface-tertiary animate-pulse" />
        <div className="h-9 w-24 rounded-lg bg-surface-tertiary animate-pulse" />
        <div className="h-9 w-24 rounded-lg bg-surface-tertiary animate-pulse" />
      </div>

      {/* List items skeleton */}
      <ul className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="rounded-xl border border-line-primary bg-surface-secondary px-5 py-4 flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-56 rounded bg-surface-tertiary animate-pulse" />
              <div className="h-3 w-32 rounded bg-surface-tertiary animate-pulse" />
            </div>
            <div className="h-5 w-14 rounded-full bg-surface-tertiary animate-pulse shrink-0" />
            <div className="h-3 w-20 rounded bg-surface-tertiary animate-pulse shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  )
}
