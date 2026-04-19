'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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

export function ProjectSwitcher({ initialProjectName, collapsed }: { initialProjectName?: string; collapsed?: boolean }) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [currentId, setCurrentId] = useState<string>('')
  const [cachedName, setCachedName] = useState<string>(initialProjectName ?? '')
  const [open, setOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [portalPos, setPortalPos] = useState<{ top: number; left: number }>({ top: 60, left: 64 })

  function fetchProjects() {
    fetch('/api/projects')
      .then(r => r.json())
      .then(({ data }) => { if (data) setProjects(data) })
  }

  useEffect(() => {
    const savedId = getCookie('poli_project_id')
    const savedName = getCookie('poli_project_name')
    if (savedId) setCurrentId(savedId)
    if (savedName) setCachedName(savedName)
  }, [])

  useEffect(() => {
    fetchProjects()
    window.addEventListener('projects-updated', fetchProjects)
    return () => window.removeEventListener('projects-updated', fetchProjects)
  }, [])

  useEffect(() => {
    const found = projects.find(p => p.id === currentId)
    if (found) { setCookie('poli_project_name', found.name); setCachedName(found.name) }
  }, [projects, currentId])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      const inDropdown = dropdownRef.current?.contains(target)
      const inButton = buttonRef.current?.contains(target)
      if (!inDropdown && !inButton) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const current = projects.find(p => p.id === currentId)
  const displayName = current?.name ?? (cachedName || '프로젝트 없음')

  function handleToggle() {
    if (collapsed && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPortalPos({ top: rect.top, left: rect.right + 8 })
    }
    setOpen(v => !v)
  }

  function switchProject(id: string, name?: string) {
    setCurrentId(id)
    setCookie('poli_project_id', id)
    if (name) { setCookie('poli_project_name', name); setCachedName(name) }
    setOpen(false)
    router.refresh()
  }

  async function handleAdd() {
    if (!newName.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const { data } = await res.json()
      if (data) {
        setProjects(prev => [...prev, data])
        switchProject(data.id, data.name)
        setNewName('')
        setShowAddModal(false)
      }
    } finally {
      setAdding(false)
    }
  }

  const projectList = (
    <>
      <div className="max-h-48 overflow-y-auto">
        {projects.length === 0 ? (
          <p className="px-3 py-3 text-xs text-content-tertiary">활성 프로젝트가 없습니다</p>
        ) : (
          projects.map(p => (
            <button
              key={p.id}
              onClick={() => switchProject(p.id, p.name)}
              className={`cursor-pointer flex w-full items-center gap-2 px-3 py-2.5 text-[13px] text-left transition-colors hover:bg-surface-secondary ${p.id === currentId ? 'text-accent font-semibold bg-accent-subtle' : 'text-content-primary'}`}
            >
              {p.id === currentId && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M20 6L9 17l-5-5"/></svg>
              )}
              <span className={`flex-1 truncate ${p.id !== currentId ? 'pl-[20px]' : ''}`}>{p.name}</span>
            </button>
          ))
        )}
      </div>
      <div className="border-t border-line-primary">
        <button
          onClick={() => { setOpen(false); setShowAddModal(true) }}
          className="cursor-pointer flex w-full items-center gap-2 px-3 py-2.5 text-[13px] text-content-secondary hover:bg-surface-secondary transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          프로젝트 추가
        </button>
      </div>
    </>
  )

  return (
    <>
      <div className={`relative ${collapsed ? 'px-2 pt-2 pb-1' : 'px-3 pt-3 pb-1'}`}>
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className={`cursor-pointer flex w-full items-center rounded-lg text-[13px] font-medium text-content-primary hover:bg-black/5 transition-colors ${collapsed ? 'justify-center py-2.5' : 'gap-2 px-2.5 py-2'}`}
          title={collapsed ? displayName : undefined}
        >
          <svg width={collapsed ? 18 : 14} height={collapsed ? 18 : 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-content-tertiary">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-left">{displayName}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`shrink-0 text-content-tertiary transition-transform ${open ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </>
          )}
        </button>

        {open && !collapsed && (
          <div ref={dropdownRef} className="absolute z-50 left-3 right-3 top-full mt-1 rounded-lg border border-line-primary bg-surface-primary shadow-lg overflow-hidden">
            {projectList}
          </div>
        )}
      </div>

      {open && collapsed && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: portalPos.top, left: portalPos.left, zIndex: 9999 }}
          className="w-52 rounded-lg border border-line-primary bg-surface-primary shadow-lg overflow-hidden"
        >
          {projectList}
        </div>,
        document.body
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={e => { if (e.target === e.currentTarget) { setShowAddModal(false); setNewName('') } }}>
          <div className="w-full max-w-sm mx-4 rounded-xl border border-line-primary bg-surface-primary p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-content-primary">프로젝트 추가</h3>
            <p className="mb-4 text-sm text-content-secondary leading-relaxed">새 프로젝트를 만들면 정책, 기능, 정책 유형이 분리됩니다.</p>
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
                className="cursor-pointer rounded-md border border-line-primary px-4 py-2 text-sm text-content-secondary hover:bg-surface-tertiary"
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
    </>
  )
}
