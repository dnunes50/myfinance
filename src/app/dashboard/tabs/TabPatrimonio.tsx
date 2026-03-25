'use client'
import { fmt } from '@/lib/utils'
import type { Lancamento, Banco } from '@/lib/types'

interface Props {
  lancamentos: Lancamento[]; bancos: Banco[]; orcamento: any[]; saldosRef: any
  onSaveLancamento: any; onDeleteLancamento: any
}

const EVOLUCAO = [
  { mes:'Dez/25', nubank:71212.53, c6:1347.71,  san:0.80, clear:155.24, bin:0,       onil:309719.79, pat:382436.07 },
  { mes:'Jan/26', nubank:5081.86,  c6:18333.04, san:0,    clear:155.24, bin:0,       onil:362285.00, pat:385855.14 },
  { mes:'Fev/26', nubank:5126.90,  c6:56868.37, san:0,    clear:155.24, bin:4000,    onil:651373.44, pat:717523.95 },
  { mes:'Mar/26', nubank:5133.69,  c6:42502.45, san:0,    clear:155.24, bin:0,       onil:675446.24, pat:723237.62 },
  { mes:'Abr/26', nubank:5133.69,  c6:45944.01, san:0,    clear:155.24, bin:0,       onil:693311.57, pat:744544.50 },
  { mes:'Mai/26', nubank:5133.69,  c6:44933.79, san:0,    clear:155.24, bin:0,       onil:711677.13, pat:761899.84 },
  { mes:'Jun/26', nubank:5133.69,  c6:44418.62, san:0,    clear:155.24, bin:0,       onil:730554.05, pat:780261.60 },
  { mes:'Jul/26', nubank:5133.69,  c6:43903.45, san:0,    clear:155.24, bin:0,       onil:749962.47, pat:799155.13 },
  { mes:'Ago/26', nubank:5133.69,  c6:38896.29, san:0,    clear:155.24, bin:0,       onil:769914.86, pat:814100.08 },
  { mes:'Set/26', nubank:5133.69,  c6:38381.12, san:0,    clear:155.24, bin:0,       onil:790425.38, pat:834095.43 },
  { mes:'Out/26', nubank:5133.69,  c6:37865.95, san:0,    clear:155.24, bin:0,       onil:811506.56, pat:854661.44 },
  { mes:'Nov/26', nubank:5133.69,  c6:37350.78, san:0,    clear:155.24, bin:0,       onil:833171.57, pat:875811.28 },
  { mes:'Dez/26', nubank:5133.69,  c6:36835.61, san:0,    clear:155.24, bin:0,       onil:855433.26, pat:897557.80 },
]

const MES_ATUAL = 'Mar/26'
const META = 1_000_000

const BANCO_CORES: Record<string, string> = {
  'C6 Bank':'#F59E0B', 'Nubank':'#A855F7', 'Onil':'#6EE7B7',
  'Santander':'#EF4444', 'Clear':'#60A5FA', 'Binance':'#FBBF24', 'XP':'#10B981'
}

