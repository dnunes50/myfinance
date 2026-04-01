import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import { sb } from '../lib/supabase'
import { getLancamentos, criarLancamento, criarLancamentos, editarLancamento, excluirLancamento, getOrcamento, salvarOrcamento } from '../lib/db'
import { ToastProvider, useToast } from '../components/Toast'
import ModalLancamento from '../components/ModalLancamento'
import Modal from '../components/Modal'
import {
  BANCOS_CONFIG, SALDOS_REF, EVOLUCAO, ORC_CATEGORIAS,
  BANCOS_LISTA, fmt, fmtS, dateToMes, calcUrgencia, getMesAtual
} from '../lib/constantes'

const MESES_LABEL = {
  '12/25':'Dez/25','01/26':'Jan/26','02/26':'Fev/26','03/26':'Mar/26','04/26':'Abr/26',
  '05/26':'Mai/26','06/26':'Jun/26','07/26':'Jul/26','08/26':'Ago/26','09/26':'Set/26',
  '10/26':'Out/26','11/26':'Nov/26','12/26':'Dez/26','01/27':'Jan/27'
}
const ALL_MESES = ['01/26','02/26','03/26','04/26','05/26','06/26','07/26','08/26','09/26','10/26','11/26','12/26']
const LAB_MAP   = {'01/26':'Jan','02/26':'Fev','03/26':'Mar','04/26':'Abr','05/26':'Mai','06/26':'Jun','07/26':'Jul','08/26':'Ago','09/26':'Set','10/26':'Out','11/26':'Nov','12/26':'Dez'}
const MES_MAP   = {Jan:'01',Fev:'02',Mar:'03',Abr:'04',Mai:'05',Jun:'06',Jul:'07',Ago:'08',Set:'09',Out:'10',Nov:'11',Dez:'12'}

const TABS = [
  {id:'dashboard',   label:'Dashboard',   icon:'📊'},
  {id:'lancamentos', label:'Lançamentos', icon:'📋'},
  {id:'alertas',     label:'Alertas',     icon:'🔔'},
  {id:'fluxo',       label:'Fluxo',       icon:'📈'},
  {id:'patrimonio',  label:'Patrimônio',  icon:'🏦'},
  {id:'orcamento',   label:'Orçamento',   icon:'💼'},
]

