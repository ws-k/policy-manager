'use client'

import { useState, useEffect } from 'react'

interface TocItem {
  id: string
  text: string
  level: number // 1, 2, 3
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w가-힣-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'heading'
  )
}

function extractHeadings(content: Record<string, unknown>): TocItem[] {
  const nodes = (content.content as unknown[]) ?? []
  const items: TocItem[] = []
  const seenIds = new Map<string, number>()

  for (const node of nodes) {
    const n = node as {
      type: string
      attrs?: { level: number }
      content?: { type: string; text?: string }[]
    }
    if (n.type !== 'heading') continue
    const level = n.attrs?.level ?? 1
    const text = (n.content ?? []).map((c) => c.text ?? '').join('')
    if (!text) continue
    const baseId = slugify(text)
    const count = seenIds.get(baseId) ?? 0
    const id = count === 0 ? baseId : `${baseId}-${count}`
    seenIds.set(baseId, count + 1)
    items.push({ id, text, level })
  }
  return items
}

const indentClass: Record<number, string> = {
  1: 'pl-0',
  2: 'pl-3',
  3: 'pl-6',
}

export function PolicyTOC({ content }: { content: Record<string, unknown> }) {
  const headings = extractHeadings(content)
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length > 0) setActiveId(visible[0].target.id)
      },
      { rootMargin: '0px 0px -80% 0px', threshold: 0 }
    )

    headings.forEach(h => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <div className="sticky top-6 rounded-lg border border-line-primary bg-surface-primary p-4">
      <p className="mb-3 text-xs font-medium text-content-secondary">목차</p>
      <ul className="space-y-1">
        {headings.map((item) => {
          const isActive = activeId === item.id
          return (
            <li key={item.id} className={indentClass[item.level] ?? 'pl-0'}>
              <button
                onClick={() =>
                  document
                    .getElementById(item.id)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className={`cursor-pointer text-xs truncate transition-colors text-left w-full ${
                  isActive
                    ? 'text-content-primary font-medium border-l-2 border-accent pl-2'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                {item.text}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
