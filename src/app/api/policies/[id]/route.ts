import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { tiptapJsonToPlainText } from '@/lib/tiptap-utils'

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
    .from('policy_docs')
    .select('*, domain:policy_domains(*)')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: '정책을 찾을 수 없습니다.', code: 'NOT_FOUND' }, { status: 404 })
  }

  return NextResponse.json({ data })
}

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

  // Check current status
  const { data: existing } = await supabase
    .from('policy_docs')
    .select('status, version, title')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: '정책을 찾을 수 없습니다.', code: 'NOT_FOUND' }, { status: 404 })
  }

  if (existing.status === 'published') {
    return NextResponse.json(
      { error: '게시된 정책은 직접 수정할 수 없습니다. 새 버전을 생성해주세요.', code: 'POLICY_PUBLISHED' },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { title, content, is_public, domain_id, slug, status: reqStatus, summary } = body as {
    title?: string
    content?: Record<string, unknown>
    is_public?: boolean
    domain_id?: string
    slug?: string
    status?: 'draft' | 'published'
    summary?: string
  }

  const updates: Record<string, unknown> = {}
  if (title !== undefined) updates.title = title
  if (content !== undefined) {
    updates.content = content
    updates.content_text = tiptapJsonToPlainText(content)
  }
  if (is_public !== undefined) updates.is_public = is_public
  if (domain_id !== undefined) updates.domain_id = domain_id
  if (slug !== undefined) updates.slug = slug
  if (reqStatus === 'published') {
    updates.status = 'published'
    updates.published_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('policy_docs')
    .update(updates)
    .eq('id', id)
    .select('*, domain:policy_domains(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
  }

  // Create changelog
  await supabase.from('changelogs').insert({
    policy_doc_id: id,
    version: existing.version,
    change_type: 'update',
    summary: summary || `정책 "${data.title}" 수정`,
    changed_by: user.id,
  })

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

  const { data: existing } = await supabase
    .from('policy_docs')
    .select('status')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: '정책을 찾을 수 없습니다.', code: 'NOT_FOUND' }, { status: 404 })
  }

  if (existing.status === 'published') {
    return NextResponse.json(
      { error: '게시된 정책은 삭제할 수 없습니다.', code: 'POLICY_PUBLISHED' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('policy_docs')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ data: { id } })
}
