export type PolicyStatus = 'draft' | 'published'

export interface PolicyDomain {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
  icon: string | null
  created_at: string
  updated_at: string
}

export interface Feature {
  id: string
  name: string
  slug: string
  description: string | null
  screen_path: string | null
}

export interface PolicyDoc {
  id: string
  domain_id: string
  title: string
  slug: string
  version: number
  status: PolicyStatus
  content: Record<string, unknown>
  content_text: string
  is_public: boolean
  parent_version_id: string | null
  published_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  domain?: PolicyDomain
}

export interface PolicySection {
  id: string
  policy_doc_id: string
  title: string
  sort_order: number
  anchor_id: string | null
}

export interface Changelog {
  id: string
  policy_doc_id: string
  version: number
  change_type: 'create' | 'update' | 'publish' | 'unpublish'
  summary: string
  detail: string | null
  changed_by: string | null
  created_at: string
}

export type ApiResponse<T> = { data: T } | { error: string; code: string }
