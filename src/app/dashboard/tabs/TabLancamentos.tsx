'use client'
import { useState, useMemo } from 'react'
import { LancamentoModal } from '@/components/LancamentoModal'
import { useToast } from '@/components/ToastProvider'
import { fmt } from '@/lib/utils'
import { exportToExcel, exportSummary } from '@/lib/exportExcel'
import type { Lancamento } from '@/lib/types'

interface Props {
  lancamentos: Lancamento[]
  bancos: any[]
  orcamento: any[]
  saldosRef: any
  onSaveLancamento: (lancs: any[], editId?: number) => Promise<void>
  onDeleteLancamento: (id: number) => Promise<void>
}

const MESES = ['12/25','01/26','02/26','03/26','04/26','05/26','06/26','07/26','08/26','09/26','10/26','11/26','12/26','01/27']
const NOME_MES: Record<string, string> = {
  '12/25':'Dez/25','01/26':'Jan/26','02/26':'Fev/26','03/26':'Mar/26','04/26':'Abr/26',
  '05/26':'Mai/26','06/26':'Jun/26','07/26':'Jul/26','08/26':'Ago/26','09/26':'Set/26',
  '10/26':'Out/26','11/26':'Nov/26','12/26':'Dez/26','01/27':'Jan/27'
}

export default function TabLancamentos({ lancamentos, onSaveLancamento, onDeleteLancamento }: Props) {
  const { toast } = useToast()
  const [filtroMes, setFiltroMes] = useState('03/26')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroBanco, setFiltroBanco] = useState('')
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState<{ open: boolean; mode: 'novo'|'editar'|'duplicar'; lanc?: Lancamento }>({ open: false, mode: 'novo' })

  const fornecedoresHistorico = useMemo(() =>
    [...new Set(lancamentos.map(l => l.fornecedor).filter(Boolean))], [lancamentos])

  const filtered = useMemo(() => {
    return lancamentos.filter(l => {
      if (filtroMes && l.mes !== filtroMes) return false
      if (filtroTipo && l.fluxo !== filtroTipo) return false
      if (filtroStatus && l.status !== filtroStatus) return false
      if (filtroBanco && l.banco !== filtroBanco) return false
      if (busca) {
        const b = busca.toLowerCase()
        if (!l.descricao.toLowerCase().includes(b) && !l.plano.toLowerCase().includes(b) &&
            !l.fornecedor.toLowerCase().includes(b)) return false
      }
      return true
    }).sort((a, b) => b.data.localeCompare(a.data))
  }, [lancamentos, filtroMes, filtroTipo, filtroStatus, filtroBanco, busca])

  const tRec = filtered.filter(l => l.fluxo === 'Entrada').reduce((s, l) => s + l.valor, 0)
  const tDes = filtered.filter(l => l.fluxo === 'Saída').reduce((s, l) => s + l.valor, 0)

  async function handleSave(lancs: any[], editId?: number) {
    await onSaveLancamento(lancs, editId)
    toast(editId ? 'Lançamento atualizado ✓' : lancs.length > 1 ? `${lancs.length} lançamentos criados ✓` : 'Lançamento adicionado ✓')
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir este lançamento?')) return
    await onDeleteLancamento(id)
    toast('Lançamento excluído')
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '700' }}>Lançamentos</div>
          <div style={{ fontSize: '12px', color: 'var(--mut)' }}>
            {filtered.length} lançamentos · Entradas: R${fmt(tRec)} · Saídas: R${fmt(tDes)} · Saldo: R${fmt(tRec - tDes)}
          </div>
        </div>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
          <button className="btn btn-s" onClick={() => exportToExcel(lancamentos)} title="Exportar todos os lançamentos">
            ⬇ Exportar Excel
          </button>
          <button className="btn btn-s" onClick={() => exportSummary(lancamentos)} title="Exportar resumo por mês">
            📊 Resumo mensal
          </button>
          <button className="btn btn-p" onClick={() => setModal({ open: true, mode: 'novo' })}>+ Novo lançamento</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} style={{ background: 'var(--sur)', border: '1px solid var(--brd2)', borderRadius: 'var(--rs)', padding: '7px 12px', color: 'var(--txt)', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}>
          <option value="">Todos os meses</option>
          {MESES.map(m => <option key={m} value={m}>{NOME_MES[m]}</option>)}
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ background: 'var(--sur)', border: '1px solid var(--brd2)', borderRadius: 'var(--rs)', padding: '7px 12px', color: 'var(--txt)', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}>
          <option value="">Entrada/Saída</option>
          <option value="Entrada">Entrada</option>
          <option value="Saída">Saída</option>
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ background: 'var(--sur)', border: '1px solid var(--brd2)', borderRadius: 'var(--rs)', padding: '7px 12px', color: 'var(--txt)', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}>
          <option value="">Todos status</option>
          <option value="Realizado">Realizado</option>
          <option value="A Realizar">A Realizar</option>
        </select>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." style={{ background: 'var(--sur)', border: '1px solid var(--brd2)', borderRadius: 'var(--rs)', padding: '7px 12px', color: 'var(--txt)', fontSize: '13px', fontFamily: 'inherit', outline: 'none', minWidth: '160px' }} />
      </div>

      {/* Table */}
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th className="hide-mob">Fornecedor</th>
              <th className="hide-mob">Plano</th>
              <th className="hide-mob">Banco</th>
              <th>Status</th>
              <th>Fluxo</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9}>
                <div className="empty"><div className="empty-icon">📋</div><p>Nenhum lançamento encontrado</p></div>
              </td></tr>
            ) : filtered.map(l => (
              <tr key={l.id}>
                <td style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>{l.data.split('-').reverse().join('/')}</td>
                <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.descricao}>{l.descricao}</td>
                <td className="hide-mob" style={{ fontSize: '11px', color: 'var(--txt2)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.fornecedor || '—'}</td>
                <td className="hide-mob" style={{ fontSize: '11px', color: 'var(--txt2)' }}>{l.plano}</td>
                <td className="hide-mob" style={{ fontSize: '12px' }}>{l.banco}</td>
                <td><span className={`bdg ${l.status === 'Realizado' ? 'bdg-real' : 'bdg-pend'}`}>{l.status}</span></td>
                <td><span className={`bdg ${l.fluxo === 'Entrada' ? 'bdg-rec' : 'bdg-des'}`}>{l.fluxo}</span></td>
                <td className="td-amt" style={{ color: l.fluxo === 'Entrada' ? 'var(--acc)' : 'var(--red)' }}>
                  {l.fluxo === 'Entrada' ? '+' : '-'}R${fmt(l.valor)}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn-s btn-sm" onClick={() => setModal({ open: true, mode: 'editar', lanc: l })}>Editar</button>
                  <button className="btn btn-s btn-sm" onClick={() => setModal({ open: true, mode: 'duplicar', lanc: l })} style={{ marginLeft: '4px' }} title="Duplicar">⧉</button>
                  <button className="btn btn-d btn-sm" onClick={() => handleDelete(l.id)} style={{ marginLeft: '4px' }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <LancamentoModal
        open={modal.open}
        onClose={() => setModal({ open: false, mode: 'novo' })}
        mode={modal.mode}
        lancamento={modal.lanc}
        onSave={handleSave}
        fornecedoresHistorico={fornecedoresHistorico}
      />
    </div>
  )
}
