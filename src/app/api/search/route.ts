import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type SearchResult = {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
  domain_name: string | null
  snippet: string
  match_in: 'title' | 'content' | 'section'
  section_title?: string
}

function extractSnippet(content: string | null, q: string): string {
  if (!content) return ''
  const lower = content.toLowerCase()
  const idx = lower.indexOf(q.toLowerCase())
  if (idx === -1) return content.slice(0, 120) + (content.length > 120 ? '...' : '')
  const start = Math.max(0, idx - 60)
  const end = Math.min(content.length, idx + q.length + 60)
  const prefix = start > 0 ? '...' : ''
  const suffix = end < content.length ? '...' : ''
  return prefix + content.slice(start, end) + suffix
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''

  if (!q) {
    return NextResponse.json({ data: [] })
  }

  const supabase = await createClient()

  // Query policy_docs
  const { data: docs, error: docsError } = await supabase
    .from('policy_docs')
    .select('id, title, slug, status, content_text, domain:policy_domains(name), updated_at')
    .or(`title.ilike.%${q}%,content_text.ilike.%${q}%`)
    .order('updated_at', { ascending: false })
    .limit(30)

  if (docsError) {
    return NextResponse.json({ error: docsError.message }, { status: 500 })
  }

  // Deduplicate by slug (keep first = most recently updated)
  const seenSlugs = new Set<string>()
  const seenDocIds = new Set<string>()
  const results: SearchResult[] = []

  for (const doc of docs ?? []) {
    if (seenSlugs.has(doc.slug)) continue
    seenSlugs.add(doc.slug)
    seenDocIds.add(doc.id)

    const titleMatch = doc.title.toLowerCase().includes(q.toLowerCase())
    const match_in: 'title' | 'content' = titleMatch ? 'title' : 'content'
    const domainData = doc.domain as unknown as { name: string } | null

    results.push({
      id: doc.id,
      title: doc.title,
      slug: doc.slug,
      status: doc.status as 'draft' | 'published',
      domain_name: domainData?.name ?? null,
      snippet: extractSnippet(doc.content_text, q),
      match_in,
    })
  }

  // Query policy_sections
  const { data: sections } = await supabase
    .from('policy_sections')
    .select('id, title, policy_doc_id, policy_docs(id, title, slug, status, domain:policy_domains(name))')
    .ilike('title', `%${q}%`)
    .limit(10)

  for (const section of sections ?? []) {
    const policyDoc = section.policy_docs as unknown as {
      id: string
      title: string
      slug: string
      status: string
      domain: { name: string } | null
    } | null
    if (!policyDoc) continue
    if (seenDocIds.has(policyDoc.id)) continue
    seenDocIds.add(policyDoc.id)

    results.push({
      id: policyDoc.id,
      title: policyDoc.title,
      slug: policyDoc.slug,
      status: policyDoc.status as 'draft' | 'published',
      domain_name: policyDoc.domain?.name ?? null,
      snippet: '',
      match_in: 'section',
      section_title: section.title,
    })
  }

  // Sort: title matches first, then section, then content
  const order = { title: 0, section: 1, content: 2 }
  results.sort((a, b) => order[a.match_in] - order[b.match_in])

  return NextResponse.json({ data: results.slice(0, 15) })
}
