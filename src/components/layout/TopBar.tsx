'use client'

import { usePathname } from 'next/navigation'

const pageTitles: Record<string, string> = {
  '/': '대시보드',
  '/policies': '정책 목록',
  '/features': '기능 맵',
}

interface TopBarProps {
  userEmail?: string
}

export function TopBar({ userEmail }: TopBarProps) {
  const pathname = usePathname()

  const title = Object.entries(pageTitles)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => pathname.startsWith(path))?.[1] ?? '페이지'

  return (
    <header className="flex h-14 items-center justify-between border-b border-line-primary bg-surface-primary px-6">
      <h1 className="text-sm font-semibold text-content-primary">{title}</h1>
      {userEmail && (
        <span className="text-xs text-content-tertiary">{userEmail}</span>
      )}
    </header>
  )
}