function calcBancos(lancs) {
  return BANCOS_CONFIG.map(b => {
    const movs  = lancs.filter(l => l.banco===b.nome && l.status==='Realizado' && l.data>b.data_abertura)
    const valor = b.saldo_abertura + movs.reduce((s,l) => l.fluxo==='Entrada' ? s+l.valor : s-l.valor, 0)
    return { ...b, valor }
  })
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
function DashboardInner() {
  const router = useRouter()
  const { toast } = useToast()
  const [tab,       setTab]       = useState('dashboard')
  const [lancs,     setLancs]     = useState([])
  const [orcDb,     setOrcDb]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [needsSeed, setNeedsSeed] = useState(false)
  const [seeding,   setSeeding]   = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [dateStr,   setDateStr]   = useState('')
  // FIX 10: persist filters between tabs
  const [filtroMes,    setFiltroMes]    = useState(getMesAtual())
  const [filtroTipo,   setFiltroTipo]   = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroBanco,  setFiltroBanco]  = useState('')
  const [busca,        setBusca]        = useState('')
  // FIX 9: highlight edited row
  const [flashId, setFlashId] = useState(null)

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'}))
    sb.auth.getUser().then(({data}) => setUserEmail(data.user?.email||''))
    loadAll()
  }, [])

  async function loadAll() {
    try {
      const [l, o] = await Promise.all([getLancamentos(), getOrcamento()])
      if (l.length===0) setNeedsSeed(true)
      else setLancs(l)
      setOrcDb(o)
    } catch(e) { toast(e.message,'err') }
    finally { setLoading(false) }
  }

  async function handleSeed() {
    setSeeding(true)
    try {
      const { data:{session} } = await sb.auth.getSession()
      const res = await fetch('/api/seed',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`}})
      const d = await res.json()
      if(d.success) { toast(`${d.lancamentos} lançamentos importados ✓`); await loadAll(); setNeedsSeed(false) }
      else if(d.count) { toast(`Já importado (${d.count})`); await loadAll(); setNeedsSeed(false) }
      else toast(d.error,'err')
    } finally { setSeeding(false) }
  }

  async function handleSave(lista, editId) {
    try {
      if(editId!==undefined) {
        const updated = await editarLancamento(editId, lista[0])
        setLancs(p => p.map(l => l.id===editId ? updated : l))
        // FIX 9: flash the updated row
        setFlashId(editId)
        setTimeout(() => setFlashId(null), 900)
        toast('Atualizado ✓')
      } else if(lista.length===1) {
        const created = await criarLancamento(lista[0])
        setLancs(p => [created,...p])
        setFlashId(created.id)
        setTimeout(() => setFlashId(null), 900)
        toast('Lançamento adicionado ✓')
      } else {
        const created = await criarLancamentos(lista)
        setLancs(p => [...created,...p])
        toast(`${created.length} lançamentos criados ✓`)
      }
    } catch(e) { toast(e.message,'err') }
  }

  async function handleDelete(id) {
    try {
      await excluirLancamento(id)
      setLancs(p => p.filter(l => l.id!==id))
      toast('Excluído')
    } catch(e) { toast(e.message,'err') }
  }

  async function handleSignOut() {
    await sb.auth.signOut()
    router.replace('/login')
  }

  const bancos   = calcBancos(lancs)
  const fornHist = [...new Set(lancs.map(l=>l.fornecedor).filter(Boolean))]

  if(loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'40px',marginBottom:'16px'}}>💰</div>
        <p style={{color:'var(--mut)',fontSize:'13px'}}>Carregando...</p>
      </div>
    </div>
  )

  if(needsSeed) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',padding:'20px'}}>
      <div style={{background:'var(--sur)',border:'1px solid var(--brd2)',borderRadius:'16px',padding:'40px',maxWidth:'420px',width:'100%',textAlign:'center'}}>
        <div style={{fontSize:'40px',marginBottom:'16px'}}>📦</div>
        <h2 style={{marginBottom:'12px',fontSize:'18px',fontWeight:700}}>Bem-vindo!</h2>
        <p style={{fontSize:'13px',color:'var(--mut)',marginBottom:'24px',lineHeight:'1.6'}}>Importe os dados iniciais para o banco.</p>
        <button className="btn btn-p" onClick={handleSeed} disabled={seeding} style={{width:'100%',justifyContent:'center'}}>
          {seeding?'Importando...':'🚀 Importar dados iniciais'}
        </button>
        <button className="btn btn-s" onClick={handleSignOut} style={{width:'100%',marginTop:'10px',justifyContent:'center'}}>Sair</button>
      </div>
    </div>
  )

  const shared = {
    lancs, bancos, orcDb, fornHist, flashId,
    onSave:handleSave, onDelete:handleDelete,
    // FIX 10: shared filters
    filtroMes, setFiltroMes, filtroTipo, setFiltroTipo,
    filtroStatus, setFiltroStatus, filtroBanco, setFiltroBanco,
    busca, setBusca,
    // FIX 2: orcamento save
    onSaveOrcamento: async (cats) => {
      try {
        await salvarOrcamento(cats)
        setOrcDb(cats)
        toast('Orçamento salvo ✓')
      } catch(e) { toast(e.message,'err') }
    }
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      {/* Desktop nav */}
      <nav className="nav">
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div className="logo-icon">MF</div>
          <span style={{fontWeight:700,fontSize:'15px'}}>My<span style={{color:'var(--acc)'}}>Finance</span></span>
          <div className="badge-live"><div className="dot"/>LIVE</div>
        </div>
        <div className="nav-tabs">
          {TABS.map(t=>(
            <button key={t.id} className={`tab${tab===t.id?' on':''}`} onClick={()=>setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <span style={{fontSize:'11px',color:'var(--mut)'}} className="hide-mob">{dateStr}</span>
          <button className="btn btn-s btn-sm" onClick={handleSignOut}>Sair</button>
        </div>
      </nav>

      {/* FIX 5: Mobile bottom nav */}
      <div className="mob-nav">
        <div className="mob-nav-items">
          {TABS.map(t=>(
            <button key={t.id} className={`mob-item${tab===t.id?' on':''}`} onClick={()=>setTab(t.id)}>
              <span className="mob-item-icon">{t.icon}</span>
              {t.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="page-pad" style={{padding:'20px',maxWidth:'1400px',margin:'0 auto'}}>
        {tab==='dashboard'   && <TabDashboard   {...shared}/>}
        {tab==='lancamentos' && <TabLancamentos  {...shared}/>}
        {tab==='alertas'     && <TabAlertas      {...shared}/>}
        {tab==='fluxo'       && <TabFluxo        {...shared}/>}
        {tab==='patrimonio'  && <TabPatrimonio   {...shared}/>}
        {tab==='orcamento'   && <TabOrcamento    {...shared}/>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TAB DASHBOARD
// ══════════════════════════════════════════════════════════════
function TabDashboard({ lancs, bancos }) {
  const hoje = new Date().toISOString().slice(0,10)
  const chartsRef = useRef({})
  const [de,  setDe]  = useState(()=>{ const d=new Date(); d.setDate(1); return d.toISOString().slice(0,10) })
  const [ate, setAte] = useState(()=>{ const d=new Date(); d.setMonth(d.getMonth()+1); d.setDate(0); return d.toISOString().slice(0,10) })

  const pat  = bancos.reduce((s,b)=>s+b.valor,0)
  const meta = 1000000
  const pct  = Math.min(100,pat/meta*100)

  const lancPeriodo = lancs.filter(l=>l.status==='Realizado'&&l.data>=de&&l.data<=ate)
  const rec  = lancPeriodo.filter(l=>l.fluxo==='Entrada').reduce((s,l)=>s+l.valor,0)
  const des  = lancPeriodo.filter(l=>l.fluxo==='Saída').reduce((s,l)=>s+l.valor,0)
  const saldo= rec-des
  const txP  = rec>0?((rec-des)/rec*100):0
  const aRec = lancs.filter(l=>l.status==='A Realizar'&&l.fluxo==='Entrada'&&l.data>=de&&l.data<=ate).reduce((s,l)=>s+l.valor,0)
  const aSai = lancs.filter(l=>l.status==='A Realizar'&&l.fluxo==='Saída'  &&l.data>=de&&l.data<=ate).reduce((s,l)=>s+l.valor,0)
  const saldoProj  = pat+aRec-aSai
  const entFimAno  = lancs.filter(l=>l.status==='A Realizar'&&l.fluxo==='Entrada'&&l.data<='2026-12-31').reduce((s,l)=>s+l.valor,0)
  const saiFimAno  = lancs.filter(l=>l.status==='A Realizar'&&l.fluxo==='Saída'  &&l.data<='2026-12-31').reduce((s,l)=>s+l.valor,0)
  const patFimAno  = pat+entFimAno-saiFimAno
  const em7  = new Date(); em7.setDate(em7.getDate()+7)
  const nUrg = lancs.filter(l=>l.status==='A Realizar'&&l.data>=hoje&&l.data<=em7.toISOString().slice(0,10)).length

  // FIX 6: saldo inicial from SALDOS_REF
  const diaAnt = de ? new Date(new Date(de+'T00:00:00').getTime()-86400000).toISOString().slice(0,10) : null
  const getSaldoRefTotal = d => {
    if(!d) return null
    if(SALDOS_REF[d]) return SALDOS_REF[d].total
    const keys = Object.keys(SALDOS_REF).filter(k=>k<=d).sort()
    const last = keys[keys.length-1]
    return last ? SALDOS_REF[last].total : null
  }
  const saldoIni = getSaldoRefTotal(diaAnt)

  function setRange(tipo) {
    const n=new Date()
    if(tipo==='mes')  { setDe(new Date(n.getFullYear(),n.getMonth(),1).toISOString().slice(0,10)); setAte(new Date(n.getFullYear(),n.getMonth()+1,0).toISOString().slice(0,10)) }
    else if(tipo==='ant'){ setDe(new Date(n.getFullYear(),n.getMonth()-1,1).toISOString().slice(0,10)); setAte(new Date(n.getFullYear(),n.getMonth(),0).toISOString().slice(0,10)) }
    else if(tipo==='ytd'){ setDe(`${n.getFullYear()}-01-01`); setAte(n.toISOString().slice(0,10)) }
    else { setDe('2025-12-01'); setAte('2027-12-31') }
  }

  useEffect(()=>{
    const s=document.createElement('script')
    s.src='https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
    s.onload=renderCharts
    document.head.appendChild(s)
    return ()=>Object.values(chartsRef.current).forEach(c=>c?.destroy())
  },[])

  useEffect(()=>{ if(window.Chart) renderCharts() },[lancs,bancos,de,ate])

  function renderCharts() {
    const Chart=window.Chart; if(!Chart) return
    const tt={backgroundColor:'#1E2940',borderColor:'rgba(255,255,255,.1)',borderWidth:1,titleColor:'#E8EDF5',bodyColor:'#A8B3C4',padding:10}
    const defaults={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{...tt,callbacks:{label:ctx=>` R$ ${Math.round(ctx.raw).toLocaleString('pt-BR')}` }}},scales:{x:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#8B95A8',font:{size:10}}},y:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#8B95A8',font:{size:10},callback:v=>'R$'+Math.round(v/1000)+'k'}}}}
    // 1. Evolução
    const evF=EVOLUCAO.filter(e=>{const[nm,ay]=e.mes.split('/'),d=`20${ay}-${MES_MAP[nm]}-01`;if(de&&d<de.slice(0,7)+'-01')return false;if(ate&&d>ate.slice(0,7)+'-01')return false;return true})
    const evD=evF.length?evF:EVOLUCAO
    chartsRef.current.ev?.destroy()
    const c1=document.getElementById('ch-ev')
    if(c1) chartsRef.current.ev=new Chart(c1,{type:'line',data:{labels:evD.map(e=>e.mes),datasets:[{label:'Patrimônio',data:evD.map(e=>e.pat),borderColor:'#6EE7B7',backgroundColor:'rgba(110,231,183,.08)',borderWidth:2,fill:true,tension:0.4,pointRadius:3,pointBackgroundColor:'#6EE7B7'},{label:'Meta',data:evD.map(()=>1000000),borderColor:'rgba(252,211,77,.35)',borderWidth:1.5,borderDash:[5,4],fill:false,tension:0,pointRadius:0}]},options:{...defaults}})
    // 2. Rec vs Des
    const mF=ALL_MESES.filter(m=>{const d1=`2026-${m.slice(0,2)}-01`,d2=`2026-${m.slice(0,2)}-31`;if(de&&d2<de)return false;if(ate&&d1>ate)return false;return true})
    chartsRef.current.rd?.destroy()
    const c2=document.getElementById('ch-rd')
    if(c2) chartsRef.current.rd=new Chart(c2,{type:'bar',data:{labels:mF.map(m=>LAB_MAP[m]||m),datasets:[{label:'Receitas',data:mF.map(m=>lancs.filter(l=>l.mes===m&&l.fluxo==='Entrada'&&l.status==='Realizado').reduce((s,l)=>s+l.valor,0)),backgroundColor:'rgba(110,231,183,.7)',borderRadius:4,borderSkipped:false},{label:'Despesas',data:mF.map(m=>lancs.filter(l=>l.mes===m&&l.fluxo==='Saída'&&l.status==='Realizado').reduce((s,l)=>s+l.valor,0)),backgroundColor:'rgba(248,113,113,.7)',borderRadius:4,borderSkipped:false}]},options:{...defaults,plugins:{...defaults.plugins,tooltip:{...tt,callbacks:{label:ctx=>` ${ctx.dataset.label}: R$ ${Math.round(ctx.raw).toLocaleString('pt-BR')}`}}}}})
    // 3. Alocação donut
    const cls={Caixa:0,Internacional:0,Cripto:0}
    bancos.forEach(b=>{if(['C6 Bank','Nubank','Santander','Clear'].includes(b.nome))cls.Caixa+=b.valor;else if(b.nome==='Onil')cls.Internacional+=b.valor;else if(b.nome==='Binance')cls.Cripto+=b.valor})
    const ae=Object.entries(cls).filter(([,v])=>v>0),at=ae.reduce((s,[,v])=>s+v,0),ac=['#60A5FA','#6EE7B7','#A78BFA']
    chartsRef.current.al?.destroy()
    const c3=document.getElementById('ch-al')
    if(c3) chartsRef.current.al=new Chart(c3,{type:'doughnut',data:{labels:ae.map(([k])=>k),datasets:[{data:ae.map(([,v])=>v),backgroundColor:ac,borderColor:'#1E2940',borderWidth:3,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{display:false},tooltip:{...tt,callbacks:{label:ctx=>` ${ctx.label}: ${(ctx.raw/at*100).toFixed(1)}% (R$ ${Math.round(ctx.raw).toLocaleString('pt-BR')})`}}}}})
    const leg=document.getElementById('ch-al-leg')
    if(leg) leg.innerHTML=ae.map(([l],i)=>`<div style="display:flex;align-items:center;gap:6px;white-space:nowrap"><span style="width:9px;height:9px;border-radius:2px;background:${ac[i]};display:inline-block"></span><span style="color:var(--txt2)">${l}</span><span style="color:var(--mut)">${(ae[i][1]/at*100).toFixed(1)}%</span></div>`).join('')
    // 4. Top despesas
    const catD={}
    lancs.filter(l=>l.fluxo==='Saída'&&l.data>=de&&l.data<=ate&&l.status==='Realizado').forEach(l=>{catD[l.tipo]=(catD[l.tipo]||0)+l.valor})
    const topD=Object.entries(catD).sort((a,b)=>b[1]-a[1]).slice(0,7)
    chartsRef.current.td?.destroy()
    const c4=document.getElementById('ch-td')
    if(c4) chartsRef.current.td=new Chart(c4,{type:'bar',data:{labels:topD.map(([k])=>k.replace('Despesa com ','').slice(0,16)),datasets:[{label:'Despesas',data:topD.map(([,v])=>v),backgroundColor:'rgba(248,113,113,.7)',borderRadius:3,borderSkipped:false}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{...tt,callbacks:{label:ctx=>` R$ ${Math.round(ctx.raw).toLocaleString('pt-BR')}`}}},scales:{x:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#8B95A8',font:{size:10},callback:v=>'R$'+Math.round(v/1000)+'k'}},y:{grid:{display:false},ticks:{color:'#A8B3C4',font:{size:10}}}}}})
  }

  const kpis=[
    ...(saldoIni!==null?[{lbl:'Saldo inicial',val:fmtS(saldoIni),sub:diaAnt?.split('-').reverse().join('/')||'',color:'var(--mut)'}]:[]),
    {lbl:'Patrimônio Atual',val:fmtS(pat),sub:`↑ ${pct.toFixed(1)}% da meta`,color:'var(--acc)',sub2:'up'},
    {lbl:'Saldo projetado',val:fmtS(saldoProj),sub:`A realizar: ${fmtS(aRec-aSai)}`,color:saldoProj>=pat?'var(--acc)':'var(--amb)'},
    {lbl:'Receitas período',val:fmtS(rec),sub:`${lancPeriodo.length} lançamentos`,color:'var(--blue)',sub2:'up'},
    {lbl:'Despesas período',val:fmtS(des),sub:'Saídas totais',color:'var(--red)'},
    {lbl:'Saldo do período',val:fmtS(Math.abs(saldo)),sub:saldo>=0?'Positivo':'Negativo',color:saldo>=0?'var(--acc)':'var(--red)',sub2:saldo>=0?'up':'dn'},
    {lbl:'Taxa de poupança',val:`${txP.toFixed(1)}%`,sub:txP>=20?'Boa':'Abaixo do ideal',color:'var(--amb)',sub2:txP>=20?'up':'warn'},
    ...(nUrg>0?[{lbl:'Alertas urgentes',val:`${nUrg}`,sub:'Vencem em 7 dias',color:'var(--red)',sub2:'dn'}]:[]),
    {lbl:'Falta para meta',val:fmtS(meta-pat),sub:'R$1 milhão · hoje',color:'#A78BFA'},
    {lbl:'Projetado Dez/26',val:fmtS(patFimAno),sub:patFimAno>=meta?'🎯 Meta!':'Falta '+fmtS(meta-patFimAno),color:patFimAno>=meta?'var(--acc)':'#A78BFA',sub2:patFimAno>=meta?'up':''},
  ]

  return (
    <div>
      <div style={{display:'flex',alignItems:'flex-end',gap:'10px',flexWrap:'wrap',marginBottom:'20px'}}>
        <div>
          <label style={{display:'block',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',color:'var(--mut)',marginBottom:'5px'}}>De</label>
          <input type="date" value={de} onChange={e=>setDe(e.target.value)} className="fsel"/>
        </div>
        <div>
          <label style={{display:'block',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',color:'var(--mut)',marginBottom:'5px'}}>Até</label>
          <input type="date" value={ate} onChange={e=>setAte(e.target.value)} className="fsel"/>
        </div>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap',paddingBottom:'1px'}}>
          {[['mes','Este mês'],['ant','Mês anterior'],['ytd','YTD 2026'],['all','Tudo']].map(([v,l])=>(
            <button key={v} className="btn btn-s btn-sm" onClick={()=>setRange(v)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map((k,i)=>(
          <div key={i} className="kpi" style={{'--ka':k.color}}>
            <div className="kpi-lbl">{k.lbl}</div>
            <div className="kpi-val" style={{color:k.color}}>{k.val}</div>
            <div className={`kpi-sub${k.sub2?' '+k.sub2:''}`}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="sec-title">Meta de patrimônio</div>
      <div className="card" style={{marginBottom:'20px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'4px'}}>
          <div>
            <div style={{fontSize:'15px',fontWeight:600}}>Progresso rumo a R$ 1.000.000</div>
            <div style={{fontSize:'12px',color:'var(--acc)',marginTop:'2px'}}>
              Faltam R${fmt(meta-pat)} · Projetado Dez/26: R${fmt(patFimAno)} ({(patFimAno/meta*100).toFixed(1)}%)
            </div>
          </div>
          <div style={{fontSize:'12px',color:'var(--mut)'}}>{pct.toFixed(1)}% concluído</div>
        </div>
        <div className="prog"><div className="prog-fill" style={{width:`${pct}%`}}/></div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',color:'var(--mut)'}}>
          <span>R$ 0</span><span>Atual: R${fmt(pat)}</span><span>R$ 1.000.000</span>
        </div>
      </div>

      <div className="sec-title">Análise visual</div>
      <div className="chart-grid">
        <div className="chart-card"><div className="chart-title">Evolução patrimonial 2026</div><div className="chart-sub">Saldo mensal vs meta R$ 1M</div><div style={{position:'relative',height:'220px'}}><canvas id="ch-ev"/></div></div>
        <div className="chart-card"><div className="chart-title">Receitas vs Despesas</div><div className="chart-sub">Por mês — realizados</div><div style={{position:'relative',height:'220px'}}><canvas id="ch-rd"/></div></div>
      </div>
      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-title">Alocação do patrimônio</div><div className="chart-sub">Por classe de ativo</div>
          <div style={{display:'flex',alignItems:'center',gap:'20px'}}>
            <div style={{position:'relative',height:'190px',flex:1}}><canvas id="ch-al"/></div>
            <div id="ch-al-leg" style={{fontSize:'11px',lineHeight:'2.2',flexShrink:0,minWidth:'110px'}}/>
          </div>
        </div>
        <div className="chart-card"><div className="chart-title">Top despesas</div><div className="chart-sub">No período selecionado</div><div style={{position:'relative',height:'190px'}}><canvas id="ch-td"/></div></div>
      </div>

      <div className="sec-title">Lançamentos recentes</div>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>Data</th><th>Descrição</th><th className="hide-mob">Categoria</th><th className="hide-mob">Banco</th><th>Tipo</th><th>Valor</th><th className="hide-mob">Status</th></tr></thead>
          <tbody>
            {lancs.slice(0,10).map(l=>(
              <tr key={l.id}>
                <td style={{whiteSpace:'nowrap',fontSize:'12px'}}>{l.data.split('-').reverse().join('/')}</td>
                <td style={{maxWidth:'180px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.descricao}</td>
                <td className="hide-mob" style={{fontSize:'11px',color:'var(--txt2)'}}>{l.plano}</td>
                <td className="hide-mob">{l.banco}</td>
                <td><span className={`bdg ${l.fluxo==='Entrada'?'bdg-rec':'bdg-des'}`}>{l.fluxo}</span></td>
                <td className="td-r" style={{color:l.fluxo==='Entrada'?'var(--acc)':'var(--red)'}}>{l.fluxo==='Entrada'?'+':'-'}R${fmt(l.valor)}</td>
                <td className="hide-mob"><span className={`bdg ${l.status==='Realizado'?'bdg-real':'bdg-pend'}`}>{l.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TAB LANÇAMENTOS — FIX 7 (sort), FIX 8 (search global), FIX 9 (flash), FIX 10 (persist filters)
// ══════════════════════════════════════════════════════════════
function TabLancamentos({ lancs, fornHist, flashId, onSave, onDelete, filtroMes, setFiltroMes, filtroTipo, setFiltroTipo, filtroStatus, setFiltroStatus, filtroBanco, setFiltroBanco, busca, setBusca }) {
  const [modal,   setModal]   = useState({open:false,mode:'novo',lanc:null})
  // FIX 7: sortable columns
  const [sortCol, setSortCol] = useState('data')
  const [sortDir, setSortDir] = useState('desc')

  const bancosUsados = [...new Set(lancs.map(l=>l.banco))]

  const filtered = lancs.filter(l=>{
    if(filtroMes    && l.mes!==filtroMes)       return false
    if(filtroTipo   && l.fluxo!==filtroTipo)    return false
    if(filtroStatus && l.status!==filtroStatus) return false
    if(filtroBanco  && l.banco!==filtroBanco)   return false
    if(busca){
      const b=busca.toLowerCase()
      if(!l.descricao?.toLowerCase().includes(b)&&!l.plano?.toLowerCase().includes(b)&&!l.fornecedor?.toLowerCase().includes(b)) return false
    }
    return true
  }).sort((a,b)=>{
    let va=a[sortCol], vb=b[sortCol]
    if(sortCol==='valor'){va=a.valor;vb=b.valor}
    if(va<vb) return sortDir==='asc'?-1:1
    if(va>vb) return sortDir==='asc'?1:-1
    return 0
  })

  const tRec=filtered.filter(l=>l.fluxo==='Entrada').reduce((s,l)=>s+l.valor,0)
  const tDes=filtered.filter(l=>l.fluxo==='Saída').reduce((s,l)=>s+l.valor,0)

  function toggleSort(col) {
    if(sortCol===col) setSortDir(d=>d==='asc'?'desc':'asc')
    else { setSortCol(col); setSortDir('asc') }
  }
  function SortIcon({col}) {
    if(sortCol!==col) return <span style={{color:'var(--brd2)',marginLeft:'3px'}}>⇅</span>
    return <span style={{color:'var(--acc)',marginLeft:'3px'}}>{sortDir==='asc'?'↑':'↓'}</span>
  }

  // FIX 1: export Excel
  function exportExcel() {
    if(typeof XLSX==='undefined'){alert('Aguarde a biblioteca carregar e tente novamente');return}
    const wb=XLSX.utils.book_new()
    const headers=['ID','Data','Mês','Descrição','Fornecedor','Plano','Tipo','Banco','Fluxo','Status','Valor']
    const rows=lancs.slice().sort((a,b)=>a.data.localeCompare(b.data)).map(l=>[l.id,l.data.split('-').reverse().join('/'),l.mes,l.descricao,l.fornecedor||'',l.plano,l.tipo,l.banco,l.fluxo,l.status,l.valor])
    const ws=XLSX.utils.aoa_to_sheet([headers,...rows])
    ws['!cols']=[{wch:6},{wch:12},{wch:8},{wch:35},{wch:30},{wch:25},{wch:22},{wch:12},{wch:8},{wch:12},{wch:14}]
    XLSX.utils.book_append_sheet(wb,ws,'Lançamentos')
    // Resumo mensal
    const meses=[...new Set(lancs.map(l=>l.mes))].sort()
    const planos=[...new Set(lancs.map(l=>l.plano))].sort()
    const rHeaders=['Plano de Contas',...meses,'TOTAL']
    const rRows=planos.map(p=>{const vals=meses.map(m=>lancs.filter(l=>l.plano===p&&l.mes===m&&l.status==='Realizado').reduce((s,l)=>s+(l.fluxo==='Entrada'?l.valor:-l.valor),0));return[p,...vals,vals.reduce((s,v)=>s+v,0)]}).filter(r=>r.slice(1).some(v=>v!==0))
    const ws2=XLSX.utils.aoa_to_sheet([rHeaders,...rRows])
    XLSX.utils.book_append_sheet(wb,ws2,'Resumo Mensal')
    XLSX.writeFile(wb,`myfinance-${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  async function del(id) {
    if(!confirm('Excluir este lançamento?')) return
    await onDelete(id)
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
        <div>
          <div style={{fontSize:'18px',fontWeight:700}}>Lançamentos</div>
          <div style={{fontSize:'12px',color:'var(--mut)'}}>
            {filtered.length} lançamentos · +R${fmt(tRec)} · -R${fmt(tDes)} · Saldo: R${fmt(tRec-tDes)}
          </div>
        </div>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
          <button className="btn btn-s" onClick={exportExcel}>⬇ Excel</button>
          <button className="btn btn-p" onClick={()=>setModal({open:true,mode:'novo',lanc:null})}>+ Novo</button>
        </div>
      </div>

      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'16px'}}>
        <select value={filtroMes} onChange={e=>setFiltroMes(e.target.value)} className="fsel">
          <option value="">Todos os meses</option>
          {Object.entries(MESES_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)} className="fsel">
          <option value="">Entrada/Saída</option>
          <option value="Entrada">Entrada</option>
          <option value="Saída">Saída</option>
        </select>
        <select value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)} className="fsel">
          <option value="">Status</option>
          <option value="Realizado">Realizado</option>
          <option value="A Realizar">A Realizar</option>
        </select>
        <select value={filtroBanco} onChange={e=>setFiltroBanco(e.target.value)} className="fsel">
          <option value="">Todos os bancos</option>
          {bancosUsados.map(b=><option key={b}>{b}</option>)}
        </select>
        {/* FIX 8: global search */}
        <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="🔍 Buscar em todos os meses..." className="fsel" style={{minWidth:'220px'}}/>
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th className="th-sort" onClick={()=>toggleSort('data')}>Data<SortIcon col="data"/></th>
              <th className="th-sort" onClick={()=>toggleSort('descricao')}>Descrição<SortIcon col="descricao"/></th>
              <th className="hide-mob">Fornecedor</th>
              <th className="hide-mob th-sort" onClick={()=>toggleSort('plano')}>Plano<SortIcon col="plano"/></th>
              <th className="hide-mob th-sort" onClick={()=>toggleSort('banco')}>Banco<SortIcon col="banco"/></th>
              <th className="th-sort" onClick={()=>toggleSort('status')}>Status<SortIcon col="status"/></th>
              <th>Fluxo</th>
              <th className="th-sort" style={{textAlign:'right'}} onClick={()=>toggleSort('valor')}>Valor<SortIcon col="valor"/></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length===0?(
              <tr><td colSpan={9}><div className="empty"><div className="empty-icon">📋</div><p>Nenhum lançamento encontrado</p></div></td></tr>
            ):filtered.map(l=>(
              <tr key={l.id} className={flashId===l.id?'row-flash':''}>
                <td style={{whiteSpace:'nowrap',fontSize:'12px'}}>{l.data.split('-').reverse().join('/')}</td>
                <td style={{maxWidth:'160px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={l.descricao}>{l.descricao}</td>
                <td className="hide-mob" style={{fontSize:'11px',color:'var(--txt2)',maxWidth:'120px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.fornecedor||'—'}</td>
                <td className="hide-mob" style={{fontSize:'11px',color:'var(--txt2)'}}>{l.plano}</td>
                <td className="hide-mob">{l.banco}</td>
                <td><span className={`bdg ${l.status==='Realizado'?'bdg-real':'bdg-pend'}`}>{l.status}</span></td>
                <td><span className={`bdg ${l.fluxo==='Entrada'?'bdg-rec':'bdg-des'}`}>{l.fluxo}</span></td>
                <td className="td-r" style={{color:l.fluxo==='Entrada'?'var(--acc)':'var(--red)'}}>{l.fluxo==='Entrada'?'+':'-'}R${fmt(l.valor)}</td>
                <td style={{whiteSpace:'nowrap'}}>
                  <button className="btn btn-s btn-sm" onClick={()=>setModal({open:true,mode:'editar',lanc:l})}>Editar</button>
                  <button className="btn btn-s btn-sm" style={{marginLeft:'4px'}} onClick={()=>setModal({open:true,mode:'duplicar',lanc:l})}>⧉</button>
                  <button className="btn btn-d btn-sm" style={{marginLeft:'4px'}} onClick={()=>del(l.id)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ModalLancamento open={modal.open} onClose={()=>setModal({open:false,mode:'novo',lanc:null})} mode={modal.mode} lanc={modal.lanc} onSave={onSave} fornHist={fornHist}/>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TAB ALERTAS — FIX 4: marcar como realizado direto
// ══════════════════════════════════════════════════════════════
function TabAlertas({ lancs, onSave, onDelete }) {
  const { toast } = useToast()
  const [filtro, setFiltro] = useState('90dias')
  const [modal,  setModal]  = useState({open:false,lanc:null})

  const hoje = new Date().toISOString().slice(0,10)

  const { deStr, ateStr, label } = (()=>{
    if(filtro==='90dias'){const fim=new Date();fim.setDate(fim.getDate()+90);return{deStr:'2000-01-01',ateStr:fim.toISOString().slice(0,10),label:'Próximos 90 dias'}}
    if(filtro==='todos') return{deStr:'2000-01-01',ateStr:'2099-12-31',label:'Todos'}
    const[mm,yy]=filtro.split('/'),de=`20${yy}-${mm}-01`,fim=new Date(`20${yy}-${mm}-01`)
    fim.setMonth(fim.getMonth()+1);fim.setDate(0)
    return{deStr:de,ateStr:fim.toISOString().slice(0,10),label:MESES_LABEL[filtro]||filtro}
  })()

  const pagar   = lancs.filter(l=>l.status==='A Realizar'&&l.fluxo==='Saída'  &&l.data>=deStr&&l.data<=ateStr).map(l=>({...l,urg:calcUrgencia(l.data)})).sort((a,b)=>a.data.localeCompare(b.data))
  const receber = lancs.filter(l=>l.status==='A Realizar'&&l.fluxo==='Entrada'&&l.data>=deStr&&l.data<=ateStr).map(l=>({...l,urg:calcUrgencia(l.data)})).sort((a,b)=>a.data.localeCompare(b.data))
  const tP=pagar.reduce((s,l)=>s+l.valor,0), tR=receber.reduce((s,l)=>s+l.valor,0)
  const nVenc=[...pagar,...receber].filter(l=>l.urg==='vencido').length

  const URG={vencido:{cls:'bdg-urg',lbl:'⚠ ATRASADO'},urgente:{cls:'bdg-urg',lbl:'URGENTE'},proximo:{cls:'bdg-next',lbl:'PRÓXIMO'},ok:{cls:'bdg-ok',lbl:'OK'}}

  // FIX 4: mark as realizado directly
  async function marcarRealizado(l) {
    await onSave([{...l, status:'Realizado', id:undefined, created_at:undefined}], l.id)
    toast(`✓ ${l.descricao} marcado como Realizado`)
  }

  const renderList=(list,cor)=>{
    if(!list.length) return <div className="empty"><div className="empty-icon">✅</div><p>Nenhuma conta</p></div>
    return list.map(l=>{
      const dias=l.urg==='vencido'?Math.abs(Math.round((new Date(l.data+'T00:00:00')-new Date())/86400000)):0
      return(
        <div key={l.id} style={{display:'flex',alignItems:'center',gap:'12px',background:'var(--sur)',border:`1px solid ${l.urg==='vencido'?'rgba(248,113,113,.4)':'var(--brd)'}`,borderRadius:'var(--rs)',padding:'12px 16px',marginBottom:'8px',transition:'border-color .15s'}}>
          <span className={`bdg ${URG[l.urg].cls}`} style={{minWidth:'80px',justifyContent:'center'}}>{URG[l.urg].lbl}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:600,fontSize:'13px',color:'var(--txt)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{l.descricao}</div>
            <div style={{fontSize:'11px',color:'var(--mut)'}}>
              {l.data.split('-').reverse().join('/')} · {l.banco} · {l.plano}
              {l.urg==='vencido'&&<span style={{color:'var(--red)',fontWeight:600,marginLeft:'6px'}}>{dias} dias em atraso</span>}
            </div>
          </div>
          <div style={{textAlign:'right',flexShrink:0}}>
            <div style={{fontSize:'16px',fontWeight:700,color:l.urg==='vencido'?'var(--red)':cor}}>R${fmt(l.valor)}</div>
            <div style={{display:'flex',gap:'4px',marginTop:'4px',justifyContent:'flex-end'}}>
              {/* FIX 4: direct realizado button */}
              <button className="btn btn-p btn-sm" onClick={()=>marcarRealizado(l)} title="Marcar como Realizado">✓</button>
              <button className="btn btn-s btn-sm" onClick={()=>setModal({open:true,lanc:l})}>Editar</button>
            </div>
          </div>
        </div>
      )
    })
  }

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
        <div>
          <div style={{fontSize:'18px',fontWeight:700}}>Contas a pagar / receber</div>
          <div style={{fontSize:'12px',color:'var(--mut)'}}>
            {label} · A pagar: R${fmt(tP)} · A receber: R${fmt(tR)} · Saldo: R${fmt(tR-tP)}
            {nVenc>0&&<span style={{color:'var(--red)',marginLeft:'8px'}}>⚠ {nVenc} em atraso</span>}
          </div>
        </div>
        <select value={filtro} onChange={e=>setFiltro(e.target.value)} className="fsel">
          <option value="90dias">Próximos 90 dias</option>
          {Object.entries(MESES_LABEL).filter(([k])=>k>='03/26').map(([v,l])=><option key={v} value={v}>{l}</option>)}
          <option value="todos">Todos</option>
        </select>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
        <div><div className="sec-title">A pagar</div>{renderList(pagar,'var(--red)')}</div>
        <div><div className="sec-title">A receber</div>{renderList(receber,'var(--acc)')}</div>
      </div>
      <ModalLancamento open={modal.open} onClose={()=>setModal({open:false,lanc:null})} mode="editar" lanc={modal.lanc} onSave={onSave} fornHist={[]}/>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TAB FLUXO — FIX 8: monthly summary
// ══════════════════════════════════════════════════════════════
function TabFluxo({ lancs }) {
  const hoje = new Date().toISOString().slice(0,10)
  const ULTIMA_REF = Object.keys(SALDOS_REF).sort().pop()
  const BANCO_CAMPO = {'C6 Bank':'c6','Nubank':'nubank','Onil':'onil','Santander':'san','Clear':'clear','Binance':'bin'}
  const [banco, setBanco] = useState('')
  const [deStr, setDeStr] = useState('2025-12-31')
  const [ateStr,setAteStr]= useState(hoje)

  function getSaldoRef(d){
    const ref=SALDOS_REF[d]; if(!ref) return null
    if(!banco) return ref.total
    const c=BANCO_CAMPO[banco]; return c!=null?ref[c]:null
  }

  function setRange(tipo){
    if(tipo==='hist'){ setDeStr('2025-12-31'); setAteStr(hoje) }
    else if(tipo==='mes'){ const n=new Date(); setDeStr(new Date(n.getFullYear(),n.getMonth(),1).toISOString().slice(0,10)); setAteStr(new Date(n.getFullYear(),n.getMonth()+1,0).toISOString().slice(0,10)) }
    else if(tipo==='60'){ const fim=new Date(); fim.setDate(fim.getDate()+60); setDeStr(hoje); setAteStr(fim.toISOString().slice(0,10)) }
    else { setDeStr('2025-12-01'); setAteStr('2027-12-31') }
  }

  const { linhas, kpis, diasNeg, resumoMensal } = (()=>{
    if(!deStr||!ateStr) return{linhas:[],kpis:null,diasNeg:0,resumoMensal:[]}
    const de=new Date(deStr+'T00:00:00'),ate=new Date(ateStr+'T00:00:00')
    if(de>ate) return{linhas:[],kpis:null,diasNeg:0,resumoMensal:[]}
    const dias=[]; const cur=new Date(de)
    while(cur<=ate){dias.push(cur.toISOString().slice(0,10));cur.setDate(cur.getDate()+1)}
    const lancFiltro=lancs.filter(l=>!banco||l.banco===banco)
    const diaAnt=new Date(de);diaAnt.setDate(diaAnt.getDate()-1)
    const diaAntStr=diaAnt.toISOString().slice(0,10)
    let saldoAcum=0
    const refAnt=getSaldoRef(diaAntStr)
    if(refAnt!==null){saldoAcum=refAnt}
    else{
      const rds=Object.keys(SALDOS_REF).filter(d=>d<deStr).sort()
      if(rds.length){const ur=rds[rds.length-1];saldoAcum=getSaldoRef(ur)??0;lancFiltro.filter(l=>l.status==='Realizado'&&l.data>ur&&l.data<deStr).forEach(l=>{saldoAcum+=l.fluxo==='Entrada'?l.valor:-l.valor})}
    }
    const byDate={};dias.forEach(d=>{byDate[d]={ent:[],sai:[]}})
    lancFiltro.forEach(l=>{if(!byDate[l.data])return;if(l.fluxo==='Entrada')byDate[l.data].ent.push(l);else byDate[l.data].sai.push(l)})
    let totalEnt=0,totalSai=0,diasNeg=0
    const saldoInicial=getSaldoRef(diaAntStr)??saldoAcum
    const linhas=dias.map(d=>{
      const refDia=getSaldoRef(d),temRef=refDia!==null,isFuturo=d>ULTIMA_REF
      const ent=byDate[d].ent.reduce((s,l)=>s+l.valor,0),sai=byDate[d].sai.reduce((s,l)=>s+l.valor,0)
      let saldoDia,saldoExibido
      if(temRef&&refDia!==null){saldoExibido=refDia;saldoDia=refDia-saldoAcum;saldoAcum=refDia}
      else{saldoDia=ent-sai;saldoAcum+=saldoDia;saldoExibido=saldoAcum}
      totalEnt+=ent;totalSai+=sai;if(saldoExibido<0)diasNeg++
      const varReal=temRef?saldoDia:null,lancNet=ent-sai,naoExplic=varReal!==null?varReal-lancNet:null
      const dt=new Date(d+'T12:00:00'),diaSem=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][dt.getDay()]
      return{d,diaSem,ent,sai,saldoDia,saldoExibido,temRef,isFuturo,isHoje:d===hoje,isPast:d<hoje,isFim:dt.getDay()===0||dt.getDay()===6,hasMovs:ent>0||sai>0,naoExplic,itens:[...byDate[d].ent,...byDate[d].sai]}
    })
    const saldoFinal=saldoAcum,varFluxo=saldoFinal-saldoInicial
    // FIX 8: monthly summary
    const mesesNoRange=[...new Set(linhas.map(r=>r.d.slice(0,7)))]
    const resumoMensal=mesesNoRange.map(m=>{
      const lm=linhas.filter(r=>r.d.startsWith(m))
      const entM=lm.reduce((s,r)=>s+r.ent,0),saiM=lm.reduce((s,r)=>s+r.sai,0)
      const saldoFimM=lm[lm.length-1]?.saldoExibido??0
      const[y,mo]=m.split('-'); const label=`${['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][parseInt(mo)-1]}/${y.slice(2)}`
      return{m,label,entM,saiM,saldoFimM}
    })
    return{linhas,diasNeg,kpis:{saldoInicial,totalEnt,totalSai,varFluxo,saldoFinal},resumoMensal}
  })()

  return(
    <div>
      <div style={{fontSize:'18px',fontWeight:700,marginBottom:'16px'}}>Fluxo Diário</div>
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center',marginBottom:'16px'}}>
        <select value={banco} onChange={e=>setBanco(e.target.value)} className="fsel">
          <option value="">Todos os bancos</option>
          {BANCOS_LISTA.map(b=><option key={b}>{b}</option>)}
        </select>
        <input type="date" value={deStr} onChange={e=>setDeStr(e.target.value)} className="fsel"/>
        <span style={{color:'var(--mut)'}}>→</span>
        <input type="date" value={ateStr} onChange={e=>setAteStr(e.target.value)} className="fsel"/>
        {[['hist','Histórico'],['mes','Este mês'],['60','Próx. 60d'],['all','Tudo']].map(([v,l])=>(
          <button key={v} className="btn btn-s btn-sm" onClick={()=>setRange(v)}>{l}</button>
        ))}
      </div>

      {kpis&&(
        <div className="kpi-grid" style={{marginBottom:'16px'}}>
          {[
            {lbl:`Saldo inicial · ${banco||'Total'}`,val:fmtS(kpis.saldoInicial),sub:deStr.split('-').reverse().join('/'),color:'var(--mut)'},
            {lbl:'Entradas',val:`+${fmtS(kpis.totalEnt)}`,sub:'No período',color:'var(--acc)',sub2:'up'},
            {lbl:'Saídas',val:`-${fmtS(kpis.totalSai)}`,sub:'No período',color:'var(--red)',sub2:'dn'},
            {lbl:'Variação',val:`${kpis.varFluxo>=0?'+':''}${fmtS(kpis.varFluxo)}`,sub:kpis.saldoInicial>0?`${(kpis.varFluxo/kpis.saldoInicial*100).toFixed(1)}%`:'',color:kpis.varFluxo>=0?'var(--acc)':'var(--red)',sub2:kpis.varFluxo>=0?'up':'dn'},
            {lbl:`Saldo final · ${banco||'Total'}`,val:fmtS(kpis.saldoFinal),sub:ateStr.split('-').reverse().join('/'),color:kpis.saldoFinal>=0?'var(--acc)':'var(--red)'},
            ...(diasNeg>0?[{lbl:'Dias negativos',val:`${diasNeg}`,sub:'Atenção',color:'var(--red)',sub2:'dn'}]:[]),
          ].map((k,i)=>(
            <div key={i} className="kpi" style={{'--ka':k.color}}>
              <div className="kpi-lbl">{k.lbl}</div>
              <div className="kpi-val" style={{fontSize:'16px',color:k.color}}>{k.val}</div>
              <div className={`kpi-sub${k.sub2?' '+k.sub2:''}`}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {diasNeg>0?(
        <div style={{background:'var(--red-d)',border:'1px solid rgba(248,113,113,.25)',borderRadius:'var(--rs)',padding:'12px 16px',display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px'}}>
          <span style={{fontSize:'20px'}}>⚠️</span><div style={{fontSize:'13px',fontWeight:600,color:'var(--red)'}}>{diasNeg} dia(s) com saldo negativo</div>
        </div>
      ):kpis?(
        <div style={{background:'var(--acc-d)',border:'1px solid rgba(110,231,183,.2)',borderRadius:'var(--rs)',padding:'10px 16px',display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>
          <span>✅</span><span style={{fontSize:'12px',color:'var(--acc)',fontWeight:500}}>Nenhum dia com saldo negativo</span>
        </div>
      ):null}

      {/* FIX 8: monthly summary */}
      {resumoMensal.length>1&&(
        <>
          <div className="sec-title">Resumo por mês</div>
          <div className="tbl-wrap" style={{marginBottom:'16px'}}>
            <table>
              <thead><tr><th>Mês</th><th style={{textAlign:'right'}}>Entradas</th><th style={{textAlign:'right'}}>Saídas</th><th style={{textAlign:'right'}}>Variação</th><th style={{textAlign:'right'}}>Saldo final</th></tr></thead>
              <tbody>
                {resumoMensal.map(r=>(
                  <tr key={r.m}>
                    <td style={{fontWeight:600}}>{r.label}</td>
                    <td className="td-r" style={{color:'var(--acc)'}}>{r.entM>0?`+R$${fmt(r.entM)}`:'—'}</td>
                    <td className="td-r" style={{color:'var(--red)'}}>{r.saiM>0?`-R$${fmt(r.saiM)}`:'—'}</td>
                    <td className="td-r" style={{color:(r.entM-r.saiM)>=0?'var(--acc)':'var(--red)'}}>{r.entM-r.saiM>=0?'+':''}R${fmt(r.entM-r.saiM)}</td>
                    <td className="td-r" style={{fontWeight:700,color:r.saldoFimM>=0?'var(--acc)':'var(--red)'}}>R${fmt(r.saldoFimM)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="sec-title">Detalhe diário</div>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>Data</th><th>Dia</th><th style={{textAlign:'right'}}>Entradas</th><th style={{textAlign:'right'}}>Saídas</th><th style={{textAlign:'right'}}>Variação</th><th style={{textAlign:'right'}}>Saldo</th><th className="hide-mob">Lançamentos</th></tr></thead>
          <tbody>
            {linhas.length===0?(
              <tr><td colSpan={7} style={{textAlign:'center',color:'var(--mut)',padding:'24px'}}>Selecione um período</td></tr>
            ):linhas.map(row=>(
              <tr key={row.d} style={{background:row.isHoje?'rgba(110,231,183,.07)':'',opacity:!row.isPast&&!row.isHoje&&!row.hasMovs?.35:1}}>
                <td style={{whiteSpace:'nowrap',fontWeight:row.isHoje?700:400,color:row.isHoje?'var(--acc)':row.isPast?'var(--txt)':'var(--txt2)'}}>
                  {row.d.split('-').reverse().join('/')}
                  {row.isHoje&&<span style={{fontSize:'9px',background:'var(--acc)',color:'#0B0F1A',padding:'1px 5px',borderRadius:'8px',fontWeight:700,marginLeft:'4px'}}>HOJE</span>}
                  {row.isFuturo&&<span style={{fontSize:'9px',color:'var(--mut)',marginLeft:'4px'}}>(proj.)</span>}
                </td>
                <td style={{color:row.isFim?'var(--mut)':'var(--txt2)',fontSize:'11px'}}>{row.diaSem}</td>
                <td className="td-r" style={{color:row.ent>0?'var(--acc)':'var(--mut)'}}>{row.ent>0?`+R$${fmt(row.ent)}`:'—'}</td>
                <td className="td-r" style={{color:row.sai>0?'var(--red)':'var(--mut)'}}>{row.sai>0?`-R$${fmt(row.sai)}`:'—'}</td>
                <td className="td-r" style={{color:row.saldoDia===0?'var(--mut)':row.saldoDia>0?'var(--acc)':'var(--red)'}}>{row.saldoDia===0?'—':`${row.saldoDia>0?'+':''}R$${fmt(row.saldoDia)}`}</td>
                <td className="td-r">
                  <span style={{fontWeight:700,color:row.saldoExibido>=0?'var(--acc)':'var(--red)'}}>R${fmt(row.saldoExibido)}</span>
                  {row.naoExplic!==null&&Math.abs(row.naoExplic)>0.05&&<span style={{fontSize:'9px',color:'var(--amb)',marginLeft:'3px'}}>Δ{row.naoExplic>0?'+':''}R${fmt(row.naoExplic)}</span>}
                  {row.temRef&&row.naoExplic!==null&&Math.abs(row.naoExplic)<=0.05&&row.hasMovs&&<span style={{fontSize:'9px',color:'var(--acc)',marginLeft:'3px'}}>✓</span>}
                </td>
                <td className="hide-mob">
                  {row.itens.length>0?row.itens.map((l,i)=>(
                    <span key={i} style={{fontSize:'10px',color:l.fluxo==='Entrada'?'var(--acc)':'var(--red)',display:'block',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'200px'}}>
                      {l.fluxo==='Entrada'?'↑':'↓'} {l.descricao} R${fmt(l.valor)}{l.status==='A Realizar'?' (prev.)':''}
                    </span>
                  )):<span style={{color:'var(--mut)',fontSize:'11px'}}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TAB PATRIMÔNIO — FIX 3: dynamic current month
// ══════════════════════════════════════════════════════════════
function TabPatrimonio({ bancos }) {
  const mesAtual = getMesAtual() // FIX 3
  const pat=bancos.reduce((s,b)=>s+b.valor,0),saldoIni=382436.07,varPat=pat-saldoIni,pct=Math.min(100,pat/1000000*100)
  const caixa=bancos.filter(b=>['C6 Bank','Nubank','Santander','Clear'].includes(b.nome)).reduce((s,b)=>s+b.valor,0)
  const intl =bancos.filter(b=>b.nome==='Onil').reduce((s,b)=>s+b.valor,0)
  const cripto=bancos.filter(b=>b.nome==='Binance').reduce((s,b)=>s+b.valor,0)
  const alloc=[{l:'Caixa',v:caixa,c:'var(--blue)'},{l:'Internacional',v:intl,c:'var(--acc)'},{l:'Cripto',v:cripto,c:'var(--amb)'}].filter(a=>a.v>0)

  return(
    <div>
      <div className="kpi-grid" style={{marginBottom:'24px'}}>
        {[
          {lbl:'Saldo inicial (31/12/25)',val:`R$${fmt(saldoIni)}`,sub:'Abertura do período',color:'var(--mut)'},
          {lbl:'Patrimônio Atual',val:fmtS(pat),sub:`↑ ${pct.toFixed(1)}% da meta`,color:'var(--acc)',sub2:'up'},
          {lbl:'Variação desde abertura',val:`${varPat>=0?'+':''}R$${fmt(varPat)}`,sub:`${((varPat/saldoIni)*100).toFixed(1)}%`,color:varPat>=0?'var(--acc)':'var(--red)',sub2:varPat>=0?'up':'dn'},
          {lbl:'Caixa total',val:fmtS(caixa),sub:`${pat>0?(caixa/pat*100).toFixed(1):0}% do patrimônio`,color:'var(--blue)'},
          {lbl:'Investim. Internacional',val:fmtS(intl),sub:`${pat>0?(intl/pat*100).toFixed(1):0}% do patrimônio`,color:'#A78BFA'},
          {lbl:'Falta para R$ 1M',val:fmtS(1000000-pat),sub:'Meta: dez/2026',color:'var(--amb)',sub2:'warn'},
        ].map((k,i)=>(
          <div key={i} className="kpi" style={{'--ka':k.color}}>
            <div className="kpi-lbl">{k.lbl}</div>
            <div className="kpi-val" style={{fontSize:'16px'}}>{k.val}</div>
            <div className={`kpi-sub${k.sub2?' '+k.sub2:''}`}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{marginBottom:'24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
          <div style={{fontWeight:700}}>Meta: R$ 1.000.000</div>
          <div style={{color:'var(--acc)',fontWeight:600}}>{pct.toFixed(1)}%</div>
        </div>
        <div className="prog"><div className="prog-fill" style={{width:`${pct}%`}}/></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginBottom:'24px'}}>
        <div>
          <div className="sec-title">Saldo por banco</div>
          {bancos.map(b=>(
            <div key={b.id} style={{display:'flex',alignItems:'center',gap:'12px',background:'var(--sur)',border:'1px solid var(--brd)',borderRadius:'var(--rs)',padding:'12px 14px',marginBottom:'8px'}}>
              <div style={{width:'36px',height:'36px',borderRadius:'8px',background:`${b.cor}22`,color:b.cor,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'12px'}}>{b.nome.slice(0,2).toUpperCase()}</div>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:'13px'}}>{b.nome}</div></div>
              <div style={{textAlign:'right'}}>
                <div style={{fontWeight:700,fontSize:'14px'}}>{fmtS(b.valor)}</div>
                <div style={{fontSize:'11px',color:'var(--mut)'}}>{pat>0?(b.valor/pat*100).toFixed(1):0}%</div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="sec-title">Alocação</div>
          <div className="card">
            {alloc.map(a=>(
              <div key={a.l} style={{marginBottom:'16px'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px'}}>
                  <span style={{color:'var(--txt2)'}}>{a.l}</span><span style={{fontWeight:600}}>{(a.v/pat*100).toFixed(1)}%</span>
                </div>
                <div className="prog" style={{height:'5px'}}><div className="prog-fill" style={{width:`${Math.min(100,a.v/pat*100)}%`,background:a.c}}/></div>
                <div style={{fontSize:'11px',color:'var(--mut)',textAlign:'right',marginTop:'2px'}}>{fmtS(a.v)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="sec-title">Evolução patrimonial</div>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>Mês</th><th style={{textAlign:'right'}}>Nubank</th><th style={{textAlign:'right'}}>C6 Bank</th><th className="hide-mob" style={{textAlign:'right'}}>Binance</th><th style={{textAlign:'right'}}>Onil</th><th style={{textAlign:'right'}}>Total</th><th style={{textAlign:'right'}}>% Meta</th></tr></thead>
          <tbody>
            {EVOLUCAO.map((e,i)=>{
              const prev=i>0?EVOLUCAO[i-1].pat:e.pat,vP=i>0?((e.pat-prev)/prev*100):0
              // FIX 3: dynamic current month
              const isNow=e.mes===mesAtual
              const isFut=!isNow&&e.mes>mesAtual
              return(
                <tr key={e.mes} style={{background:isNow?'rgba(110,231,183,.07)':'',opacity:isFut?.6:1}}>
                  <td style={{fontWeight:isNow?700:400,color:isNow?'var(--acc)':isFut?'var(--mut)':'var(--txt)',whiteSpace:'nowrap'}}>
                    {e.mes}
                    {isNow&&<span style={{fontSize:'9px',background:'var(--acc)',color:'#0B0F1A',padding:'1px 5px',borderRadius:'8px',fontWeight:700,marginLeft:'4px'}}>HOJE</span>}
                    {isFut&&<span style={{fontSize:'9px',color:'var(--mut)',marginLeft:'4px'}}>(proj.)</span>}
                  </td>
                  <td className="td-r">{e.nubank>0?`R$${fmt(e.nubank)}`:'—'}</td>
                  <td className="td-r">{e.c6>0?`R$${fmt(e.c6)}`:'—'}</td>
                  <td className="td-r hide-mob">{e.bin>0?`R$${fmt(e.bin)}`:'—'}</td>
                  <td className="td-r" style={{color:'#A78BFA'}}>{e.onil>0?`R$${fmt(e.onil)}`:'—'}</td>
                  <td className="td-r" style={{fontWeight:700,color:isNow?'var(--acc)':'var(--txt)'}}>R${fmt(e.pat)}</td>
                  <td className="td-r" style={{color:vP>=0?'var(--acc)':'var(--red)'}}>{i===0?'—':`${vP>=0?'+':''}${vP.toFixed(1)}%`}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TAB ORÇAMENTO — FIX 2: save to DB
// ══════════════════════════════════════════════════════════════
function TabOrcamento({ lancs, orcDb, onSaveOrcamento }) {
  const { toast } = useToast()
  const hoje = new Date().toISOString().slice(0,10)
  const [mesesSel, setMesesSel] = useState([getMesAtual()])
  const [modalOrc, setModalOrc] = useState(false)
  const [editVals, setEditVals] = useState({})
  const [saving,   setSaving]   = useState(false)

  const toggleMes=m=>setMesesSel(p=>p.includes(m)?p.filter(x=>x!==m):[...p,m])
  const allMes=()=>setMesesSel([...ALL_MESES])
  const ytdMes=()=>setMesesSel(ALL_MESES.filter(m=>{const[mm,yy]=m.split('/');return`20${yy}-${mm}-01`<=hoje}))

  const orcEffective=ORC_CATEGORIAS.map(cat=>{
    const dbRow=orcDb.find(o=>o.cat===cat.cat)
    return{...cat,valor_default:dbRow?.valor_default??cat.default,custom_meses:dbRow?.custom_meses??{}}
  })

  function getOrcado(cat,mes){
    const[mm,yy]=mes.split('/'),key=`20${yy}-${mm}`
    return cat.custom_meses?.[key]??cat.valor_default??0
  }

  const rows=(()=>{
    const calc=cat=>{
      const orcado=mesesSel.reduce((s,m)=>s+getOrcado(cat,m),0)
      const realizado=lancs.filter(l=>l.status==='Realizado'&&l.fluxo==='Saída'&&mesesSel.includes(l.mes)&&cat.planos.includes(l.plano)).reduce((s,l)=>s+l.valor,0)
      const aRealizar=lancs.filter(l=>l.status==='A Realizar'&&l.fluxo==='Saída'&&mesesSel.includes(l.mes)&&cat.planos.includes(l.plano)).reduce((s,l)=>s+l.valor,0)
      return{cat:cat.cat,tipo:cat.tipo,orcado,realizado,aRealizar,projetado:realizado+aRealizar}
    }
    return{
      despesas:    orcEffective.filter(c=>c.tipo==='despesa').map(calc).filter(r=>r.orcado>0||r.realizado>0||r.aRealizar>0).sort((a,b)=>{const pA=a.orcado>0?a.projetado/a.orcado:999,pB=b.orcado>0?b.projetado/b.orcado:999;return pB-pA}),
      investimentos:orcEffective.filter(c=>c.tipo==='investimento').map(calc).filter(r=>r.orcado>0||r.realizado>0||r.aRealizar>0),
    }
  })()

  const tO=rows.despesas.reduce((s,r)=>s+r.orcado,0),tR=rows.despesas.reduce((s,r)=>s+r.realizado,0)
  const tAR=rows.despesas.reduce((s,r)=>s+r.aRealizar,0),tP=rows.despesas.reduce((s,r)=>s+r.projetado,0)
  const saldoProj=tO-tP,nEst=rows.despesas.filter(r=>r.orcado>0&&r.projetado>r.orcado).length
  const label=mesesSel.length===1?`${LAB_MAP[mesesSel[0]]||mesesSel[0]}/26`:`${mesesSel.length} meses`

  function openParam(){
    const v={}
    orcEffective.forEach((cat,i)=>{
      v[`d${i}`]=cat.valor_default
      ALL_MESES.forEach(m=>{const[mm,yy]=m.split('/'),key=`20${yy}-${mm}`;v[`${i}-${m.replace('/','')}`]=cat.custom_meses?.[key]??''})
    })
    setEditVals(v);setModalOrc(true)
  }

  // FIX 2: actually save to DB
  async function saveOrcamento(){
    setSaving(true)
    try{
      const updated=orcEffective.map((cat,i)=>{
        const newDefault=parseFloat(editVals[`d${i}`])||0
        const newCustom={}
        ALL_MESES.forEach(m=>{
          const[mm,yy]=m.split('/'),key=`20${yy}-${mm}`
          const v=parseFloat(editVals[`${i}-${m.replace('/','')}`])
          if(!isNaN(v)&&String(editVals[`${i}-${m.replace('/','')}`])!=='')newCustom[key]=v
        })
        return{cat:cat.cat,tipo:cat.tipo,planos:cat.planos,valor_default:newDefault,custom_meses:newCustom,default:newDefault}
      })
      await onSaveOrcamento(updated)
      setModalOrc(false)
    }catch(e){toast(e.message,'err')}
    finally{setSaving(false)}
  }

  const RowEl=({r,cor=''})=>{
    const pct=r.orcado>0?(r.projetado/r.orcado*100):(r.projetado>0?100:0)
    const over=pct>100,warn=pct>80,col=over?'var(--red)':warn?'var(--amb)':'var(--acc)'
    return(
      <tr style={{background:over?'rgba(248,113,113,.04)':''}}>
        <td style={{fontWeight:500,color:cor||'var(--txt)'}}>{r.cat}</td>
        <td className="td-r">{r.orcado>0?`R$${fmt(r.orcado)}`:<span style={{color:'var(--mut)'}}>—</span>}</td>
        <td className="td-r" style={{color:r.realizado>0?'var(--txt)':'var(--mut)'}}>{r.realizado>0?`R$${fmt(r.realizado)}`:'—'}</td>
        <td className="td-r" style={{color:r.aRealizar>0?'var(--amb)':'var(--mut)'}}>{r.aRealizar>0?`R$${fmt(r.aRealizar)}`:'—'}</td>
        <td className="td-r" style={{color:cor||col,fontWeight:600}}>R${fmt(r.projetado)}</td>
        <td className="td-r">
          <div style={{display:'flex',alignItems:'center',gap:'6px',justifyContent:'flex-end'}}>
            <div style={{width:'50px',background:'var(--bg)',borderRadius:'99px',height:'4px',overflow:'hidden'}}>
              <div style={{width:`${Math.min(100,pct).toFixed(0)}%`,height:'100%',background:cor||col,borderRadius:'99px'}}/>
            </div>
            <span style={{color:cor||col,minWidth:'35px',textAlign:'right'}}>{pct.toFixed(0)}%</span>
          </div>
        </td>
        <td style={{textAlign:'center'}}><span className={`bdg ${over?'bdg-urg':warn?'bdg-warn':'bdg-ok'}`}>{over?'🔴 Estourou':warn?'⚠ Atenção':'✅ OK'}</span></td>
      </tr>
    )
  }

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
        <div>
          <div style={{fontSize:'18px',fontWeight:700}}>Orçamento</div>
          <div style={{fontSize:'12px',color:'var(--mut)'}}>{label} · Orçado vs Realizado vs Projetado</div>
        </div>
        <button className="btn btn-p" onClick={openParam}>⚙ Parametrizar</button>
      </div>
      <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'16px'}}>
        {ALL_MESES.map(m=>(
          <button key={m} className={`mes-btn${mesesSel.includes(m)?' on':''}`} onClick={()=>toggleMes(m)}>{LAB_MAP[m]}/26</button>
        ))}
        <button className="btn btn-s btn-sm" onClick={allMes}>Todos</button>
        <button className="btn btn-s btn-sm" onClick={ytdMes}>YTD</button>
      </div>
      <div className="kpi-grid" style={{marginBottom:'20px'}}>
        {[
          {lbl:'Total orçado',val:`R$${fmt(tO)}`,sub:label,color:'var(--blue)'},
          {lbl:'Realizado',val:`R$${fmt(tR)}`,sub:tO>0?`${(tR/tO*100).toFixed(0)}% do orçado`:'—',color:'var(--red)'},
          {lbl:'A Realizar',val:`R$${fmt(tAR)}`,sub:'Projeção futura',color:'var(--amb)'},
          {lbl:'Saldo projetado',val:`R$${fmt(Math.abs(saldoProj))}`,sub:saldoProj>=0?'Dentro do orçamento':'⚠ Estouro',color:saldoProj>=0?'var(--acc)':'var(--red)'},
          ...(nEst>0?[{lbl:'Estourando',val:`${nEst}`,sub:'categorias',color:'var(--red)'}]:[]),
        ].map((k,i)=>(
          <div key={i} className="kpi" style={{'--ka':k.color}}>
            <div className="kpi-lbl">{k.lbl}</div>
            <div className="kpi-val" style={{fontSize:'18px',color:k.color}}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>
      {nEst>0&&(
        <div style={{background:'var(--red-d)',border:'1px solid rgba(248,113,113,.25)',borderRadius:'var(--rs)',padding:'12px 16px',marginBottom:'16px'}}>
          <div style={{fontSize:'13px',fontWeight:600,color:'var(--red)',marginBottom:'6px'}}>⚠ {nEst} categoria(s) com estouro projetado</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
            {rows.despesas.filter(r=>r.orcado>0&&r.projetado>r.orcado).map(r=>(
              <span key={r.cat} style={{fontSize:'11px',background:'var(--red-d)',color:'var(--red)',border:'1px solid rgba(248,113,113,.2)',borderRadius:'20px',padding:'2px 10px'}}>{r.cat}: +R${fmt(r.projetado-r.orcado)}</span>
            ))}
          </div>
        </div>
      )}
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>Categoria</th><th style={{textAlign:'right'}}>Orçado</th><th style={{textAlign:'right'}}>Realizado</th><th style={{textAlign:'right'}}>A Realizar</th><th style={{textAlign:'right'}}>Projetado</th><th style={{textAlign:'right'}}>%</th><th style={{textAlign:'center'}}>Status</th></tr></thead>
          <tbody>
            {rows.despesas.map(r=><RowEl key={r.cat} r={r}/>)}
            {rows.investimentos.length>0&&<>
              <tr style={{background:'var(--bg2)'}}><td colSpan={7} style={{padding:'10px 12px',fontSize:'11px',fontWeight:700,textTransform:'uppercase',color:'#A78BFA',letterSpacing:'.06em'}}>💼 Investimentos — Fluxo Patrimonial</td></tr>
              {rows.investimentos.map(r=><RowEl key={r.cat} r={r} cor="#A78BFA"/>)}
            </>}
          </tbody>
        </table>
      </div>

      <Modal open={modalOrc} onClose={()=>setModalOrc(false)} title="⚙ Parametrizar orçamento" maxWidth={560}>
        <p style={{fontSize:'12px',color:'var(--mut)',marginBottom:'16px',lineHeight:'1.6'}}>
          Defina o valor <strong style={{color:'var(--txt)'}}>padrão mensal</strong> por categoria. Expanda para personalizar mês a mês.
        </p>
        <div style={{maxHeight:'55vh',overflowY:'auto',paddingRight:'4px'}}>
          {orcEffective.map((cat,i)=>(
            <div key={i} style={{background:'var(--bg)',borderRadius:'var(--rs)',padding:'12px',marginBottom:'8px'}}>
              <div style={{fontSize:'12px',fontWeight:700,color:'var(--txt)',marginBottom:'4px'}}>{cat.cat}</div>
              <div style={{fontSize:'10px',color:'var(--mut)',marginBottom:'8px'}}>{cat.planos.join(', ')}</div>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                <span style={{fontSize:'11px',color:'var(--mut)',minWidth:'80px'}}>Padrão/mês</span>
                <input type="number" step="0.01" value={editVals[`d${i}`]??0}
                  onChange={e=>setEditVals(v=>({...v,[`d${i}`]:e.target.value}))}
                  style={{flex:1,background:'var(--bg2)',border:'1px solid var(--brd2)',borderRadius:'var(--rs)',padding:'6px 10px',color:'var(--txt)',fontSize:'13px',fontFamily:'Sora,sans-serif',outline:'none'}}/>
              </div>
              <details style={{fontSize:'11px'}}>
                <summary style={{cursor:'pointer',color:'var(--mut)',marginBottom:'6px'}}>Personalizar por mês</summary>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginTop:'6px'}}>
                  {ALL_MESES.map(m=>(
                    <div key={m}>
                      <div style={{fontSize:'10px',color:'var(--mut)',marginBottom:'2px'}}>{LAB_MAP[m]}/26</div>
                      <input type="number" step="0.01" value={editVals[`${i}-${m.replace('/','')}`]??''}
                        onChange={e=>setEditVals(v=>({...v,[`${i}-${m.replace('/','')}`]:e.target.value}))}
                        placeholder="padrão"
                        style={{width:'100%',background:'var(--bg2)',border:'1px solid var(--brd2)',borderRadius:'var(--rs)',padding:'5px 8px',color:'var(--txt)',fontSize:'12px',fontFamily:'Sora,sans-serif',outline:'none'}}/>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ))}
        </div>
        <div className="modal-foot">
          <button className="btn btn-s" onClick={()=>setModalOrc(false)}>Cancelar</button>
          <button className="btn btn-p" onClick={saveOrcamento} disabled={saving}>
            {saving?'Salvando...':'Salvar orçamento'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default function Dashboard() {
  return <ToastProvider><DashboardInner/></ToastProvider>
}
