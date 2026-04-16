'use client'

import { useState, useMemo } from 'react'
import { diffLines, diffArrays } from 'diff'
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

/**
 * Splits an HTML string into tokens: HTML tags as atomic units, text nodes split by whitespace.
 * This allows word-level diffing without corrupting HTML structure.
 */
function tokenizeHtml(html: string): string[] {
  const tokens: string[] = []
  const re = /(<[^>]+\/?>|[^<]+)/g
  let match
  while ((match = re.exec(html)) !== null) {
    if (match[0].startsWith('<')) {
      tokens.push(match[0])
    } else {
      // Split text by whitespace, keeping the whitespace tokens
      const words = match[0].split(/(\s+)/)
      for (const w of words) {
        if (w) tokens.push(w)
      }
    }
  }
  return tokens
}

/**
 * Word-level (HTML-aware) diff of two HTML block strings.
 * Produces left HTML with removed words wrapped in diff-word-removed spans,
 * and right HTML with added words wrapped in diff-word-added spans.
 */
function inlineDiff(leftHtml: string, rightHtml: string): { leftInline: string; rightInline: string } {
  const leftTokens = tokenizeHtml(leftHtml)
  const rightTokens = tokenizeHtml(rightHtml)

  const changes = diffArrays(leftTokens, rightTokens)

  let leftContent = ''
  let rightContent = ''

  for (const change of changes) {
    const text = change.value.join('')
    if (change.removed) {
      leftContent += `<span class="diff-word-removed">${text}</span>`
    } else if (change.added) {
      rightContent += `<span class="diff-word-added">${text}</span>`
    } else {
      leftContent += text
      rightContent += text
    }
  }

  return { leftInline: leftContent, rightInline: rightContent }
}

function buildSideHtml(leftLines: string[], rightLines: string[]): {
  leftHtml: string
  rightHtml: string
  removedCount: number
  addedCount: number
} {
  const changes = diffLines(leftLines.join('\n'), rightLines.join('\n'))

  const leftParts: string[] = []
  const rightParts: string[] = []
  let removedCount = 0
  let addedCount = 0

  let i = 0
  while (i < changes.length) {
    const change = changes[i]

    if (!change.removed && !change.added) {
      // Unchanged blocks
      const blocks = change.value.split('\n').filter(Boolean)
      for (const block of blocks) {
        leftParts.push(block)
        rightParts.push(block)
      }
      i++
    } else if (change.removed) {
      const removedBlocks = change.value.split('\n').filter(Boolean)
      const next = changes[i + 1]

      if (next?.added) {
        // Modified blocks — pair for word-level diff
        const addedBlocks = next.value.split('\n').filter(Boolean)
        const len = Math.max(removedBlocks.length, addedBlocks.length)

        for (let j = 0; j < len; j++) {
          const lb = removedBlocks[j]
          const rb = addedBlocks[j]

          if (lb && rb) {
            const { leftInline, rightInline } = inlineDiff(lb, rb)
            leftParts.push(leftInline)
            rightParts.push(rightInline)
          } else if (lb) {
            leftParts.push(`<div class="diff-block-removed">${lb}</div>`)
            removedCount++
          } else if (rb) {
            rightParts.push(`<div class="diff-block-added">${rb}</div>`)
            addedCount++
          }
        }
        i += 2
      } else {
        // Pure deletion
        for (const block of removedBlocks) {
          leftParts.push(`<div class="diff-block-removed">${block}</div>`)
          removedCount++
        }
        i++
      }
    } else {
      // Pure insertion
      const addedBlocks = change.value.split('\n').filter(Boolean)
      for (const block of addedBlocks) {
        rightParts.push(`<div class="diff-block-added">${block}</div>`)
        addedCount++
      }
      i++
    }
  }

  return {
    leftHtml: leftParts.join(''),
    rightHtml: rightParts.join(''),
    removedCount,
    addedCount,
  }
}

