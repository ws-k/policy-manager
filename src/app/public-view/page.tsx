import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function PublicPoliciesPage() {
  const supabase = await createClient()

  const { data: policies } = await supabase
    .from('policy_docs')
    .select('id, title, slug, version, published_at, domain:policy_domains(name)')
    .eq('status', 'published')
    .eq('is_public', true)
    .order('published_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900">DS Visitor 정책</h1>
        <p className="mt-2 text-gray-500">공개된 정책 목록입니다.</p>

        <div className="mt-8 space-y-3">
          {policies && policies.length > 0 ? (
            policies.map((policy) => {
              const domain = Array.isArray(policy.domain)
                ? policy.domain[0]
                : policy.domain
              return (
                <Link
                  key={policy.id}
                  href={`/public-view/${policy.id}`}
                  className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors"
                >
                  <div className="font-medium text-gray-900">{policy.title}</div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
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
                </Link>
              )
            })
          ) : (
            <p className="text-gray-500">공개된 정책이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  )
}
