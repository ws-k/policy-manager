import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = await request.json() as { feature_id: string; section_id: string; note?: string }
  const { feature_id, section_id, note } = body

  if (!feature_id || !section_id) {
    return NextResponse.json({ error: '기능 ID와 섹션 ID를 입력해주세요.', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const { data: sectionRow } = await supabase
    .from('policy_sections')
    .select('policy_doc_id')
    .eq('id', section_id)
    .single()

  const { data, error } = await supabase
    .from('feature_policies')
    .insert({ feature_id, section_id, note: note ?? null, policy_doc_id: sectionRow?.policy_doc_id ?? null })
    .select()
    .single()

  if (error) {
    // Unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json({ error: '이미 연결된 섹션입니다.', code: 'ALREADY_LINKED' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const feature_id = searchParams.get('feature_id')
  const section_id = searchParams.get('section_id')

  if (id) {
    const { error } = await supabase
      .from('feature_policies')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
    }

    return NextResponse.json({ data: { id } })
  }

  if (!feature_id || !section_id) {
    return NextResponse.json({ error: 'feature_id와 section_id가 필요합니다.', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const { error } = await supabase
    .from('feature_policies')
    .delete()
    .eq('feature_id', feature_id)
    .eq('section_id', section_id)

  if (error) {
    return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ data: { feature_id, section_id } })
}
