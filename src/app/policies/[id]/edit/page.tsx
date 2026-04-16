'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { PolicyEditor } from '@/components/policy/PolicyEditor'
import { ChangelogModal } from '@/components/policy/ChangelogModal'
import { useAutoSave } from '@/hooks/useAutoSave'
import { toast } from 'sonner'
import type { PolicyDoc, PolicyDomain } from '@/lib/types'

export default function EditPolicyPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [policy, setPolicy] = useState<PolicyDoc | null>(null)
  const [domains, setDomains] = useState<PolicyDomain[]>([])
  const [title, setTitle] = useState('')
  const [domainId, setDomainId] = useState('')
  const [slug, setSlug] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [content, setContent] = useState<Record<string, unknown>>({})

  const [modalOpen, setModalOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<'draft' | 'published'>('draft')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  const [hasDraft, setHasDraft] = useState(false)
  const [restoredContent, setRestoredContent] = useState<Record<string, unknown> | undefined>(undefined)
  const [showVersionConfirm, setShowVersionConfirm] = useState(false)
  const [versionLoading, setVersionLoading] = useState(false)
  const [slugEditing, setSlugEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  const draftKey = `pm:draft:edit:${id}`
  const draftData = { title, domainId, slug, isPublic, content }
  const hasChanges =
    !pageLoading &&
    policy !== null &&
    (title !== policy.title ||
      domainId !== policy.domain_id ||
      slug !== policy.slug ||
      isPublic !== policy.is_public ||
      JSON.stringify(content) !== JSON.stringify(policy.content))
  const autoSaveEnabled = hasChanges
  const { status: autoSaveStatus, savedAt, getDraft, clearDraft } = useAutoSave(draftKey, draftData, autoSaveEnabled)

  useEffect(() => {
    Promise.all([
      fetch(`/api/policies/${id}`).then((r) => r.json()),
      fetch('/api/domains').then((r) => r.json()),
    ]).then(([policyRes, domainsRes]) => {
      if (domainsRes.data) setDomains(domainsRes.data)

      if (policyRes.data) {
        const doc = policyRes.data as PolicyDoc

        // If published, show inline confirmation instead of blocking confirm()
        if (doc.status === 'published') {
          setPolicy(doc)
          setTitle(doc.title)
          setDomainId(doc.domain_id)
          setSlug(doc.slug)
          setIsPublic(doc.is_public)
          setContent(doc.content)
          setShowVersionConfirm(true)
          setPageLoading(false)
          return
        }

        setPolicy(doc)
        setTitle(doc.title)
        setDomainId(doc.domain_id)
        setSlug(doc.slug)
        setIsPublic(doc.is_public)
        setContent(doc.content)
      }
      setPageLoading(false)
    })
  }, [id, router])

  // Check for draft after policy loads
  useEffect(() => {
    if (pageLoading) return
    const draft = getDraft()
    if (draft) {
      setHasDraft(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageLoading])

  useEffect(() => {
    if (!autoSaveEnabled) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [title, content, policy, autoSaveEnabled])

  const handleContentChange = useCallback((json: Record<string, unknown>) => {
    setContent(json)
  }, [])

  function handleRestoreDraft() {
    const draft = getDraft()
    if (!draft) return
    setTitle(draft.data.title)
    setDomainId(draft.data.domainId)
    setSlug(draft.data.slug)
    setIsPublic(draft.data.isPublic)
    setContent(draft.data.content)
    setRestoredContent(draft.data.content)
    setHasDraft(false)
  }

  function handleDismissDraft() {
    clearDraft()
    setHasDraft(false)
  }

  async function handleCreateNewVersion() {
    setVersionLoading(true)
    try {
      const res = await fetch(`/api/policies/${id}/new-version`, { method: 'POST' })
      const data = await res.json()
      if (data.data) {
        router.replace(`/policies/${data.data.id}/edit`)
      } else {
        toast.error(data.error || '새 버전 생성에 실패했습니다.')
        router.push(`/policies/${id}`)
      }
    } finally {
      setVersionLoading(false)
    }
  }

  function openModal(status: 'draft' | 'published') {
    setPendingStatus(status)
    setModalOpen(true)
  }

  async function handleSave(summary: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/policies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          domain_id: domainId,
          content,
          is_public: isPublic,
          slug,
          status: pendingStatus,
          summary,
        }),
      })
      const result = await res.json()
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      clearDraft()
      router.push(`/policies/${result.data.id}`)
    } finally {
      setLoading(false)
      setModalOpen(false)
    }
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-content-tertiary">
        로딩 중...
      </div>
    )
  }

  if (!policy) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-content-tertiary">
        정책을 찾을 수 없습니다.
      </div>
    )
  }

  if (showVersionConfirm) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="w-full max-w-sm rounded-xl border border-line-primary bg-surface-primary p-6 shadow-sm">
          <p className="mb-1 text-sm font-semibold text-content-primary">게시된 정책입니다</p>
          <p className="mb-6 text-sm text-content-secondary">
            이미 게시된 정책을 수정하려면 새 버전을 생성해야 합니다. 계속하시겠습니까?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push(`/policies/${id}`)}
              disabled={versionLoading}
              className="rounded-md border border-line-primary bg-surface-primary px-4 py-2 text-sm font-medium text-content-primary hover:bg-surface-tertiary disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleCreateNewVersion}
              disabled={versionLoading}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {versionLoading ? '생성 중...' : '새 버전 생성'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const canSave = title.trim() && domainId

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/policies/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-xs text-content-secondary hover:text-content-primary transition-colors"
      >
        &larr; 상세로 돌아가기
      </Link>

      {hasDraft && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="flex-1">
            임시 저장된 작성 내용이 있습니다.
            {(() => {
              const draft = getDraft()
              return draft ? ` (${formatTime(draft.savedAt)} 저장)` : ''
            })()}
          </span>
          <button
            type="button"
            onClick={handleRestoreDraft}
            className="font-medium underline underline-offset-2 hover:opacity-80"
          >
            복원하기
          </button>
          <button
            type="button"
            onClick={handleDismissDraft}
            className="hover:opacity-80"
          >
            무시하기
          </button>
        </div>
      )}

      <h1 className="mb-6 text-xl font-semibold text-content-primary">정책 편집</h1>

      {/* Meta fields */}
      <div className="mb-6 space-y-4 rounded-lg border border-line-primary bg-surface-primary p-5">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-secondary">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="정책 제목을 입력하세요"
            className="w-full rounded-md border border-line-primary bg-surface-primary px-3 py-2 text-sm text-content-primary outline-none placeholder:text-content-tertiary focus:border-line-secondary"
          />
        </div>

        {/* Domain + Public */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-content-secondary">영역</label>
            <select
              value={domainId}
              onChange={(e) => setDomainId(e.target.value)}
              className="w-full rounded-md border border-line-primary bg-surface-primary px-3 py-2 text-sm text-content-primary outline-none focus:border-line-secondary"
            >
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 pb-2 text-sm text-content-primary">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-line-primary"
              />
              공개
            </label>
          </div>
        </div>

        {/* Public URL */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-secondary">공개 URL 주소</label>
          {slugEditing ? (
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs text-content-tertiary font-mono">
                {typeof window !== 'undefined' ? window.location.origin : ''}/p/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                autoFocus
                className="flex-1 rounded-md border border-line-secondary bg-surface-primary px-3 py-2 text-xs text-content-primary outline-none font-mono focus:border-line-secondary"
              />
              <button
                type="button"
                onClick={() => setSlugEditing(false)}
                className="shrink-0 rounded-md border border-line-primary bg-surface-primary px-3 py-1.5 text-xs text-content-secondary hover:bg-surface-tertiary"
              >
                완료
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-line-primary bg-surface-secondary px-3 py-2">
              <span className="flex-1 truncate font-mono text-xs text-content-secondary">
                {typeof window !== 'undefined' ? window.location.origin : ''}/p/{slug}
              </span>
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/p/${slug}`
                  navigator.clipboard.writeText(url)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="shrink-0 rounded border border-line-primary bg-surface-primary px-2 py-1 text-xs text-content-secondary hover:bg-surface-tertiary"
              >
                {copied ? '복사됨' : '복사'}
              </button>
              <button
                type="button"
                onClick={() => setSlugEditing(true)}
                className="shrink-0 rounded border border-line-primary bg-surface-primary px-2 py-1 text-xs text-content-secondary hover:bg-surface-tertiary"
              >
                수정
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="mb-24">
        <PolicyEditor content={restoredContent ?? policy.content} onChange={handleContentChange} />
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 z-40 border-t border-line-primary bg-surface-primary px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <span className="text-xs text-content-tertiary">
            {autoSaveStatus === 'saving' && '저장 중...'}
            {autoSaveStatus === 'saved' && savedAt && `임시 저장됨 ${formatTime(savedAt)}`}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openModal('draft')}
              disabled={!canSave || loading}
              className="rounded-md border border-line-primary bg-surface-primary px-4 py-2 text-sm font-medium text-content-primary transition-colors hover:bg-surface-tertiary disabled:opacity-50"
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => openModal('published')}
              disabled={!canSave || loading}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              게시
            </button>
          </div>
        </div>
      </div>

      <ChangelogModal
        open={modalOpen}
        loading={loading}
        onClose={() => setModalOpen(false)}
        onConfirm={handleSave}
      />
    </div>
  )
}
