'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import { fmt, fmtS } from '@/lib/utils'
import type { Lancamento, Banco } from '@/lib/types'

interface Props {
  lancamentos: Lancamento[]; bancos: Banco[]; orcamento: any[]; saldosRef: any
  onSaveLancamento: any; onDeleteLancamento: any
}

const EVOLUCAO = [
  {mes:'Dez/25',pat:382436.07},{mes:'Jan/26',pat:385855.14},{mes:'Fev/26',pat:717523.95},
  {mes:'Mar/26',pat:723237.62},{mes:'Abr/26',pat:744544.50},{mes:'Mai/26',pat:761899.84},
  {mes:'Jun/26',pat:780261.60},{mes:'Jul/26',pat:799155.13},{mes:'Ago/26',pat:814100.08},
  {mes:'Set/26',pat:834095.43},{mes:'Out/26',pat:854661.44},{mes:'Nov/26',pat:875811.28},
  {mes:'Dez/26',pat:897557.80},
]

const MES_MAP: Record<string,string> = {Jan:'01',Fev:'02',Mar:'03',Abr:'04',Mai:'05',Jun:'06',Jul:'07',Ago:'08',Set:'09',Out:'10',Nov:'11',Dez:'12'}
const ALL_MESES = ['01/26','02/26','03/26','04/26','05/26','06/26','07/26','08/26','09/26','10/26','11/26','12/26']
const LAB_MAP: Record<string,string> = {'01/26':'Jan','02/26':'Fev','03/26':'Mar','04/26':'Abr','05/26':'Mai','06/26':'Jun','07/26':'Jul','08/26':'Ago','09/26':'Set','10/26':'Out','11/26':'Nov','12/26':'Dez'}

function getMonthStart() { const d=new Date();d.setDate(1);return d.toISOString().slice(0,10) }
function getMonthEnd()   { const d=new Date();d.setMonth(d.getMonth()+1);d.setDate(0);return d.toISOString().slice(0,10) }

