'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Project = { id: string; name: string; created_at: string }

const DEFAULT_PROJECT_ID = '00000000-0000-0000-0000-000000000001'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=31536000;SameSite=Lax`
}

export function ProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
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
      setProjects(prev => prev.filter(p => p.id !== id))
      // 현재 선택된 프로젝트가 삭제된 경우 기본 프로젝트로 전환
      const current = getCookie('poli_project_id')
      if (current === id) {
        setCookie('poli_project_id', DEFAULT_PROJECT_ID)
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

      <div className="space-y-3">
        {projects.length === 0 ? (
          <p className="text-content-tertiary text-sm">등록된 프로젝트가 없습니다.</p>
        ) : (
          projects.map(project => {
            const isDefault = project.id === DEFAULT_PROJECT_ID
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
                      <h2 className="truncate text-sm font-semibold text-content-primary">{project.name}</h2>
                      {isDefault && (
                        <span className="shrink-0 rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium text-content-secondary">
                          기본
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => startEdit(project)}
                        className="cursor-pointer rounded border border-line-primary bg-surface-secondary px-3 py-1 text-sm text-content-secondary hover:bg-surface-tertiary hover:text-content-primary"
                      >
                        이름 변경
                      </button>
                      {!isDefault && (
                        <button
                          onClick={() => setConfirmDelete({ id: project.id, name: project.name })}
                          className="cursor-pointer rounded border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

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

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm mx-4 rounded-xl border border-line-primary bg-surface-primary p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-content-primary">&ldquo;{confirmDelete.name}&rdquo; 프로젝트를 삭제하시겠습니까?</h3>
            <p className="mb-6 text-sm text-content-secondary leading-relaxed">프로젝트에 속한 정책, 기능, 도메인 등 모든 데이터가 함께 삭제됩니다.</p>
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
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
