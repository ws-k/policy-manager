type Status = 'draft' | 'published'

const config: Record<Status, { label: string; bg: string; text: string; dot: string }> = {
  draft:     { label: '초안',   bg: 'bg-yellow-50',  text: 'text-yellow-800', dot: 'bg-yellow-400' },
  published: { label: '게시됨', bg: 'bg-green-50',   text: 'text-green-700',  dot: 'bg-green-500'  },
}

export function StatusBadge({ status }: { status: Status }) {
  const c = config[status] ?? config.draft
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}
