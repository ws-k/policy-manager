'use client'

import { useState } from 'react'
import type { DomainWithCount } from './page'

type EditState = {
  id: string
  name: string
  slug: string
  description: string
  sort_order: number
  icon: string
}

export function DomainsClient({ initialDomains }: { initialDomains: DomainWithCount[] }) {
  const [domains, setDomains] = useState<DomainWithCount[]>(initialDomains)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refreshDomains() {
    const res = await fetch('/api/domains')
    const result = await res.json() as { data: DomainWithCount[] } | { error: string }
    if ('data' in result) setDomains(result.data)
  }

  function startEdit(domain: DomainWithCount) {
    setEditState({
      id: domain.id,
      name: domain.name,
      slug: domain.slug,
      description: domain.description ?? '',
      sort_order: domain.sort_order,
      icon: domain.icon ?? '',
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
      const res = await fetch(`/api/domains/${editState.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editState.name,
          slug: editState.slug,
          description: editState.description || null,
          sort_order: editState.sort_order,
          icon: editState.icon || null,
        }),
      })
      const result = await res.json() as { data: unknown } | { error: string }
      if (!res.ok) {
        setError('error' in result ? result.error : '저장 실패')
        return
      }
      setEditState(null)
      await refreshDomains()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" 도메인을 삭제하시겠습니까?`)) return
    setError(null)
    const res = await fetch(`/api/domains/${id}`, { method: 'DELETE' })
    const result = await res.json() as { data: unknown } | { error: string }
    if (!res.ok) {
      setError('error' in result ? result.error : '삭제 실패')
      return
    }
    await refreshDomains()
  }

  async function handleAdd() {
    if (!newName.trim() || !newSlug.trim()) {
      setError('이름과 슬러그는 필수입니다.')
      return
    }
    setAdding(true)
    setError(null)
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim() }),
      })
      const result = await res.json() as { data: unknown } | { error: string }
      if (!res.ok) {
        setError('error' in result ? result.error : '추가 실패')
        return
      }
      setNewName('')
      setNewSlug('')
      await refreshDomains()
    } finally {
      setAdding(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-content-primary">도메인 관리</h1>
        <p className="mt-1 text-sm text-content-secondary">정책 도메인을 추가·수정·삭제합니다.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-line-primary bg-surface-primary overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-primary bg-surface-secondary">
              <th className="px-4 py-3 text-left font-medium text-content-secondary">이름</th>
              <th className="px-4 py-3 text-left font-medium text-content-secondary">슬러그</th>
              <th className="px-4 py-3 text-left font-medium text-content-secondary">순서</th>
              <th className="px-4 py-3 text-left font-medium text-content-secondary">정책 수</th>
              <th className="px-4 py-3 text-left font-medium text-content-secondary">아이콘</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {domains.map((domain) => {
              const isEditing = editState?.id === domain.id
              return (
                <tr
                  key={domain.id}
                  className="border-b border-line-primary last:border-0 hover:bg-surface-secondary transition-colors"
                >
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        className="w-full rounded border border-line-primary bg-surface-primary px-2 py-1 text-sm text-content-primary focus:outline-none focus:ring-1 focus:ring-accent"
                        value={editState.name}
                        onChange={(e) => setEditState({ ...editState, name: e.target.value })}
                      />
                    ) : (
                      <span
                        className="cursor-pointer text-content-primary hover:text-accent"
                        onClick={() => startEdit(domain)}
                      >
                        {domain.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        className="w-full rounded border border-line-primary bg-surface-primary px-2 py-1 font-mono text-sm text-content-primary focus:outline-none focus:ring-1 focus:ring-accent"
                        value={editState.slug}
                        onChange={(e) => setEditState({ ...editState, slug: e.target.value })}
                      />
                    ) : (
                      <span className="font-mono text-content-secondary">{domain.slug}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="number"
                        className="w-20 rounded border border-line-primary bg-surface-primary px-2 py-1 text-sm text-content-primary focus:outline-none focus:ring-1 focus:ring-accent"
                        value={editState.sort_order}
                        onChange={(e) => setEditState({ ...editState, sort_order: Number(e.target.value) })}
                      />
                    ) : (
                      <span className="tabular-nums text-content-secondary">{domain.sort_order}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="tabular-nums text-content-secondary">{domain.policy_count}</span>
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        className="w-20 rounded border border-line-primary bg-surface-primary px-2 py-1 text-sm text-content-primary focus:outline-none focus:ring-1 focus:ring-accent"
                        value={editState.icon}
                        onChange={(e) => setEditState({ ...editState, icon: e.target.value })}
                        placeholder="없음"
                      />
                    ) : (
                      <span className="text-content-tertiary">{domain.icon ?? '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-text disabled:opacity-50"
                          >
                            {saving ? '저장 중...' : '저장'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={saving}
                            className="rounded-md border border-line-primary px-3 py-1 text-xs text-content-secondary hover:text-content-primary disabled:opacity-50"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(domain)}
                            className="text-xs text-content-secondary hover:text-content-primary"
                          >
                            편집
                          </button>
                          <button
                            onClick={() => handleDelete(domain.id, domain.name)}
                            className="text-xs text-content-tertiary hover:text-red-500"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {domains.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-content-tertiary">
                  도메인이 없습니다. 아래에서 추가해주세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 새 도메인 추가 */}
      <div className="mt-4 rounded-lg border border-line-primary bg-surface-secondary p-4">
        <p className="mb-3 text-sm font-medium text-content-primary">새 도메인 추가</p>
        <div className="flex items-center gap-3">
          <input
            className="flex-1 rounded border border-line-primary bg-surface-primary px-3 py-2 text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="이름 (예: 개인정보 보호)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <input
            className="flex-1 rounded border border-line-primary bg-surface-primary px-3 py-2 font-mono text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="슬러그 (예: privacy)"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={adding}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-text disabled:opacity-50"
          >
            {adding ? '추가 중...' : '추가'}
          </button>
        </div>
      </div>
    </div>
  )
}
