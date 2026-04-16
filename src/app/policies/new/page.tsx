'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PolicyEditor } from '@/components/policy/PolicyEditor'
import { ChangelogModal } from '@/components/policy/ChangelogModal'
import { useAutoSave } from '@/hooks/useAutoSave'
import { toast } from 'sonner'
import type { PolicyDomain } from '@/lib/types'
import { POLICY_TEMPLATES } from '@/lib/policy-templates'

function generateSlugFromTitle(title: string): string {
  const cleaned = title
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!cleaned || /[^\x00-\x7F]/.test(cleaned)) {
    return `policy-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
  }
  return cleaned
}

export default function NewPolicyPage() {
  const router = useRouter()

  const [domains, setDomains] = useState<PolicyDomain[]>([])
  const [title, setTitle] = useState('')
  const [domainId, setDomainId] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [content, setContent] = useState<Record<string, unknown>>({})

  const [modalOpen, setModalOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<'draft' | 'published'>('draft')
  const [loading, setLoading] = useState(false)

  const [hasDraft, setHasDraft] = useState(false)
  const [restoredContent, setRestoredContent] = useState<Record<string, unknown> | undefined>(undefined)
  const [templateSelected, setTemplateSelected] = useState(false)

  const draftKey = 'pm:draft:new'
  const draftData = { title, domainId, slug, isPublic, content }
  const autoSaveEnabled = !hasDraft && Boolean(title.trim() || Object.keys(content).length > 0)
  const { status: autoSaveStatus, savedAt, getDraft, clearDraft } = useAutoSave(draftKey, draftData, autoSaveEnabled)

  useEffect(() => {
    fetch('/api/domains')
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setDomains(res.data)
          if (res.data.length > 0) setDomainId(res.data[0].id)
        }
      })
  }, [])

  useEffect(() => {
    const draft = getDraft()
    if (draft) {
      setHasDraft(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!slugManual && title) {
      setSlug(generateSlugFromTitle(title))
    }
  }, [title, slugManual])

  useEffect(() => {
    const hasChanges = title.trim() !== '' || Object.keys(content).length > 0
    if (!hasChanges) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [title, content])

  const handleSlugChange = useCallback((value: string) => {
    setSlugManual(true)
    setSlug(value)
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
    setTemplateSelected(true) // keep editor mounted after hasDraft is cleared
    setHasDraft(false)
  }

  function handleDismissDraft() {
    clearDraft()
    setHasDraft(false)
  }

  function handleSelectTemplate(templateId: string) {
    const tpl = POLICY_TEMPLATES.find((t) => t.id === templateId)
    if (!tpl) return
    if (templateId !== 'blank') {
      setContent(tpl.content)
      setRestoredContent(tpl.content)
    }
    setTemplateSelected(true)
  }

  function openModal(status: 'draft' | 'published') {
    setPendingStatus(status)
    setModalOpen(true)
  }

  async function handleSave(summary: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/policies', {
        method: 'POST',
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

  const canSave = title.trim() && domainId && (templateSelected || hasDraft)

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/policies"
        className="mb-4 inline-flex items-center gap-1 text-xs text-content-secondary hover:text-content-primary transition-colors"
      >
        &larr; 목록으로
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

      <h1 className="mb-6 text-xl font-semibold text-content-primary">새 정책 작성</h1>

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
          <div className="flex items-center rounded-md border border-line-primary bg-surface-primary overflow-hidden">
            <span className="shrink-0 border-r border-line-primary bg-surface-secondary px-3 py-2 text-xs text-content-tertiary font-mono">
              {typeof window !== 'undefined' ? window.location.origin : ''}/p/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="자동 생성됩니다"
              className="flex-1 bg-transparent px-3 py-2 text-xs text-content-primary outline-none placeholder:text-content-tertiary font-mono"
            />
          </div>
        </div>
      </div>

      {/* Template selection */}
      {!templateSelected && !hasDraft && (
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-content-primary">템플릿 선택</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {POLICY_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tpl.id)}
                className="rounded-lg border border-line-primary bg-surface-primary px-4 py-4 text-left transition-colors hover:border-line-secondary hover:bg-surface-secondary"
              >
                <p className="text-sm font-medium text-content-primary">{tpl.name}</p>
                <p className="mt-1 text-xs text-content-tertiary">{tpl.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      {(templateSelected || hasDraft) && (
        <div className="mb-24">
          <PolicyEditor content={restoredContent} onChange={setContent} />
        </div>
      )}

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
              임시저장
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
