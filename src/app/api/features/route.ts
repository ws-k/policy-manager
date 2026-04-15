import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = await request.json() as {
    name?: string
    slug?: string
    description?: string
    screen_path?: string
  }
  const { name, slug, description, screen_path } = body

  if (!name || !slug) {
    return NextResponse.json({ error: 'name과 slug는 필수입니다.', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('features')
    .insert({ name, slug, description: description ?? null, screen_path: screen_path ?? null })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('features')
    .select(`
      *,
      feature_policies (
        id,
        note,
        policy_sections:section_id (
          id,
          title,
          policy_docs:policy_doc_id (
            id,
            title,
            status,
            domain:policy_domains(id, name)
          )
        )
      )
    `)
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
