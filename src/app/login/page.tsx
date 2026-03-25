'use client'
import { createClient } from '@/lib/supabase'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('diegoonunes50@gmail.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [mode, setMode]         = useState<'login'|'register'>('login')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Preencha email e senha'); return }
    setLoading(true); setError('')
    const supabase = createClient()

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setError('Conta criada! Verifique seu e-mail para confirmar.')
        setMode('login')
      }
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email ou senha incorretos'
        : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--brd2)',
        borderRadius: '20px', padding: '48px 40px', width: '100%', maxWidth: '400px'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'var(--acc-d)', border: '1px solid rgba(110,231,183,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '28px'
          }}>💰</div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '6px' }}>MyFinance</h1>
          <p style={{ fontSize: '13px', color: 'var(--mut)' }}>Controle financeiro pessoal</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fld">
            <label>Email</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </div>
          <div className="fld">
            <label>Senha</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--rs)', marginBottom: '12px',
              background: error.includes('criada') ? 'var(--acc-d)' : 'var(--red-d)',
              color: error.includes('criada') ? 'var(--acc)' : 'var(--red)',
              fontSize: '12px', border: `1px solid ${error.includes('criada') ? 'rgba(110,231,183,.2)' : 'rgba(248,113,113,.2)'}`
            }}>
              {error}
            </div>
          )}

          <button
            type="submit" className="btn btn-p"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
          >
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            style={{ background: 'none', border: 'none', color: 'var(--mut)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {mode === 'login' ? 'Criar nova conta' : 'Já tenho conta — fazer login'}
          </button>
        </div>
      </div>
    </div>
  )
}