export default function TabPatrimonio({ bancos }: Props) {
  const pat       = bancos.reduce((s, b) => s + b.valor, 0)
  const saldoIni  = 382436.07
  const varPat    = pat - saldoIni
  const pct       = Math.min(100, pat / META * 100)

  // Classify banks
  const caixa = bancos.filter(b => ['C6 Bank','Nubank','Santander','Clear'].includes(b.nome)).reduce((s,b) => s+b.valor, 0)
  const intl  = bancos.filter(b => b.nome === 'Onil').reduce((s,b) => s+b.valor, 0)
  const cripto= bancos.filter(b => b.nome === 'Binance').reduce((s,b) => s+b.valor, 0)

  const alocacao = [
    { label:'Caixa',                    valor: caixa,         cor:'var(--blue)' },
    { label:'Investimento Internacional',valor: intl,          cor:'var(--acc)'  },
    { label:'Cripto',                   valor: cripto,         cor:'var(--amb)'  },
  ].filter(a => a.valor > 0)

  return (
    <div>
      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom:'24px' }}>
        {[
          { lbl:'Saldo inicial (31/12/25)', val:`R$${fmt(saldoIni)}`, sub:'Abertura do período',   color:'var(--mut)' },
          { lbl:'Patrimônio Atual',         val:`R$${fmt(pat)}`,      sub:`↑ ${pct.toFixed(1)}% da meta`, color:'var(--acc)', subClass:'up' },
          { lbl:'Variação desde abertura',  val:`${varPat>=0?'+':''}R$${fmt(varPat)}`, sub:`${((varPat/saldoIni)*100).toFixed(1)}%`, color: varPat>=0?'var(--acc)':'var(--red)', subClass: varPat>=0?'up':'dn' },
          { lbl:'Caixa total',              val:`R$${fmt(caixa)}`,    sub:`${(caixa/pat*100).toFixed(1)}% do patrimônio`, color:'var(--blue)' },
          { lbl:'Investim. Internacional',  val:`R$${fmt(intl)}`,     sub:`${(intl/pat*100).toFixed(1)}% do patrimônio`,  color:'#A78BFA' },
          { lbl:'Falta para R$ 1M',         val:`R$${fmt(META-pat)}`, sub:'Meta: dez/2026', color:'var(--amb)', subClass:'warn' },
        ].map((k,i) => (
          <div key={i} className="kpi" style={{'--ka':k.color} as any}>
            <div className="kpi-lbl">{k.lbl}</div>
            <div className="kpi-val" style={{ fontSize:'16px' }}>{k.val}</div>
            <div className={`kpi-sub ${k.subClass||''}`}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom:'24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
          <div style={{ fontWeight:'700' }}>Meta: R$ 1.000.000</div>
          <div style={{ color:'var(--acc)', fontWeight:'600', fontSize:'13px' }}>{pct.toFixed(1)}% concluído</div>
        </div>
        <div className="prog-track">
          <div className="prog-fill" style={{ width:`${pct}%` }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'8px', fontSize:'11px', color:'var(--mut)' }}>
          <span>Atual: R${fmt(pat)}</span>
          <span>Faltam R${fmt(META-pat)}</span>
        </div>
      </div>

      <div className="g2" style={{ marginBottom:'24px' }}>
        {/* Saldo por banco */}
        <div>
          <div className="sec-title">Saldo por banco</div>
          {bancos.map(b => (
            <div key={b.id} style={{ display:'flex', alignItems:'center', gap:'12px', background:'var(--sur)', border:'1px solid var(--brd)', borderRadius:'var(--rs)', padding:'12px 14px', marginBottom:'8px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:`${BANCO_CORES[b.nome]||'#6EE7B7'}22`, color: BANCO_CORES[b.nome]||'var(--acc)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'12px' }}>
                {b.nome.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:'600', fontSize:'13px' }}>{b.nome}</div>
                <div style={{ fontSize:'11px', color:'var(--mut)' }}>{b.data_abertura.split('-').reverse().join('/')}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontWeight:'700', fontSize:'14px', color: b.valor>0?'var(--txt)':'var(--mut)' }}>R${fmt(b.valor)}</div>
                <div style={{ fontSize:'11px', color:'var(--mut)' }}>{pat>0?(b.valor/pat*100).toFixed(1):0}%</div>
              </div>
            </div>
          ))}
        </div>

        {/* Alocação */}
        <div>
          <div className="sec-title">Alocação</div>
          <div className="card">
            {alocacao.map(a => (
              <div key={a.label} style={{ marginBottom:'16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'4px' }}>
                  <span style={{ color:'var(--txt2)' }}>{a.label}</span>
                  <span style={{ fontWeight:'600' }}>{(a.valor/pat*100).toFixed(1)}%</span>
                </div>
                <div className="prog-track" style={{ height:'5px' }}>
                  <div className="prog-fill" style={{ width:`${Math.min(100,a.valor/pat*100)}%`, background: a.cor }} />
                </div>
                <div style={{ fontSize:'11px', color:'var(--mut)', textAlign:'right', marginTop:'2px' }}>R${fmt(a.valor)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela saldo por banco por mês */}
      <div style={{ marginBottom:'24px' }}>
        <div className="sec-title">Saldo por banco — histórico mensal</div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Mês</th>
                <th style={{ textAlign:'right' }}>Nubank</th>
                <th style={{ textAlign:'right' }}>C6 Bank</th>
                <th className="hide-mob" style={{ textAlign:'right' }}>Santander</th>
                <th className="hide-mob" style={{ textAlign:'right' }}>Clear</th>
                <th className="hide-mob" style={{ textAlign:'right' }}>Binance</th>
                <th style={{ textAlign:'right' }}>Onil</th>
                <th style={{ textAlign:'right' }}>Total</th>
                <th style={{ textAlign:'right' }}>Var %</th>
              </tr>
            </thead>
            <tbody>
              {EVOLUCAO.map((e, i) => {
                const prev = i > 0 ? EVOLUCAO[i-1].pat : e.pat
                const vP   = i > 0 ? ((e.pat-prev)/prev*100) : 0
                const isNow = e.mes === MES_ATUAL
                const isFut = ['Abr/26','Mai/26','Jun/26','Jul/26','Ago/26','Set/26','Out/26','Nov/26','Dez/26'].includes(e.mes)
                const fc = (v: number) => v > 0 ? `R$${fmt(v)}` : '—'
                return (
                  <tr key={e.mes} style={{ background: isNow?'rgba(110,231,183,.07)':'', opacity: isFut?.6:1 }}>
                    <td style={{ fontWeight: isNow?700:400, color: isNow?'var(--acc)':isFut?'var(--mut)':'var(--txt)', whiteSpace:'nowrap' }}>
                      {e.mes}
                      {isNow && <span style={{ fontSize:'9px', background:'var(--acc)', color:'#0B0F1A', padding:'1px 5px', borderRadius:'8px', fontWeight:700, marginLeft:'4px' }}>HOJE</span>}
                      {isFut && <span style={{ fontSize:'9px', color:'var(--mut)', marginLeft:'4px' }}>(proj.)</span>}
                    </td>
                    <td className="td-amt">{fc(e.nubank)}</td>
                    <td className="td-amt">{fc(e.c6)}</td>
                    <td className="td-amt hide-mob">{fc(e.san)}</td>
                    <td className="td-amt hide-mob">{fc(e.clear)}</td>
                    <td className="td-amt hide-mob">{fc(e.bin)}</td>
                    <td className="td-amt" style={{ color:'#A78BFA' }}>{fc(e.onil)}</td>
                    <td className="td-amt" style={{ fontWeight:700, color: isNow?'var(--acc)':'var(--txt)' }}>R${fmt(e.pat)}</td>
                    <td className="td-amt" style={{ color: vP>=0?'var(--acc)':'var(--red)' }}>{i===0?'—':`${vP>=0?'+':''}${vP.toFixed(1)}%`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabela evolução patrimonial */}
      <div>
        <div className="sec-title">Evolução patrimonial vs meta</div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Mês</th>
                <th style={{ textAlign:'right' }}>Patrimônio</th>
                <th style={{ textAlign:'right' }}>Variação R$</th>
                <th style={{ textAlign:'right' }}>Variação %</th>
                <th style={{ textAlign:'right' }}>Meta</th>
                <th style={{ textAlign:'right' }}>% da Meta</th>
              </tr>
            </thead>
            <tbody>
              {EVOLUCAO.map((e, i) => {
                const prev = i > 0 ? EVOLUCAO[i-1].pat : e.pat
                const vR = e.pat - prev
                const vP = i > 0 ? ((e.pat-prev)/prev*100) : 0
                const pm = e.pat / META * 100
                const isNow = e.mes === MES_ATUAL
                return (
                  <tr key={e.mes} style={{ background: isNow?'rgba(110,231,183,.07)':'' }}>
                    <td style={{ fontWeight: isNow?700:400, color: isNow?'var(--acc)':'var(--txt)' }}>{e.mes}</td>
                    <td className="td-amt">R${fmt(e.pat)}</td>
                    <td className="td-amt" style={{ color: vR>=0?'var(--acc)':'var(--red)' }}>{i===0?'—':`${vR>=0?'+':''}R$${fmt(vR)}`}</td>
                    <td className="td-amt" style={{ color: vP>=0?'var(--acc)':'var(--red)' }}>{i===0?'—':`${vP>=0?'+':''}${vP.toFixed(2)}%`}</td>
                    <td className="td-amt" style={{ color:'var(--mut)' }}>R$1.000.000</td>
                    <td className="td-amt">
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', justifyContent:'flex-end' }}>
                        <span>{pm.toFixed(1)}%</span>
                        <div style={{ width:'56px', background:'var(--bg)', borderRadius:'99px', height:'4px', overflow:'hidden' }}>
                          <div style={{ width:`${Math.min(100,pm)}%`, height:'100%', background:'var(--acc)', borderRadius:'99px' }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
