import { createClient } from '@/lib/supabase/server'
import { FeaturesClient } from './features-client'

type PolicyDoc = {
  id: string
  title: string
  status: string
  domain: { id: string; name: string } | null
}

type PolicySection = {
  id: string
  title: string
  policy_docs: PolicyDoc | null
}

type FeaturePolicy = {
  id: string
  note: string | null
  policy_sections: PolicySection | null
}

type FeatureWithPolicies = {
  id: string
  name: string
  slug: string
  description: string | null
  screen_path: string | null
  feature_policies: FeaturePolicy[]
}

export default async function FeaturesPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('features')
    .select(`
      *,
      feature_policies (
        id,
        note,
        policy_sections:section_id (
          id,
          title,
          policy_docs:policy_doc_id (
            id,
            title,
            status,
            domain:policy_domains(id, name)
          )
        )
      )
    `)
    .order('name')

  const features = (data ?? []) as FeatureWithPolicies[]

  if (error) {
    return (
      <div>
        <p className="text-sm text-red-500">데이터를 불러오지 못했습니다: {error.message}</p>
      </div>
    )
  }

  return <FeaturesClient initialFeatures={features} />
}
