import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const body = await request.json() as { name?: string; archived?: boolean }

  if (body.name === undefined && body.archived === undefined) {
    return NextResponse.json({ error: 'name 또는 archived 필드가 필요합니다.' }, { status: 400 })
  }

  const updates: { name?: string; archived?: boolean; updated_at: string } = {
    updated_at: new Date().toISOString(),
  }
  if (body.name !== undefined) {
    if (!body.name.trim()) return NextResponse.json({ error: 'name은 빈 값일 수 없습니다.' }, { status: 400 })
    updates.name = body.name.trim()
  }
  if (body.archived !== undefined) {
    updates.archived = body.archived
  }

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { id } = await params

  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: null })
}
