'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)

const GridIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)

const navItems = [
  { href: '/', label: '대시보드', icon: <HomeIcon /> },
  { href: '/policies', label: '정책 목록', icon: <DocumentIcon /> },
  { href: '/features', label: '기능 맵', icon: <GridIcon /> },
  { href: '/domains', label: '도메인 관리', icon: <GlobeIcon /> },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-line-primary bg-surface-tertiary">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-line-primary px-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent shadow-sm">
          <span className="text-[19px] font-bold leading-none tracking-tight text-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>P</span>
        </div>
        <span className="text-[18px] font-bold tracking-tight text-content-primary">Poli</span>
      </div>

      {/* Search */}
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

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-all',
                isActive
                  ? 'bg-surface-primary text-accent shadow-sm font-semibold'
                  : 'text-content-secondary hover:bg-black/5 hover:text-content-primary',
              ].join(' ')}
            >
              <span className="flex items-center justify-center">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-line-primary p-3">
        <button
          onClick={handleLogout}
          className="cursor-pointer flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-content-secondary transition-colors hover:bg-black/5 hover:text-content-primary"
        >
          <span className="text-base leading-none">→</span>
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  )
}
