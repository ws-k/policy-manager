import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PolicyContent } from './policy-content'

export default async function PublicPolicyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: policy, error } = await supabase
    .from('policy_docs')
    .select('*, domain:policy_domains(name)')
    .eq('id', id)
    .eq('status', 'published')
    .eq('is_public', true)
    .single()

  if (error || !policy) {
    notFound()
  }

  const domain = Array.isArray(policy.domain) ? policy.domain[0] : policy.domain

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/public-view"
          className="text-blue-600 hover:underline text-sm"
        >
          ← 전체 정책 보기
        </Link>

        <h1 className="mt-6 text-2xl font-bold text-gray-900">{policy.title}</h1>

        <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
          {domain?.name && <span>{domain.name}</span>}
          {policy.published_at && (
            <span>
              {new Date(policy.published_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          )}
        </div>

        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
          {policy.content ? (
            <PolicyContent content={policy.content as Record<string, unknown>} />
          ) : (
            <p className="text-gray-500">내용이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  )
}
