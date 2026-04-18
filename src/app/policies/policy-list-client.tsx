'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { PolicyDoc, PolicyDomain } from '@/lib/types'
import { StatusBadge } from '@/components/policy/StatusBadge'

interface Props {
  policies: PolicyDoc[]
  domains: PolicyDomain[]
  currentDomain: string
  currentStatus: string
  currentQuery: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const statusOptions = [
  { value: '', label: '전체 상태' },
  { value: 'draft', label: '초안' },
  { value: 'published', label: '게시됨' },
]

export function PolicyListClient({ policies, domains, currentDomain, currentStatus, currentQuery }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [statusOpen, setStatusOpen] = useState(false)
  const statusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      startTransition(() => {
        router.push(`/policies?${params.toString()}`)
      })
    },
    [router, searchParams]
  )

  return (
    <div className={isPending ? 'opacity-70 transition-opacity' : ''}>
      {/* Page Header */}
      <div className="mb-7 flex justify-end">
        <Link
          href="/policies/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <span className="text-base leading-none">+</span>
          새 정책
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {/* Domain chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => updateFilter('domain', '')}
            className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
              !currentDomain
                ? 'border-accent bg-accent text-white shadow-sm'
                : 'border-line-primary bg-surface-primary text-content-secondary hover:border-line-secondary hover:text-content-primary'
            }`}
          >
            전체
          </button>
          {domains.map((d) => (
            <button
              key={d.id}
              onClick={() => updateFilter('domain', d.id)}
              className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                currentDomain === d.id
                  ? 'border-accent bg-accent text-white shadow-sm'
                  : 'border-line-primary bg-surface-primary text-content-secondary hover:border-line-secondary hover:text-content-primary'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>

        {/* Status dropdown */}
        <div ref={statusRef} className="relative">
          <button
            onClick={() => setStatusOpen((o) => !o)}
            className="cursor-pointer flex items-center gap-2 rounded-lg border border-line-primary bg-surface-primary px-4 py-[9px] text-sm font-medium text-content-primary transition-colors hover:border-line-secondary"
          >
            {statusOptions.find((o) => o.value === currentStatus)?.label ?? '전체 상태'}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${statusOpen ? 'rotate-180' : ''}`}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {statusOpen && (
            <div className="absolute left-0 top-full z-10 mt-1 min-w-[120px] overflow-hidden rounded-lg border border-line-primary bg-surface-primary shadow-md">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { updateFilter('status', opt.value); setStatusOpen(false) }}
                  className={`cursor-pointer flex w-full items-center px-4 py-2 text-sm transition-colors hover:bg-surface-secondary ${currentStatus === opt.value ? 'font-semibold text-accent' : 'text-content-primary'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search input */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            updateFilter('q', fd.get('q') as string)
          }}
          className="ml-auto"
        >
          <input
            name="q"
            type="text"
            defaultValue={currentQuery}
            placeholder="정책 검색..."
            className="w-64 rounded-lg border border-line-primary bg-surface-primary px-4 py-2 text-sm text-content-primary outline-none placeholder:text-content-tertiary focus:border-accent transition-colors hover:border-line-secondary"
          />
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-line-primary bg-surface-primary shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line-primary bg-surface-secondary">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-content-secondary uppercase tracking-wide">제목</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-content-secondary uppercase tracking-wide">영역</th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-content-secondary uppercase tracking-wide">버전</th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-content-secondary uppercase tracking-wide">상태</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-content-secondary uppercase tracking-wide">최종 수정일</th>
            </tr>
          </thead>
          <tbody>
            {policies.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-sm text-content-tertiary">
                  정책이 없습니다.
                </td>
              </tr>
            ) : (
              policies.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/policies/${p.id}`)}
                  className="cursor-pointer border-b border-line-primary last:border-b-0 hover:bg-surface-secondary transition-colors"
                >
                  <td className="px-5 py-4 text-[15px] font-semibold text-content-primary">{p.title}</td>
                  <td className="px-5 py-4 text-sm text-content-secondary">{p.domain?.name ?? '-'}</td>
                  <td className="px-5 py-4 text-center text-sm tabular-nums text-content-secondary">v{p.version}</td>
                  <td className="px-5 py-4 text-center">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-5 py-4 text-right text-sm tabular-nums text-content-secondary">
                    {formatDate(p.updated_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
