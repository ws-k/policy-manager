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
    .from('policy_domains')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const cookieStore = await cookies()
  const projectId = cookieStore.get('poli_project_id')?.value ?? DEFAULT_PROJECT_ID

  const body = await request.json()
  const { name, slug, description, sort_order, icon } = body as {
    name: string
    slug: string
    description?: string
    sort_order?: number
    icon?: string
  }

  if (!name || !slug) {
    return NextResponse.json({ error: 'name과 slug는 필수입니다.', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('policy_domains')
    .insert({ name, slug, description: description ?? null, sort_order: sort_order ?? 0, icon: icon ?? null, project_id: projectId })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
