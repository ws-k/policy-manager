'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type SearchResult = {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
  domain_name: string | null
  snippet: string
  match_in: 'title' | 'content' | 'section'
  section_title?: string
}

function highlight(text: string, query: string) {
  if (!query || !text) return <>{text}</>
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-100 text-yellow-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

export function SearchModal() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  const openModal = useCallback(() => {
    setOpen(true)
    setQuery('')
    setResults([])
    setSelectedIdx(-1)
  }, [])

  const closeModal = useCallback(() => {
    setOpen(false)
    setQuery('')
    setResults([])
    setSelectedIdx(-1)
  }, [])

  const navigateTo = useCallback(
    (result: SearchResult) => {
      router.push('/policies/' + result.id)
      closeModal()
    },
    [router, closeModal]
  )

  // Keyboard shortcut + custom event
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openModal()
      }
      if (e.key === 'Escape') {
        closeModal()
      }
    }
    function onOpenSearch() {
      openModal()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('open-search', onOpenSearch)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('open-search', onOpenSearch)
    }
  }, [openModal, closeModal])

  // Auto-focus
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const json = await res.json() as { data: SearchResult[] }
        setResults(json.data ?? [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
      setSelectedIdx(-1)
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // Arrow key / Enter navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      if (selectedIdx >= 0 && results[selectedIdx]) {
        navigateTo(results[selectedIdx])
      }
    }
  }

  const titleMatches = results.filter((r) => r.match_in === 'title' || r.match_in === 'section')
  const contentMatches = results.filter((r) => r.match_in === 'content')

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40"
      onClick={closeModal}
    >
      <div
        className="w-full max-w-2xl mx-4 rounded-xl border border-line-primary bg-surface-primary shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="정책 검색..."
          className="w-full px-5 py-4 text-base border-b border-line-primary outline-none bg-transparent placeholder:text-content-tertiary text-content-primary"
        />

        {/* Results */}
        <div className="max-h-[520px] overflow-y-auto divide-y divide-line-primary">
          {loading && (
            <div className="px-5 py-8 text-sm text-content-tertiary opacity-60 animate-pulse">
              검색 중...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="px-5 py-8 text-sm text-content-tertiary">검색 결과 없음</div>
          )}

          {!loading && results.length > 0 && (
            <>
              {titleMatches.length > 0 && (
                <>
                  <div className="px-5 py-2 text-xs font-medium text-content-tertiary bg-surface-secondary">
                    제목 일치
                  </div>
                  {titleMatches.map((result, i) => {
                    const globalIdx = i
                    return (
                      <ResultItem
                        key={result.id + result.match_in}
                        result={result}
                        query={query}
                        isSelected={selectedIdx === globalIdx}
                        onClick={() => navigateTo(result)}
                      />
                    )
                  })}
                </>
              )}

              {contentMatches.length > 0 && (
                <>
                  <div className="px-5 py-2 text-xs font-medium text-content-tertiary bg-surface-secondary">
                    내용 일치
                  </div>
                  {contentMatches.map((result, i) => {
                    const globalIdx = titleMatches.length + i
                    return (
                      <ResultItem
                        key={result.id + result.match_in}
                        result={result}
                        query={query}
                        isSelected={selectedIdx === globalIdx}
                        onClick={() => navigateTo(result)}
                      />
                    )
                  })}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 text-sm text-content-tertiary border-t border-line-primary flex gap-4">
          <span>↑↓ 이동</span>
          <span>Enter 열기</span>
          <span>Esc 닫기</span>
        </div>
      </div>
    </div>
  )
}

function ResultItem({
  result,
  query,
  isSelected,
  onClick,
}: {
  result: SearchResult
  query: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'cursor-pointer w-full text-left px-5 py-4 flex flex-col gap-1 transition-colors',
        isSelected ? 'bg-surface-tertiary' : 'hover:bg-surface-secondary',
      ].join(' ')}
    >
      <div className="flex items-center gap-2">
        <span className="text-base font-medium text-content-primary">
          {highlight(result.title, query)}
        </span>
        {result.status === 'published' ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 font-medium">
            게시됨
          </span>
        ) : (
          <span className="rounded-full bg-surface-tertiary px-2 py-0.5 text-xs text-content-tertiary font-medium">
            초안
          </span>
        )}
      </div>

      {result.domain_name && (
        <span className="text-sm text-content-tertiary">{result.domain_name}</span>
      )}

      {result.match_in === 'section' && result.section_title && (
        <span className="text-sm text-content-secondary">
          섹션: {highlight(result.section_title, query)}
        </span>
      )}

      {result.snippet && (
        <span className="text-sm text-content-secondary line-clamp-2">
          {highlight(result.snippet, query)}
        </span>
      )}
    </button>
  )
}
