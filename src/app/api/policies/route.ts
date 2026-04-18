import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { tiptapJsonToPlainText } from '@/lib/tiptap-utils'

const DEFAULT_PROJECT_ID = '00000000-0000-0000-0000-000000000001'

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

  const cookieStore = await cookies()
  const projectId = cookieStore.get('poli_project_id')?.value ?? DEFAULT_PROJECT_ID

  const searchParams = request.nextUrl.searchParams
  const domain = searchParams.get('domain')
  const status = searchParams.get('status')
  const q = searchParams.get('q')

  let query = supabase
    .from('policy_docs')
    .select('*, domain:policy_domains(*)')
    .eq('project_id', projectId)
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

  // Deduplicate by slug — keep only the latest version per policy
  const latestBySlug = new Map<string, (typeof data)[0]>()
  for (const doc of data ?? []) {
    const existing = latestBySlug.get(doc.slug)
    if (!existing || doc.version > existing.version) {
      latestBySlug.set(doc.slug, doc)
    }
  }
  const result = Array.from(latestBySlug.values())
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  return NextResponse.json({ data: result })
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
      project_id: projectId,
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

  // Sync sections from H1/H2 headings
  if (content) {
    const { syncPolicySections } = await import('@/lib/sync-sections')
    await syncPolicySections(supabase, doc.id, content)
  }

  return NextResponse.json({ data: doc }, { status: 201 })
}
