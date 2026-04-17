'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    // Temp random password — user will set real password after signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password: crypto.randomUUID(),
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=/set-password`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.session) {
      // Email confirmation disabled — session returned immediately
      // Use full navigation to ensure session cookie is flushed before redirect
      window.location.href = '/set-password'
    } else {
      // Confirmation email sent
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-surface-secondary">
        <div className="w-full max-w-sm rounded-xl border border-line-primary bg-surface-primary p-8 shadow-sm">
          <h1 className="mb-1 text-lg font-semibold text-content-primary">이메일을 확인해주세요</h1>
          <p className="mt-2 text-sm text-content-secondary">
            <span className="font-medium text-content-primary">{email}</span>로 가입 확인 링크를 보냈습니다.
            이메일의 링크를 클릭하면 비밀번호 설정 화면으로 이동합니다.
          </p>
          <p className="mt-4 text-xs text-content-tertiary">
            이메일이 오지 않으면 스팸함을 확인해주세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-surface-secondary">
      <div className="w-full max-w-sm rounded-xl border border-line-primary bg-surface-primary p-8 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-content-primary">Policy Manager</h1>
        <p className="mb-6 text-sm text-content-secondary">계정 만들기</p>

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

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="cursor-pointer mt-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-text transition-opacity disabled:opacity-50"
          >
            {loading ? '전송 중...' : '이메일 인증하기'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-content-tertiary">
          이미 계정이 있나요?{' '}
          <Link href="/login" className="text-accent hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
