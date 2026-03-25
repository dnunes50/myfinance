'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { ToastProvider } from '@/components/ToastProvider'
import { getLancamentos, getBancos, getOrcamento, updateLancamento, createLancamento, createLancamentos, deleteLancamento } from '@/lib/db'
import { BANCOS_CONFIG, ORC_CATEGORIAS_DEFAULT, SALDOS_REF } from '@/lib/dados'
import type { Lancamento, Banco, OrcamentoCategoria } from '@/lib/types'
import TabDashboard   from './tabs/TabDashboard'
import TabLancamentos from './tabs/TabLancamentos'
import TabAlertas     from './tabs/TabAlertas'
import TabFluxo       from './tabs/TabFluxo'
import TabPatrimonio  from './tabs/TabPatrimonio'
import TabOrcamento   from './tabs/TabOrcamento'

type Tab = 'dashboard' | 'lancamentos' | 'alertas' | 'fluxo' | 'patrimonio' | 'orcamento'

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard',   label: 'Dashboard'   },
  { id: 'lancamentos', label: 'Lançamentos' },
  { id: 'alertas',     label: 'Alertas'     },
  { id: 'fluxo',       label: 'Fluxo Diário'},
  { id: 'patrimonio',  label: 'Patrimônio'  },
  { id: 'orcamento',   label: 'Orçamento'   },
]

export default function AppShell() {
  const [tab, setTab]                 = useState<Tab>('dashboard')
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [bancos, setBancos]           = useState<Banco[]>(BANCOS_CONFIG)
  const [orcamento, setOrcamento]     = useState<OrcamentoCategoria[]>(ORC_CATEGORIAS_DEFAULT)
  const [loading, setLoading]         = useState(true)
  const [needsSeed, setNeedsSeed]     = useState(false)
  const [userEmail, setUserEmail]     = useState('')
  const [dateStr, setDateStr]         = useState('')

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }))
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email || ''))

    async function load() {
      try {
        const [lancs, bancsDb, orcDb] = await Promise.all([getLancamentos(), getBancos(), getOrcamento()])
        if (lancs.length === 0) { setNeedsSeed(true) }
        else setLancamentos(lancs)
        if (bancsDb.length > 0) setBancos(bancsDb)
        if (orcDb.length > 0)   setOrcamento(orcDb)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const bancosCalculados = useCallback((lancs: Lancamento[], base: Banco[]) =>
    base.map(b => {
      const val = b.saldo_abertura + lancs
        .filter(l => l.status === 'Realizado' && l.banco === b.nome && l.data > b.data_abertura)
        .reduce((s, l) => s + (l.fluxo === 'Entrada' ? l.valor : -l.valor), 0)
      return { ...b, valor: val }
    }), [])

  const bancosComSaldo = bancosCalculados(lancamentos, bancos)

  async function handleSaveLancamento(lancs: Omit<Lancamento, 'id'|'user_id'|'created_at'>[], editId?: number) {
    if (editId !== undefined) {
      const u = await updateLancamento(editId, lancs[0])
      setLancamentos(prev => prev.map(l => l.id === editId ? { ...l, ...u } : l))
    } else if (lancs.length === 1) {
      const c = await createLancamento(lancs[0])
      setLancamentos(prev => [c, ...prev])
    } else {
      const c = await createLancamentos(lancs)
      setLancamentos(prev => [...(c || []), ...prev])
    }
  }

  async function handleDeleteLancamento(id: number) {
    await deleteLancamento(id)
    setLancamentos(prev => prev.filter(l => l.id !== id))
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'40px', marginBottom:'16px' }}>💰</div>
        <p style={{ color:'var(--mut)', fontSize:'13px', fontFamily:'Sora,sans-serif' }}>Carregando dados...</p>
      </div>
    </div>
  )

  if (needsSeed) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'20px' }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--brd2)', borderRadius:'16px', padding:'40px', maxWidth:'420px', width:'100%', textAlign:'center', fontFamily:'Sora,sans-serif' }}>
        <div style={{ fontSize:'40px', marginBottom:'16px' }}>📦</div>
        <h2 style={{ marginBottom:'12px', fontSize:'18px', fontWeight:'700' }}>Bem-vindo ao MyFinance!</h2>
        <p style={{ fontSize:'13px', color:'var(--mut)', marginBottom:'24px', lineHeight:'1.6' }}>
          Primeira vez acessando. Importe os dados iniciais para começar.
        </p>
        <a href="/seed" className="btn btn-p" style={{ display:'inline-flex', justifyContent:'center', width:'100%', textDecoration:'none' }}>
          🚀 Importar dados iniciais
        </a>
        <button className="btn btn-s" onClick={handleSignOut} style={{ width:'100%', marginTop:'10px', justifyContent:'center' }}>Sair</button>
      </div>
    </div>
  )

  const shared = { lancamentos, bancos: bancosComSaldo, orcamento, saldosRef: SALDOS_REF, onSaveLancamento: handleSaveLancamento, onDeleteLancamento: handleDeleteLancamento }

  return (
    <ToastProvider>
      <div style={{ minHeight:'100vh', background:'var(--bg)' }}>

        {/* Nav — igual ao HTML original */}
        <nav className="nav">
          <div className="nav-logo">
            <div className="logo-icon">MF</div>
            <div className="logo-text">My<span>Finance</span></div>
            <div className="badge-live"><div className="dot"></div>LIVE</div>
          </div>

          <div className="nav-tabs">
            {TABS.map(t => (
              <button key={t.id} className={`tab${tab === t.id ? ' on' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="nav-right">
            <span style={{ color:'var(--mut)' }}>{dateStr}</span>
            <button className="btn btn-s" style={{ fontSize:'11px', padding:'4px 10px' }} onClick={handleSignOut}>Sair</button>
          </div>
        </nav>

        {/* Mobile tabs */}
        <div style={{ display:'none', overflowX:'auto', background:'var(--bg2)', borderBottom:'1px solid var(--brd)', padding:'8px 12px', gap:'4px' }} className="mob-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`tab${tab === t.id ? ' on' : ''}`} onClick={() => setTab(t.id)} style={{ fontSize:'11px' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Page content */}
        <div style={{ padding:'20px', maxWidth:'1300px', margin:'0 auto' }}>
          {tab === 'dashboard'   && <TabDashboard   {...shared} />}
          {tab === 'lancamentos' && <TabLancamentos  {...shared} />}
          {tab === 'alertas'     && <TabAlertas      {...shared} />}
          {tab === 'fluxo'       && <TabFluxo        {...shared} />}
          {tab === 'patrimonio'  && <TabPatrimonio   {...shared} />}
          {tab === 'orcamento'   && <TabOrcamento    {...shared} onSaveOrcamento={setOrcamento} />}
        </div>
      </div>
    </ToastProvider>
  )
}
