'use client'
import { useState, useMemo } from 'react'
import { Modal } from '@/components/Modal'
import { fmt } from '@/lib/utils'
import type { Lancamento, OrcamentoCategoria } from '@/lib/types'

interface Props {
  lancamentos: Lancamento[]; bancos: any[]; orcamento: OrcamentoCategoria[]; saldosRef: any
  onSaveLancamento: any; onDeleteLancamento: any
  onSaveOrcamento: (orc: OrcamentoCategoria[]) => void
}

const TODOS_MESES=['01/26','02/26','03/26','04/26','05/26','06/26','07/26','08/26','09/26','10/26','11/26','12/26']
const NOME_MES: Record<string,string>={
  '01/26':'Jan','02/26':'Fev','03/26':'Mar','04/26':'Abr','05/26':'Mai','06/26':'Jun',
  '07/26':'Jul','08/26':'Ago','09/26':'Set','10/26':'Out','11/26':'Nov','12/26':'Dez'
}
const NOME_MES_KEY: Record<string,string>={
  '01':'Jan','02':'Fev','03':'Mar','04':'Abr','05':'Mai','06':'Jun',
  '07':'Jul','08':'Ago','09':'Set','10':'Out','11':'Nov','12':'Dez'
}

export default function TabOrcamento({ lancamentos, orcamento, onSaveOrcamento }: Props) {
  const hoje = new Date().toISOString().slice(0,10)
  const [mesesSel, setMesesSel] = useState<string[]>(['03/26'])
  const [modalOrc, setModalOrc] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, any>>({})

  function toggleMes(m: string) { setMesesSel(prev=>prev.includes(m)?prev.filter(x=>x!==m):[...prev,m]) }
  function selectAll() { setMesesSel([...TODOS_MESES]) }
  function selectYTD() { setMesesSel(TODOS_MESES.filter(m=>{const[mm,yy]=m.split('/');return`20${yy}-${mm}-01`<=hoje})) }

  function getOrcado(cat: OrcamentoCategoria, mes: string): number {
    const [mm,yy]=mes.split('/')
    const key=`20${yy}-${mm}`
    return (cat.mensal_custom?.[key]??cat.mensal_default)??0
  }

  const rows = useMemo(()=>{
    const despesas=orcamento.filter(c=>c.tipo==='despesa')
    const investimentos=orcamento.filter(c=>c.tipo==='investimento')
    function calcRow(cat: OrcamentoCategoria){
      const orcado=mesesSel.reduce((s,m)=>s+getOrcado(cat,m),0)
      const realizado=lancamentos.filter(l=>l.status==='Realizado'&&l.fluxo==='Saída'&&mesesSel.includes(l.mes)&&cat.planos.includes(l.plano)).reduce((s,l)=>s+l.valor,0)
      const aRealizar=lancamentos.filter(l=>l.status==='A Realizar'&&l.fluxo==='Saída'&&mesesSel.includes(l.mes)&&cat.planos.includes(l.plano)).reduce((s,l)=>s+l.valor,0)
      return{cat:cat.cat,orcado,realizado,aRealizar,projetado:realizado+aRealizar}
    }
    return{
      despesas:despesas.map(calcRow).filter(r=>r.orcado>0||r.realizado>0||r.aRealizar>0).sort((a,b)=>{const pA=a.orcado>0?a.projetado/a.orcado:999;const pB=b.orcado>0?b.projetado/b.orcado:999;return pB-pA}),
      investimentos:investimentos.map(calcRow).filter(r=>r.orcado>0||r.realizado>0||r.aRealizar>0)
    }
  },[lancamentos,orcamento,mesesSel])

  const tO=rows.despesas.reduce((s,r)=>s+r.orcado,0)
  const tR=rows.despesas.reduce((s,r)=>s+r.realizado,0)
  const tAR=rows.despesas.reduce((s,r)=>s+r.aRealizar,0)
  const tP=rows.despesas.reduce((s,r)=>s+r.projetado,0)
  const saldoProj=tO-tP
  const nEstouros=rows.despesas.filter(r=>r.orcado>0&&r.projetado>r.orcado).length
  const label=mesesSel.length===1?`${NOME_MES[mesesSel[0]]}/26`:`${mesesSel.length} meses`

  function openParametrizar(){
    const vals: Record<string,any>={}
    orcamento.forEach((cat,i)=>{
      vals[`default-${i}`]=cat.mensal_default||0
      const meses=['01/26','02/26','03/26','04/26','05/26','06/26','07/26','08/26','09/26','10/26','11/26','12/26']
      meses.forEach(m=>{const[mm,yy]=m.split('/');const key=`20${yy}-${mm}`;vals[`${i}-${m.replace('/','')}`]=cat.mensal_custom?.[key]??''})
    })
    setEditValues(vals)
    setModalOrc(true)
  }

  function saveOrcamento(){
    const updated=orcamento.map((cat,i)=>{
      const newDefault=parseFloat(editValues[`default-${i}`])||0
      const newCustom:{[k:string]:number}={}
      const meses=['01/26','02/26','03/26','04/26','05/26','06/26','07/26','08/26','09/26','10/26','11/26','12/26']
      meses.forEach(m=>{
        const[mm,yy]=m.split('/')
        const key=`20${yy}-${mm}`
        const v=parseFloat(editValues[`${i}-${m.replace('/','')}`])
        if(!isNaN(v)&&v!==newDefault)newCustom[key]=v
      })
      return{...cat,mensal_default:newDefault,mensal_custom:newCustom}
    })
    onSaveOrcamento(updated)
    setModalOrc(false)
  }

  const RowEl=({r,cor=''}:{r:any,cor?:string})=>{
    const pct=r.orcado>0?(r.projetado/r.orcado*100):(r.projetado>0?100:0)
    const over=pct>100,warn=pct>80
    const col=over?'var(--red)':warn?'var(--amb)':'var(--acc)'
    return(
      <tr style={{background:over?'rgba(248,113,113,.04)':''}}>
        <td style={{fontWeight:500,color:cor||'var(--txt)'}}>{r.cat}</td>
        <td className="td-amt">{r.orcado>0?`R$${fmt(r.orcado)}`:<span style={{color:'var(--mut)'}}>—</span>}</td>
        <td className="td-amt" style={{color:r.realizado>0?'var(--txt)':'var(--mut)'}}>{r.realizado>0?`R$${fmt(r.realizado)}`:'—'}</td>
        <td className="td-amt" style={{color:r.aRealizar>0?'var(--amb)':'var(--mut)'}}>{r.aRealizar>0?`R$${fmt(r.aRealizar)}`:'—'}</td>
        <td className="td-amt" style={{color:cor||col,fontWeight:600}}>R${fmt(r.projetado)}</td>
        <td className="td-amt">
          <div style={{display:'flex',alignItems:'center',gap:'6px',justifyContent:'flex-end'}}>
            <div style={{width:'50px',background:'var(--bg)',borderRadius:'99px',height:'4px',overflow:'hidden'}}>
              <div style={{width:`${Math.min(100,pct).toFixed(0)}%`,height:'100%',background:cor||col,borderRadius:'99px'}}/>
            </div>
            <span style={{color:cor||col,minWidth:'35px',textAlign:'right'}}>{pct.toFixed(0)}%</span>
          </div>
        </td>
        <td style={{textAlign:'center'}}>
          <span className={`bdg ${over?'bdg-urg':warn?'bdg-warn':'bdg-ok'}`}>{over?'🔴 Estourou':warn?'⚠ Atenção':'✅ OK'}</span>
        </td>
      </tr>
    )
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
        <div>
          <div style={{fontSize:'18px',fontWeight:700}}>Orçamento</div>
          <div style={{fontSize:'12px',color:'var(--mut)'}}>{label} · Orçado vs Realizado vs Projetado</div>
        </div>
        <button className="btn btn-p" onClick={openParametrizar}>⚙ Parametrizar</button>
      </div>

      {/* Mes selector */}
      <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'16px'}}>
        {TODOS_MESES.map(m=>(
          <button key={m} className={`mes-btn${mesesSel.includes(m)?' on':''}`} onClick={()=>toggleMes(m)}>
            {NOME_MES[m]}/26
          </button>
        ))}
        <button className="btn btn-s btn-sm" onClick={selectAll}>Todos</button>
        <button className="btn btn-s btn-sm" onClick={selectYTD}>YTD</button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{marginBottom:'20px'}}>
        {[
          {lbl:'Total orçado',val:`R$${fmt(tO)}`,sub:label,color:'var(--blue)'},
          {lbl:'Realizado',val:`R$${fmt(tR)}`,sub:tO>0?`${(tR/tO*100).toFixed(0)}% do orçado`:'—',color:'var(--red)'},
          {lbl:'A Realizar',val:`R$${fmt(tAR)}`,sub:'Projeção futura',color:'var(--amb)'},
          {lbl:'Saldo projetado',val:`R$${fmt(Math.abs(saldoProj))}`,sub:saldoProj>=0?'Dentro do orçamento':'⚠ Estouro projetado',color:saldoProj>=0?'var(--acc)':'var(--red)'},
          ...(nEstouros>0?[{lbl:'Categorias estourando',val:`${nEstouros}`,sub:'Acima do orçado',color:'var(--red)'}]:[]),
        ].map((k,i)=>(
          <div key={i} className="kpi" style={{'--ka':k.color} as any}>
            <div className="kpi-lbl">{k.lbl}</div>
            <div className="kpi-val" style={{fontSize:'18px',color:k.color}}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Alert */}
      {nEstouros>0?(
        <div style={{background:'var(--red-d)',border:'1px solid rgba(248,113,113,.25)',borderRadius:'var(--rs)',padding:'12px 16px',marginBottom:'16px'}}>
          <div style={{fontSize:'13px',fontWeight:600,color:'var(--red)',marginBottom:'6px'}}>⚠ {nEstouros} categoria{nEstouros>1?'s':''} com estouro projetado</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
            {rows.despesas.filter(r=>r.orcado>0&&r.projetado>r.orcado).map(r=>(
              <span key={r.cat} style={{fontSize:'11px',background:'var(--red-d)',color:'var(--red)',border:'1px solid rgba(248,113,113,.2)',borderRadius:'20px',padding:'2px 10px'}}>{r.cat}: +R${fmt(r.projetado-r.orcado)}</span>
            ))}
          </div>
        </div>
      ):(
        <div style={{background:'var(--acc-d)',border:'1px solid rgba(110,231,183,.2)',borderRadius:'var(--rs)',padding:'10px 16px',display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>
          <span>✅</span><span style={{fontSize:'12px',color:'var(--acc)',fontWeight:500}}>Sem estouros projetados no período selecionado</span>
        </div>
      )}

      {/* Table */}
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Categoria</th>
              <th style={{textAlign:'right'}}>Orçado</th>
              <th style={{textAlign:'right'}}>Realizado</th>
              <th style={{textAlign:'right'}}>A Realizar</th>
              <th style={{textAlign:'right'}}>Projetado</th>
              <th style={{textAlign:'right'}}>%</th>
              <th style={{textAlign:'center'}}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.despesas.map(r=><RowEl key={r.cat} r={r}/>)}
            {rows.investimentos.length>0&&<>
              <tr style={{background:'var(--bg2)'}}>
                <td colSpan={7} style={{padding:'10px 12px',fontSize:'11px',fontWeight:700,textTransform:'uppercase',color:'#A78BFA',letterSpacing:'.06em'}}>
                  💼 Investimentos — Fluxo Patrimonial
                </td>
              </tr>
              {rows.investimentos.map(r=><RowEl key={r.cat} r={r} cor="#A78BFA"/>)}
            </>}
          </tbody>
        </table>
      </div>

      {/* Modal parametrizar */}
      <Modal open={modalOrc} onClose={()=>setModalOrc(false)} title="⚙ Parametrizar orçamento mensal" maxWidth={560}>
        <p style={{fontSize:'12px',color:'var(--mut)',marginBottom:'16px',lineHeight:'1.6'}}>
          Defina o valor <strong style={{color:'var(--txt)'}}>padrão mensal</strong> para cada categoria. Para meses específicos diferentes, expanda e edite.
        </p>
        <div style={{maxHeight:'55vh',overflowY:'auto',paddingRight:'4px'}}>
          {orcamento.map((cat,i)=>(
            <div key={i} style={{background:'var(--bg)',borderRadius:'var(--rs)',padding:'12px',marginBottom:'8px'}}>
              <div style={{fontSize:'12px',fontWeight:700,color:'var(--txt)',marginBottom:'4px'}}>{cat.cat}</div>
              <div style={{fontSize:'10px',color:'var(--mut)',marginBottom:'8px'}}>{cat.planos.join(', ')}</div>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                <span style={{fontSize:'11px',color:'var(--mut)',minWidth:'80px'}}>Padrão/mês</span>
                <input type="number" step="0.01" value={editValues[`default-${i}`]??0}
                  onChange={e=>setEditValues(v=>({...v,[`default-${i}`]:e.target.value}))}
                  style={{flex:1,background:'var(--bg2)',border:'1px solid var(--brd2)',borderRadius:'var(--rs)',padding:'6px 10px',color:'var(--txt)',fontSize:'13px',fontFamily:'Sora,sans-serif',outline:'none'}}/>
              </div>
              <details style={{fontSize:'11px'}}>
                <summary style={{cursor:'pointer',color:'var(--mut)',marginBottom:'6px'}}>Personalizar por mês</summary>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginTop:'6px'}}>
                  {['01/26','02/26','03/26','04/26','05/26','06/26','07/26','08/26','09/26','10/26','11/26','12/26'].map(m=>{
                    const[mm]=m.split('/')
                    return(
                      <div key={m}>
                        <div style={{fontSize:'10px',color:'var(--mut)',marginBottom:'2px'}}>{NOME_MES_KEY[mm]}/26</div>
                        <input type="number" step="0.01" value={editValues[`${i}-${m.replace('/','')}`]??''}
                          onChange={e=>setEditValues(v=>({...v,[`${i}-${m.replace('/','')}`]:e.target.value}))}
                          placeholder="padrão"
                          style={{width:'100%',background:'var(--bg2)',border:'1px solid var(--brd2)',borderRadius:'var(--rs)',padding:'5px 8px',color:'var(--txt)',fontSize:'12px',fontFamily:'Sora,sans-serif',outline:'none'}}/>
                      </div>
                    )
                  })}
                </div>
              </details>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn btn-s" onClick={()=>setModalOrc(false)}>Cancelar</button>
          <button className="btn btn-p" onClick={saveOrcamento}>Salvar orçamento</button>
        </div>
      </Modal>
    </div>
  )
}
