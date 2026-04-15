import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { PolicyDomain, Changelog, PolicyDoc } from '@/lib/types'

interface DomainWithStats extends PolicyDomain {
  policy_count: number
  last_updated: string | null
}

interface ChangelogWithPolicy extends Changelog {
  policy: Pick<PolicyDoc, 'id' | 'title'>
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
  create: { label: '생성', className: 'bg-surface-secondary text-content-secondary' },
  update: { label: '수정', className: 'bg-surface-secondary text-content-secondary' },
  publish: { label: '게시', className: 'bg-accent text-accent-text' },
  unpublish: { label: '게시 취소', className: 'bg-surface-tertiary text-content-tertiary' },
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch summary counts
  const [{ count: totalCount }, { count: draftCount }, { count: publishedCount }] =
    await Promise.all([
      supabase.from('policy_docs').select('*', { count: 'exact', head: true }),
      supabase.from('policy_docs').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
      supabase.from('policy_docs').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    ])

  // Fetch domains
  const { data: domains } = await supabase
    .from('policy_domains')
    .select('*')
    .order('sort_order', { ascending: true })

  // Fetch all policies (for domain stats)
  const { data: allPolicies } = await supabase
    .from('policy_docs')
    .select('id, domain_id, updated_at')
    .order('updated_at', { ascending: false })

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

  // Fetch recent changelogs
  const { data: changelogs } = await supabase
    .from('changelogs')
    .select('*, policy:policy_docs(id, title)')
    .order('created_at', { ascending: false })
    .limit(10)

  const recentChanges = (changelogs ?? []) as ChangelogWithPolicy[]

  return (
    <div className="space-y-8 p-6">
      {/* Summary cards */}
      <section>
        <h2 className="text-content-primary text-sm font-semibold mb-3">정책 현황</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface-secondary rounded-xl p-5 border border-line-primary">
            <p className="text-content-tertiary text-xs mb-1">전체 정책</p>
            <p className="text-content-primary text-3xl font-bold tabular-nums">{totalCount ?? 0}</p>
            <p className="text-content-tertiary text-xs mt-1">개 정책</p>
          </div>
          <div className="bg-surface-secondary rounded-xl p-5 border border-line-primary">
            <div className="flex items-center justify-between mb-1">
              <p className="text-content-tertiary text-xs">임시저장</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-tertiary text-content-secondary">draft</span>
            </div>
            <p className="text-content-primary text-3xl font-bold tabular-nums">{draftCount ?? 0}</p>
            <p className="text-content-tertiary text-xs mt-1">개 정책</p>
          </div>
          <div className="bg-surface-secondary rounded-xl p-5 border border-line-primary">
            <div className="flex items-center justify-between mb-1">
              <p className="text-content-tertiary text-xs">게시됨</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-text">published</span>
            </div>
            <p className="text-content-primary text-3xl font-bold tabular-nums">{publishedCount ?? 0}</p>
            <p className="text-content-tertiary text-xs mt-1">개 정책</p>
          </div>
        </div>
      </section>

      {/* Domain cards */}
      <section>
        <h2 className="text-content-primary text-sm font-semibold mb-3">영역별 정책</h2>
        {domainStats.length === 0 ? (
          <p className="text-content-tertiary text-sm">등록된 영역이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {domainStats.map((domain) => (
              <Link
                key={domain.id}
                href={`/policies?domain=${domain.id}`}
                className="bg-surface-secondary rounded-xl p-5 border border-line-primary hover:border-line-secondary transition-colors"
              >
                <p className="text-content-primary font-medium text-sm truncate">{domain.name}</p>
                <p className="text-content-primary text-2xl font-bold tabular-nums mt-2">
                  {domain.policy_count}
                  <span className="text-content-tertiary text-xs font-normal ml-1">개</span>
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
        <h2 className="text-content-primary text-sm font-semibold mb-3">최근 변경 내역</h2>
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
                  className="bg-surface-secondary rounded-xl px-5 py-4 border border-line-primary flex items-start gap-4"
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
