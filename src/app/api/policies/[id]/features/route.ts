import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type FeaturePolicyRow = {
  id: string
  features: {
    id: string
    name: string
    slug: string
    screen_path: string | null
  } | null
  policy_sections: {
    id: string
    title: string
  } | null
}

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

  // Get section ids for this policy doc
  const { data: sections, error: sectionsError } = await supabase
    .from('policy_sections')
    .select('id')
    .eq('policy_doc_id', id)

  if (sectionsError) {
    return NextResponse.json({ error: sectionsError.message, code: 'DB_ERROR' }, { status: 500 })
  }

  const sectionIds = (sections ?? []).map((s) => s.id)

  if (sectionIds.length === 0) {
    return NextResponse.json({ data: [] })
  }

  const { data, error } = await supabase
    .from('feature_policies')
    .select('id, features(id,name,slug,screen_path), policy_sections(id,title)')
    .in('section_id', sectionIds)

  if (error) {
    return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
  }

  const rows = (data as unknown as FeaturePolicyRow[]) ?? []

  const result = rows
    .filter((row) => row.features !== null && row.policy_sections !== null)
    .map((row) => ({
      id: row.id,
      feature: row.features!,
      section: row.policy_sections!,
    }))

  return NextResponse.json({ data: result })
}
