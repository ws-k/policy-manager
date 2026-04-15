import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Changelog, PolicyDoc } from '@/lib/types'

export interface ChangelogWithPolicy extends Changelog {
  policy: Pick<PolicyDoc, 'id' | 'title'>
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') ?? '10', 10)
  const policyId = searchParams.get('policy_id')

  let query = supabase
    .from('changelogs')
    .select('*, policy:policy_docs(id, title)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (policyId) {
    query = query.eq('policy_doc_id', policyId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ data: data as ChangelogWithPolicy[] })
}
