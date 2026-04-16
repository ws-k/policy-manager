'use client'

import { useEffect, useRef, useState } from 'react'

type AutoSaveStatus = 'idle' | 'saving' | 'saved'

interface AutoSaveDraft<T> {
  savedAt: number
  data: T
}

interface UseAutoSaveReturn<T> {
  status: AutoSaveStatus
  savedAt: number | null
  getDraft: () => AutoSaveDraft<T> | null
  clearDraft: () => void
}

export function useAutoSave<T>(
  key: string,
  data: T,
  enabled: boolean = true,
  delay: number = 3000
): UseAutoSaveReturn<T> {
  const [status, setStatus] = useState<AutoSaveStatus>('idle')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const isInitialMount = useRef(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestDataRef = useRef<T>(data)
  const pendingRef = useRef(false)

  // Always keep latestDataRef in sync
  useEffect(() => {
    latestDataRef.current = data
  })

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (!enabled) {
      pendingRef.current = false
      return
    }

    pendingRef.current = true

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      pendingRef.current = false
      setStatus('saving')
      try {
        const draft: AutoSaveDraft<T> = { savedAt: Date.now(), data: latestDataRef.current }
        localStorage.setItem(key, JSON.stringify(draft))
        setSavedAt(draft.savedAt)
        setStatus('saved')
      } catch {
        setStatus('idle')
      }
    }, delay)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [data, enabled, key, delay])

  // Save immediately on unmount if there's a pending debounced save
  useEffect(() => {
    return () => {
      if (pendingRef.current) {
        try {
          const draft: AutoSaveDraft<T> = { savedAt: Date.now(), data: latestDataRef.current }
          localStorage.setItem(key, JSON.stringify(draft))
        } catch {}
      }
    }
  // key is stable per page; intentionally omit latestDataRef/pendingRef (refs)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  function getDraft(): AutoSaveDraft<T> | null {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      return JSON.parse(raw) as AutoSaveDraft<T>
    } catch {
      return null
    }
  }

  function clearDraft() {
    localStorage.removeItem(key)
    setStatus('idle')
    setSavedAt(null)
  }

  return { status, savedAt, getDraft, clearDraft }
}
