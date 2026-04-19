'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
    } else {
      router.push('/policies')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-surface-secondary">
      <div className="w-full max-w-sm rounded-xl border border-line-primary bg-surface-primary p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <svg width="138" height="36" viewBox="0 0 168 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="2" width="28" height="28" rx="7" fill="#82B4F0"/>
            <rect x="8" y="10" width="28" height="28" rx="7" fill="#3182F6"/>
            <text x="44" y="31" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontSize="28" fontWeight="800" fill="#191F28" letterSpacing="-1.5">poli</text>
          </svg>
        </div>
        <p className="mb-6 text-sm text-content-secondary">동승그룹 정책 관리 시스템</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-content-secondary">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              autoComplete="email"
              className="rounded-lg border border-line-primary bg-surface-primary px-3 py-2 text-sm text-content-primary placeholder:text-content-tertiary focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-content-secondary">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="rounded-lg border border-line-primary bg-surface-primary px-3 py-2 text-sm text-content-primary placeholder:text-content-tertiary focus:border-accent focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="cursor-pointer mt-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-text transition-opacity disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-content-tertiary">
          계정이 없나요?{' '}
          <Link href="/signup" className="text-accent hover:underline">
            계정 만들기
          </Link>
        </p>
      </div>
    </div>
  )
}
