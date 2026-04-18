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

type TombstoneRow = {
  id: string
  feature_id: string
  deleted_section_title: string | null
  features: {
    id: string
    name: string
    slug: string
    screen_path: string | null
  } | null
}

type LinkedFeature = {
  id: string
  feature: { id: string; name: string; slug: string; screen_path: string | null }
  section: { id: string; title: string }
  is_broken?: boolean
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

  const healthyResult: LinkedFeature[] = []

  if (sectionIds.length > 0) {
    const { data, error } = await supabase
      .from('feature_policies')
      .select('id, features(id,name,slug,screen_path), policy_sections(id,title)')
      .in('section_id', sectionIds)

    if (error) {
      return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
    }

    const rows = (data as unknown as FeaturePolicyRow[]) ?? []

    rows
      .filter((row) => row.features !== null && row.policy_sections !== null)
      .forEach((row) => {
        healthyResult.push({
          id: row.id,
          feature: row.features!,
          section: row.policy_sections!,
        })
      })
  }

  // Tombstone query: feature_policies where section_id IS NULL and policy_doc_id = id
  const { data: tombstones } = await supabase
    .from('feature_policies')
    .select('id, feature_id, deleted_section_title, features(id,name,slug,screen_path)')
    .eq('policy_doc_id', id)
    .is('section_id', null)

  const tombstoneResult: LinkedFeature[] = (tombstones as unknown as TombstoneRow[] ?? [])
    .filter((t) => t.features !== null)
    .map((t) => ({
      id: t.id,
      feature: t.features!,
      section: { id: '', title: t.deleted_section_title ?? '(알 수 없음)' },
      is_broken: true,
    }))

  return NextResponse.json({ data: [...healthyResult, ...tombstoneResult] })
}
