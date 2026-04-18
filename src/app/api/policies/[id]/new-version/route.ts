import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  // Fetch existing policy
  const { data: source } = await supabase
    .from('policy_docs')
    .select('*')
    .eq('id', id)
    .single()

  if (!source) {
    return NextResponse.json({ error: '정책을 찾을 수 없습니다.', code: 'NOT_FOUND' }, { status: 404 })
  }

  if (source.status !== 'published') {
    return NextResponse.json({ error: '게시된 정책만 새 버전을 생성할 수 있습니다.', code: 'NOT_PUBLISHED' }, { status: 400 })
  }

  const newVersion = source.version + 1

  // Check if a draft version already exists for this slug
  const { data: existingDraft } = await supabase
    .from('policy_docs')
    .select('id')
    .eq('slug', source.slug)
    .eq('status', 'draft')
    .maybeSingle()

  if (existingDraft) {
    return NextResponse.json(
      { error: '이미 초안 버전이 존재합니다.', code: 'DRAFT_EXISTS' },
      { status: 400 }
    )
  }

  // Create new version
  const { data: newDoc, error: docError } = await supabase
    .from('policy_docs')
    .insert({
      project_id: source.project_id,
      domain_id: source.domain_id,
      title: source.title,
      slug: source.slug,
      version: newVersion,
      status: 'draft',
      content: source.content,
      content_text: source.content_text,
      is_public: source.is_public,
      parent_version_id: source.id,
      created_by: user.id,
    })
    .select('*, domain:policy_domains(*)')
    .single()

  if (docError) {
    return NextResponse.json({ error: docError.message, code: 'DB_ERROR' }, { status: 500 })
  }

  // Copy sections
  const { data: sections } = await supabase
    .from('policy_sections')
    .select('*')
    .eq('policy_doc_id', id)
    .order('sort_order', { ascending: true })

  if (sections && sections.length > 0) {
    for (const section of sections) {
      const { data: newSection } = await supabase
        .from('policy_sections')
        .insert({
          policy_doc_id: newDoc.id,
          title: section.title,
          sort_order: section.sort_order,
          anchor_id: section.anchor_id,
        })
        .select()
        .single()

      if (newSection) {
        // Copy feature_policies for this section
        const { data: fps } = await supabase
          .from('feature_policies')
          .select('*')
          .eq('section_id', section.id)

        if (fps && fps.length > 0) {
          await supabase.from('feature_policies').insert(
            fps.map((fp) => ({
              feature_id: fp.feature_id,
              section_id: newSection.id,
              note: fp.note,
              policy_doc_id: newDoc.id,
            }))
          )
        }
      }
    }
  }

  // Create changelog
  await supabase.from('changelogs').insert({
    policy_doc_id: newDoc.id,
    version: newVersion,
    change_type: 'create',
    summary: `정책 "${source.title}" v${newVersion} 생성 (v${source.version} 기반)`,
    changed_by: user.id,
  })

  return NextResponse.json({ data: newDoc }, { status: 201 })
}
