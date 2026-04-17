'use client'

import { forwardRef } from 'react'

export interface SlashCommand {
  id: string
  label: string
  description: string
  icon: string
}

export const SLASH_COMMANDS: SlashCommand[] = [
  { id: 'h1', label: '제목 1', description: '큰 제목', icon: 'H1' },
  { id: 'h2', label: '제목 2', description: '중간 제목', icon: 'H2' },
  { id: 'h3', label: '제목 3', description: '작은 제목', icon: 'H3' },
  { id: 'ul', label: '글머리 기호 목록', description: '순서 없는 목록', icon: '•' },
  { id: 'ol', label: '번호 매기기 목록', description: '순서 있는 목록', icon: '1.' },
  { id: 'quote', label: '인용구', description: '인용 블록', icon: '"' },
  { id: 'code', label: '코드 블록', description: '코드 블록', icon: '</>' },
  { id: 'table', label: '표', description: '3×3 표 삽입', icon: '▦' },
  { id: 'hr', label: '구분선', description: '수평 구분선', icon: '—' },
  { id: 'text', label: '텍스트', description: '일반 단락', icon: 'T' },
  { id: 'block-warning', label: '주의 블록', description: '경고/주의 사항 강조', icon: '⚠️' },
  { id: 'block-definition', label: '정의 블록', description: '용어 정의 구조', icon: '📖' },
  { id: 'block-date', label: '시행일 블록', description: '시행일 표시', icon: '📅' },
  { id: 'block-reference', label: '참조 블록', description: '관련 법령/정책 인용', icon: '🔗' },
]

interface SlashCommandMenuProps {
  commands: SlashCommand[]
  selectedIndex: number
  onSelect: (command: SlashCommand) => void
}

export const SlashCommandMenu = forwardRef<HTMLDivElement, SlashCommandMenuProps>(
  ({ commands, selectedIndex, onSelect }, ref) => {
    if (commands.length === 0) return null

    return (
      <div
        ref={ref}
        className="z-50 w-56 overflow-hidden rounded-lg border border-line-primary bg-surface-primary shadow-lg"
      >
        {commands.map((cmd, i) => (
          <button
            key={cmd.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              onSelect(cmd)
            }}
            className={`cursor-pointer flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
              i === selectedIndex
                ? 'bg-surface-tertiary text-content-primary'
                : 'text-content-secondary hover:bg-surface-secondary'
            }`}
          >
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border border-line-primary bg-surface-secondary text-xs font-bold text-content-primary">
              {cmd.icon}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-content-primary">{cmd.label}</p>
              <p className="text-[10px] text-content-tertiary">{cmd.description}</p>
            </div>
          </button>
        ))}
      </div>
    )
  }
)
SlashCommandMenu.displayName = 'SlashCommandMenu'
