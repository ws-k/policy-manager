import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('policy_sections')
    .select('*')
    .eq('policy_doc_id', id)
    .order('sort_order')

  if (error) {
    return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = await request.json() as { title: string }
  const { title } = body

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return NextResponse.json({ error: '섹션 제목을 입력해주세요.', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  // Get current max sort_order
  const { data: existing } = await supabase
    .from('policy_sections')
    .select('sort_order')
    .eq('policy_doc_id', id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSortOrder = existing ? existing.sort_order + 1 : 1

  const { data, error } = await supabase
    .from('policy_sections')
    .insert({ policy_doc_id: id, title: title.trim(), sort_order: nextSortOrder })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
