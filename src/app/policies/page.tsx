import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { PolicyDoc, PolicyDomain } from '@/lib/types'
import { PolicyListClient } from './policy-list-client'

const DEFAULT_PROJECT_ID = '00000000-0000-0000-0000-000000000001'

interface SearchParams {
  domain?: string
  status?: string
  q?: string
}

export default async function PoliciesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const cookieStore = await cookies()
  const projectId = cookieStore.get('poli_project_id')?.value ?? DEFAULT_PROJECT_ID

  // Fetch domains
  const { data: domains } = await supabase
    .from('policy_domains')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })

  // Fetch policies with filters
  let query = supabase
    .from('policy_docs')
    .select('*, domain:policy_domains(*)')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false })

  if (sp.domain) {
    query = query.eq('domain_id', sp.domain)
  }
  if (sp.status) {
    query = query.eq('status', sp.status)
  }
  if (sp.q) {
    query = query.or(`title.ilike.%${sp.q}%,content_text.ilike.%${sp.q}%`)
  }

  const { data: rawPolicies } = await query

  // Deduplicate by slug — keep only the latest version per policy
  const latestBySlug = new Map<string, PolicyDoc>()
  for (const doc of (rawPolicies ?? []) as PolicyDoc[]) {
    const existing = latestBySlug.get(doc.slug)
    if (!existing || doc.version > existing.version) {
      latestBySlug.set(doc.slug, doc)
    }
  }
  const policies = Array.from(latestBySlug.values())
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  return (
    <PolicyListClient
      policies={policies}
      domains={(domains ?? []) as PolicyDomain[]}
      currentDomain={sp.domain ?? ''}
      currentStatus={sp.status ?? ''}
      currentQuery={sp.q ?? ''}
    />
  )
}
