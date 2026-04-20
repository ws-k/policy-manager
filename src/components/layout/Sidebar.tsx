'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProjectSwitcher } from './ProjectSwitcher'

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)

const GridIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
)

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

const navItems = [
  { href: '/', label: '대시보드', icon: <HomeIcon /> },
  { href: '/policies', label: '정책 목록', icon: <DocumentIcon /> },
  { href: '/features', label: '기능 목록', icon: <GridIcon /> },
  { href: '/domains', label: '정책 유형 관리', icon: <GlobeIcon /> },
  { href: '/projects', label: '프로젝트 관리', icon: <SettingsIcon /> },
]

const iconBtn = 'cursor-pointer flex w-full items-center justify-center rounded-lg py-2.5 text-content-secondary transition-colors hover:bg-black/5 hover:text-content-primary'

export function Sidebar({ initialProjectName }: { initialProjectName?: string }) {
  const [collapsed, setCollapsed] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
    {showLogoutModal && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50" onClick={e => { if (e.target === e.currentTarget) setShowLogoutModal(false) }}>
        <div className="w-full max-w-xs mx-4 rounded-xl border border-line-primary bg-surface-primary p-6 shadow-xl">
          <h3 className="mb-4 text-lg font-semibold text-content-primary">로그아웃</h3>
          <p className="mb-5 text-sm text-content-secondary">정말 로그아웃 하시겠습니까?</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowLogoutModal(false)} className="cursor-pointer rounded-md border border-line-primary px-4 py-2 text-sm text-content-secondary hover:bg-surface-tertiary">취소</button>
            <button onClick={handleLogout} className="cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-white">로그아웃</button>
          </div>
        </div>
      </div>
    )}
    <aside className={`relative z-10 flex h-screen flex-col border-r border-line-primary bg-surface-tertiary transition-all duration-200 ${collapsed ? 'w-14' : 'w-52'}`}>
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-line-primary px-3 gap-2">
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="cursor-pointer flex w-full items-center justify-center rounded-lg p-2 text-content-tertiary transition-colors hover:bg-black/5 hover:text-content-secondary"
            title="메뉴 펼치기"
          >
            <ChevronRightIcon />
          </button>
        ) : (
          <>
            <Link href="/" className="flex-1 min-w-0">
              <svg width="138" height="36" viewBox="0 0 168 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="2" width="28" height="28" rx="7" fill="#82B4F0"/>
                <rect x="8" y="10" width="28" height="28" rx="7" fill="#3182F6"/>
                <text x="44" y="31" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontSize="28" fontWeight="800" fill="#191F28" letterSpacing="-1.5">poli</text>
              </svg>
            </Link>
            <button
              onClick={() => setCollapsed(true)}
              className="cursor-pointer shrink-0 flex items-center justify-center rounded-lg p-2 text-content-tertiary transition-colors hover:bg-black/5 hover:text-content-secondary"
              title="메뉴 접기"
            >
              <ChevronLeftIcon />
            </button>
          </>
        )}
      </div>

      <ProjectSwitcher initialProjectName={initialProjectName} collapsed={collapsed} />
      {collapsed ? (
        <div className="p-2 border-b border-line-primary">
          <button
            onClick={() => document.dispatchEvent(new Event('open-search'))}
            className={iconBtn}
            title="검색 (⌘K)"
          >
            <SearchIcon />
          </button>
        </div>
      ) : (
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={() => document.dispatchEvent(new Event('open-search'))}
            className="cursor-pointer flex w-full items-center gap-2.5 rounded-lg border border-line-primary bg-surface-primary px-3 py-2 text-sm text-content-secondary transition-colors hover:border-line-secondary hover:text-content-primary shadow-sm"
          >
            <span className="text-base leading-none">⌕</span>
            <span className="flex-1 text-left text-[13px]">검색</span>
            <span className="rounded bg-surface-secondary px-1.5 py-0.5 text-[10px] text-content-tertiary font-mono">⌘K</span>
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={[
                'flex items-center rounded-lg py-2.5 text-[14px] font-medium transition-all',
                collapsed ? 'justify-center px-2' : 'gap-2.5 px-3',
                isActive
                  ? 'bg-surface-primary text-accent shadow-sm font-semibold'
                  : 'text-content-secondary hover:bg-black/5 hover:text-content-primary',
              ].join(' ')}
            >
              <span className="flex shrink-0 items-center justify-center">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-line-primary p-2">
        <button
          onClick={() => setShowLogoutModal(true)}
          title={collapsed ? '로그아웃' : undefined}
          className={`cursor-pointer flex w-full items-center rounded-lg py-2.5 text-[13px] text-content-secondary transition-colors hover:bg-black/5 hover:text-content-primary ${collapsed ? 'justify-center px-2' : 'gap-2.5 px-3'}`}
        >
          <span className="flex shrink-0 items-center justify-center"><LogoutIcon /></span>
          {!collapsed && <span>로그아웃</span>}
        </button>
      </div>
    </aside>
    </>
  )
}
