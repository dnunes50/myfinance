'use client'
import { fmt } from '@/lib/utils'
import type { Lancamento, Banco } from '@/lib/types'

interface Props {
  lancamentos: Lancamento[]; bancos: Banco[]; orcamento: any[]; saldosRef: any
  onSaveLancamento: any; onDeleteLancamento: any
}

export default function TabFluxo({ lancamentos, bancos, saldosRef }: Props) {
  const hoje = new Date().toISOString().slice(0, 10)

  // Build daily flow: use saldosRef for historical, project forward
  const saldoRefKeys = Object.keys(saldosRef).sort()
  const lastRef = saldoRefKeys[saldoRefKeys.length - 1]
  const lastRefTotal = saldosRef[lastRef]?.total || 0

  // Get last 30 days and next 30 days
  const dias: { data: string; saldo: number; tipo: 'historico' | 'projetado' }[] = []

  for (let i = -30; i <= 30; i++) {
    const d = new Date(); d.setDate(d.getDate() + i)
    const ds = d.toISOString().slice(0, 10)

    if (ds <= lastRef && saldosRef[ds]) {
      dias.push({ data: ds, saldo: saldosRef[ds].total, tipo: 'historico' })
    } else if (ds > lastRef) {
      const movs = lancamentos.filter(l => l.status === 'A Realizar' && l.data === ds)
      const delta = movs.reduce((s, l) => s + (l.fluxo === 'Entrada' ? l.valor : -l.valor), 0)
      const prev = dias[dias.length - 1]?.saldo || lastRefTotal
      dias.push({ data: ds, saldo: prev + delta, tipo: 'projetado' })
    }
  }

  return (
    <div>
      <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Fluxo Diário</div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th style={{ textAlign: 'right' }}>Saldo</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {dias.filter((_, i) => i % 1 === 0).map(d => (
              <tr key={d.data} style={d.data === hoje ? { background: 'rgba(110,231,183,.05)' } : {}}>
                <td style={{ fontWeight: d.data === hoje ? '700' : '400' }}>
                  {d.data.split('-').reverse().join('/')}
                  {d.data === hoje && <span style={{ marginLeft: '8px', fontSize: '10px', color: 'var(--acc)', fontWeight: '600' }}>HOJE</span>}
                </td>
                <td className="td-amt" style={{ color: d.tipo === 'projetado' ? 'var(--amb)' : 'var(--acc)' }}>
                  R${fmt(d.saldo)}
                </td>
                <td>
                  <span className={`bdg ${d.tipo === 'historico' ? 'bdg-real' : 'bdg-pend'}`}>
                    {d.tipo === 'historico' ? 'Histórico' : 'Projetado'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
