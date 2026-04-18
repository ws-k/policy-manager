import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const { name } = await request.json() as { name: string }
  if (!name?.trim()) return NextResponse.json({ error: 'name은 필수입니다.' }, { status: 400 })

  const { data, error } = await supabase
    .from('projects')
    .update({ name: name.trim(), updated_at: new Date().toISOString() })
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

  // 기본 프로젝트는 삭제 불가
  if (id === '00000000-0000-0000-0000-000000000001') {
    return NextResponse.json({ error: '기본 프로젝트는 삭제할 수 없습니다.' }, { status: 400 })
  }

  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: null })
}
