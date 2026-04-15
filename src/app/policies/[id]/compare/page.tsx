import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { PolicyDoc } from '@/lib/types'
import { CompareClient } from './compare-client'

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ right?: string }>
}) {
  const { id } = await params
  const { right } = await searchParams
  const supabase = await createClient()

  // Get slug for this policy
  const { data: doc } = await supabase
    .from('policy_docs')
    .select('slug')
    .eq('id', id)
    .single()

  if (!doc) notFound()

  // Get all versions with the same slug
  const { data: versions } = await supabase
    .from('policy_docs')
    .select('*, domain:policy_domains(*)')
    .eq('slug', doc.slug)
    .order('version', { ascending: true })

  if (!versions || versions.length <= 1) {
    return (
      <div className="mx-auto max-w-4xl py-16 text-center">
        <p className="text-sm text-content-tertiary">비교할 버전이 없습니다.</p>
        <a
          href={`/policies/${id}`}
          className="mt-4 inline-flex items-center gap-1 text-xs text-content-secondary hover:text-content-primary transition-colors"
        >
          ← 정책으로 돌아가기
        </a>
      </div>
    )
  }

  return <CompareClient versions={versions as PolicyDoc[]} currentId={id} initialRightId={right} />
}
