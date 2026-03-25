'use client'
import { useState, useMemo } from 'react'
import { fmt, fmtS, NOME_MES } from '@/lib/utils'
import type { Lancamento, Banco } from '@/lib/types'

interface Props {
  lancamentos: Lancamento[]; bancos: Banco[]; orcamento: any[]; saldosRef: any
  onSaveLancamento: any; onDeleteLancamento: any
}

export default function TabDashboard({ lancamentos, bancos, saldosRef }: Props) {
  const hoje = new Date().toISOString().slice(0, 10)
  const [de, setDe] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10)
  })
  const [ate, setAte] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(0); return d.toISOString().slice(0, 10)
  })

  const pat = bancos.reduce((s, b) => s + b.valor, 0)
  const meta = 1_000_000
  const pct = Math.min(100, pat / meta * 100)
  const falta = meta - pat

  // Projeção fim do ano
  const entFimAno = lancamentos.filter(l => l.status === 'A Realizar' && l.fluxo === 'Entrada' && l.data <= '2026-12-31').reduce((s, l) => s + l.valor, 0)
  const saiFimAno = lancamentos.filter(l => l.status === 'A Realizar' && l.fluxo === 'Saída' && l.data <= '2026-12-31').reduce((s, l) => s + l.valor, 0)
  const patFimAno = pat + entFimAno - saiFimAno
  const pctFimAno = Math.min(100, patFimAno / meta * 100)
  const faltaFimAno = meta - patFimAno

  // Período
  const lancPeriodo = useMemo(() =>
    lancamentos.filter(l => l.status === 'Realizado' && l.data >= de && l.data <= ate),
    [lancamentos, de, ate])

  const rec = lancPeriodo.filter(l => l.fluxo === 'Entrada').reduce((s, l) => s + l.valor, 0)
  const des = lancPeriodo.filter(l => l.fluxo === 'Saída').reduce((s, l) => s + l.valor, 0)
  const saldo = rec - des
  const txPoup = rec > 0 ? ((rec - des) / rec * 100) : 0

  // Saldo inicial
  const diaAnt = de ? new Date(new Date(de + 'T00:00:00').getTime() - 86400000).toISOString().slice(0, 10) : null
  const getSaldoRef = (d: string | null) => {
    if (!d) return null
    if (saldosRef[d]) return saldosRef[d].total
    const keys = Object.keys(saldosRef).filter(k => k <= d).sort()
    const last = keys[keys.length - 1]
    return last ? saldosRef[last].total : null
  }
  const saldoIni = getSaldoRef(diaAnt)

  // Projeção período
  const aRec = lancamentos.filter(l => l.status === 'A Realizar' && l.fluxo === 'Entrada' && l.data >= de && l.data <= ate).reduce((s, l) => s + l.valor, 0)
  const aSai = lancamentos.filter(l => l.status === 'A Realizar' && l.fluxo === 'Saída' && l.data >= de && l.data <= ate).reduce((s, l) => s + l.valor, 0)
  const saldoProj = pat + aRec - aSai

  // Urgentes
  const em7 = new Date(); em7.setDate(em7.getDate() + 7)
  const em7s = em7.toISOString().slice(0, 10)
  const nUrgentes = lancamentos.filter(l => l.status === 'A Realizar' && l.data >= hoje && l.data <= em7s).length

  function setRange(tipo: string) {
    const now = new Date()
    if (tipo === 'mes') {
      setDe(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10))
      setAte(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10))
    } else if (tipo === 'mesant') {
      setDe(new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10))
      setAte(new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10))
    } else if (tipo === 'ytd') {
      setDe(`${now.getFullYear()}-01-01`)
      setAte(now.toISOString().slice(0, 10))
    } else {
      setDe('2025-12-01'); setAte('2027-12-31')
    }
  }

  const kpis = [
    saldoIni !== null ? { lbl: 'Saldo inicial', val: fmtS(saldoIni), sub: diaAnt?.split('-').reverse().join('/') || '', color: 'var(--mut)' } : null,
    { lbl: 'Patrimônio atual', val: fmtS(pat), sub: `↑ ${pct.toFixed(1)}% da meta`, color: 'var(--acc)', subClass: 'up' },
    { lbl: 'Saldo projetado', val: fmtS(saldoProj), sub: `A realizar: ${fmtS(aRec - aSai)}`, color: saldoProj >= pat ? 'var(--acc)' : 'var(--amb)' },
    { lbl: 'Receitas no período', val: fmtS(rec), sub: `${lancPeriodo.length} lançamentos`, color: 'var(--blue)', subClass: 'up' },
    { lbl: 'Despesas no período', val: fmtS(des), sub: 'Saídas totais', color: 'var(--red)' },
    { lbl: 'Saldo do período', val: fmtS(Math.abs(saldo)), sub: saldo >= 0 ? 'Positivo' : 'Negativo', color: saldo >= 0 ? 'var(--acc)' : 'var(--red)', subClass: saldo >= 0 ? 'up' : 'dn' },
    { lbl: 'Taxa de poupança', val: `${txPoup.toFixed(1)}%`, sub: txPoup >= 20 ? 'Boa' : 'Abaixo do ideal', color: 'var(--amb)', subClass: txPoup >= 20 ? 'up' : 'warn' },
    nUrgentes > 0 ? { lbl: 'Alertas urgentes', val: `${nUrgentes}`, sub: 'Vencem em 7 dias', color: 'var(--red)', subClass: 'dn' } : null,
    { lbl: 'Falta para meta', val: fmtS(falta), sub: 'R$1 milhão · hoje', color: '#A78BFA' },
    { lbl: 'Projetado Dez/26', val: fmtS(patFimAno), sub: patFimAno >= meta ? '🎯 Meta atingida!' : `Falta ${fmtS(faltaFimAno)} · ${pctFimAno.toFixed(1)}%`, color: patFimAno >= meta ? 'var(--acc)' : '#A78BFA', subClass: patFimAno >= meta ? 'up' : '' },
  ].filter(Boolean)

  return (
    <div>
      {/* Period filter */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input type="date" value={de} onChange={e => setDe(e.target.value)} style={{ background: 'var(--sur)', border: '1px solid var(--brd2)', borderRadius: 'var(--rs)', padding: '7px 12px', color: 'var(--txt)', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
        <span style={{ color: 'var(--mut)' }}>→</span>
        <input type="date" value={ate} onChange={e => setAte(e.target.value)} style={{ background: 'var(--sur)', border: '1px solid var(--brd2)', borderRadius: 'var(--rs)', padding: '7px 12px', color: 'var(--txt)', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
        {[['mes','Este mês'],['mesant','Mês anterior'],['ytd','YTD 2026'],['tudo','Tudo']].map(([v, l]) => (
          <button key={v} className="btn btn-s btn-sm" onClick={() => setRange(v)}>{l}</button>
        ))}
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        {kpis.map((k: any, i) => (
          <div key={i} className="kpi" style={{ '--ka': k.color } as any}>
            <div className="kpi-lbl">{k.lbl}</div>
            <div className="kpi-val" style={{ color: k.color }}>{k.val}</div>
            <div className={`kpi-sub ${k.subClass || ''}`}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Meta progress */}
      <div style={{ background: 'var(--sur)', border: '1px solid var(--brd)', borderRadius: 'var(--r)', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ fontWeight: '700' }}>Meta: R$ 1.000.000</div>
          <div style={{ fontSize: '13px', color: 'var(--acc)', fontWeight: '600' }}>{pct.toFixed(1)}% concluído</div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: 'var(--mut)' }}>
          <span>Atual: R${fmt(pat)}</span>
          <span>Faltam R${fmt(falta)} · Projetado Dez/26: R${fmt(patFimAno)} ({pctFimAno.toFixed(1)}%)</span>
        </div>
      </div>

      {/* Saldos por banco */}
      <div style={{ marginBottom: '24px' }}>
        <div className="sec-title">Saldo por banco</div>
        <div className="kpi-grid">
          {bancos.filter(b => b.valor !== 0).map(b => (
            <div key={b.id} className="kpi" style={{ '--ka': 'var(--blue)' } as any}>
              <div className="kpi-lbl">{b.nome}</div>
              <div className="kpi-val" style={{ fontSize: '16px' }}>R${fmt(b.valor)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent lancamentos */}
      <div>
        <div className="sec-title">Lançamentos recentes</div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th><th>Descrição</th><th className="hide-mob">Plano</th>
                <th>Status</th><th style={{ textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.slice(0, 10).map(l => (
                <tr key={l.id}>
                  <td style={{ fontSize: '12px' }}>{l.data.split('-').reverse().join('/')}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.descricao}</td>
                  <td className="hide-mob" style={{ fontSize: '11px', color: 'var(--txt2)' }}>{l.plano}</td>
                  <td><span className={`bdg ${l.status === 'Realizado' ? 'bdg-real' : 'bdg-pend'}`}>{l.status}</span></td>
                  <td className="td-amt" style={{ color: l.fluxo === 'Entrada' ? 'var(--acc)' : 'var(--red)' }}>
                    {l.fluxo === 'Entrada' ? '+' : '-'}R${fmt(l.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
