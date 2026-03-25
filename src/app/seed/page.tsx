'use client'
import { useState } from 'react'

export default function SeedPage() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSeed() {
    setLoading(true)
    setStatus('Importando dados...')
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setStatus(`✅ ${data.lancamentos} lançamentos importados com sucesso!`)
      } else if (data.count) {
        setStatus(`ℹ️ Dados já importados (${data.count} lançamentos). Nada foi alterado.`)
      } else {
        setStatus(`❌ Erro: ${data.error}`)
      }
    } catch (e: any) {
      setStatus(`❌ Erro: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--brd2)', borderRadius: '16px', padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
        <h2 style={{ marginBottom: '8px' }}>Importar dados iniciais</h2>
        <p style={{ fontSize: '13px', color: 'var(--mut)', marginBottom: '24px', lineHeight: '1.6' }}>
          Isso vai importar os 245 lançamentos da planilha original para o Supabase.<br />
          Execute apenas uma vez.
        </p>
        <button
          className="btn btn-p"
          onClick={handleSeed}
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? 'Importando...' : '🚀 Importar 245 lançamentos'}
        </button>
        {status && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--sur)', borderRadius: 'var(--rs)', fontSize: '13px' }}>
            {status}
          </div>
        )}
        {status.includes('✅') && (
          <a href="/dashboard" style={{ display: 'block', marginTop: '16px', color: 'var(--acc)', fontSize: '13px' }}>
            → Ir para o Dashboard
          </a>
        )}
      </div>
    </div>
  )
}
