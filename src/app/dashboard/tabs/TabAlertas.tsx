'use client'
import { useState, useMemo } from 'react'
import { LancamentoModal } from '@/components/LancamentoModal'
import { useToast } from '@/components/ToastProvider'
import { fmt, calcUrgencia } from '@/lib/utils'
import type { Lancamento } from '@/lib/types'

interface Props {
  lancamentos: Lancamento[]; bancos: any[]; orcamento: any[]; saldosRef: any
  onSaveLancamento: (lancs: any[], editId?: number) => Promise<void>
  onDeleteLancamento: (id: number) => Promise<void>
}

const MESES=['03/26','04/26','05/26','06/26','07/26','08/26','09/26','10/26','11/26','12/26','01/27']
const NOME_MES: Record<string,string>={
  '03/26':'Mar/26','04/26':'Abr/26','05/26':'Mai/26','06/26':'Jun/26','07/26':'Jul/26',
  '08/26':'Ago/26','09/26':'Set/26','10/26':'Out/26','11/26':'Nov/26','12/26':'Dez/26','01/27':'Jan/27'
}
const URG_MAP={
  vencido:{cls:'bdg-urg',lbl:'⚠ ATRASADO'},
  urgente:{cls:'bdg-urg',lbl:'URGENTE'},
  proximo:{cls:'bdg-next',lbl:'PRÓXIMO'},
  ok:{cls:'bdg-ok',lbl:'OK'},
}

export default function TabAlertas({ lancamentos, onSaveLancamento }: Props) {
  const { toast } = useToast()
  const [filtro, setFiltro] = useState('90dias')
  const [modal, setModal] = useState<{open:boolean;lanc?:Lancamento}>({open:false})

  const { deStr, ateStr, label } = useMemo(()=>{
    if(filtro==='90dias'){
      const fim=new Date();fim.setDate(fim.getDate()+90)
      return{deStr:'2000-01-01',ateStr:fim.toISOString().slice(0,10),label:'Próximos 90 dias'}
    }
    if(filtro==='todos')return{deStr:'2000-01-01',ateStr:'2099-12-31',label:'Todos'}
    const[mm,yy]=filtro.split('/')
    const de=`20${yy}-${mm}-01`
    const fim=new Date(`20${yy}-${mm}-01`);fim.setMonth(fim.getMonth()+1);fim.setDate(0)
    return{deStr:de,ateStr:fim.toISOString().slice(0,10),label:NOME_MES[filtro]||filtro}
  },[filtro])

  const pagar=useMemo(()=>
    lancamentos.filter(l=>l.status==='A Realizar'&&l.fluxo==='Saída'&&l.data>=deStr&&l.data<=ateStr)
      .map(l=>({...l,urgencia:calcUrgencia(l.data)}))
      .sort((a,b)=>a.data.localeCompare(b.data))
  ,[lancamentos,deStr,ateStr])

  const receber=useMemo(()=>
    lancamentos.filter(l=>l.status==='A Realizar'&&l.fluxo==='Entrada'&&l.data>=deStr&&l.data<=ateStr)
      .map(l=>({...l,urgencia:calcUrgencia(l.data)}))
      .sort((a,b)=>a.data.localeCompare(b.data))
  ,[lancamentos,deStr,ateStr])

  const nVencidos=[...pagar,...receber].filter(l=>l.urgencia==='vencido').length
  const tP=pagar.reduce((s,l)=>s+l.valor,0)
  const tR=receber.reduce((s,l)=>s+l.valor,0)

  async function handleSave(lancs:any[],editId?:number){
    await onSaveLancamento(lancs,editId)
    toast('Atualizado ✓')
    setModal({open:false})
  }

  const renderList=(list:any[],cor:string)=>{
    if(!list.length)return<div className="empty"><div className="empty-icon">✅</div><p>Nenhuma conta em {label}</p></div>
    return list.map(l=>{
      const diasAtraso=l.urgencia==='vencido'?Math.abs(Math.round((new Date(l.data+'T00:00:00').getTime()-new Date().getTime())/86400000)):0
      const urg=URG_MAP[l.urgencia as keyof typeof URG_MAP]
      return(
        <div key={l.id} className="al-item" style={l.urgencia==='vencido'?{borderLeft:'3px solid var(--red)',paddingLeft:'10px'}:{}}>
          <span className={`bdg ${urg.cls}`} style={{minWidth:'80px',justifyContent:'center'}}>{urg.lbl}</span>
          <div className="al-info">
            <div className="al-desc">{l.descricao}</div>
            <div className="al-date">
              {l.data.split('-').reverse().join('/')} · {l.banco} · {l.plano}
              {l.urgencia==='vencido'&&<span style={{color:'var(--red)',fontWeight:600,marginLeft:'6px'}}>{diasAtraso} dias em atraso</span>}
            </div>
          </div>
          <div>
            <div className="al-amt" style={{color:l.urgencia==='vencido'?'var(--red)':cor}}>R${fmt(l.valor)}</div>
            <button className="btn btn-s btn-sm" style={{marginTop:'4px'}} onClick={()=>setModal({open:true,lanc:l})}>Editar</button>
          </div>
        </div>
      )
    })
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
        <div>
          <div style={{fontSize:'18px',fontWeight:700}}>Contas a pagar / receber</div>
          <div style={{fontSize:'12px',color:'var(--mut)'}}>
            {label} · A pagar: R${fmt(tP)} · A receber: R${fmt(tR)} · Saldo: R${fmt(tR-tP)}
            {nVencidos>0&&<span style={{color:'var(--red)',marginLeft:'8px'}}>⚠ {nVencidos} em atraso</span>}
          </div>
        </div>
        <select value={filtro} onChange={e=>setFiltro(e.target.value)} className="filter-sel">
          <option value="90dias">Próximos 90 dias</option>
          {MESES.map(m=><option key={m} value={m}>{NOME_MES[m]}</option>)}
          <option value="todos">Todos</option>
        </select>
      </div>

      <div className="g2">
        <div>
          <div className="sec-title">Contas a pagar</div>
          {renderList(pagar,'var(--red)')}
        </div>
        <div>
          <div className="sec-title">Contas a receber</div>
          {renderList(receber,'var(--acc)')}
        </div>
      </div>

      <LancamentoModal
        open={modal.open}
        onClose={()=>setModal({open:false})}
        mode="editar"
        lancamento={modal.lanc}
        onSave={handleSave}
        fornecedoresHistorico={[]}
      />
    </div>
  )
}
