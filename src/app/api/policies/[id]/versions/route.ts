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

  // Get the slug for this policy
  const { data: doc } = await supabase
    .from('policy_docs')
    .select('slug')
    .eq('id', id)
    .single()

  if (!doc) {
    return NextResponse.json({ error: '정책을 찾을 수 없습니다.', code: 'NOT_FOUND' }, { status: 404 })
  }

  // Get all versions with the same slug
  const { data, error } = await supabase
    .from('policy_docs')
    .select('*, domain:policy_domains(*)')
    .eq('slug', doc.slug)
    .order('version', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
