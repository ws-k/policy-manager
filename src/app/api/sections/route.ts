import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_PROJECT_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const cookieStore = await cookies()
  const projectId = cookieStore.get('poli_project_id')?.value ?? DEFAULT_PROJECT_ID

  const { data, error } = await supabase
    .from('policy_sections')
    .select('*, policy_docs:policy_doc_id!inner(id, title, status, project_id)')
    .eq('policy_docs.project_id', projectId)
    .order('policy_doc_id')
    .order('sort_order')

  if (error) {
    return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
  }

  // Lazy sync: find policy_docs that have content but no sections yet
  const sectionedDocIds = [...new Set((data ?? []).map((s) => s.policy_doc_id as string))]

  let unsyncedQuery = supabase.from('policy_docs').select('id, content').eq('project_id', projectId)
  if (sectionedDocIds.length > 0) {
    unsyncedQuery = unsyncedQuery.not('id', 'in', `(${sectionedDocIds.join(',')})`)
  }
  const { data: unsyncedDocs } = await unsyncedQuery

  const docsToSync = (unsyncedDocs ?? []).filter(
    (d) => d.content && typeof d.content === 'object' && Object.keys(d.content).length > 0
  )

  if (docsToSync.length > 0) {
    const { syncPolicySections } = await import('@/lib/sync-sections')
    await Promise.all(
      docsToSync.map((d) =>
        syncPolicySections(supabase, d.id, d.content as Record<string, unknown>)
      )
    )

    // Re-fetch with newly synced sections
    const { data: refreshed, error: refreshError } = await supabase
      .from('policy_sections')
      .select('*, policy_docs:policy_doc_id!inner(id, title, status, project_id)')
      .eq('policy_docs.project_id', projectId)
      .order('policy_doc_id')
      .order('sort_order')

    if (refreshError) {
      return NextResponse.json({ error: refreshError.message, code: 'DB_ERROR' }, { status: 500 })
    }

    return NextResponse.json({ data: refreshed ?? [] })
  }

  return NextResponse.json({ data: data ?? [] })
}
