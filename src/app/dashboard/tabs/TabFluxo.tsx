'use client'
import { useState, useMemo, useCallback } from 'react'
import { fmt } from '@/lib/utils'
import type { Lancamento, Banco } from '@/lib/types'

interface Props {
  lancamentos: Lancamento[]; bancos: Banco[]; orcamento: any[]; saldosRef: any
  onSaveLancamento: any; onDeleteLancamento: any
}

const BANCO_CAMPO: Record<string, string> = {
  'C6 Bank':'c6', 'Nubank':'nubank', 'Onil':'onil',
  'Santander':'san', 'Clear':'clear', 'Binance':'bin'
}
const BANCOS_LISTA = ['','C6 Bank','Nubank','Onil','Santander','Clear','Binance']

function getToday() { return new Date().toISOString().slice(0,10) }
function getFirstDayOfMonth() {
  const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10)
}
function getLastDayOfMonth() {
  const d = new Date(); d.setMonth(d.getMonth()+1); d.setDate(0); return d.toISOString().slice(0,10)
}

export default function TabFluxo({ lancamentos, saldosRef }: Props) {
  const hoje = getToday()
  const [banco, setBanco] = useState('')
  const [deStr, setDeStr] = useState('2025-12-31')
  const [ateStr, setAteStr] = useState(hoje)

  const ULTIMA_REF = Object.keys(saldosRef).sort().pop() || hoje

  function getSaldoRef(d: string): number | null {
    const ref = saldosRef[d]
    if (!ref) return null
    if (!banco) return ref.total
    const campo = BANCO_CAMPO[banco]
    return campo ? ref[campo] : null
  }

  function setRange(tipo: string) {
    if (tipo === 'historico') { setDeStr('2025-12-31'); setAteStr(hoje) }
    else if (tipo === 'mes')  { setDeStr(getFirstDayOfMonth()); setAteStr(getLastDayOfMonth()) }
    else if (tipo === 'prox60') {
      const fim = new Date(); fim.setDate(fim.getDate()+60)
      setDeStr(hoje); setAteStr(fim.toISOString().slice(0,10))
    } else { setDeStr('2025-12-01'); setAteStr('2027-12-31') }
  }

  const { linhas, kpis, diasNeg } = useMemo(() => {
    if (!deStr || !ateStr) return { linhas: [], kpis: null, diasNeg: 0 }
    const de = new Date(deStr+'T00:00:00'), ate = new Date(ateStr+'T00:00:00')
    if (de > ate) return { linhas: [], kpis: null, diasNeg: 0 }

    // Build list of days
    const dias: string[] = []
    const cur = new Date(de)
    while (cur <= ate) { dias.push(cur.toISOString().slice(0,10)); cur.setDate(cur.getDate()+1) }

    // Filter lancamentos by banco
    const lancFiltro = lancamentos.filter(l => !banco || l.banco === banco)

    // Saldo inicial
    const diaAnt = new Date(de); diaAnt.setDate(diaAnt.getDate()-1)
    const diaAntStr = diaAnt.toISOString().slice(0,10)
    let saldoAcum = 0
    const refAnt = getSaldoRef(diaAntStr)
    if (refAnt !== null) {
      saldoAcum = refAnt
    } else {
      const refDates = Object.keys(saldosRef).filter(d => d < deStr).sort()
      if (refDates.length) {
        const ultimaRef = refDates[refDates.length-1]
        saldoAcum = getSaldoRef(ultimaRef) ?? 0
        lancFiltro.filter(l => l.status==='Realizado' && l.data>ultimaRef && l.data<deStr)
          .forEach(l => { saldoAcum += l.fluxo==='Entrada' ? l.valor : -l.valor })
      }
    }

    // Group lancamentos by date
    const byDate: Record<string, { ent: Lancamento[], sai: Lancamento[] }> = {}
    dias.forEach(d => { byDate[d] = { ent: [], sai: [] } })
    lancFiltro.forEach(l => {
      if (!byDate[l.data]) return
      if (l.fluxo === 'Entrada') byDate[l.data].ent.push(l)
      else byDate[l.data].sai.push(l)
    })

    let totalEnt = 0, totalSai = 0, diasNeg = 0
    const saldoInicial = getSaldoRef(diaAntStr) ?? saldoAcum

    const linhas = dias.map(d => {
      const refDia = getSaldoRef(d)
      const temRef = refDia !== null
      const isFuturo = d > ULTIMA_REF
      const ent = byDate[d].ent.reduce((s,l) => s+l.valor, 0)
      const sai = byDate[d].sai.reduce((s,l) => s+l.valor, 0)

      let saldoDia: number, saldoExibido: number
      if (temRef && refDia !== null) {
        saldoExibido = refDia
        saldoDia = refDia - saldoAcum
        saldoAcum = refDia
      } else {
        saldoDia = ent - sai
        saldoAcum += saldoDia
        saldoExibido = saldoAcum
      }

      totalEnt += ent; totalSai += sai
      if (saldoExibido < 0) diasNeg++

      const varReal = temRef ? saldoDia : null
      const lancNet = ent - sai
      const naoExplic = varReal !== null ? varReal - lancNet : null

      const dt = new Date(d+'T12:00:00')
      const diaSem = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][dt.getDay()]
      const isHoje = d === hoje
      const isPast = d < hoje
      const isFim  = dt.getDay() === 0 || dt.getDay() === 6
      const hasMovs = ent > 0 || sai > 0

      return { d, diaSem, ent, sai, saldoDia, saldoExibido, temRef, isFuturo, isHoje, isPast, isFim, hasMovs, naoExplic, itens: [...byDate[d].ent, ...byDate[d].sai] }
    })

    const saldoFinal = saldoAcum
    const varFluxo = saldoFinal - saldoInicial

    return {
      linhas,
      diasNeg,
      kpis: { saldoInicial, totalEnt, totalSai, varFluxo, saldoFinal }
    }
  }, [lancamentos, banco, deStr, ateStr, saldosRef])

  return (
    <div>
      <div style={{ fontSize:'18px', fontWeight:'700', marginBottom:'16px' }}>Fluxo Diário</div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'16px' }}>
        <select value={banco} onChange={e => setBanco(e.target.value)} className="filter-sel">
          <option value="">Todos os bancos</option>
          {BANCOS_LISTA.filter(b=>b).map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <input type="date" value={deStr} onChange={e => setDeStr(e.target.value)} className="filter-sel" />
        <span style={{ color:'var(--mut)' }}>→</span>
        <input type="date" value={ateStr} onChange={e => setAteStr(e.target.value)} className="filter-sel" />
        {[['historico','Histórico completo'],['mes','Este mês'],['prox60','Próx. 60 dias'],['tudo','Tudo']].map(([v,l]) => (
          <button key={v} className="btn btn-s btn-sm" onClick={() => setRange(v)}>{l}</button>
        ))}
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="kpi-grid" style={{ marginBottom:'16px' }}>
          {[
            { lbl:`Saldo inicial · ${banco||'Total'}`, val:`R$${fmt(kpis.saldoInicial)}`, sub: deStr.split('-').reverse().join('/'), color:'var(--mut)' },
            { lbl:'Entradas lançadas', val:`+R$${fmt(kpis.totalEnt)}`, sub:'No período', color:'var(--acc)', subClass:'up' },
            { lbl:'Saídas lançadas',   val:`-R$${fmt(kpis.totalSai)}`, sub:'No período', color:'var(--red)', subClass:'dn' },
            { lbl:'Variação do período', val:`${kpis.varFluxo>=0?'+':''}R$${fmt(kpis.varFluxo)}`, sub: kpis.saldoInicial>0?`${(kpis.varFluxo/kpis.saldoInicial*100).toFixed(1)}%`:'', color: kpis.varFluxo>=0?'var(--acc)':'var(--red)', subClass: kpis.varFluxo>=0?'up':'dn' },
            { lbl:`Saldo final · ${banco||'Total'}`, val:`R$${fmt(kpis.saldoFinal)}`, sub: ateStr.split('-').reverse().join('/'), color: kpis.saldoFinal>=0?'var(--acc)':'var(--red)' },
            ...(diasNeg>0?[{ lbl:'Dias negativos', val:`${diasNeg}`, sub:'Atenção', color:'var(--red)', subClass:'dn' }]:[]),
          ].map((k,i) => (
            <div key={i} className="kpi" style={{'--ka':k.color} as any}>
              <div className="kpi-lbl">{k.lbl}</div>
              <div className="kpi-val" style={{ fontSize:'16px', color:k.color }}>{k.val}</div>
              <div className={`kpi-sub ${k.subClass||''}`}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Alert */}
      {diasNeg > 0 ? (
        <div style={{ background:'var(--red-d)', border:'1px solid rgba(248,113,113,.25)', borderRadius:'var(--rs)', padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
          <span style={{ fontSize:'20px' }}>⚠️</span>
          <div>
            <div style={{ fontSize:'13px', fontWeight:'600', color:'var(--red)' }}>{diasNeg} dia{diasNeg>1?'s':''} com saldo negativo</div>
            <div style={{ fontSize:'11px', color:'var(--mut)', marginTop:'2px' }}>Verifique as linhas em vermelho</div>
          </div>
        </div>
      ) : kpis ? (
        <div style={{ background:'var(--acc-d)', border:'1px solid rgba(110,231,183,.2)', borderRadius:'var(--rs)', padding:'10px 16px', display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
          <span>✅</span><span style={{ fontSize:'12px', color:'var(--acc)', fontWeight:'500' }}>Nenhum dia com saldo negativo no período</span>
        </div>
      ) : null}

      {/* Table */}
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Dia</th>
              <th style={{ textAlign:'right' }}>Entradas</th>
              <th style={{ textAlign:'right' }}>Saídas</th>
              <th style={{ textAlign:'right' }}>Variação</th>
              <th style={{ textAlign:'right' }}>Saldo</th>
              <th className="hide-mob">Lançamentos</th>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--mut)', padding:'24px' }}>Selecione um período válido</td></tr>
            ) : linhas.map(row => (
              <tr key={row.d} style={{ background: row.isHoje ? 'rgba(110,231,183,.07)' : '', opacity: !row.isPast && !row.isHoje && !row.hasMovs ? .35 : 1 }}>
                <td style={{ whiteSpace:'nowrap', fontWeight: row.isHoje?700:400, color: row.isHoje?'var(--acc)':row.isPast?'var(--txt)':'var(--txt2)' }}>
                  {row.d.split('-').reverse().join('/')}
                  {row.isHoje && <span style={{ fontSize:'9px', background:'var(--acc)', color:'#0B0F1A', padding:'1px 5px', borderRadius:'8px', fontWeight:700, marginLeft:'4px' }}>HOJE</span>}
                  {row.isFuturo && <span style={{ fontSize:'9px', color:'var(--mut)', marginLeft:'4px' }}>(proj.)</span>}
                </td>
                <td style={{ color: row.isFim?'var(--mut)':'var(--txt2)', fontSize:'11px' }}>{row.diaSem}</td>
                <td className="td-amt" style={{ color: row.ent>0?'var(--acc)':'var(--mut)' }}>{row.ent>0?`+R$${fmt(row.ent)}`:'—'}</td>
                <td className="td-amt" style={{ color: row.sai>0?'var(--red)':'var(--mut)' }}>{row.sai>0?`-R$${fmt(row.sai)}`:'—'}</td>
                <td className="td-amt" style={{ color: row.saldoDia===0?'var(--mut)':row.saldoDia>0?'var(--acc)':'var(--red)' }}>
                  {row.saldoDia===0?'—':`${row.saldoDia>0?'+':''}R$${fmt(row.saldoDia)}`}
                </td>
                <td className="td-amt">
                  <span style={{ fontWeight:700, color: row.saldoExibido>=0?'var(--acc)':'var(--red)' }}>R${fmt(row.saldoExibido)}</span>
                  {row.saldoExibido < 0 && <span style={{ fontSize:'9px', background:'var(--red-d)', color:'var(--red)', borderRadius:'8px', padding:'1px 5px', marginLeft:'4px' }}>⚠</span>}
                  {row.naoExplic !== null && Math.abs(row.naoExplic) > 0.05 && (
                    <span style={{ fontSize:'9px', color:'var(--amb)', marginLeft:'3px' }}>Δ{row.naoExplic>0?'+':''}R${fmt(row.naoExplic)}</span>
                  )}
                  {row.temRef && row.naoExplic !== null && Math.abs(row.naoExplic) <= 0.05 && row.hasMovs && (
                    <span style={{ fontSize:'9px', color:'var(--acc)', marginLeft:'3px' }}>✓</span>
                  )}
                </td>
                <td className="hide-mob">
                  {row.itens.length > 0 ? row.itens.map((l,i) => (
                    <span key={i} style={{ fontSize:'10px', color: l.fluxo==='Entrada'?'var(--acc)':'var(--red)', display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'200px' }}>
                      {l.fluxo==='Entrada'?'↑':'↓'} {l.descricao} R${fmt(l.valor)}{l.status==='A Realizar'?' (prev.)':''}
                    </span>
                  )) : <span style={{ color:'var(--mut)', fontSize:'11px' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
