import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface ToastMessage {
  id: number
  text: string
  tone: 'default' | 'error' | 'milestone'
}

interface ToastContextValue {
  toast: ToastMessage | null
  showToast: (text: string, tone?: ToastMessage['tone']) => void
  clearToast: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const value = useMemo<ToastContextValue>(() => ({
    toast,
    showToast: (text, tone = 'default') => setToast({ id: Date.now(), text, tone }),
    clearToast: () => setToast(null),
  }), [toast])
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used within ToastProvider')
  return value
}
