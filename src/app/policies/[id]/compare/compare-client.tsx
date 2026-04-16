'use client'

import { useState, useMemo } from 'react'
import { diffLines } from 'diff'
import type { PolicyDoc } from '@/lib/types'
import { tiptapToHtmlLines } from '@/lib/tiptap-to-html'

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === 'published'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-surface-tertiary text-content-secondary border-line-primary'
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles}`}>
      {status === 'published' ? '게시됨' : '초안'}
    </span>
  )
}

type DiffLine =
  | { kind: 'equal'; text: string }
  | { kind: 'removed'; text: string }
  | { kind: 'added'; text: string }

function buildDiffLines(leftText: string, rightText: string): DiffLine[] {
  const changes = diffLines(leftText, rightText)
  const lines: DiffLine[] = []

  for (const change of changes) {
    const parts = change.value.split('\n').filter((l, i, arr) => l !== '' || i < arr.length - 1)
    if (change.removed) {
      for (const text of parts) lines.push({ kind: 'removed', text })
    } else if (change.added) {
      for (const text of parts) lines.push({ kind: 'added', text })
    } else {
      for (const text of parts) lines.push({ kind: 'equal', text })
    }
  }

  return lines
}

const inlineClass = '[&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through [&_mark]:bg-yellow-200 [&_a]:underline [&_a]:text-blue-600'

export function CompareClient({
  versions,
  currentId,
  initialRightId,
}: {
  versions: PolicyDoc[]
  currentId: string
  initialRightId?: string
}) {
  const getInitialIds = () => {
    if (initialRightId) {
      const rightIdx = versions.findIndex((v) => v.id === initialRightId)
      if (rightIdx > 0) {
        return { left: versions[rightIdx - 1].id, right: initialRightId }
      } else if (rightIdx === 0 && versions.length > 1) {
        return { left: initialRightId, right: versions[1].id }
      }
    }
    const defaultRight =
      versions[versions.length - 1].id !== versions[0].id
        ? versions[versions.length - 1].id
        : versions[1]?.id ?? versions[0].id
    return { left: versions[0].id, right: defaultRight }
  }

  const initial = getInitialIds()
  const [leftId, setLeftId] = useState(initial.left)
  const [rightId, setRightId] = useState(initial.right)

  const leftVersion = versions.find((v) => v.id === leftId) ?? versions[0]
  const rightVersion = versions.find((v) => v.id === rightId) ?? versions[versions.length - 1]

  const lines = useMemo(() => {
    const leftLines = tiptapToHtmlLines(leftVersion.content)
    const rightLines = tiptapToHtmlLines(rightVersion.content)
    return buildDiffLines(leftLines.join('\n'), rightLines.join('\n'))
  }, [leftVersion, rightVersion])

  const removedCount = lines.filter((l) => l.kind === 'removed').length
  const addedCount = lines.filter((l) => l.kind === 'added').length

  function swap() {
    setLeftId(rightId)
    setRightId(leftId)
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back link */}
      <a
        href={`/policies/${currentId}`}
        className="mb-4 inline-flex items-center gap-1 text-xs text-content-secondary hover:text-content-primary transition-colors"
      >
        ← 정책으로 돌아가기
      </a>

      <h1 className="mb-6 text-xl font-semibold text-content-primary">버전 비교</h1>

      {/* Controls */}
      <div className="mb-4 flex items-center gap-3">
        <select
          value={leftId}
          onChange={(e) => setLeftId(e.target.value)}
          className="rounded-md border border-line-primary bg-surface-primary px-3 py-1.5 text-xs text-content-primary focus:border-line-secondary focus:outline-none"
        >
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              v{v.version} — {v.status === 'published' ? '게시됨' : '초안'}
            </option>
          ))}
        </select>

        <button
          onClick={swap}
          className="rounded-md border border-line-primary bg-surface-primary px-2.5 py-1.5 text-xs text-content-secondary transition-colors hover:bg-surface-tertiary"
          title="버전 교체"
        >
          ⇄
        </button>

        <select
          value={rightId}
          onChange={(e) => setRightId(e.target.value)}
          className="rounded-md border border-line-primary bg-surface-primary px-3 py-1.5 text-xs text-content-primary focus:border-line-secondary focus:outline-none"
        >
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              v{v.version} — {v.status === 'published' ? '게시됨' : '초안'}
            </option>
          ))}
        </select>

        {/* Version meta */}
        <div className="ml-auto flex items-center gap-4 text-xs text-content-tertiary">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-200" />
            삭제 {removedCount}줄
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-200" />
            추가 {addedCount}줄
          </span>
        </div>
      </div>

      {leftId === rightId && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          같은 버전을 선택했습니다. 비교할 두 버전을 다르게 선택해 주세요.
        </div>
      )}

      {/* Unified diff */}
      <div className="overflow-hidden rounded-lg border border-line-primary">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line-primary bg-surface-secondary px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-content-secondary">
              v{leftVersion.version}
            </span>
            <StatusBadge status={leftVersion.status} />
            <span className="text-xs text-content-tertiary">→</span>
            <span className="text-xs text-content-secondary">
              v{rightVersion.version}
            </span>
            <StatusBadge status={rightVersion.status} />
          </div>
          <span className="truncate text-xs text-content-tertiary">{leftVersion.title}</span>
        </div>

        <div className="divide-y divide-line-primary font-mono text-xs">
          {lines.length === 0 && (
            <div className="px-4 py-8 text-center text-content-tertiary">
              두 버전의 내용이 동일합니다.
            </div>
          )}
          {lines.map((line, idx) => {
            if (line.kind === 'equal') {
              return (
                <div key={idx} className="flex gap-3 bg-surface-primary px-4 py-1.5 text-content-secondary">
                  <span className="w-4 select-none text-content-tertiary"> </span>
                  <span dangerouslySetInnerHTML={{ __html: line.text }} className={inlineClass} />
                </div>
              )
            }
            if (line.kind === 'removed') {
              return (
                <div key={idx} className="flex gap-3 bg-red-50 px-4 py-1.5 text-red-800">
                  <span className="w-4 select-none font-bold text-red-400">−</span>
                  <span dangerouslySetInnerHTML={{ __html: line.text }} className={inlineClass} />
                </div>
              )
            }
            // added
            return (
              <div key={idx} className="flex gap-3 bg-emerald-50 px-4 py-1.5 text-emerald-800">
                <span className="w-4 select-none font-bold text-emerald-500">+</span>
                <span dangerouslySetInnerHTML={{ __html: line.text }} className={inlineClass} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
