import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { data: existing } = await supabase
    .from('policy_docs')
    .select('status, version, title')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: '정책을 찾을 수 없습니다.', code: 'NOT_FOUND' }, { status: 404 })
  }

  if (existing.status === 'published') {
    return NextResponse.json({ error: '이미 게시된 정책입니다.', code: 'ALREADY_PUBLISHED' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('policy_docs')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, domain:policy_domains(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
  }

  await supabase.from('changelogs').insert({
    policy_doc_id: id,
    version: existing.version,
    change_type: 'publish',
    summary: `정책 "${existing.title}" v${existing.version} 게시`,
    changed_by: user.id,
  })

  return NextResponse.json({ data })
}
