'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Project = { id: string; name: string; created_at: string; archived: boolean }

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=31536000;SameSite=Lax`
}

export function ProjectsClient({ initialProjects, initialArchived }: {
  initialProjects: Project[]
  initialArchived: Project[]
}) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [archivedProjects, setArchivedProjects] = useState<Project[]>(initialArchived)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)
  const [confirmArchive, setConfirmArchive] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit(project: Project) {
    setEditId(project.id)
    setEditName(project.name)
    setError(null)
  }

  function cancelEdit() {
    setEditId(null)
    setEditName('')
    setError(null)
  }

  async function handleSave(id: string) {
    if (!editName.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })
      const result = await res.json() as { data?: Project; error?: string }
      if (!res.ok) {
        setError(result.error ?? '저장 실패')
        return
      }
      if (result.data) {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, name: result.data!.name } : p))
      }
      setEditId(null)
      setEditName('')
      window.dispatchEvent(new Event('projects-updated'))
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleAdd() {
    if (!newName.trim()) return
    setAdding(true)
    setError(null)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const result = await res.json() as { data?: Project; error?: string }
      if (!res.ok) {
        setError(result.error ?? '추가 실패')
        return
      }
      if (result.data) {
        setProjects(prev => [...prev, result.data!])
      }
      setNewName('')
      setShowAddModal(false)
      router.refresh()
    } finally {
      setAdding(false)
    }
  }

  async function executeArchive(id: string) {
    setArchiving(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      })
      const result = await res.json() as { data?: Project; error?: string }
      if (!res.ok) {
        setError(result.error ?? '보관 실패')
        return
      }
      const archived = projects.find(p => p.id === id)
      setProjects(prev => prev.filter(p => p.id !== id))
      if (archived) {
        setArchivedProjects(prev => [...prev, { ...archived, archived: true }])
      }
      const current = getCookie('poli_project_id')
      if (current === id) {
        const remaining = projects.filter(p => p.id !== id)
        if (remaining.length > 0) {
          setCookie('poli_project_id', remaining[0].id)
        } else {
          setCookie('poli_project_id', '')
        }
      }
      setConfirmArchive(null)
      router.refresh()
    } finally {
      setArchiving(false)
    }
  }

  async function executeRestore(id: string) {
    setError(null)
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: false }),
      })
      const result = await res.json() as { data?: Project; error?: string }
      if (!res.ok) {
        setError(result.error ?? '되살리기 실패')
        return
      }
      const restored = archivedProjects.find(p => p.id === id)
      setArchivedProjects(prev => prev.filter(p => p.id !== id))
      if (restored) {
        setProjects(prev => [...prev, { ...restored, archived: false }])
      }
      router.refresh()
    } catch {
      setError('되살리기 실패')
    }
  }

  async function executeDelete(id: string) {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      const result = await res.json() as { data?: unknown; error?: string }
      if (!res.ok) {
        setError(result.error ?? '삭제 실패')
        return
      }
      setArchivedProjects(prev => prev.filter(p => p.id !== id))
      const current = getCookie('poli_project_id')
      if (current === id) {
        setCookie('poli_project_id', '')
      }
      setConfirmDelete(null)
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => { setShowAddModal(true); setError(null) }}
          className="cursor-pointer shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          프로젝트 추가
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold text-content-secondary">활성 프로젝트</h2>

      <div className="space-y-3">
        {projects.length === 0 ? (
          <p className="text-content-tertiary text-sm">등록된 프로젝트가 없습니다. 프로젝트를 추가해보세요.</p>
        ) : (
          projects.map(project => {
            const isEditing = editId === project.id
            return (
              <div
                key={project.id}
                className="rounded-xl border border-line-primary bg-surface-primary p-4 shadow-sm"
              >
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      className="flex-1 rounded border border-line-primary bg-surface-secondary px-3 py-1.5 text-sm text-content-primary focus:outline-none focus:ring-1 focus:ring-accent"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSave(project.id) }}
                    />
                    <button
                      onClick={() => handleSave(project.id)}
                      disabled={saving || !editName.trim()}
                      className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                    >
                      {saving ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={saving}
                      className="cursor-pointer rounded-md border border-line-primary px-3 py-1.5 text-xs text-content-secondary hover:text-content-primary disabled:opacity-50"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-content-primary">{project.name}</h3>
                      <button
                        onClick={() => startEdit(project)}
                        className="shrink-0 cursor-pointer rounded p-1.5 text-content-tertiary hover:bg-surface-secondary hover:text-content-primary"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => setConfirmArchive({ id: project.id, name: project.name })}
                        className="cursor-pointer rounded border border-line-primary bg-surface-secondary px-3 py-1 text-sm text-content-secondary hover:bg-surface-tertiary"
                      >
                        보관
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold text-content-secondary">보관된 프로젝트</h2>

      {archivedProjects.length > 0 && (
        <div className="space-y-3">
          {archivedProjects.map(project => (
            <div
              key={project.id}
              className="rounded-xl border border-line-primary bg-surface-secondary p-4 shadow-sm opacity-60"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-content-primary">{project.name}</h3>
                  <span className="shrink-0 rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium text-content-secondary">
                    보관됨
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => executeRestore(project.id)}
                    className="cursor-pointer rounded border border-line-primary bg-surface-secondary px-3 py-1 text-sm text-content-secondary hover:bg-surface-tertiary"
                  >
                    되살리기
                  </button>
                  <button
                    onClick={() => setConfirmDelete({ id: project.id, name: project.name })}
                    className="cursor-pointer rounded border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100"
                  >
                    영구 삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={e => { if (e.target === e.currentTarget) { setShowAddModal(false); setNewName('') } }}
        >
          <div className="w-full max-w-sm mx-4 rounded-xl border border-line-primary bg-surface-primary p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-content-primary">프로젝트 추가</h3>
            <p className="mb-4 text-sm text-content-secondary leading-relaxed">새 프로젝트를 만들면 정책, 기능, 도메인이 분리됩니다.</p>
            <input
              autoFocus
              className="w-full rounded-lg border border-line-primary bg-surface-secondary px-3 py-2 text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent mb-4"
              placeholder="프로젝트 이름"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowAddModal(false); setNewName('') }}
                disabled={adding}
                className="cursor-pointer rounded-md border border-line-primary px-4 py-2 text-sm text-content-secondary hover:bg-surface-tertiary disabled:opacity-50"
              >취소</button>
              <button
                onClick={handleAdd}
                disabled={adding || !newName.trim()}
                className="cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >{adding ? '추가 중...' : '추가'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirm Modal */}
      {confirmArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm mx-4 rounded-xl border border-line-primary bg-surface-primary p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-content-primary">&ldquo;{confirmArchive.name}&rdquo; 프로젝트를 보관하시겠습니까?</h3>
            <p className="mb-6 text-sm text-content-secondary leading-relaxed">보관하면 사이드 메뉴에서 선택이 불가능해집니다. 보관된 프로젝트 관리에서 되살릴 수 있습니다.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmArchive(null)}
                disabled={archiving}
                className="cursor-pointer rounded-md border border-line-primary px-4 py-2 text-sm text-content-secondary hover:bg-surface-tertiary disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={() => executeArchive(confirmArchive.id)}
                disabled={archiving}
                className="cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {archiving ? '보관 중...' : '보관'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm mx-4 rounded-xl border border-line-primary bg-surface-primary p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-content-primary">&ldquo;{confirmDelete.name}&rdquo; 프로젝트를 영구 삭제하시겠습니까?</h3>
            <p className="mb-6 text-sm text-content-secondary leading-relaxed">이 프로젝트를 영구적으로 삭제합니다. 복구할 수 없습니다.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="cursor-pointer rounded-md border border-line-primary px-4 py-2 text-sm text-content-secondary hover:bg-surface-tertiary disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={() => executeDelete(confirmDelete.id)}
                disabled={deleting}
                className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '영구 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
