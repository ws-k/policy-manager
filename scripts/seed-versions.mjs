/**
 * Seed script: creates historical (v2, v3) versions of existing published policy docs
 * Usage: node scripts/seed-versions.mjs
 *
 * Logic:
 *  1. Fetch all policy_docs where status = 'published' and version = 1
 *  2. For each, create a v2 draft (modified content, parent_version_id = source.id)
 *  3. For the first 2 docs, also publish v2 and create a v3 draft on top of it
 *  4. Insert changelogs for every created doc
 */

const SUPABASE_URL = 'https://vpmblzdxtducrbkdchur.supabase.co'
const SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbWJsemR4dGR1Y3Jia2RjaHVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTYyMTA3MCwiZXhwIjoyMDkxMTk3MDcwfQ.l9krnGZLRHju2obROTdXP81Y358upnWZIqo-ts4gV5s'

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

// ─── Tiptap JSON helpers ──────────────────────────────────────────────────────

/**
 * Deep-clone content and apply revision modifications:
 *  - Appends " (개정)" to the first H1 text node
 *  - Adds a revision note paragraph at the end
 */
function appendRevisionNote(content) {
  const cloned = JSON.parse(JSON.stringify(content))

  // Modify first H1 text node
  const firstH1 = cloned.content?.find(
    (n) => n.type === 'heading' && n.attrs?.level === 1
  )
  if (firstH1?.content?.[0]) {
    firstH1.content[0].text += ' (개정)'
  }

  // Add revision note paragraph at end
  cloned.content = cloned.content ?? []
  cloned.content.push({
    type: 'paragraph',
    content: [
      {
        type: 'text',
        text: `[개정 ${new Date().toLocaleDateString('ko-KR')}] 본 버전은 이전 버전을 기반으로 내용이 일부 수정되었습니다.`,
      },
    ],
  })

  return cloned
}

/**
 * Extract plain text from Tiptap JSON for content_text column.
 * Mirrors the approach in seed-policies.mjs.
 */
function extractText(content) {
  return (content.content ?? [])
    .map((node) => {
      if (node.content) {
        return node.content
          .flatMap((c) => c.content?.map((t) => t.text ?? '') ?? [])
          .join(' ')
      }
      return ''
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'GET',
    headers,
  })
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function sbPost(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function sbPatch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  })
  return res.ok
}

// ─── Core logic ───────────────────────────────────────────────────────────────

/**
 * Insert a changelog row.
 */
async function insertChangelog({ policy_doc_id, version, change_type, summary, changed_by }) {
  await sbPost('changelogs', {
    policy_doc_id,
    version,
    change_type,
    summary,
    changed_by,
  })
}

/**
 * Create a new version document based on a source doc.
 * Returns the created doc record, or null on failure.
 */
async function createVersionDoc({
  source,
  newVersion,
  status,
  parentVersionId,
  publishedAt,
}) {
  const revisedContent = appendRevisionNote(source.content)

  const payload = {
    title: source.title,
    slug: source.slug,
    version: newVersion,
    status,
    content: revisedContent,
    content_text: extractText(revisedContent),
    domain_id: source.domain_id,
    is_public: source.is_public,
    parent_version_id: parentVersionId,
    published_at: publishedAt ?? null,
    created_by: source.created_by,
  }

  const result = await sbPost('policy_docs?select=id,title,version,status', payload)

  if (!Array.isArray(result) || !result[0]?.id) {
    console.error('    ❌ Insert failed:', result)
    return null
  }

  return result[0]
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Fetching published v1 policy docs...\n')

  const sourceDocs = await sbGet(
    'policy_docs?status=eq.published&version=eq.1&select=id,title,slug,version,status,content,domain_id,is_public,created_by'
  )

  if (!Array.isArray(sourceDocs) || sourceDocs.length === 0) {
    console.log('⚠️  No published v1 docs found. Run seed-policies.mjs first.')
    return
  }

  console.log(`Found ${sourceDocs.length} published v1 doc(s).\n`)
  console.log('─'.repeat(60))

  // First 2 docs get v2 published + v3 draft; the rest get only v2 draft
  const FULL_HISTORY_COUNT = 2

  for (let i = 0; i < sourceDocs.length; i++) {
    const source = sourceDocs[i]
    const doFullHistory = i < FULL_HISTORY_COUNT

    console.log(`\n📄 ${source.title} v${source.version} → creating v2 draft...`)

    // ── Step 1: Create v2 draft ──────────────────────────────────────────────
    const v2Draft = await createVersionDoc({
      source,
      newVersion: source.version + 1,
      status: 'draft',
      parentVersionId: source.id,
      publishedAt: null,
    })

    if (!v2Draft) continue
    console.log(`  ✅ v2 draft created (id: ${v2Draft.id})`)

    await insertChangelog({
      policy_doc_id: v2Draft.id,
      version: v2Draft.version,
      change_type: 'create',
      summary: `v${v2Draft.version} 초안 작성 — 내용 일부 개정`,
      changed_by: source.created_by,
    })

    if (!doFullHistory) continue

    // ── Step 2: Publish v2 (update status + published_at) ───────────────────
    console.log(`  ✅ v2 published, creating v3 draft...`)

    const publishedAt = new Date().toISOString()
    await sbPatch(`policy_docs?id=eq.${v2Draft.id}`, {
      status: 'published',
      published_at: publishedAt,
    })

    await insertChangelog({
      policy_doc_id: v2Draft.id,
      version: v2Draft.version,
      change_type: 'publish',
      summary: `v${v2Draft.version} 게시`,
      changed_by: source.created_by,
    })

    // Build a published source object for v3 creation
    const v2Published = {
      ...source,
      id: v2Draft.id,
      version: v2Draft.version,
      content: appendRevisionNote(source.content), // same revised content
    }

    // ── Step 3: Create v3 draft based on published v2 ───────────────────────
    const v3Draft = await createVersionDoc({
      source: v2Published,
      newVersion: v2Draft.version + 1,
      status: 'draft',
      parentVersionId: v2Draft.id,
      publishedAt: null,
    })

    if (!v3Draft) continue
    console.log(`  ✅ v3 draft created (id: ${v3Draft.id})`)

    await insertChangelog({
      policy_doc_id: v3Draft.id,
      version: v3Draft.version,
      change_type: 'create',
      summary: `v${v3Draft.version} 초안 작성 — 추가 개정 진행 중`,
      changed_by: source.created_by,
    })
  }

  console.log('\n' + '─'.repeat(60))
  console.log('\n🎉 Version seed complete!\n')
}

main().catch(console.error)
