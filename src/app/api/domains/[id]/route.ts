import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { data: existing } = await supabase
    .from('policy_domains')
    .select('id')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: '도메인을 찾을 수 없습니다.', code: 'NOT_FOUND' }, { status: 404 })
  }

  const body = await request.json()
  const { name, slug, description, sort_order, icon } = body as {
    name?: string
    slug?: string
    description?: string
    sort_order?: number
    icon?: string
  }

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name
  if (slug !== undefined) updates.slug = slug
  if (description !== undefined) updates.description = description
  if (sort_order !== undefined) updates.sort_order = sort_order
  if (icon !== undefined) updates.icon = icon

  const { data, error } = await supabase
    .from('policy_domains')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { count, error: countError } = await supabase
    .from('policy_docs')
    .select('id', { count: 'exact', head: true })
    .eq('domain_id', id)

  if (countError) {
    return NextResponse.json({ error: countError.message, code: 'DB_ERROR' }, { status: 500 })
  }

  if (count && count > 0) {
    return NextResponse.json(
      { error: `연결된 정책 ${count}개가 있어 삭제할 수 없습니다.`, code: 'HAS_POLICIES' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('policy_domains')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ data: { id } })
}
