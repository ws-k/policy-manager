import { createClient } from '@/lib/supabase/server'
import { DomainsClient } from './domains-client'
import type { PolicyDomain } from '@/lib/types'

export type DomainWithCount = PolicyDomain & { policy_count: number }

export default async function DomainsPage() {
  const supabase = await createClient()

  const { data: domains } = await supabase
    .from('policy_domains')
    .select('*, policy_docs(count)')
    .order('sort_order', { ascending: true })

  const domainsWithCount: DomainWithCount[] = (domains ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    description: d.description,
    sort_order: d.sort_order,
    icon: d.icon,
    created_at: d.created_at,
    updated_at: d.updated_at,
    policy_count: Array.isArray(d.policy_docs) ? (d.policy_docs[0] as { count: number } | undefined)?.count ?? 0 : 0,
  }))

  return <DomainsClient initialDomains={domainsWithCount} />
}
