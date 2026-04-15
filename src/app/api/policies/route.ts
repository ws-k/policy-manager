import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { tiptapJsonToPlainText } from '@/lib/tiptap-utils'

function generateSlug(title: string): string {
  const cleaned = title
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  // If slug contains non-ASCII (Korean), use policy-{short uuid} format
  if (/[^\x00-\x7F]/.test(cleaned)) {
    const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 8)
    return `policy-${uuid}`
  }

  return cleaned || `policy-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const domain = searchParams.get('domain')
  const status = searchParams.get('status')
  const q = searchParams.get('q')

  let query = supabase
    .from('policy_docs')
    .select('*, domain:policy_domains(*)')
    .order('updated_at', { ascending: false })

  if (domain) {
    query = query.eq('domain_id', domain)
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (q) {
    query = query.or(`title.ilike.%${q}%,content_text.ilike.%${q}%`)
  }

  const { data, error } = await query

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

  const body = await request.json()
  const { title, domain_id, content, is_public, slug: customSlug, status: reqStatus, summary } = body as {
    title: string
    domain_id: string
    content?: Record<string, unknown>
    is_public?: boolean
    slug?: string
    status?: 'draft' | 'published'
    summary?: string
  }

  if (!title || !domain_id) {
    return NextResponse.json({ error: 'title과 domain_id는 필수입니다.', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  let slug = customSlug || generateSlug(title)

  // Check for slug uniqueness (with version 1)
  const { data: existing } = await supabase
    .from('policy_docs')
    .select('id')
    .eq('slug', slug)
    .eq('version', 1)
    .maybeSingle()

  if (existing) {
    slug = `${slug}-${crypto.randomUUID().replace(/-/g, '').slice(0, 4)}`
  }

  const { data: doc, error: docError } = await supabase
    .from('policy_docs')
    .insert({
      title,
      domain_id,
      slug,
      version: 1,
      status: reqStatus === 'published' ? 'published' : 'draft',
      content: content ?? {},
      content_text: content ? tiptapJsonToPlainText(content) : '',
      is_public: is_public ?? false,
      published_at: reqStatus === 'published' ? new Date().toISOString() : null,
      created_by: user.id,
    })
    .select('*, domain:policy_domains(*)')
    .single()

  if (docError) {
    return NextResponse.json({ error: docError.message, code: 'DB_ERROR' }, { status: 500 })
  }

  // Create changelog
  await supabase.from('changelogs').insert({
    policy_doc_id: doc.id,
    version: 1,
    change_type: 'create',
    summary: summary || `정책 "${title}" 생성`,
    changed_by: user.id,
  })

  return NextResponse.json({ data: doc }, { status: 201 })
}
