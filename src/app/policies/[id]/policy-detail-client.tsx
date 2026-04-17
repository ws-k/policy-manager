'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { PolicyDoc, Changelog, PolicySection } from '@/lib/types'
import { PolicyTOC } from '@/components/policy/PolicyTOC'
import { toast } from 'sonner'

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === 'published'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-surface-tertiary text-content-secondary border-line-primary'

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}>
      {status === 'published' ? '게시됨' : '초안'}
    </span>
  )
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const changeTypeLabels: Record<string, string> = {
  create: '생성',
  update: '수정',
  publish: '게시',
  unpublish: '게시 취소',
}

const changeTypeColors: Record<string, string> = {
  create: 'bg-blue-500',
  update: 'bg-amber-500',
  publish: 'bg-emerald-500',
  unpublish: 'bg-surface-tertiary',
}

const PAGE_SIZE = 5

function VersionsPanel({ policyId, currentVersion }: { policyId: string; currentVersion: number }) {
  const [versions, setVersions] = useState<Pick<PolicyDoc, 'id' | 'version' | 'status' | 'published_at'>[]>([])
  const [page, setPage] = useState(0)

  useEffect(() => {
    fetch(`/api/policies/${policyId}/versions`)
      .then((r) => r.json())
      .then((result: { data: PolicyDoc[] } | { error: string }) => {
        if ('data' in result) {
          setVersions(result.data)
          // Start on the page that contains the current version
          const idx = result.data.findIndex((v) => v.id === policyId)
          if (idx >= 0) setPage(Math.floor(idx / PAGE_SIZE))
        }
      })
  }, [policyId])

  if (versions.length === 0) return null

  const totalPages = Math.ceil(versions.length / PAGE_SIZE)
  const pageVersions = versions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="rounded-lg border border-line-primary bg-surface-primary p-4">
      <h2 className="mb-3 text-xs font-medium text-content-primary">버전 이력</h2>
      <ul className="space-y-1">
        {pageVersions.map((v) => (
          <li key={v.id}>
            {v.id === policyId ? (
              <div className="flex items-center justify-between rounded-md bg-surface-secondary px-2.5 py-1.5">
                <span className="text-xs font-medium text-content-primary">v{v.version}</span>
                <span className="text-xs text-content-tertiary">현재</span>
              </div>
            ) : (
              <a
                href={`/policies/${v.id}`}
                className="flex items-center justify-between rounded-md px-2.5 py-1.5 hover:bg-surface-secondary transition-colors"
              >
                <span className="text-xs text-content-secondary">v{v.version}</span>
                <span className={`text-xs ${v.status === 'published' ? 'text-emerald-600' : 'text-content-tertiary'}`}>
                  {v.status === 'published' ? '게시됨' : '초안'}
                </span>
              </a>
            )}
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between border-t border-line-primary pt-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded px-2 py-1 text-xs text-content-secondary hover:bg-surface-secondary disabled:opacity-30"
          >
            ←
          </button>
          <span className="text-xs text-content-tertiary tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="rounded px-2 py-1 text-xs text-content-secondary hover:bg-surface-secondary disabled:opacity-30"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}

function SectionsPanel({ policyId }: { policyId: string }) {
  const [sections, setSections] = useState<PolicySection[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchSections = useCallback(async () => {
    const res = await fetch(`/api/policies/${policyId}/sections`)
    const result = await res.json() as { data: PolicySection[] } | { error: string }
    if ('data' in result) setSections(result.data)
  }, [policyId])

  useEffect(() => {
    fetchSections()
  }, [fetchSections])

  async function handleAdd() {
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`/api/policies/${policyId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      if (res.ok) {
        setNewTitle('')
        await fetchSections()
      }
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(sectionId: string) {
    const res = await fetch(`/api/sections/${sectionId}`, { method: 'DELETE' })
    if (res.ok) {
      await fetchSections()
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-line-primary bg-surface-primary p-6">
      <h2 className="mb-4 text-sm font-medium text-content-primary">섹션 관리</h2>
      {sections.length === 0 ? (
        <p className="mb-4 text-sm text-content-tertiary">등록된 섹션이 없습니다.</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {sections.map((section) => (
            <li
              key={section.id}
              className="flex items-center justify-between rounded-md bg-surface-secondary px-3 py-2"
            >
              <span className="text-sm text-content-primary">{section.title}</span>
              <button
                onClick={() => handleDelete(section.id)}
                className="text-xs text-content-tertiary hover:text-red-500"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          placeholder="섹션 제목 입력"
          className="flex-1 rounded-md border border-line-primary bg-surface-primary px-3 py-1.5 text-sm text-content-primary outline-none focus:border-line-secondary"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newTitle.trim()}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-text disabled:opacity-50"
        >
          섹션 추가
        </button>
      </div>
    </div>
  )
}

type LinkedFeature = {
  id: string
  feature: { id: string; name: string; slug: string; screen_path: string | null }
  section: { id: string; title: string }
}

function LinkedFeaturesPanel({ policyId }: { policyId: string }) {
  const [items, setItems] = useState<LinkedFeature[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/policies/${policyId}/features`)
      .then((r) => r.json())
      .then((result: { data: LinkedFeature[] } | { error: string }) => {
        if ('data' in result) setItems(result.data)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [policyId])

  if (!loaded || items.length === 0) return null

  return (
    <div className="rounded-lg border border-line-primary bg-surface-primary p-4">
      <h2 className="mb-3 text-xs font-medium text-content-primary">연결된 기능</h2>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/features#${item.feature.slug}`}
              className="block rounded-md px-2.5 py-1.5 transition-colors hover:bg-surface-secondary"
            >
              <span className="block text-xs font-medium text-content-primary">{item.feature.name}</span>
              <span className="block text-xs text-content-tertiary">· {item.section.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ExportDropdown({ policyId, title }: { policyId: string; title: string }) {
  const [open, setOpen] = useState(false)

  const download = (format: string) => {
    window.location.href = `/api/policies/${policyId}/export?format=${format}`
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-line-primary bg-surface-primary px-3 py-1.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-tertiary"
      >
        내보내기 ▾
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-1 w-36 overflow-hidden rounded-md border border-line-primary bg-surface-primary shadow-md">
            <button onClick={() => download('markdown')} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-content-primary hover:bg-surface-secondary">
              <span>📄</span> Markdown
            </button>
            <button onClick={() => download('html')} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-content-primary hover:bg-surface-secondary">
              <span>🌐</span> HTML
            </button>
            <button onClick={() => download('docx')} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-content-primary hover:bg-surface-secondary">
              <span>📝</span> Word (DOCX)
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function PolicyDetailClient({
  policy,
  changelogs,
  contentHtml,
}: {
  policy: PolicyDoc
  changelogs: Changelog[]
  contentHtml: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isPublic, setIsPublic] = useState(policy.is_public)
  const [togglingPublic, setTogglingPublic] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleTogglePublic() {
    setTogglingPublic(true)
    try {
      const res = await fetch(`/api/policies/${policy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: !isPublic }),
      })
      if (res.ok) {
        setIsPublic((prev) => !prev)
      }
    } finally {
      setTogglingPublic(false)
    }
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/public-view/${policy.id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleAction(action: 'publish' | 'unpublish' | 'new-version' | 'delete') {
    setLoading(true)
    try {
      if (action === 'delete') {
        if (!confirm('정말 삭제하시겠습니까?')) {
          setLoading(false)
          return
        }
        const res = await fetch(`/api/policies/${policy.id}`, { method: 'DELETE' })
        const result = await res.json()
        if ('error' in result) {
          toast.error(result.error)
          return
        }
        router.push('/policies')
        return
      }

      const res = await fetch(`/api/policies/${policy.id}/${action}`, { method: 'POST' })
      const result = await res.json()
      if ('error' in result) {
        alert(result.error)
        return
      }

      if (action === 'new-version' && result.data) {
        router.push(`/policies/${result.data.id}`)
      } else {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Back link */}
      <Link
        href="/policies"
        className="mb-4 inline-flex items-center gap-1 text-xs text-content-secondary hover:text-content-primary transition-colors"
      >
        ← 목록으로
      </Link>

      <div className="flex gap-8 mt-6">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-content-primary">{policy.title}</h1>
                <StatusBadge status={policy.status} />
              </div>
              <div className="flex items-center gap-3 text-xs text-content-secondary">
                <span>{policy.domain?.name ?? '-'}</span>
                <span className="text-line-primary">|</span>
                <span className="tabular-nums">v{policy.version}</span>
                {policy.published_at && (
                  <>
                    <span className="text-line-primary">|</span>
                    <span>게시일: {formatDateTime(policy.published_at)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <ExportDropdown policyId={policy.id} title={policy.title} />
              <Link
                href={`/policies/${policy.id}/compare`}
                className="rounded-md border border-line-primary bg-surface-primary px-3 py-1.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-tertiary"
              >
                버전 비교
              </Link>
              {policy.status === 'draft' && (
                <>
                  <Link
                    href={`/policies/${policy.id}/edit`}
                    className="rounded-md border border-line-primary bg-surface-primary px-3 py-1.5 text-xs font-medium text-content-primary transition-colors hover:bg-surface-tertiary"
                  >
                    편집
                  </Link>
                  <button
                    onClick={() => handleAction('publish')}
                    disabled={loading}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    게시
                  </button>
                  <button
                    onClick={() => handleAction('delete')}
                    disabled={loading}
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                  >
                    삭제
                  </button>
                </>
              )}
              {policy.status === 'published' && (
                <>
                  <button
                    onClick={handleTogglePublic}
                    disabled={togglingPublic}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                      isPublic
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'border-line-primary bg-surface-primary text-content-secondary hover:bg-surface-tertiary'
                    }`}
                  >
                    {isPublic ? '공개중' : '비공개'}
                  </button>
                  {isPublic && (
                    <button
                      onClick={handleCopyLink}
                      className="rounded-md border border-line-primary bg-surface-primary px-3 py-1.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-tertiary"
                    >
                      {copied ? '복사됨!' : '링크 복사'}
                    </button>
                  )}
                  <button
                    onClick={() => handleAction('new-version')}
                    disabled={loading}
                    className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-text transition-colors hover:opacity-90 disabled:opacity-50"
                  >
                    새 버전 생성
                  </button>
                  <button
                    onClick={() => handleAction('unpublish')}
                    disabled={loading}
                    className="rounded-md border border-line-primary bg-surface-primary px-3 py-1.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-tertiary disabled:opacity-50"
                  >
                    게시 취소
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="mb-8 rounded-lg border border-line-primary bg-surface-primary p-6">
            <h2 className="mb-3 text-sm font-medium text-content-primary">내용</h2>
            {contentHtml ? (
              <div
                className="prose prose-sm max-w-none text-sm text-content-primary"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            ) : (
              <p className="text-sm text-content-tertiary">내용이 없습니다.</p>
            )}
          </div>

          {/* Sections */}
          <SectionsPanel policyId={policy.id} />

          {/* Changelog */}
          <div className="mt-6 rounded-lg border border-line-primary bg-surface-primary p-6">
            <h2 className="mb-4 text-sm font-medium text-content-primary">변경 이력</h2>
            {changelogs.length === 0 ? (
              <p className="text-sm text-content-tertiary">변경 이력이 없습니다.</p>
            ) : (
              <div className="space-y-0">
                {changelogs.map((log, i) => (
                  <div key={log.id} className="relative flex gap-3 pb-6 last:pb-0">
                    {/* Timeline line */}
                    {i < changelogs.length - 1 && (
                      <div className="absolute left-[7px] top-4 bottom-0 w-px bg-line-primary" />
                    )}
                    {/* Dot */}
                    <div className={`mt-1 h-[15px] w-[15px] flex-shrink-0 rounded-full border-2 border-surface-primary ${changeTypeColors[log.change_type] ?? 'bg-surface-tertiary'}`} />
                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-content-primary">
                          {changeTypeLabels[log.change_type] ?? log.change_type}
                        </span>
                        <span className="tabular-nums text-xs text-content-tertiary">
                          v{log.version}
                        </span>
                        {log.version > 1 && (
                          <Link
                            href={`/policies/${policy.id}/compare?right=${log.policy_doc_id}`}
                            className="text-xs text-content-tertiary underline underline-offset-2 hover:text-content-primary"
                          >
                            비교
                          </Link>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-content-secondary">{log.summary}</p>
                      {log.detail && (
                        <p className="mt-1 text-xs text-content-tertiary">{log.detail}</p>
                      )}
                      <p className="mt-1 tabular-nums text-xs text-content-tertiary">
                        {formatDateTime(log.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-52 shrink-0 space-y-4">
          <LinkedFeaturesPanel policyId={policy.id} />
          <VersionsPanel policyId={policy.id} currentVersion={policy.version} />
          <PolicyTOC content={policy.content} />
        </div>
      </div>
    </div>
  )
}
