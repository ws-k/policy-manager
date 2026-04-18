'use client'

import { usePathname } from 'next/navigation'

const pageTitles: Record<string, string> = {
  '/': '대시보드',
  '/policies': '정책 목록',
  '/features': '기능 목록',
  '/domains': '정책 유형 관리',
  '/projects': '프로젝트 관리',
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
    <header className="flex h-16 items-center justify-between border-b border-line-primary bg-surface-primary/80 backdrop-blur-sm px-6">
      <h1 className="text-xl font-bold text-content-primary">{title}</h1>
      {userEmail && (
        <span className="text-xs text-content-tertiary">{userEmail}</span>
      )}
    </header>
  )
}
