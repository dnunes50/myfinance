'use client'
import { fmt } from '@/lib/utils'
import type { Lancamento, Banco } from '@/lib/types'

interface Props {
  lancamentos: Lancamento[]; bancos: Banco[]; orcamento: any[]; saldosRef: any
  onSaveLancamento: any; onDeleteLancamento: any
}

const EVOLUCAO = [
  { mes:'Dez/25', nubank:71212.53, c6:1347.71,    san:0.80,  clear:155.24, bin:0,       onil:309719.79, pat:382436.07 },
  { mes:'Jan/26', nubank:5081.86,  c6:18333.04,   san:0,     clear:155.24, bin:0,       onil:362285.00, pat:385855.14 },
  { mes:'Fev/26', nubank:5126.90,  c6:56868.37,   san:0,     clear:155.24, bin:4000,    onil:651373.44, pat:717523.95 },
  { mes:'Mar/26', nubank:5133.69,  c6:42502.45,   san:0,     clear:155.24, bin:0,       onil:675446.24, pat:723237.62 },
  { mes:'Abr/26', nubank:5133.69,  c6:45944.01,   san:0,     clear:155.24, bin:0,       onil:693311.57, pat:744544.50 },
  { mes:'Mai/26', nubank:5133.69,  c6:44933.79,   san:0,     clear:155.24, bin:0,       onil:711677.13, pat:761899.84 },
  { mes:'Jun/26', nubank:5133.69,  c6:44418.62,   san:0,     clear:155.24, bin:0,       onil:730554.05, pat:780261.60 },
  { mes:'Jul/26', nubank:5133.69,  c6:43903.45,   san:0,     clear:155.24, bin:0,       onil:749962.47, pat:799155.13 },
  { mes:'Ago/26', nubank:5133.69,  c6:38896.29,   san:0,     clear:155.24, bin:0,       onil:769914.86, pat:814100.08 },
  { mes:'Set/26', nubank:5133.69,  c6:38381.12,   san:0,     clear:155.24, bin:0,       onil:790425.38, pat:834095.43 },
  { mes:'Out/26', nubank:5133.69,  c6:37865.95,   san:0,     clear:155.24, bin:0,       onil:811506.56, pat:854661.44 },
  { mes:'Nov/26', nubank:5133.69,  c6:37350.78,   san:0,     clear:155.24, bin:0,       onil:833171.57, pat:875811.28 },
  { mes:'Dez/26', nubank:5133.69,  c6:36835.61,   san:0,     clear:155.24, bin:0,       onil:855433.26, pat:897557.80 },
]

export default function TabPatrimonio({ bancos }: Props) {
  const pat = bancos.reduce((s, b) => s + b.valor, 0)
  const meta = 1_000_000
  const pct = Math.min(100, pat / meta * 100)
  const saldoIni = 382436.07

  return (
    <div>
      <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Patrimônio</div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi" style={{ '--ka': 'var(--mut)' } as any}>
          <div className="kpi-lbl">Saldo inicial (31/12/25)</div>
          <div className="kpi-val">R${fmt(saldoIni)}</div>
          <div className="kpi-sub">Abertura</div>
        </div>
        <div className="kpi" style={{ '--ka': 'var(--acc)' } as any}>
          <div className="kpi-lbl">Patrimônio atual</div>
          <div className="kpi-val" style={{ color: 'var(--acc)' }}>R${fmt(pat)}</div>
          <div className="kpi-sub up">↑ {pct.toFixed(1)}% da meta</div>
        </div>
        <div className="kpi" style={{ '--ka': 'var(--blue)' } as any}>
          <div className="kpi-lbl">Variação desde abertura</div>
          <div className="kpi-val">R${fmt(pat - saldoIni)}</div>
          <div className="kpi-sub up">+{((pat - saldoIni) / saldoIni * 100).toFixed(1)}%</div>
        </div>
        <div className="kpi" style={{ '--ka': '#A78BFA' } as any}>
          <div className="kpi-lbl">Falta para meta</div>
          <div className="kpi-val" style={{ color: '#A78BFA' }}>R${fmt(meta - pat)}</div>
          <div className="kpi-sub">R$1 milhão</div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ background: 'var(--sur)', border: '1px solid var(--brd)', borderRadius: 'var(--r)', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ fontWeight: '700' }}>Meta: R$ 1.000.000</div>
          <div style={{ color: 'var(--acc)', fontWeight: '600' }}>{pct.toFixed(1)}%</div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Saldos por banco */}
      <div style={{ marginBottom: '24px' }}>
        <div className="sec-title">Saldo atual por banco</div>
        <div className="kpi-grid">
          {bancos.map(b => (
            <div key={b.id} className="kpi" style={{ '--ka': 'var(--blue)' } as any}>
              <div className="kpi-lbl">{b.nome}</div>
              <div className="kpi-val" style={{ fontSize: '16px' }}>R${fmt(b.valor)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Evolução mensal */}
      <div>
        <div className="sec-title">Evolução patrimonial</div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Mês</th>
                <th style={{ textAlign: 'right' }}>Nubank</th>
                <th style={{ textAlign: 'right' }}>C6 Bank</th>
                <th style={{ textAlign: 'right' }}>Onil</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>% Meta</th>
              </tr>
            </thead>
            <tbody>
              {EVOLUCAO.map(e => (
                <tr key={e.mes}>
                  <td style={{ fontWeight: '600' }}>{e.mes}</td>
                  <td className="td-amt">R${fmt(e.nubank)}</td>
                  <td className="td-amt">R${fmt(e.c6)}</td>
                  <td className="td-amt" style={{ color: '#A78BFA' }}>R${fmt(e.onil)}</td>
                  <td className="td-amt" style={{ color: 'var(--acc)', fontWeight: '700' }}>R${fmt(e.pat)}</td>
                  <td className="td-amt" style={{ color: 'var(--mut)' }}>{(e.pat / meta * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
