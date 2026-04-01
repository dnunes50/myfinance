import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, maxWidth=520 }) {
  useEffect(() => {
    const h = e => { if(e.key==='Escape') onClose() }
    if(open) document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])
  if(!open) return null
  return (
    <div className="overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth}}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  )
}
