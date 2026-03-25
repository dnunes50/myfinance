'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { ToastProvider } from '@/components/ToastProvider'
import { getLancamentos, getBancos, getOrcamento, updateLancamento, createLancamento, createLancamentos, deleteLancamento } from '@/lib/db'
import { BANCOS_CONFIG, ORC_CATEGORIAS_DEFAULT } from '@/lib/dados'
import type { Lancamento, Banco, OrcamentoCategoria } from '@/lib/types'
import TabDashboard from './tabs/TabDashboard'
import TabLancamentos from './tabs/TabLancamentos'
import TabAlertas from './tabs/TabAlertas'
import TabFluxo from './tabs/TabFluxo'
import TabPatrimonio from './tabs/TabPatrimonio'
import TabOrcamento from './tabs/TabOrcamento'
import { SALDOS_REF } from '@/lib/dados'

type Tab = 'dashboard' | 'lancamentos' | 'alertas' | 'fluxo' | 'patrimonio' | 'orcamento'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard',   label: 'Dashboard',   icon: '📊' },
  { id: 'lancamentos', label: 'Lançamentos', icon: '📋' },
  { id: 'alertas',     label: 'Alertas',     icon: '🔔' },
  { id: 'fluxo',       label: 'Fluxo',       icon: '📈' },
  { id: 'patrimonio',  label: 'Patrimônio',  icon: '🏦' },
  { id: 'orcamento',   label: 'Orçamento',   icon: '💼' },
]

export default function AppShell() {
  const [tab, setTab]             = useState<Tab>('dashboard')
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [bancos, setBancos]       = useState<Banco[]>(BANCOS_CONFIG)
  const [orcamento, setOrcamento] = useState<OrcamentoCategoria[]>(ORC_CATEGORIAS_DEFAULT)
  const [loading, setLoading]     = useState(true)
  const [needsSeed, setNeedsSeed] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || '')
    })

    async function loadData() {
      try {
        const [lancs, bancsDb, orcDb] = await Promise.all([
          getLancamentos(),
          getBancos(),
          getOrcamento(),
        ])

        if (lancs.length === 0) {
          // No data yet — show seed prompt
          setNeedsSeed(true)
        } else {
          setLancamentos(lancs)
        }
        if (bancsDb.length > 0) setBancos(bancsDb)
        if (orcDb.length > 0) setOrcamento(orcDb)
      } catch (e) {
        console.error('Erro ao carregar dados:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Recalc bank balances from lancamentos
  const bancosCalculados = useCallback((lancs: Lancamento[], bancosBase: Banco[]) => {
    return bancosBase.map(b => {
      const movs = lancs.filter(l =>
        l.status === 'Realizado' && l.banco === b.nome && l.data > b.data_abertura
      )
      const valor = b.saldo_abertura + movs.reduce((s, l) =>
        s + (l.fluxo === 'Entrada' ? l.valor : -l.valor), 0
      )
      return { ...b, valor }
    })
  }, [])

  const bancosComSaldo = bancosCalculados(lancamentos, bancos)

  async function handleSaveLancamento(
    lancs: Omit<Lancamento, 'id' | 'user_id' | 'created_at'>[],
    editId?: number
  ) {
    if (editId !== undefined) {
      const updated = await updateLancamento(editId, lancs[0])
      setLancamentos(prev => prev.map(l => l.id === editId ? { ...l, ...updated } : l))
    } else if (lancs.length === 1) {
      const created = await createLancamento(lancs[0])
      setLancamentos(prev => [created, ...prev])
    } else {
      const created = await createLancamentos(lancs)
      setLancamentos(prev => [...(created || []), ...prev])
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>💰</div>
          <p style={{ color: 'var(--mut)', fontSize: '14px' }}>Carregando dados...</p>
        </div>
      </div>
    )
  }

  if (needsSeed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '20px' }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--brd2)', borderRadius: '16px', padding: '40px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>📦</div>
          <h2 style={{ marginBottom: '12px' }}>Bem-vindo ao MyFinance!</h2>
          <p style={{ fontSize: '13px', color: 'var(--mut)', marginBottom: '24px', lineHeight: '1.6' }}>
            Primeira vez acessando. Clique abaixo para importar os dados iniciais da planilha para o banco de dados.
          </p>
          <a href="/seed" className="btn btn-p" style={{ display: 'inline-flex', justifyContent: 'center', width: '100%', textDecoration: 'none' }}>
            🚀 Importar dados iniciais
          </a>
          <button className="btn btn-s" onClick={handleSignOut} style={{ width: '100%', marginTop: '10px', justifyContent: 'center' }}>
            Sair
          </button>
        </div>
      </div>
    )
  }

  const sharedProps = {
    lancamentos,
    bancos: bancosComSaldo,
    orcamento,
    saldosRef: SALDOS_REF,
    onSaveLancamento: handleSaveLancamento,
    onDeleteLancamento: handleDeleteLancamento,
  }

  return (
    <ToastProvider>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <header style={{
          background: 'var(--bg2)', borderBottom: '1px solid var(--brd)',
          padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>💰</span>
            <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--txt)' }}>MyFinance</span>
            <span style={{ background: 'var(--acc-d)', color: 'var(--acc)', fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(110,231,183,.2)' }}>
              ● LIVE
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--mut)' }} className="hide-mob">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
            {userEmail && (
              <span style={{ fontSize: '11px', color: 'var(--mut)' }} className="hide-mob">{userEmail}</span>
            )}
            <button className="btn btn-s" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={handleSignOut}>
              Sair
            </button>
          </div>
        </header>

        {/* Nav */}
        <nav style={{
          background: 'var(--bg2)', borderBottom: '1px solid var(--brd)',
          padding: '0 24px', display: 'flex', gap: '2px', overflowX: 'auto'
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '14px 16px', background: 'none', border: 'none',
                color: tab === t.id ? 'var(--acc)' : 'var(--mut)',
                fontWeight: tab === t.id ? '600' : '400',
                fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap',
                borderBottom: tab === t.id ? '2px solid var(--acc)' : '2px solid transparent',
                fontFamily: 'inherit', transition: 'all .15s',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <span>{t.icon}</span>
              <span className="hide-mob">{t.label}</span>
            </button>
          ))}
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, padding: '24px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {tab === 'dashboard'   && <TabDashboard   {...sharedProps} />}
          {tab === 'lancamentos' && <TabLancamentos  {...sharedProps} />}
          {tab === 'alertas'     && <TabAlertas      {...sharedProps} />}
          {tab === 'fluxo'       && <TabFluxo        {...sharedProps} />}
          {tab === 'patrimonio'  && <TabPatrimonio   {...sharedProps} />}
          {tab === 'orcamento'   && <TabOrcamento    {...sharedProps} onSaveOrcamento={setOrcamento} />}
        </main>
      </div>
    </ToastProvider>
  )
}