export default function TabDashboard({ lancamentos, bancos, saldosRef }: Props) {
  const [de,  setDe]  = useState(getMonthStart)
  const [ate, setAte] = useState(getMonthEnd)
  const chartsRendered = useRef(false)
  const chartsRef = useRef<any>({})

  const pat  = bancos.reduce((s,b)=>s+b.valor,0)
  const meta = 1_000_000
  const pct  = Math.min(100, pat/meta*100)
  const falta= meta - pat

  // Projeção fim do ano
  const entFimAno = lancamentos.filter(l=>l.status==='A Realizar'&&l.fluxo==='Entrada'&&l.data<='2026-12-31').reduce((s,l)=>s+l.valor,0)
  const saiFimAno = lancamentos.filter(l=>l.status==='A Realizar'&&l.fluxo==='Saída'  &&l.data<='2026-12-31').reduce((s,l)=>s+l.valor,0)
  const patFimAno = pat + entFimAno - saiFimAno
  const faltaFimAno = meta - patFimAno

  // Período
  const lancPeriodo = useMemo(()=>
    lancamentos.filter(l=>l.status==='Realizado'&&l.data>=de&&l.data<=ate),
    [lancamentos,de,ate])

  const rec   = lancPeriodo.filter(l=>l.fluxo==='Entrada').reduce((s,l)=>s+l.valor,0)
  const des   = lancPeriodo.filter(l=>l.fluxo==='Saída').reduce((s,l)=>s+l.valor,0)
  const saldo = rec-des
  const txPoup= rec>0?((rec-des)/rec*100):0

  // Saldo inicial
  const diaAnt= de?new Date(new Date(de+'T00:00:00').getTime()-86400000).toISOString().slice(0,10):null
  const getSaldoRef=(d:string|null)=>{
    if(!d)return null
    if(saldosRef[d])return saldosRef[d].total
    const keys=Object.keys(saldosRef).filter(k=>k<=d).sort()
    const last=keys[keys.length-1]
    return last?saldosRef[last].total:null
  }
  const saldoIni=getSaldoRef(diaAnt)

  // A realizar no período
  const aRec=lancamentos.filter(l=>l.status==='A Realizar'&&l.fluxo==='Entrada'&&l.data>=de&&l.data<=ate).reduce((s,l)=>s+l.valor,0)
  const aSai=lancamentos.filter(l=>l.status==='A Realizar'&&l.fluxo==='Saída'  &&l.data>=de&&l.data<=ate).reduce((s,l)=>s+l.valor,0)
  const saldoProj=pat+aRec-aSai

  // Urgentes
  const hoje=new Date().toISOString().slice(0,10)
  const em7 =new Date();em7.setDate(em7.getDate()+7)
  const em7s=em7.toISOString().slice(0,10)
  const nUrgentes=lancamentos.filter(l=>l.status==='A Realizar'&&l.data>=hoje&&l.data<=em7s).length

  function setRange(tipo:string){
    const now=new Date()
    if(tipo==='mes'){setDe(new Date(now.getFullYear(),now.getMonth(),1).toISOString().slice(0,10));setAte(new Date(now.getFullYear(),now.getMonth()+1,0).toISOString().slice(0,10))}
    else if(tipo==='mes-ant'){setDe(new Date(now.getFullYear(),now.getMonth()-1,1).toISOString().slice(0,10));setAte(new Date(now.getFullYear(),now.getMonth(),0).toISOString().slice(0,10))}
    else if(tipo==='ytd'){setDe(`${now.getFullYear()}-01-01`);setAte(now.toISOString().slice(0,10))}
    else{setDe('2025-12-01');setAte('2027-12-31')}
  }

  // Charts
  useEffect(()=>{
    if(typeof window==='undefined')return
    const script=document.createElement('script')
    script.src='https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
    script.onload=()=>renderCharts()
    document.head.appendChild(script)
    return ()=>{ Object.values(chartsRef.current).forEach((c:any)=>c?.destroy()) }
  },[])

  useEffect(()=>{
    if((window as any).Chart)renderCharts()
  },[lancamentos,bancos,de,ate])

  function renderCharts(){
    const Chart=(window as any).Chart
    if(!Chart)return

    const chartDefaults={
      responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{backgroundColor:'#1E2940',borderColor:'rgba(255,255,255,.1)',borderWidth:1,titleColor:'#E8EDF5',bodyColor:'#A8B3C4',padding:10,callbacks:{label:(ctx:any)=>' R$ '+Math.round(ctx.raw).toLocaleString('pt-BR')}}},
      scales:{x:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#8B95A8',font:{size:10}}},y:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#8B95A8',font:{size:10},callback:(v:any)=>'R$'+Math.round(v/1000)+'k'}}}
    }

    // 1. Evolução patrimonial
    const evFilt=EVOLUCAO.filter(e=>{
      const [nm,ay]=e.mes.split('/');const d=`20${ay}-${MES_MAP[nm]}-01`
      if(de&&d<de.slice(0,7)+'-01')return false
      if(ate&&d>ate.slice(0,7)+'-01')return false
      return true
    })
    const evData=evFilt.length?evFilt:EVOLUCAO
    chartsRef.current.evolucao?.destroy()
    const c1=document.getElementById('chart-evolucao') as HTMLCanvasElement
    if(c1)chartsRef.current.evolucao=new Chart(c1,{type:'line',data:{labels:evData.map(e=>e.mes),datasets:[{label:'Patrimônio',data:evData.map(e=>e.pat),borderColor:'#6EE7B7',backgroundColor:'rgba(110,231,183,.08)',borderWidth:2,fill:true,tension:0.4,pointRadius:3,pointBackgroundColor:'#6EE7B7'},{label:'Meta',data:evData.map(()=>1000000),borderColor:'rgba(252,211,77,.35)',borderWidth:1.5,borderDash:[5,4],fill:false,tension:0,pointRadius:0}]},options:{...chartDefaults}})

    // 2. Receitas vs Despesas por mês
    const mesesFilt=ALL_MESES.filter(m=>{
      const d1=`2026-${m.slice(0,2)}-01`;const d2=`2026-${m.slice(0,2)}-31`
      if(de&&d2<de)return false;if(ate&&d1>ate)return false;return true
    })
    const recByMes=mesesFilt.map(m=>lancamentos.filter(l=>l.mes===m&&l.fluxo==='Entrada'&&l.status==='Realizado').reduce((s,l)=>s+l.valor,0))
    const desByMes=mesesFilt.map(m=>lancamentos.filter(l=>l.mes===m&&l.fluxo==='Saída'  &&l.status==='Realizado').reduce((s,l)=>s+l.valor,0))
    chartsRef.current.recdes?.destroy()
    const c2=document.getElementById('chart-recdes') as HTMLCanvasElement
    if(c2)chartsRef.current.recdes=new Chart(c2,{type:'bar',data:{labels:mesesFilt.map(m=>LAB_MAP[m]||m),datasets:[{label:'Receitas',data:recByMes,backgroundColor:'rgba(110,231,183,.7)',borderRadius:4,borderSkipped:false},{label:'Despesas',data:desByMes,backgroundColor:'rgba(248,113,113,.7)',borderRadius:4,borderSkipped:false}]},options:{...chartDefaults,plugins:{...chartDefaults.plugins,tooltip:{...chartDefaults.plugins.tooltip,callbacks:{label:(ctx:any)=>` ${ctx.dataset.label}: R$ ${Math.round(ctx.raw).toLocaleString('pt-BR')}`}}}}})

    // 3. Alocação donut
    const classes:Record<string,number>={'Caixa':0,'Internacional':0,'Cripto':0}
    bancos.forEach(b=>{
      if(['C6 Bank','Nubank','Santander','Clear'].includes(b.nome))classes['Caixa']+=b.valor
      else if(b.nome==='Onil')classes['Internacional']+=b.valor
      else if(b.nome==='Binance')classes['Cripto']+=b.valor
    })
    const allocEntries=Object.entries(classes).filter(([,v])=>v>0)
    const allocColors=['#60A5FA','#6EE7B7','#A78BFA','#FCD34D','#F87171']
    const allocTotal=allocEntries.reduce((s,[,v])=>s+v,0)
    chartsRef.current.alloc?.destroy()
    const c3=document.getElementById('chart-alloc') as HTMLCanvasElement
    if(c3)chartsRef.current.alloc=new Chart(c3,{type:'doughnut',data:{labels:allocEntries.map(([k])=>k),datasets:[{data:allocEntries.map(([,v])=>v),backgroundColor:allocColors,borderColor:'#1E2940',borderWidth:3,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{display:false},tooltip:{backgroundColor:'#1E2940',borderColor:'rgba(255,255,255,.1)',borderWidth:1,titleColor:'#E8EDF5',bodyColor:'#A8B3C4',padding:10,callbacks:{label:(ctx:any)=>` ${ctx.label}: ${(ctx.raw/allocTotal*100).toFixed(1)}% (R$ ${Math.round(ctx.raw).toLocaleString('pt-BR')})`}}}}})
    const legend=document.getElementById('alloc-legend')
    if(legend)legend.innerHTML=allocEntries.map(([l],i)=>`<div style="display:flex;align-items:center;gap:6px;white-space:nowrap"><span style="width:9px;height:9px;border-radius:2px;background:${allocColors[i]};display:inline-block"></span><span style="color:var(--txt2)">${l}</span><span style="color:var(--mut)">${(allocEntries[i][1]/allocTotal*100).toFixed(1)}%</span></div>`).join('')

    // 4. Top despesas
    const catDes:Record<string,number>={}
    lancamentos.filter(l=>l.fluxo==='Saída'&&l.data>=de&&l.data<=ate&&l.status==='Realizado').forEach(l=>{catDes[l.tipo]=(catDes[l.tipo]||0)+l.valor})
    const topDes=Object.entries(catDes).sort((a,b)=>b[1]-a[1]).slice(0,7)
    chartsRef.current.orc?.destroy()
    const c4=document.getElementById('chart-orc') as HTMLCanvasElement
    if(c4)chartsRef.current.orc=new Chart(c4,{type:'bar',data:{labels:topDes.map(([k])=>k.replace('Despesa com ','').length>16?k.replace('Despesa com ','').slice(0,14)+'…':k.replace('Despesa com ','')),datasets:[{label:'Despesas',data:topDes.map(([,v])=>v),backgroundColor:'rgba(248,113,113,.7)',borderRadius:3,borderSkipped:false}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#1E2940',borderColor:'rgba(255,255,255,.1)',borderWidth:1,titleColor:'#E8EDF5',bodyColor:'#A8B3C4',padding:10,callbacks:{label:(ctx:any)=>` R$ ${Math.round(ctx.raw).toLocaleString('pt-BR')}`}}},scales:{x:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#8B95A8',font:{size:10},callback:(v:any)=>'R$'+Math.round(v/1000)+'k'}},y:{grid:{display:false},ticks:{color:'#A8B3C4',font:{size:10}}}}}})
  }

  const kpis=[
    saldoIni!==null?{lbl:'Saldo inicial',val:fmtS(saldoIni),sub:diaAnt?.split('-').reverse().join('/')||'',color:'var(--mut)'}:null,
    {lbl:'Patrimônio Atual',val:fmtS(pat),sub:`↑ ${pct.toFixed(1)}% da meta`,color:'var(--acc)',subClass:'up'},
    {lbl:'Saldo projetado',val:fmtS(saldoProj),sub:`A realizar: ${fmtS(aRec-aSai)}`,color:saldoProj>=pat?'var(--acc)':'var(--amb)'},
    {lbl:'Receitas no período',val:fmtS(rec),sub:`${lancPeriodo.length} lançamentos`,color:'var(--blue)',subClass:'up'},
    {lbl:'Despesas no período',val:fmtS(des),sub:'Saídas totais',color:'var(--red)'},
    {lbl:'Saldo do período',val:fmtS(Math.abs(saldo)),sub:saldo>=0?'Positivo':'Negativo',color:saldo>=0?'var(--acc)':'var(--red)',subClass:saldo>=0?'up':'dn'},
    {lbl:'Taxa de poupança',val:`${txPoup.toFixed(1)}%`,sub:txPoup>=20?'Boa':'Abaixo do ideal',color:'var(--amb)',subClass:txPoup>=20?'up':'warn'},
    nUrgentes>0?{lbl:'Alertas urgentes',val:`${nUrgentes}`,sub:'Vencem em 7 dias',color:'var(--red)',subClass:'dn'}:null,
    {lbl:'Falta para meta',val:fmtS(falta),sub:'R$1 milhão · hoje',color:'#A78BFA'},
    {lbl:'Projetado Dez/26',val:fmtS(patFimAno),sub:patFimAno>=meta?'🎯 Meta atingida!':`Falta ${fmtS(faltaFimAno)}`,color:patFimAno>=meta?'var(--acc)':'#A78BFA',subClass:patFimAno>=meta?'up':''},
  ].filter(Boolean) as any[]

  const recentes=lancamentos.slice().sort((a,b)=>b.data.localeCompare(a.data)).slice(0,10)

  return (
    <div>
      {/* Period filter */}
      <div style={{display:'flex',alignItems:'flex-end',gap:'10px',flexWrap:'wrap',marginBottom:'20px'}}>
        <div>
          <label style={{display:'block',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',color:'var(--mut)',marginBottom:'5px'}}>De</label>
          <input type="date" value={de} onChange={e=>setDe(e.target.value)} className="filter-sel" />
        </div>
        <div>
          <label style={{display:'block',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',color:'var(--mut)',marginBottom:'5px'}}>Até</label>
          <input type="date" value={ate} onChange={e=>setAte(e.target.value)} className="filter-sel" />
        </div>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
          {[['mes','Este mês'],['mes-ant','Mês anterior'],['ytd','YTD 2026'],['tudo','Tudo']].map(([v,l])=>(
            <button key={v} className="btn btn-s btn-sm" onClick={()=>setRange(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        {kpis.map((k:any,i:number)=>(
          <div key={i} className="kpi" style={{'--ka':k.color} as any}>
            <div className="kpi-lbl">{k.lbl}</div>
            <div className="kpi-val" style={{color:k.color}}>{k.val}</div>
            <div className={`kpi-sub ${k.subClass||''}`}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Meta */}
      <div className="sec-title">Meta de patrimônio</div>
      <div className="card" style={{marginBottom:'20px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'4px'}}>
          <div>
            <div style={{fontSize:'15px',fontWeight:600}}>Progresso rumo a R$ 1.000.000</div>
            <div style={{fontSize:'12px',color:'var(--acc)',marginTop:'2px'}}>Faltam R${fmt(falta)} · Projetado Dez/26: R${fmt(patFimAno)} ({(patFimAno/meta*100).toFixed(1)}%)</div>
          </div>
          <div style={{fontSize:'12px',color:'var(--mut)'}}>{pct.toFixed(1)}% concluído</div>
        </div>
        <div className="prog-track"><div className="prog-fill" style={{width:`${pct}%`}} /></div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',color:'var(--mut)'}}>
          <span>R$ 0</span><span>Atual: R${fmt(pat)}</span><span>R$ 1.000.000</span>
        </div>
      </div>

      {/* Charts */}
      <div className="sec-title">Análise visual</div>
      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-title">Evolução patrimonial 2026</div>
          <div className="chart-sub">Saldo mensal vs meta R$ 1M</div>
          <div style={{position:'relative',height:'220px'}}><canvas id="chart-evolucao"></canvas></div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Receitas vs Despesas</div>
          <div className="chart-sub">Por mês — lançamentos realizados</div>
          <div style={{position:'relative',height:'220px'}}><canvas id="chart-recdes"></canvas></div>
        </div>
      </div>
      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-title">Alocação do patrimônio</div>
          <div className="chart-sub">Distribuição por classe de ativo</div>
          <div style={{display:'flex',alignItems:'center',gap:'20px'}}>
            <div style={{position:'relative',height:'190px',flex:1}}><canvas id="chart-alloc"></canvas></div>
            <div id="alloc-legend" style={{fontSize:'11px',lineHeight:'2.2',flexShrink:0,minWidth:'110px'}}></div>
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Top despesas por categoria</div>
          <div className="chart-sub">No período selecionado</div>
          <div style={{position:'relative',height:'190px'}}><canvas id="chart-orc"></canvas></div>
        </div>
      </div>

      {/* Recent lancamentos */}
      <div className="sec-title">Lançamentos recentes</div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th><th>Descrição</th>
              <th className="hide-mob">Categoria</th><th className="hide-mob">Banco</th>
              <th>Tipo</th><th>Valor</th><th className="hide-mob">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentes.length===0?(
              <tr><td colSpan={7} style={{textAlign:'center',color:'var(--mut)',padding:'24px'}}>Nenhum lançamento</td></tr>
            ):recentes.map(l=>(
              <tr key={l.id}>
                <td style={{whiteSpace:'nowrap',fontSize:'12px'}}>{l.data.split('-').reverse().join('/')}</td>
                <td style={{maxWidth:'180px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.descricao}</td>
                <td className="hide-mob" style={{fontSize:'11px',color:'var(--txt2)'}}>{l.plano}</td>
                <td className="hide-mob">{l.banco}</td>
                <td><span className={`bdg ${l.fluxo==='Entrada'?'bdg-rec':'bdg-des'}`}>{l.fluxo}</span></td>
                <td className="td-amt" style={{color:l.fluxo==='Entrada'?'var(--acc)':'var(--red)'}}>{l.fluxo==='Entrada'?'+':'-'}R${fmt(l.valor)}</td>
                <td className="hide-mob"><span className={`bdg ${l.status==='Realizado'?'bdg-real':'bdg-pend'}`}>{l.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
