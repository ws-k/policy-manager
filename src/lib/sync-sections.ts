import type { SupabaseClient } from '@supabase/supabase-js'
import { extractH1H2Headings } from './tiptap-utils'

export async function syncPolicySections(
  supabase: SupabaseClient,
  policyDocId: string,
  content: Record<string, unknown>
) {
  const headings = extractH1H2Headings(content)

  const { data: existing } = await supabase
    .from('policy_sections')
    .select('id, title, sort_order')
    .eq('policy_doc_id', policyDocId)
    .order('sort_order')

  const existingByTitle = new Map((existing ?? []).map((s) => [s.title, s]))
  const newTitles = new Set(headings)

  // Delete sections no longer in headings
  const toDelete = (existing ?? []).filter((s) => !newTitles.has(s.title))
  if (toDelete.length > 0) {
    await supabase
      .from('policy_sections')
      .delete()
      .in('id', toDelete.map((s) => s.id))
  }

  // Upsert remaining in order
  for (let i = 0; i < headings.length; i++) {
    const title = headings[i]
    const match = existingByTitle.get(title)
    if (match) {
      if (match.sort_order !== i + 1) {
        await supabase
          .from('policy_sections')
          .update({ sort_order: i + 1 })
          .eq('id', match.id)
      }
    } else {
      await supabase
        .from('policy_sections')
        .insert({ policy_doc_id: policyDocId, title, sort_order: i + 1 })
    }
  }
}
