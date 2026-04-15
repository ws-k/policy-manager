'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('비밀번호 설정에 실패했습니다. 다시 시도해주세요.')
      setLoading(false)
    } else {
      router.push('/policies')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-surface-secondary">
      <div className="w-full max-w-sm rounded-xl border border-line-primary bg-surface-primary p-8 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-content-primary">비밀번호 설정</h1>
        <p className="mb-6 text-sm text-content-secondary">사용할 비밀번호를 입력해주세요.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-content-secondary">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자 이상"
              required
              autoComplete="new-password"
              className="rounded-lg border border-line-primary bg-surface-primary px-3 py-2 text-sm text-content-primary placeholder:text-content-tertiary focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password-confirm" className="text-xs font-medium text-content-secondary">
              비밀번호 확인
            </label>
            <input
              id="password-confirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              className="rounded-lg border border-line-primary bg-surface-primary px-3 py-2 text-sm text-content-primary placeholder:text-content-tertiary focus:border-accent focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password || !passwordConfirm}
            className="mt-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-text transition-opacity disabled:opacity-50"
          >
            {loading ? '설정 중...' : '비밀번호 설정 완료'}
          </button>
        </form>
      </div>
    </div>
  )
}