const PROSE =
  '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-2 ' +
  '[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-1.5 ' +
  '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 ' +
  '[&_p]:my-2 [&_p]:leading-relaxed ' +
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 ' +
  '[&_blockquote]:border-l-4 [&_blockquote]:border-line-primary [&_blockquote]:pl-4 [&_blockquote]:my-3 [&_blockquote]:text-content-secondary ' +
  '[&_pre]:bg-surface-tertiary [&_pre]:rounded [&_pre]:p-3 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:text-xs ' +
  '[&_code]:bg-surface-tertiary [&_code]:rounded [&_code]:px-1 [&_code]:text-xs ' +
  '[&_table]:w-full [&_table]:border-collapse [&_table]:my-3 ' +
  '[&_th]:border [&_th]:border-line-primary [&_th]:px-3 [&_th]:py-1.5 [&_th]:bg-surface-secondary [&_th]:text-left [&_th]:font-medium [&_th]:text-sm ' +
  '[&_td]:border [&_td]:border-line-primary [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-sm ' +
  '[&_hr]:my-6 [&_hr]:border-line-primary ' +
  '[&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through ' +
  '[&_mark]:bg-yellow-200 [&_a]:underline [&_a]:text-blue-600 ' +
  // Inline word-level diff
  '[&_.diff-word-removed]:bg-red-200 [&_.diff-word-removed]:line-through [&_.diff-word-removed]:rounded-sm ' +
  '[&_.diff-word-added]:bg-emerald-200 [&_.diff-word-added]:rounded-sm ' +
  // Block-level diff (whole block inserted/deleted)
  '[&_.diff-block-removed]:bg-red-100 [&_.diff-block-removed]:rounded [&_.diff-block-removed]:-mx-2 [&_.diff-block-removed]:px-2 ' +
  '[&_.diff-block-added]:bg-emerald-100 [&_.diff-block-added]:rounded [&_.diff-block-added]:-mx-2 [&_.diff-block-added]:px-2'

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

  const { leftHtml, rightHtml, removedCount, addedCount } = useMemo(() => {
    const leftLines = tiptapToHtmlLines(leftVersion.content)
    const rightLines = tiptapToHtmlLines(rightVersion.content)
    return buildSideHtml(leftLines, rightLines)
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
      <div className="mb-4 flex flex-wrap items-center gap-3">
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

        <div className="ml-auto flex items-center gap-4 text-xs text-content-tertiary">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-200" />
            삭제 {removedCount}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-200" />
            추가 {addedCount}
          </span>
        </div>
      </div>

      {leftId === rightId && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          같은 버전을 선택했습니다. 비교할 두 버전을 다르게 선택해 주세요.
        </div>
      )}

      {/* Side-by-side */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line-primary bg-line-primary">
        {/* Left — old version */}
        <div className="bg-surface-primary">
          <div className="flex items-center gap-2 border-b border-line-primary bg-red-50 px-4 py-2.5">
            <span className="text-xs font-medium text-content-secondary">v{leftVersion.version}</span>
            <StatusBadge status={leftVersion.status} />
            <span className="ml-auto text-xs text-red-500">이전</span>
          </div>
          <div
            className={`p-6 text-sm text-content-primary ${PROSE}`}
            dangerouslySetInnerHTML={{ __html: leftHtml }}
          />
        </div>

        {/* Right — new version */}
        <div className="bg-surface-primary">
          <div className="flex items-center gap-2 border-b border-line-primary bg-emerald-50 px-4 py-2.5">
            <span className="text-xs font-medium text-content-secondary">v{rightVersion.version}</span>
            <StatusBadge status={rightVersion.status} />
            <span className="ml-auto text-xs text-emerald-600">최신</span>
          </div>
          <div
            className={`p-6 text-sm text-content-primary ${PROSE}`}
            dangerouslySetInnerHTML={{ __html: rightHtml }}
          />
        </div>
      </div>
    </div>
  )
}
