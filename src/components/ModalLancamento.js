import { useState, useEffect } from 'react'
import Modal from './Modal'
import { PLANOS, BANCOS_LISTA, FORNECEDORES, dateToMes, gerarDatasRecorrencia } from '../lib/constantes'

const DEFAULT = {
  data: '', mes:'', plano: PLANOS[0], tipo:'Receita', banco: BANCOS_LISTA[0],
  descricao:'', fornecedor:'', valor:'', status:'A Realizar', fluxo:'Saída'
}

export default function ModalLancamento({ open, onClose, mode, lanc, onSave, fornHist=[] }) {
  const [form,    setForm]    = useState({...DEFAULT})
  const [rec,     setRec]     = useState(false)
  const [freq,    setFreq]    = useState('mensal')
  const [reps,    setReps]    = useState(12)
  const [saving,  setSaving]  = useState(false)

  const allForn = [...new Set([...FORNECEDORES, ...fornHist])].sort((a,b)=>a.localeCompare(b,'pt-BR'))

  useEffect(() => {
    if(!open) return
    if(mode==='novo') { setForm({...DEFAULT, data: new Date().toISOString().slice(0,10)}); setRec(false) }
    else if(lanc) {
      if(mode==='duplicar') {
        const d = new Date(lanc.data+'T00:00:00'); d.setMonth(d.getMonth()+1)
        setForm({...lanc, data: d.toISOString().slice(0,10), valor: String(lanc.valor)})
      } else {
        setForm({...lanc, valor: String(lanc.valor)})
      }
      setRec(false)
    }
  }, [open, mode, lanc])

  const set = (k, v) => setForm(f => ({...f, [k]:v}))

  const previewRec = () => {
    if(!rec || !form.data) return ''
    const datas = gerarDatasRecorrencia(form.data, freq, reps)
    const f = d => d.split('-').reverse().join('/')
    return `${datas.length} lançamentos: ${f(datas[0])} → ${f(datas[datas.length-1])}`
  }

  async function handleSave() {
    const valor = parseFloat(String(form.valor).replace(',','.'))
    if(!form.data || !form.descricao || !valor || valor<=0) return
    setSaving(true)
    try {
      const base = {...form, valor, mes: dateToMes(form.data)}
      delete base.id; delete base.created_at

      if(mode==='editar' && lanc) {
        await onSave([base], lanc.id)
      } else if(rec) {
        const datas = gerarDatasRecorrencia(form.data, freq, reps)
        await onSave(datas.map((d,i) => ({...base, data:d, mes:dateToMes(d), descricao:`${form.descricao} ${i+1}/${datas.length}`})))
      } else {
        await onSave([base])
      }
      onClose()
    } finally { setSaving(false) }
  }

  const title = mode==='novo' ? 'Novo lançamento' : mode==='duplicar' ? `⧉ Duplicar` : 'Editar lançamento'

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="fld-row">
        <div className="fld">
          <label>Data</label>
          <input type="date" value={form.data} onChange={e=>set('data',e.target.value)}/>
        </div>
        <div className="fld">
          <label>Fluxo</label>
          <select value={form.fluxo} onChange={e=>set('fluxo',e.target.value)}>
            <option value="Entrada">Entrada (Receita)</option>
            <option value="Saída">Saída (Despesa)</option>
          </select>
        </div>
      </div>
      <div className="fld">
        <label>Descrição</label>
        <input type="text" value={form.descricao} onChange={e=>set('descricao',e.target.value)} placeholder="Ex: Aluguel mensal"/>
      </div>
      <div className="fld-row">
        <div className="fld">
          <label>Plano de Contas</label>
          <select value={form.plano} onChange={e=>set('plano',e.target.value)}>
            {PLANOS.map(p=><option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="fld">
          <label>Banco</label>
          <select value={form.banco} onChange={e=>set('banco',e.target.value)}>
            {BANCOS_LISTA.map(b=><option key={b}>{b}</option>)}
          </select>
        </div>
      </div>
      <div className="fld-row">
        <div className="fld">
          <label>Valor (R$)</label>
          <input type="number" step="0.01" min="0" value={form.valor} onChange={e=>set('valor',e.target.value)} placeholder="0,00"/>
        </div>
        <div className="fld">
          <label>Status</label>
          <select value={form.status} onChange={e=>set('status',e.target.value)}>
            <option value="A Realizar">A Realizar</option>
            <option value="Realizado">Realizado</option>
          </select>
        </div>
      </div>
      <div className="fld">
        <label>Fornecedor</label>
        <datalist id="forn-dl">{allForn.map(f=><option key={f} value={f}/>)}</datalist>
        <input list="forn-dl" value={form.fornecedor} onChange={e=>set('fornecedor',e.target.value)} placeholder="Digite ou selecione..." autoComplete="off"/>
      </div>

      {mode!=='editar' && (
        <div style={{borderTop:'1px solid var(--brd)',marginTop:'4px',paddingTop:'16px'}}>
          <label style={{display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',marginBottom:'10px'}}>
            <input type="checkbox" checked={rec} onChange={e=>setRec(e.target.checked)} style={{width:16,height:16,accentColor:'var(--acc)'}}/>
            <span style={{fontSize:'13px',fontWeight:600}}>🔁 Recorrente</span>
          </label>
          {rec && (
            <div style={{background:'var(--bg)',borderRadius:'var(--rs)',padding:'12px'}}>
              <div className="fld-row">
                <div className="fld">
                  <label>Frequência</label>
                  <select value={freq} onChange={e=>setFreq(e.target.value)}>
                    {['mensal','quinzenal','semanal','bimestral','trimestral','anual'].map(f=><option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="fld">
                  <label>Repetições</label>
                  <input type="number" min="2" max="60" value={reps} onChange={e=>setReps(parseInt(e.target.value)||2)}/>
                </div>
              </div>
              {previewRec() && <p style={{fontSize:'11px',color:'var(--acc)',marginTop:'4px'}}>✓ {previewRec()}</p>}
            </div>
          )}
        </div>
      )}

      <div className="modal-foot">
        <button className="btn btn-s" onClick={onClose}>Cancelar</button>
        <button className="btn btn-p" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : mode==='editar' ? 'Salvar' : rec ? `Criar ${reps} lançamentos` : 'Salvar'}
        </button>
      </div>
    </Modal>
  )
}
