import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { DomainsClient } from './domains-client'
import type { PolicyDomain } from '@/lib/types'

const DEFAULT_PROJECT_ID = '00000000-0000-0000-0000-000000000001'

export type DomainWithCount = PolicyDomain & { policy_count: number }

export default async function DomainsPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const projectId = cookieStore.get('poli_project_id')?.value ?? DEFAULT_PROJECT_ID

  const { data: domains } = await supabase
    .from('policy_domains')
    .select('*, policy_docs(count)')
    .eq('project_id', projectId)
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
