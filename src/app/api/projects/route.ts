import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const archivedParam = searchParams.get('archived')
  const archivedFilter = archivedParam === 'true'

  const { data, error } = await supabase
    .from('projects')
    .select('id, name, created_at, archived')
    .eq('archived', archivedFilter)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { name } = await request.json() as { name: string }
  if (!name?.trim()) return NextResponse.json({ error: 'name은 필수입니다.' }, { status: 400 })

  const { data, error } = await supabase
    .from('projects')
    .insert({ name: name.trim(), created_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
