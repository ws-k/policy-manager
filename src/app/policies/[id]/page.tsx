import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { PolicyDoc, Changelog } from '@/lib/types'
import { PolicyDetailClient } from './policy-detail-client'

export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: policy } = await supabase
    .from('policy_docs')
    .select('*, domain:policy_domains(*)')
    .eq('id', id)
    .single()

  if (!policy) {
    notFound()
  }

  const { data: changelogs } = await supabase
    .from('changelogs')
    .select('*')
    .eq('policy_doc_id', id)
    .order('created_at', { ascending: false })

  return (
    <PolicyDetailClient
      policy={policy as PolicyDoc}
      changelogs={(changelogs ?? []) as Changelog[]}
    />
  )
}
