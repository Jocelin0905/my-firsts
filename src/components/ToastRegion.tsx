import { useEffect } from 'react'
import { useToast } from '../hooks/useToast'

export function ToastRegion() {
  const { toast, clearToast } = useToast()
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(clearToast, toast.tone === 'milestone' ? 4200 : 2800)
    return () => window.clearTimeout(timer)
  }, [toast, clearToast])

  return (
    <div className="toast-region" aria-live="polite" aria-atomic="true">
      {toast ? <div className={`toast toast--${toast.tone}`}>{toast.text}</div> : null}
    </div>
  )
}
