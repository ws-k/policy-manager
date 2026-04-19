'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import type { PolicyDoc, Changelog, PolicySection } from '@/lib/types'
import { PolicyTOC } from '@/components/policy/PolicyTOC'
import { StatusBadge } from '@/components/policy/StatusBadge'
import { toast } from 'sonner'

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
            className="cursor-pointer rounded px-2 py-1 text-xs text-content-secondary hover:bg-surface-secondary disabled:opacity-30"
          >
            ←
          </button>
          <span className="text-xs text-content-tertiary tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="cursor-pointer rounded px-2 py-1 text-xs text-content-secondary hover:bg-surface-secondary disabled:opacity-30"
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
                className="cursor-pointer text-xs text-content-tertiary hover:text-red-500"
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
          className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-text disabled:opacity-50"
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
  is_broken?: boolean
}

function LinkedFeaturesPanel({ policyId }: { policyId: string }) {
  const [items, setItems] = useState<LinkedFeature[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)

  const fetchItems = useCallback(() => {
    fetch(`/api/policies/${policyId}/features`)
      .then((r) => r.json())
      .then((result: { data: LinkedFeature[] } | { error: string }) => {
        if ('data' in result) setItems(result.data)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [policyId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleUnlink = async (featureId: string, sectionId: string) => {
    await fetch(`/api/feature-policies?feature_id=${featureId}&section_id=${sectionId}`, {
      method: 'DELETE',
    })
    fetchItems()
  }

  const handleUnlinkBroken = async (fpId: string) => {
    await fetch(`/api/feature-policies?id=${fpId}`, { method: 'DELETE' })
    fetchItems()
  }

  return (
    <div className="rounded-lg border border-line-primary bg-surface-primary p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-medium text-content-primary">연결된 기능</h2>
        <button
          onClick={() => setShowLinkModal(true)}
          className="cursor-pointer flex items-center gap-1 rounded-md border border-accent px-2 py-1 text-xs font-medium text-accent hover:bg-accent-subtle transition-colors"
        >
          연결하기
        </button>
      </div>
      {!loaded ? (
        <div className="space-y-1">
          {[1, 2].map((i) => (
            <div key={i} className="h-9 animate-pulse rounded-md bg-surface-secondary" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-content-tertiary">연결된 기능이 없습니다</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) =>
            item.is_broken ? (
              <li key={item.id} className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-amber-500">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-medium text-amber-700 truncate">{item.feature.name}</span>
                  <span className="block text-xs text-amber-600">섹션 삭제됨: {item.section.title}</span>
                </div>
                <button onClick={() => handleUnlinkBroken(item.id)} className="cursor-pointer text-xs text-amber-600 hover:text-red-600">✕</button>
              </li>
            ) : (
              <li key={item.id} className="flex items-center">
                <Link
                  href={`/features#${item.feature.slug}`}
                  className="flex-1 rounded-md px-2.5 py-1.5 transition-colors hover:bg-surface-secondary"
                >
                  <span className="block text-xs font-medium text-content-primary">{item.feature.name}</span>
                  <span className="block text-xs text-content-tertiary">· {item.section.title}</span>
                </Link>
                <button
                  onClick={() => handleUnlink(item.feature.id, item.section.id)}
                  className="cursor-pointer rounded px-1.5 py-1 text-xs text-content-tertiary hover:text-content-primary"
                >
                  ✕
                </button>
              </li>
            )
          )}
        </ul>
      )}
      {showLinkModal && (
        <LinkFeatureModal
          policyId={policyId}
          onClose={() => setShowLinkModal(false)}
          onSuccess={() => {
            setShowLinkModal(false)
            fetchItems()
          }}
        />
      )}
    </div>
  )
}

function LinkFeatureModal({
  policyId,
  onClose,
  onSuccess,
}: {
  policyId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [features, setFeatures] = useState<{ id: string; name: string }[]>([])
  const [sections, setSections] = useState<{ id: string; title: string }[]>([])
  const [selectedFeatureId, setSelectedFeatureId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [linking, setLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [featureOpen, setFeatureOpen] = useState(false)
  const [sectionOpen, setSectionOpen] = useState(false)
  const featureRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/features')
      .then((r) => r.json())
      .then((result: { data: { id: string; name: string }[] } | { error: string }) => {
        if ('data' in result) setFeatures(result.data)
      })
      .catch(() => {})
    fetch(`/api/policies/${policyId}/sections`)
      .then((r) => r.json())
      .then((result: { data: { id: string; title: string }[] } | { error: string }) => {
        if ('data' in result) setSections(result.data)
      })
      .catch(() => {})
  }, [policyId])

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (featureRef.current && !featureRef.current.contains(e.target as Node)) {
        setFeatureOpen(false)
      }
      if (sectionRef.current && !sectionRef.current.contains(e.target as Node)) {
        setSectionOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  const handleLink = async () => {
    if (!selectedFeatureId || !selectedSectionId) return
    setLinking(true)
    setError(null)
    try {
      const res = await fetch('/api/feature-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_id: selectedFeatureId, section_id: selectedSectionId }),
      })
      if (res.status === 409) {
        setError('이미 연결되어 있습니다')
        return
      }
      if (!res.ok) {
        setError('연결에 실패했습니다')
        return
      }
      onSuccess()
    } catch {
      setError('연결에 실패했습니다')
    } finally {
      setLinking(false)
    }
  }

  const selectedFeatureName = features.find((f) => f.id === selectedFeatureId)?.name
  const selectedSectionTitle = sections.find((s) => s.id === selectedSectionId)?.title

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl border border-line-primary bg-surface-primary p-7 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-5 text-lg font-semibold text-content-primary">기능 연결</h3>
        <div className="space-y-5">
          {/* Feature dropdown */}
          <div>
            <p className="text-xs font-medium text-content-secondary mb-1.5">기능</p>
            <div ref={featureRef} className="relative">
              <button
                type="button"
                onClick={() => { setFeatureOpen((v) => !v); setSectionOpen(false) }}
                className="w-full flex items-center justify-between rounded-lg border border-line-primary bg-surface-secondary px-4 py-3 text-sm text-content-primary hover:border-line-secondary transition-colors cursor-pointer"
              >
                <span className={selectedFeatureName ? 'text-content-primary' : 'text-content-tertiary'}>
                  {selectedFeatureName ?? '기능 선택'}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`shrink-0 transition-transform ${featureOpen ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {featureOpen && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-line-primary bg-surface-primary shadow-lg overflow-hidden">
                  <div className="max-h-52 overflow-y-auto">
                    {features.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => { setSelectedFeatureId(f.id); setFeatureOpen(false) }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-surface-secondary cursor-pointer ${selectedFeatureId === f.id ? 'text-accent font-medium bg-accent-subtle' : 'text-content-primary'}`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section dropdown */}
          <div>
            <p className="text-xs font-medium text-content-secondary mb-1.5">섹션</p>
            {sections.length === 0 ? (
              <p className="mt-2 text-xs text-content-tertiary">이 정책에 섹션이 없습니다. 섹션을 먼저 추가해주세요.</p>
            ) : (
              <div ref={sectionRef} className="relative">
                <button
                  type="button"
                  onClick={() => { setSectionOpen((v) => !v); setFeatureOpen(false) }}
                  className="w-full flex items-center justify-between rounded-lg border border-line-primary bg-surface-secondary px-4 py-3 text-sm text-content-primary hover:border-line-secondary transition-colors cursor-pointer"
                >
                  <span className={selectedSectionTitle ? 'text-content-primary' : 'text-content-tertiary'}>
                    {selectedSectionTitle ?? '섹션 선택'}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`shrink-0 transition-transform ${sectionOpen ? 'rotate-180' : ''}`}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {sectionOpen && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-line-primary bg-surface-primary shadow-lg overflow-hidden">
                    <div className="max-h-52 overflow-y-auto">
                      {sections.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => { setSelectedSectionId(s.id); setSectionOpen(false) }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-surface-secondary cursor-pointer ${selectedSectionId === s.id ? 'text-accent font-medium bg-accent-subtle' : 'text-content-primary'}`}
                        >
                          {s.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="mt-7 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line-primary px-5 py-2.5 text-sm text-content-secondary hover:bg-surface-tertiary cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleLink}
            disabled={linking || !selectedFeatureId || !selectedSectionId}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-text disabled:opacity-50 cursor-pointer"
          >
            연결
          </button>
        </div>
      </div>
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
        className="cursor-pointer rounded-md border border-line-primary bg-surface-primary px-3 py-1.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-tertiary"
      >
        내보내기 ▾
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-1 w-36 overflow-hidden rounded-md border border-line-primary bg-surface-primary shadow-md">
            <button onClick={() => download('markdown')} className="cursor-pointer flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-content-primary hover:bg-surface-secondary">
              <span>📄</span> Markdown
            </button>
            <button onClick={() => download('html')} className="cursor-pointer flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-content-primary hover:bg-surface-secondary">
              <span>🌐</span> HTML
            </button>
            <button onClick={() => download('docx')} className="cursor-pointer flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-content-primary hover:bg-surface-secondary">
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
  const [confirmDelete, setConfirmDelete] = useState(false)

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

  async function executeDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/policies/${policy.id}`, { method: 'DELETE' })
      const result = await res.json()
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      router.push('/policies')
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(action: 'publish' | 'unpublish' | 'new-version' | 'delete') {
    if (action === 'delete') {
      setConfirmDelete(true)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/policies/${policy.id}/${action}`, { method: 'POST' })
      const result = await res.json()
      if ('error' in result) {
        toast.error(result.error)
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
                    className="cursor-pointer rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    게시
                  </button>
                  <button
                    onClick={() => handleAction('delete')}
                    disabled={loading}
                    className="cursor-pointer rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
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
                    className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
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
                      className="cursor-pointer rounded-md border border-line-primary bg-surface-primary px-3 py-1.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-tertiary"
                    >
                      {copied ? '복사됨!' : '링크 복사'}
                    </button>
                  )}
                  <button
                    onClick={() => handleAction('new-version')}
                    disabled={loading}
                    className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-text transition-colors hover:opacity-90 disabled:opacity-50"
                  >
                    새 버전 생성
                  </button>
                  <button
                    onClick={() => handleAction('unpublish')}
                    disabled={loading}
                    className="cursor-pointer rounded-md border border-line-primary bg-surface-primary px-3 py-1.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-tertiary disabled:opacity-50"
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
        <div className="w-64 shrink-0 space-y-4">
          <LinkedFeaturesPanel policyId={policy.id} />
          <VersionsPanel policyId={policy.id} currentVersion={policy.version} />
          <PolicyTOC content={policy.content} />
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm mx-4 rounded-xl border border-line-primary bg-surface-primary p-6 shadow-xl">
            <p className="mb-1 text-sm font-semibold text-content-primary">정책을 삭제하시겠습니까?</p>
            <p className="mb-6 text-sm text-content-secondary">이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={loading}
                className="cursor-pointer rounded-md border border-line-primary bg-surface-primary px-4 py-2 text-sm font-medium text-content-primary hover:bg-surface-tertiary disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  setConfirmDelete(false)
                  await executeDelete()
                }}
                disabled={loading}
                className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
