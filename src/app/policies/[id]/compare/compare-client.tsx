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

type DiffRow =
  | { kind: 'equal'; text: string }
  | { kind: 'removed'; text: string }
  | { kind: 'added'; text: string }
  | { kind: 'pair'; left: string; right: string }

function buildDiffRows(leftText: string, rightText: string): DiffRow[] {
  const changes = diffLines(leftText, rightText)
  const rows: DiffRow[] = []

  let i = 0
  while (i < changes.length) {
    const cur = changes[i]
    const next = changes[i + 1]

    if (!cur.added && !cur.removed) {
      // unchanged — emit each line
      for (const line of cur.value.split('\n')) {
        if (line !== '' || i < changes.length - 1) {
          rows.push({ kind: 'equal', text: line })
        }
      }
      i++
    } else if (cur.removed && next?.added) {
      // modified block — pair removed lines with added lines
      const removedLines = cur.value.split('\n').filter((l) => l !== '' || cur.value.endsWith('\n'))
      const addedLines = next.value.split('\n').filter((l) => l !== '' || next.value.endsWith('\n'))
      const len = Math.max(removedLines.length, addedLines.length)
      for (let j = 0; j < len; j++) {
        rows.push({ kind: 'pair', left: removedLines[j] ?? '', right: addedLines[j] ?? '' })
      }
      i += 2
    } else if (cur.removed) {
      for (const line of cur.value.split('\n')) {
        if (line !== '') rows.push({ kind: 'removed', text: line })
      }
      i++
    } else if (cur.added) {
      for (const line of cur.value.split('\n')) {
        if (line !== '') rows.push({ kind: 'added', text: line })
      }
      i++
    } else {
      i++
    }
  }

  return rows
}

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

  const rows = useMemo(() => {
    const leftLines = tiptapToHtmlLines(leftVersion.content)
    const rightLines = tiptapToHtmlLines(rightVersion.content)
    return buildDiffRows(leftLines.join('\n'), rightLines.join('\n'))
  }, [leftVersion, rightVersion])

  function swap() {
    setLeftId(rightId)
    setRightId(leftId)
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Back link */}
      <a
        href={`/policies/${currentId}`}
        className="mb-4 inline-flex items-center gap-1 text-xs text-content-secondary hover:text-content-primary transition-colors"
      >
        ← 정책으로 돌아가기
      </a>

      <h1 className="mb-6 text-xl font-semibold text-content-primary">버전 비교</h1>

      {/* Controls */}
      <div className="mb-6 flex items-center gap-3">
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
      </div>

      {leftId === rightId && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          같은 버전을 선택했습니다. 비교할 두 버전을 다르게 선택해 주세요.
        </div>
      )}

      {/* Diff table */}
      <div className="overflow-hidden rounded-lg border border-line-primary">
        {/* Column headers */}
        <div className="grid grid-cols-2 border-b border-line-primary">
          <div className="flex items-center gap-2 border-r border-line-primary bg-surface-secondary px-4 py-3">
            <span className="text-sm font-medium text-content-primary">v{leftVersion.version}</span>
            <StatusBadge status={leftVersion.status} />
            <span className="ml-1 truncate text-xs text-content-tertiary">{leftVersion.title}</span>
          </div>
          <div className="flex items-center gap-2 bg-surface-secondary px-4 py-3">
            <span className="text-sm font-medium text-content-primary">v{rightVersion.version}</span>
            <StatusBadge status={rightVersion.status} />
            <span className="ml-1 truncate text-xs text-content-tertiary">{rightVersion.title}</span>
          </div>
        </div>

        {/* Diff rows */}
        <div className="divide-y divide-line-primary font-mono text-xs">
          {rows.length === 0 && (
            <div className="px-4 py-8 text-center text-content-tertiary">
              두 버전의 내용이 동일합니다.
            </div>
          )}
          {rows.map((row, idx) => {
            if (row.kind === 'equal') {
              return (
                <div key={idx} className="grid grid-cols-2">
                  <div className="border-r border-line-primary bg-surface-primary px-4 py-1.5 text-content-primary">
                    <span className="mr-2 select-none text-content-tertiary"> </span>
                    <span dangerouslySetInnerHTML={{ __html: row.text }} className="[&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through [&_mark]:bg-yellow-200 [&_a]:underline [&_a]:text-blue-600" />
                  </div>
                  <div className="bg-surface-primary px-4 py-1.5 text-content-primary">
                    <span className="mr-2 select-none text-content-tertiary"> </span>
                    <span dangerouslySetInnerHTML={{ __html: row.text }} className="[&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through [&_mark]:bg-yellow-200 [&_a]:underline [&_a]:text-blue-600" />
                  </div>
                </div>
              )
            }

            if (row.kind === 'removed') {
              return (
                <div key={idx} className="grid grid-cols-2">
                  <div className="border-r border-line-primary bg-red-50 px-4 py-1.5 text-red-800">
                    <span className="mr-2 select-none text-red-400">-</span>
                    <span dangerouslySetInnerHTML={{ __html: row.text }} className="[&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through [&_mark]:bg-yellow-200 [&_a]:underline [&_a]:text-blue-600" />
                  </div>
                  <div className="bg-surface-primary px-4 py-1.5" />
                </div>
              )
            }

            if (row.kind === 'added') {
              return (
                <div key={idx} className="grid grid-cols-2">
                  <div className="border-r border-line-primary bg-surface-primary px-4 py-1.5" />
                  <div className="bg-emerald-50 px-4 py-1.5 text-emerald-800">
                    <span className="mr-2 select-none text-emerald-400">+</span>
                    <span dangerouslySetInnerHTML={{ __html: row.text }} className="[&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through [&_mark]:bg-yellow-200 [&_a]:underline [&_a]:text-blue-600" />
                  </div>
                </div>
              )
            }

            // pair (modified)
            return (
              <div key={idx} className="grid grid-cols-2">
                <div className="border-r border-line-primary bg-amber-50 px-4 py-1.5 text-amber-800">
                  <span className="mr-2 select-none text-amber-400">~</span>
                  <span dangerouslySetInnerHTML={{ __html: row.left }} className="[&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through [&_mark]:bg-yellow-200 [&_a]:underline [&_a]:text-blue-600" />
                </div>
                <div className="bg-amber-50 px-4 py-1.5 text-amber-800">
                  <span className="mr-2 select-none text-amber-400">~</span>
                  <span dangerouslySetInnerHTML={{ __html: row.right }} className="[&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through [&_mark]:bg-yellow-200 [&_a]:underline [&_a]:text-blue-600" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
