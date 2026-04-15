'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems: { href: string; label: string; icon: string; phase?: number }[] = [
  { href: '/', label: '대시보드', icon: '⊞' },
  { href: '/policies', label: '정책 목록', icon: '≡' },
  { href: '/features', label: '기능 맵', icon: '◈' },
  { href: '/domains', label: '도메인 관리', icon: '◎' },
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
    <aside className="flex h-screen w-56 flex-col border-r border-line-primary bg-surface-secondary">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-line-primary px-4">
        <span className="text-sm font-semibold text-content-primary">Policy Manager</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-accent text-accent-text'
                  : 'text-content-secondary hover:bg-surface-tertiary hover:text-content-primary',
              ].join(' ')}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
              {item.phase && (
                <span className="ml-auto rounded-full bg-surface-tertiary px-1.5 py-0.5 text-[10px] text-content-tertiary">
                  Phase {item.phase}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-line-primary p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-content-secondary transition-colors hover:bg-surface-tertiary hover:text-content-primary"
        >
          <span className="text-base leading-none">→</span>
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  )
}
