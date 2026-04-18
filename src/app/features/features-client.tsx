'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type PolicyDoc = {
  id: string
  title: string
  status: string
}

type PolicySection = {
  id: string
  title: string
  sort_order: number
  policy_doc_id: string
  policy_docs: PolicyDoc | null
}

type FeaturePolicy = {
  id: string
  note: string | null
  policy_sections: {
    id: string
    title: string
    policy_docs: PolicyDoc | null
  } | null
}

type Feature = {
  id: string
  name: string
  slug: string
  description: string | null
  screen_path: string | null
  feature_policies: FeaturePolicy[]
}

type EditState = {
  id: string
  name: string
  slug: string
  description: string
  screen_path: string
}

type AddState = {
  name: string
  slug: string
  description: string
  screen_path: string
}

function generateSlug(name: string): string {
  const ascii = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  if (ascii.length > 0) return ascii
  // Korean or non-ascii: use timestamp-based slug
  return `feature-${Date.now()}`
}

function SortableFeatureCard({ id, children }: { id: string; children: (dragHandleProps: React.HTMLAttributes<HTMLElement>) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 10 : undefined,
  }
  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners })}
    </div>
  )
}

export function FeaturesClient({ initialFeatures }: { initialFeatures: Feature[] }) {
  const [features, setFeatures] = useState<Feature[]>(initialFeatures)
  const [allSections, setAllSections] = useState<PolicySection[]>([])
  const [linkModal, setLinkModal] = useState<{ feature: Feature } | null>(null)
  const [modalStep, setModalStep] = useState<'policy' | 'section'>('policy')
  const [modalPolicy, setModalPolicy] = useState<{ doc: PolicyDoc; sections: PolicySection[] } | null>(null)
  const [linking, setLinking] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addState, setAddState] = useState<AddState>({ name: '', slug: '', description: '', screen_path: '' })
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unlinkingSectionId, setUnlinkingSectionId] = useState<string | null>(null)
  const [confirmUnlink, setConfirmUnlink] = useState<{ featureId: string; sectionId: string; sectionTitle: string; docTitle: string } | null>(null)
  const [confirmUnlinkDoc, setConfirmUnlinkDoc] = useState<{ featureId: string; docId: string; docTitle: string; sectionIds: string[] } | null>(null)
  const [bulkLinking, setBulkLinking] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (over && active.id !== over.id) {
      setFeatures((items) => {
        const oldIndex = items.findIndex((f) => f.id === active.id)
        const newIndex = items.findIndex((f) => f.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  useEffect(() => {
    fetch('/api/sections')
      .then((r) => r.json())
      .then((result: { data: PolicySection[] } | { error: string }) => {
        if ('data' in result) setAllSections(result.data)
      })
  }, [])

  async function refreshFeatures() {
    const res = await fetch('/api/features')
    const result = await res.json() as { data: Feature[] } | { error: string }
    if ('data' in result) {
      setFeatures(result.data)
    }
  }

  function startEdit(feature: Feature) {
    setEditState({
      id: feature.id,
      name: feature.name,
      slug: feature.slug,
      description: feature.description ?? '',
      screen_path: feature.screen_path ?? '',
    })
    setError(null)
  }

  function cancelEdit() {
    setEditState(null)
    setError(null)
  }

  async function handleSave() {
    if (!editState) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/features/${editState.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editState.name,
          slug: editState.slug,
          description: editState.description || null,
          screen_path: editState.screen_path || null,
        }),
      })
      const result = await res.json() as { data: unknown } | { error: string }
      if (!res.ok) {
        setError('error' in result ? result.error : '저장 실패')
        return
      }
      setEditState(null)
      await refreshFeatures()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    setConfirmDelete({ id, name })
  }

  async function executeDelete(id: string) {
    setError(null)
    const res = await fetch(`/api/features/${id}`, { method: 'DELETE' })
    const result = await res.json() as { data: unknown } | { error: string }
    if (!res.ok) {
      setError('error' in result ? result.error : '삭제 실패')
      return
    }
    await refreshFeatures()
  }

  async function handleAdd() {
    if (!addState.name.trim()) {
      setError('이름은 필수입니다.')
      return
    }
    const slug = addState.slug.trim() || generateSlug(addState.name.trim())
    setAdding(true)
    setError(null)
    try {
      const res = await fetch('/api/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addState.name.trim(),
          slug,
          description: addState.description.trim() || null,
          screen_path: addState.screen_path.trim() || null,
        }),
      })
      const result = await res.json() as { data: unknown } | { error: string }
      if (!res.ok) {
        setError('error' in result ? result.error : '추가 실패')
        return
      }
      setAddState({ name: '', slug: '', description: '', screen_path: '' })
      setShowAddForm(false)
      await refreshFeatures()
    } finally {
      setAdding(false)
    }
  }

  async function handleLink(featureId: string, sectionId: string) {
    setLinking(true)
    try {
      const res = await fetch('/api/feature-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_id: featureId, section_id: sectionId }),
      })
      if (!res.ok && res.status !== 409) {
        setError('연결에 실패했습니다.')
        return
      }
      await refreshFeatures()
    } finally {
      setLinking(false)
    }
  }

  async function handleUnlink(featureId: string, sectionId: string) {
    setUnlinkingSectionId(sectionId)
    try {
      const res = await fetch(`/api/feature-policies?feature_id=${featureId}&section_id=${sectionId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        setError('해제에 실패했습니다.')
        return
      }
      await refreshFeatures()
    } finally {
      setUnlinkingSectionId(null)
    }
  }

  async function handleLinkAll(featureId: string, sectionIds: string[]) {
    setBulkLinking(true)
    try {
      await Promise.allSettled(
        sectionIds.map((sid) =>
          fetch('/api/feature-policies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feature_id: featureId, section_id: sid }),
          })
        )
      )
      await refreshFeatures()
    } finally {
      setBulkLinking(false)
    }
  }

  async function handleUnlinkDoc(featureId: string, sectionIds: string[]) {
    setBulkLinking(true)
    try {
      await Promise.allSettled(
        sectionIds.map((sid) =>
          fetch(`/api/feature-policies?feature_id=${featureId}&section_id=${sid}`, { method: 'DELETE' })
        )
      )
      await refreshFeatures()
    } finally {
      setBulkLinking(false)
    }
  }

  // Group sections by policy doc for display
  const sectionsByPolicy = allSections.reduce<Record<string, { doc: PolicyDoc; sections: PolicySection[] }>>(
    (acc, section) => {
      if (!section.policy_docs) return acc
      const docId = section.policy_docs.id
      if (!acc[docId]) {
        acc[docId] = { doc: section.policy_docs, sections: [] }
      }
      acc[docId].sections.push(section)
      return acc
    },
    {}
  )

  // Get the up-to-date feature from state (refreshFeatures updates features array)
  const modalFeature = linkModal
    ? (features.find((f) => f.id === linkModal.feature.id) ?? linkModal.feature)
    : null

  const linkedSectionIds = new Set(
    modalFeature?.feature_policies
      .map((fp) => fp.policy_sections?.id)
      .filter((id): id is string => !!id) ?? []
  )

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => { setShowAddForm((v) => !v); setError(null) }}
          className="cursor-pointer shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-text"
        >
          {showAddForm ? '취소' : '기능 추가'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="mb-6 rounded-lg border border-line-primary bg-surface-secondary p-4">
          <p className="mb-3 text-sm font-medium text-content-primary">새 기능 추가</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              className="rounded border border-line-primary bg-surface-primary px-3 py-2 text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="이름 (예: 회원가입)"
              value={addState.name}
              onChange={(e) => {
                const name = e.target.value
                setAddState((s) => ({
                  ...s,
                  name,
                  slug: s.slug === '' || s.slug === generateSlug(s.name) ? generateSlug(name) : s.slug,
                }))
              }}
            />
            <input
              className="rounded border border-line-primary bg-surface-primary px-3 py-2 font-mono text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="슬러그 (예: sign-up)"
              value={addState.slug}
              onChange={(e) => setAddState((s) => ({ ...s, slug: e.target.value }))}
            />
            <input
              className="rounded border border-line-primary bg-surface-primary px-3 py-2 text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="설명 (선택)"
              value={addState.description}
              onChange={(e) => setAddState((s) => ({ ...s, description: e.target.value }))}
            />
            <input
              className="rounded border border-line-primary bg-surface-primary px-3 py-2 font-mono text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="화면 경로 (예: /auth/signup)"
              value={addState.screen_path}
              onChange={(e) => setAddState((s) => ({ ...s, screen_path: e.target.value }))}
            />
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleAdd}
              disabled={adding}
              className="cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-text disabled:opacity-50"
            >
              {adding ? '추가 중...' : '추가'}
            </button>
          </div>
        </div>
      )}

      {features.length === 0 && (
        <p className="text-sm text-content-tertiary">등록된 기능이 없습니다</p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={features.map((f) => f.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {features.map((feature) => {
              const seenDocIds = new Set<string>()
              const linkedDocs = feature.feature_policies
                ?.map((fp) => fp.policy_sections?.policy_docs)
                .filter((doc): doc is PolicyDoc => {
                  if (!doc || seenDocIds.has(doc.id)) return false
                  seenDocIds.add(doc.id)
                  return true
                }) ?? []
              const policyCount = linkedDocs.length
              const isEditing = editState?.id === feature.id

              return (
                <SortableFeatureCard key={feature.id} id={feature.id}>
                  {(dragHandleProps) => (
                    <div className="relative rounded-xl border border-line-primary bg-surface-primary p-4 shadow-sm">
                      {!isEditing && (
                        <div
                          {...dragHandleProps}
                          className="absolute top-3 right-3 cursor-grab active:cursor-grabbing p-1 text-content-tertiary hover:text-content-secondary touch-none"
                          title="드래그하여 순서 변경"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                            <circle cx="4" cy="2" r="1.2"/><circle cx="10" cy="2" r="1.2"/>
                            <circle cx="4" cy="7" r="1.2"/><circle cx="10" cy="7" r="1.2"/>
                            <circle cx="4" cy="12" r="1.2"/><circle cx="10" cy="12" r="1.2"/>
                          </svg>
                        </div>
                      )}

                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            className="w-full rounded border border-line-primary bg-surface-secondary px-2 py-1.5 text-sm text-content-primary focus:outline-none focus:ring-1 focus:ring-accent"
                            placeholder="이름"
                            value={editState.name}
                            onChange={(e) => setEditState({ ...editState, name: e.target.value })}
                          />
                          <input
                            className="w-full rounded border border-line-primary bg-surface-secondary px-2 py-1.5 font-mono text-sm text-content-primary focus:outline-none focus:ring-1 focus:ring-accent"
                            placeholder="슬러그"
                            value={editState.slug}
                            onChange={(e) => setEditState({ ...editState, slug: e.target.value })}
                          />
                          <input
                            className="w-full rounded border border-line-primary bg-surface-secondary px-2 py-1.5 text-sm text-content-primary focus:outline-none focus:ring-1 focus:ring-accent"
                            placeholder="설명 (선택)"
                            value={editState.description}
                            onChange={(e) => setEditState({ ...editState, description: e.target.value })}
                          />
                          <input
                            className="w-full rounded border border-line-primary bg-surface-secondary px-2 py-1.5 font-mono text-sm text-content-primary focus:outline-none focus:ring-1 focus:ring-accent"
                            placeholder="화면 경로 (선택)"
                            value={editState.screen_path}
                            onChange={(e) => setEditState({ ...editState, screen_path: e.target.value })}
                          />
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={handleSave}
                              disabled={saving}
                              className="cursor-pointer rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-text disabled:opacity-50"
                            >
                              {saving ? '저장 중...' : '저장'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="cursor-pointer rounded-md border border-line-primary px-3 py-1 text-xs text-content-secondary hover:text-content-primary disabled:opacity-50"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="mb-2 flex items-start justify-between gap-2 pr-6">
                            <div className="flex min-w-0 items-center gap-2">
                              <h2 className="truncate font-semibold text-content-primary">{feature.name}</h2>
                              <button
                                onClick={() => startEdit(feature)}
                                className="shrink-0 cursor-pointer rounded p-1.5 text-content-tertiary hover:bg-surface-secondary hover:text-content-primary"
                                title="수정"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {policyCount > 0 ? (
                                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-text">
                                  정책 {policyCount}개 연결
                                </span>
                              ) : (
                                <span className="text-xs text-content-tertiary">정책 미연결</span>
                              )}
                              <button
                                onClick={() => { setLinkModal({ feature }); setModalStep('policy'); setModalPolicy(null) }}
                                className="cursor-pointer rounded border border-line-primary bg-surface-secondary px-3 py-1 text-sm font-medium text-content-secondary hover:bg-surface-tertiary hover:text-content-primary"
                              >
                                연결
                              </button>
                              <button
                                onClick={() => handleDelete(feature.id, feature.name)}
                                className="cursor-pointer rounded border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-100"
                              >
                                삭제
                              </button>
                            </div>
                          </div>

                          {feature.screen_path && (
                            <p className="mb-1 font-mono text-xs text-content-tertiary">{feature.screen_path}</p>
                          )}

                          {feature.description && (
                            <p className="mb-3 text-sm text-content-secondary">{feature.description}</p>
                          )}

                          {linkedDocs.length > 0 && (
                            <div className="mt-3 border-t border-line-primary pt-3 space-y-0.5">
                              {linkedDocs.map((doc) => {
                                const linkedSections = feature.feature_policies
                                  .filter((fp) => fp.policy_sections?.policy_docs?.id === doc.id)
                                  .map((fp) => ({ id: fp.policy_sections!.id, title: fp.policy_sections!.title }))
                                return (
                                  <div key={doc.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-secondary transition-colors">
                                    <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${doc.status === 'published' ? 'bg-emerald-500' : 'bg-content-tertiary'}`} />
                                    <Link
                                      href={`/policies/${doc.id}`}
                                      className="flex-1 truncate text-sm text-content-primary hover:underline underline-offset-2 min-w-0"
                                    >
                                      {doc.title}
                                    </Link>
                                    <span className="shrink-0 rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium text-content-secondary">
                                      {linkedSections.length}개 섹션
                                    </span>
                                    <button
                                      onClick={() => setConfirmUnlinkDoc({ featureId: feature.id, docId: doc.id, docTitle: doc.title, sectionIds: linkedSections.map((s) => s.id) })}
                                      disabled={bulkLinking}
                                      className="invisible shrink-0 cursor-pointer rounded p-0.5 text-content-tertiary hover:text-red-500 group-hover:visible transition-colors disabled:opacity-50"
                                      title="연결 해제"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                      </svg>
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </SortableFeatureCard>
              )
            })}
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={null}>
          {activeId ? (() => {
            const f = features.find((f) => f.id === activeId)
            if (!f) return null
            const seenDocIds = new Set<string>()
            const linkedDocs = f.feature_policies
              .map((fp) => fp.policy_sections?.policy_docs)
              .filter((doc): doc is PolicyDoc => {
                if (!doc || seenDocIds.has(doc.id)) return false
                seenDocIds.add(doc.id)
                return true
              })
            const policyCount = linkedDocs.length
            return (
              <div className="rounded-xl border border-line-primary bg-surface-primary p-4 shadow-xl opacity-95">
                <div className="mb-2 flex items-start justify-between gap-2 pr-6">
                  <h2 className="truncate font-semibold text-content-primary">{f.name}</h2>
                  <div className="shrink-0">
                    {policyCount > 0 ? (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-text">정책 {policyCount}개 연결</span>
                    ) : (
                      <span className="text-xs text-content-tertiary">정책 미연결</span>
                    )}
                  </div>
                </div>
                {f.screen_path && <p className="mb-1 font-mono text-xs text-content-tertiary">{f.screen_path}</p>}
                {f.description && <p className="mb-3 text-sm text-content-secondary">{f.description}</p>}
                {linkedDocs.length > 0 && (
                  <div className="mt-3 border-t border-line-primary pt-3 space-y-0.5">
                    {linkedDocs.map((doc) => {
                      const linkedSections = f.feature_policies
                        .filter((fp) => fp.policy_sections?.policy_docs?.id === doc.id)
                        .map((fp) => fp.policy_sections!)
                      return (
                        <div key={doc.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                          <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${doc.status === 'published' ? 'bg-emerald-500' : 'bg-content-tertiary'}`} />
                          <span className="flex-1 truncate text-sm text-content-primary">{doc.title}</span>
                          <span className="shrink-0 rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium text-content-secondary">{linkedSections.length}개 섹션</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })() : null}
        </DragOverlay>
      </DndContext>

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm mx-4 rounded-xl border border-line-primary bg-surface-primary p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-content-primary">&ldquo;{confirmDelete.name}&rdquo; 기능을 삭제하시겠습니까?</h3>
            <p className="mb-6 text-sm text-content-secondary leading-relaxed">연결된 정책 매핑도 함께 삭제됩니다.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="cursor-pointer rounded-md border border-line-primary bg-surface-primary px-4 py-2 text-sm font-medium text-content-primary hover:bg-surface-tertiary disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  const { id } = confirmDelete
                  setConfirmDelete(null)
                  await executeDelete(id)
                }}
                className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlink Confirm Modal */}
      {confirmUnlink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm mx-4 rounded-xl border border-line-primary bg-surface-primary p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-content-primary">섹션 연결을 해제하시겠습니까?</h3>
            <p className="mb-6 text-sm text-content-secondary leading-relaxed">
              <span className="font-semibold text-content-primary">{confirmUnlink.docTitle}</span> &rsaquo; <span className="font-semibold text-content-primary">{confirmUnlink.sectionTitle}</span> 섹션과의 연결이 해제됩니다.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmUnlink(null)}
                disabled={!!unlinkingSectionId}
                className="cursor-pointer rounded-md border border-line-primary bg-surface-primary px-4 py-2 text-sm font-medium text-content-primary hover:bg-surface-tertiary disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  const { featureId, sectionId } = confirmUnlink
                  setConfirmUnlink(null)
                  await handleUnlink(featureId, sectionId)
                }}
                disabled={!!unlinkingSectionId}
                className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                연결 해제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlink Doc Confirm Modal */}
      {confirmUnlinkDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm mx-4 rounded-xl border border-line-primary bg-surface-primary p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-content-primary">문서 전체 연결을 해제하시겠습니까?</h3>
            <p className="mb-6 text-sm text-content-secondary leading-relaxed">
              <span className="font-semibold text-content-primary">{confirmUnlinkDoc.docTitle}</span>의 모든 섹션 연결이 해제됩니다.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmUnlinkDoc(null)}
                disabled={bulkLinking}
                className="cursor-pointer rounded-md border border-line-primary bg-surface-primary px-4 py-2 text-sm font-medium text-content-primary hover:bg-surface-tertiary disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  const { featureId, sectionIds } = confirmUnlinkDoc
                  setConfirmUnlinkDoc(null)
                  await handleUnlinkDoc(featureId, sectionIds)
                }}
                disabled={bulkLinking}
                className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                전체 해제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {linkModal && modalFeature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setLinkModal(null) }}
        >
          <div className="relative w-full max-w-lg mx-4 rounded-xl border border-line-primary bg-surface-primary shadow-xl flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-line-primary shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {modalStep === 'section' && (
                  <button
                    onClick={() => { setModalStep('policy'); setModalPolicy(null) }}
                    className="cursor-pointer shrink-0 rounded-md p-1 text-content-tertiary hover:text-content-primary"
                    aria-label="뒤로"
                  >
                    ←
                  </button>
                )}
                <h2 className="truncate text-sm font-semibold text-content-primary">
                  {modalStep === 'policy'
                    ? `정책 연결 — ${modalFeature.name}`
                    : modalPolicy?.doc.title ?? ''}
                </h2>
              </div>
              <button
                onClick={() => setLinkModal(null)}
                className="cursor-pointer ml-4 shrink-0 rounded-md p-1 text-content-tertiary hover:text-content-primary"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {modalStep === 'policy' ? (
                /* Step 1: policy list */
                <div className="space-y-2">
                  {Object.keys(sectionsByPolicy).length === 0 ? (
                    <p className="text-xs text-content-tertiary">
                      섹션이 없습니다. 정책에 섹션을 먼저 추가해주세요.
                    </p>
                  ) : (
                    Object.values(sectionsByPolicy).map(({ doc, sections }) => {
                      const linkedCount = sections.filter((s) => linkedSectionIds.has(s.id)).length
                      return (
                        <button
                          key={doc.id}
                          onClick={() => { setModalPolicy({ doc, sections }); setModalStep('section') }}
                          className="cursor-pointer w-full flex items-center justify-between gap-3 rounded-lg border border-line-primary bg-surface-secondary px-4 py-3 text-left transition-colors hover:border-line-secondary hover:bg-surface-tertiary"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="flex-1 truncate text-sm font-medium text-content-primary">
                                {doc.title}
                              </span>
                              {doc.status === 'published' ? (
                                <span className="flex shrink-0 items-center gap-1 text-xs text-emerald-600">
                                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  게시됨
                                </span>
                              ) : (
                                <span className="flex shrink-0 items-center gap-1 text-xs text-content-tertiary">
                                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-content-tertiary" />
                                  초안
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-content-tertiary">
                              {linkedCount > 0
                                ? `${sections.length}개 항목 중 ${linkedCount}개 연결됨`
                                : `${sections.length}개 항목`}
                            </p>
                          </div>
                          <span className="shrink-0 text-content-tertiary text-xs">›</span>
                        </button>
                      )
                    })
                  )}
                </div>
              ) : (
                /* Step 2: section list */
                <div className="space-y-2">
                  {modalPolicy && modalPolicy.sections.length > 0 && (() => {
                    const allLinked = modalPolicy.sections.every((s) => linkedSectionIds.has(s.id))
                    const unlinkedIds = modalPolicy.sections.filter((s) => !linkedSectionIds.has(s.id)).map((s) => s.id)
                    const allSectionIds = modalPolicy.sections.map((s) => s.id)
                    return (
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3">
                        <span className="flex-1 truncate text-sm font-medium text-content-primary">
                          {modalPolicy.doc.title}
                        </span>
                        {allLinked ? (
                          <button
                            onClick={() => handleUnlinkDoc(modalFeature.id, allSectionIds)}
                            disabled={bulkLinking}
                            className="cursor-pointer shrink-0 rounded border border-red-200 bg-red-50 px-4 py-1.5 text-sm text-red-600 hover:bg-red-100 disabled:opacity-50"
                          >
                            {bulkLinking ? '처리 중...' : '전체 해제'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLinkAll(modalFeature.id, unlinkedIds)}
                            disabled={bulkLinking}
                            className="cursor-pointer shrink-0 rounded-md border border-line-primary bg-surface-primary px-4 py-1.5 text-sm font-medium text-content-secondary transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                          >
                            {bulkLinking ? '처리 중...' : '전체 연결'}
                          </button>
                        )}
                      </div>
                    )
                  })()}
                  {modalPolicy && modalPolicy.sections.length === 0 ? (
                    <p className="text-xs text-content-tertiary">이 정책에 섹션이 없습니다.</p>
                  ) : (
                    modalPolicy?.sections.map((section) => {
                      const isLinked = linkedSectionIds.has(section.id)
                      return (
                        <div
                          key={section.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-line-primary bg-surface-secondary px-4 py-3"
                        >
                          <span className="flex-1 truncate text-sm text-content-primary">
                            {section.title}
                          </span>
                          {isLinked ? (
                            <button
                              onClick={() => handleUnlink(modalFeature.id, section.id)}
                              disabled={linking}
                              className="cursor-pointer shrink-0 rounded border border-red-200 bg-red-50 px-4 py-1.5 text-sm text-red-600 hover:bg-red-100 disabled:opacity-50"
                            >
                              해제
                            </button>
                          ) : (
                            <button
                              onClick={() => handleLink(modalFeature.id, section.id)}
                              disabled={linking}
                              className="cursor-pointer shrink-0 rounded-md border border-line-primary bg-surface-primary px-4 py-1.5 text-sm font-medium text-content-secondary transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                            >
                              연결
                            </button>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
