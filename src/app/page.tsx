import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { PolicyDomain, Changelog, PolicyDoc } from '@/lib/types'

export const revalidate = 60

interface DomainWithStats extends PolicyDomain {
  policy_count: number
  last_updated: string | null
}

interface ChangelogWithPolicy extends Changelog {
  policy: Pick<PolicyDoc, 'id' | 'title'>
}

interface StaleDraft {
  id: string
  title: string
  updated_at: string
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 30) return `${days}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR')
}

const CHANGE_TYPE_LABELS: Record<string, { label: string; className: string }> = {
  create: { label: '생성', className: 'bg-surface-tertiary text-content-secondary' },
  update: { label: '수정', className: 'bg-surface-tertiary text-content-secondary' },
  publish: { label: '게시', className: 'bg-accent-subtle text-accent' },
  unpublish: { label: '게시 취소', className: 'bg-surface-tertiary text-content-tertiary' },
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalCount },
    { count: draftCount },
    { count: publishedCount },
    { data: domains },
    { data: allPolicies },
    { data: changelogs },
    { data: rawStaleDrafts },
  ] = await Promise.all([
    supabase.from('policy_docs').select('*', { count: 'exact', head: true }),
    supabase.from('policy_docs').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('policy_docs').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('policy_domains').select('*').order('sort_order', { ascending: true }),
    supabase.from('policy_docs').select('id, domain_id, updated_at').order('updated_at', { ascending: false }),
    supabase.from('changelogs').select('*, policy:policy_docs(id, title)').order('created_at', { ascending: false }).limit(10),
    supabase
      .from('policy_docs')
      .select('id, title, updated_at')
      .eq('status', 'draft')
      .lt('updated_at', fourteenDaysAgo)
      .order('updated_at', { ascending: true })
      .limit(5),
  ])

  const staleDrafts = (rawStaleDrafts ?? []) as StaleDraft[]

  // Compute per-domain stats
  const domainStats = ((domains ?? []) as PolicyDomain[]).map((domain) => {
    const domainPolicies = (allPolicies ?? []).filter((p) => p.domain_id === domain.id)
    const last = domainPolicies[0]?.updated_at ?? null
    return {
      ...domain,
      policy_count: domainPolicies.length,
      last_updated: last,
    } as DomainWithStats
  })

  const recentChanges = (changelogs ?? []) as ChangelogWithPolicy[]

  return (
    <div className="space-y-10">
      {/* Summary cards */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-4">정책 현황</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface-primary rounded-2xl p-6 border border-line-primary shadow-sm">
            <p className="text-content-secondary text-sm font-medium mb-3">전체 정책</p>
            <p className="text-content-primary text-4xl font-bold tabular-nums">{totalCount ?? 0}</p>
          </div>
          <div className="bg-surface-primary rounded-2xl p-6 border border-line-primary shadow-sm">
            <p className="text-content-secondary text-sm font-medium mb-3">임시저장</p>
            <p className="text-content-primary text-4xl font-bold tabular-nums">{draftCount ?? 0}</p>
          </div>
          <div className="bg-surface-primary rounded-2xl p-6 border border-line-primary shadow-sm">
            <p className="text-content-secondary text-sm font-medium mb-3">게시됨</p>
            <p className="text-content-primary text-4xl font-bold tabular-nums">{publishedCount ?? 0}</p>
          </div>
        </div>
      </section>

      {/* Action insights */}
      {staleDrafts.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-4">액션이 필요한 항목</h2>
          <div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-amber-900">오래된 초안</p>
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900 tabular-nums">
                  {staleDrafts.length}개
                </span>
              </div>
              <p className="mb-3 text-xs text-amber-700">14일 이상 수정되지 않은 초안입니다.</p>
              <ul className="space-y-1.5">
                {staleDrafts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-xs text-amber-800">{p.title}</span>
                    <Link
                      href={`/policies/${p.id}/edit`}
                      className="shrink-0 rounded border border-amber-300 bg-white px-2 py-0.5 text-xs text-amber-700 hover:bg-amber-100 transition-colors"
                    >
                      편집
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Domain cards */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-4">영역별 정책</h2>
        {domainStats.length === 0 ? (
          <p className="text-content-tertiary text-sm">등록된 영역이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {domainStats.map((domain) => (
              <Link
                key={domain.id}
                href={`/policies?domain=${domain.id}`}
                className="bg-surface-primary rounded-2xl p-6 border border-line-primary shadow-sm hover:shadow-md hover:border-line-secondary transition-all"
              >
                <p className="text-content-primary font-medium text-sm truncate">{domain.name}</p>
                <p className="text-content-primary text-3xl font-bold tabular-nums mt-2">
                  {domain.policy_count}
                  <span className="text-content-tertiary text-sm font-normal ml-1">개</span>
                </p>
                <p className="text-content-tertiary text-xs mt-2">
                  최근 수정:{' '}
                  {domain.last_updated ? relativeTime(domain.last_updated) : '—'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent changelog feed */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-content-tertiary mb-4">최근 변경 내역</h2>
        {recentChanges.length === 0 ? (
          <p className="text-content-tertiary text-sm">아직 변경 기록이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {recentChanges.map((log) => {
              const badge = CHANGE_TYPE_LABELS[log.change_type] ?? {
                label: log.change_type,
                className: 'bg-surface-tertiary text-content-tertiary',
              }
              return (
                <li
                  key={log.id}
                  className="bg-surface-primary rounded-xl px-5 py-4 border border-line-primary flex items-start gap-4"
                >
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full mt-0.5 ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/policies/${log.policy_doc_id}`}
                      className="text-content-primary text-sm font-medium hover:underline truncate block"
                    >
                      {log.policy?.title ?? '(삭제된 정책)'}
                    </Link>
                    <p className="text-content-secondary text-xs mt-0.5 line-clamp-2">{log.summary}</p>
                  </div>
                  <time className="shrink-0 text-content-tertiary text-xs tabular-nums whitespace-nowrap">
                    {relativeTime(log.created_at)}
                  </time>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
