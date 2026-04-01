import { createContext, useContext, useState, useCallback } from 'react'

const Ctx = createContext({ toast: () => {} })

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const toast = useCallback((msg, type='ok') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000)
  }, [])
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type==='err'?'err':''}`}>{t.msg}</div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
export const useToast = () => useContext(Ctx)
