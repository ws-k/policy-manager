'use client'

import { useState, useEffect } from 'react'

interface ChangelogModalProps {
  open: boolean
  loading: boolean
  onClose: () => void
  onConfirm: (summary: string) => void
}

export function ChangelogModal({ open, loading, onClose, onConfirm }: ChangelogModalProps) {
  const [summary, setSummary] = useState('')

  useEffect(() => {
    if (open) setSummary('')
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-lg border border-line-primary bg-surface-primary p-6 shadow-lg">
        <h2 className="mb-4 text-base font-semibold text-content-primary">변경 사유 입력</h2>

        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="변경 사유를 입력하세요 (필수)"
          rows={3}
          className="w-full rounded-md border border-line-primary bg-surface-primary px-3 py-2 text-sm text-content-primary outline-none placeholder:text-content-tertiary focus:border-line-secondary resize-none"
          autoFocus
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-line-primary bg-surface-primary px-4 py-2 text-sm font-medium text-content-primary transition-colors hover:bg-surface-tertiary disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onConfirm(summary)}
            disabled={!summary.trim() || loading}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-text transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {loading ? '저장 중...' : '저장 완료'}
          </button>
        </div>
      </div>
    </div>
  )
}
