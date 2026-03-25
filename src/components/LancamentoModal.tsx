'use client'
import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { PLANOS, BANCOS, TIPOS, FORNECEDORES, dateToMes, gerarDatasRecorrencia } from '@/lib/utils'
import type { Lancamento } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  mode: 'novo' | 'editar' | 'duplicar'
  lancamento?: Lancamento
  onSave: (lancs: Omit<Lancamento, 'id' | 'user_id' | 'created_at'>[], editId?: number) => Promise<void>
  fornecedoresHistorico: string[]
}

const DEFAULT: Omit<Lancamento, 'id' | 'user_id' | 'created_at'> = {
  data: new Date().toISOString().slice(0, 10),
  mes: '',
  descricao: '',
  valor: 0,
  plano: PLANOS[0],
  tipo: TIPOS[0],
  banco: BANCOS[0],
  fornecedor: '',
  status: 'A Realizar',
  fluxo: 'Saída',
}

export function LancamentoModal({ open, onClose, mode, lancamento, onSave, fornecedoresHistorico }: Props) {
  const [form, setForm] = useState({ ...DEFAULT })
  const [recorrente, setRecorrente] = useState(false)
  const [freq, setFreq] = useState('mensal')
  const [repeticoes, setRepeticoes] = useState(12)
  const [saving, setSaving] = useState(false)

  // Todos os fornecedores únicos
  const allFornecedores = [...new Set([...FORNECEDORES, ...fornecedoresHistorico])].sort((a, b) => a.localeCompare(b, 'pt-BR'))

  useEffect(() => {
    if (!open) return
    if (mode === 'novo') {
      setForm({ ...DEFAULT, data: new Date().toISOString().slice(0, 10) })
      setRecorrente(false)
    } else if (lancamento) {
      if (mode === 'duplicar') {
        const novaData = new Date(lancamento.data + 'T00:00:00')
        novaData.setMonth(novaData.getMonth() + 1)
        setForm({ ...lancamento, data: novaData.toISOString().slice(0, 10) })
      } else {
        setForm({ ...lancamento })
      }
      setRecorrente(false)
    }
  }, [open, mode, lancamento])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const previewRec = () => {
    if (!recorrente) return ''
    const datas = gerarDatasRecorrencia(form.data, freq, repeticoes)
    const f = (d: string) => d.split('-').reverse().join('/')
    return `${datas.length} lançamentos: ${f(datas[0])} → ${f(datas[datas.length - 1])}`
  }

  async function handleSave() {
    if (!form.data || !form.descricao || !form.valor || form.valor <= 0) return
    setSaving(true)
    try {
      const base = { ...form, mes: dateToMes(form.data) }
      if (mode === 'editar' && lancamento) {
        await onSave([base], lancamento.id)
      } else if (recorrente) {
        const datas = gerarDatasRecorrencia(form.data, freq, repeticoes)
        const lancs = datas.map((d, i) => ({
          ...base,
          data: d,
          mes: dateToMes(d),
          descricao: `${form.descricao} ${i + 1}/${datas.length}`
        }))
        await onSave(lancs)
      } else {
        await onSave([base])
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const title = mode === 'novo' ? 'Novo lançamento' : mode === 'duplicar' ? `⧉ Duplicar: ${lancamento?.descricao?.slice(0, 25)}` : 'Editar lançamento'

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="fld-row">
        <div className="fld">
          <label>Data</label>
          <input type="date" value={form.data} onChange={e => set('data', e.target.value)} />
        </div>
        <div className="fld">
          <label>Fluxo</label>
          <select value={form.fluxo} onChange={e => set('fluxo', e.target.value)}>
            <option value="Entrada">Entrada (Receita)</option>
            <option value="Saída">Saída (Despesa)</option>
          </select>
        </div>
      </div>

      <div className="fld">
        <label>Descrição</label>
        <input type="text" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Aluguel mensal" />
      </div>

      <div className="fld-row">
        <div className="fld">
          <label>Plano de Contas</label>
          <select value={form.plano} onChange={e => set('plano', e.target.value)}>
            {PLANOS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="fld">
          <label>Tipo</label>
          <select value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="fld-row">
        <div className="fld">
          <label>Banco</label>
          <select value={form.banco} onChange={e => set('banco', e.target.value)}>
            {BANCOS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="fld">
          <label>Valor (R$)</label>
          <input type="number" step="0.01" min="0" value={form.valor || ''} onChange={e => set('valor', parseFloat(e.target.value) || 0)} placeholder="0,00" />
        </div>
      </div>

      <div className="fld-row">
        <div className="fld">
          <label>Fornecedor</label>
          <datalist id="forn-list">
            {allFornecedores.map(f => <option key={f} value={f} />)}
          </datalist>
          <input list="forn-list" value={form.fornecedor} onChange={e => set('fornecedor', e.target.value)} placeholder="Digite ou selecione..." autoComplete="off" />
        </div>
        <div className="fld">
          <label>Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="A Realizar">A Realizar</option>
            <option value="Realizado">Realizado</option>
          </select>
        </div>
      </div>

      {/* Recorrência */}
      {mode !== 'editar' && (
        <div style={{ borderTop: '1px solid var(--brd)', marginTop: '4px', paddingTop: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '10px' }}>
            <input type="checkbox" checked={recorrente} onChange={e => setRecorrente(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--acc)' }} />
            <span style={{ fontSize: '13px', fontWeight: '600' }}>🔁 Lançamento recorrente</span>
          </label>

          {recorrente && (
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--rs)', padding: '12px' }}>
              <div className="fld-row">
                <div className="fld">
                  <label>Frequência</label>
                  <select value={freq} onChange={e => setFreq(e.target.value)}>
                    <option value="mensal">Mensal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="semanal">Semanal</option>
                    <option value="bimestral">Bimestral</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                <div className="fld">
                  <label>Nº de repetições</label>
                  <input type="number" min="2" max="60" value={repeticoes} onChange={e => setRepeticoes(parseInt(e.target.value) || 2)} />
                </div>
              </div>
              {previewRec() && (
                <p style={{ fontSize: '11px', color: 'var(--acc)', marginTop: '4px' }}>
                  ✓ {previewRec()}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="modal-actions">
        <button className="btn btn-s" onClick={onClose}>Cancelar</button>
        <button className="btn btn-p" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : mode === 'editar' ? 'Salvar alterações' : recorrente ? `Criar ${repeticoes} lançamentos` : 'Salvar'}
        </button>
      </div>
    </Modal>
  )
}
