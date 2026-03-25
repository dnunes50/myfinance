'use client'
import { createContext, useContext, useState, useCallback } from 'react'

interface Toast { id: number; message: string; type?: 'success' | 'error' | 'info' }
interface ToastContextType { toast: (msg: string, type?: Toast['type']) => void }

const ToastContext = createContext<ToastContextType>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast" style={{
            borderLeft: `3px solid ${t.type === 'error' ? 'var(--red)' : t.type === 'info' ? 'var(--blue)' : 'var(--acc)'}`
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
