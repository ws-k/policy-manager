'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
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

export function PolicyListClient({ policies, domains, currentDomain, currentStatus, currentQuery }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

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
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-content-primary">정책 목록</span>
          <span className="text-content-secondary text-xs">|</span>
          <span className="text-xs text-content-secondary">
            총 {policies.length}건
          </span>
          <span className="text-xs text-content-secondary">
            초안 {policies.filter(p => p.status === 'draft').length}
          </span>
          <span className="text-xs text-content-secondary">
            게시됨 {policies.filter(p => p.status === 'published').length}
          </span>
        </div>
        <Link
          href="/policies/new"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-text transition-colors hover:opacity-90"
        >
          새 정책
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Domain chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => updateFilter('domain', '')}
            className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              !currentDomain
                ? 'border-accent bg-accent text-accent-text'
                : 'border-line-primary bg-surface-primary text-content-secondary hover:bg-surface-tertiary'
            }`}
          >
            전체
          </button>
          {domains.map((d) => (
            <button
              key={d.id}
              onClick={() => updateFilter('domain', d.id)}
              className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                currentDomain === d.id
                  ? 'border-accent bg-accent text-accent-text'
                  : 'border-line-primary bg-surface-primary text-content-secondary hover:bg-surface-tertiary'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>

        {/* Status select */}
        <select
          value={currentStatus}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="cursor-pointer rounded-md border border-line-primary bg-surface-primary px-3 py-1.5 text-xs text-content-primary outline-none focus:border-line-secondary"
        >
          <option value="">전체 상태</option>
          <option value="draft">초안</option>
          <option value="published">게시됨</option>
        </select>

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
            className="w-56 rounded-md border border-line-primary bg-surface-primary px-3 py-1.5 text-xs text-content-primary outline-none placeholder:text-content-tertiary focus:border-line-secondary"
          />
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-line-primary">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-primary bg-surface-secondary">
              <th className="px-4 py-3 text-left text-xs font-medium text-content-secondary">제목</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-content-secondary">영역</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-content-secondary">버전</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-content-secondary">상태</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-content-secondary">최종 수정일</th>
            </tr>
          </thead>
          <tbody>
            {policies.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-content-tertiary">
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
                  <td className="px-4 py-3 font-medium text-content-primary">{p.title}</td>
                  <td className="px-4 py-3 text-content-secondary">{p.domain?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-content-secondary">v{p.version}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-content-secondary">
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
