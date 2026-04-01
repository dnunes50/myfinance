import { useState } from 'react'
import { useRouter } from 'next/router'
import { sb } from '../lib/supabase'

export default function Login() {
  const [email,    setEmail]    = useState('diegoonunes50@gmail.com')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await sb.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : error.message)
      setLoading(false)
    } else {
      router.replace('/dashboard')
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'360px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'36px',justifyContent:'center'}}>
          <div className="logo-icon">MF</div>
          <span style={{fontSize:'20px',fontWeight:700}}>My<span style={{color:'var(--acc)'}}>Finance</span></span>
        </div>
        <div style={{background:'var(--sur)',border:'1px solid var(--brd2)',borderRadius:'14px',padding:'28px'}}>
          <div style={{fontSize:'15px',fontWeight:600,marginBottom:'4px'}}>Acesso</div>
          <div style={{fontSize:'12px',color:'var(--mut)',marginBottom:'22px'}}>Entre com email e senha</div>
          <form onSubmit={handleLogin}>
            <div className="fld">
              <label>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/>
            </div>
            <div className="fld">
              <label>Senha</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required/>
            </div>
            {error && <div style={{fontSize:'12px',color:'var(--red)',marginBottom:'12px'}}>{error}</div>}
            <button type="submit" className="btn btn-p" style={{width:'100%',justifyContent:'center'}} disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
