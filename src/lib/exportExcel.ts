import type { Lancamento } from './types'

export function exportToExcel(lancamentos: Lancamento[], filename = 'myfinance-lancamentos') {
  // Build CSV with BOM for Excel to recognize UTF-8
  const BOM = '\uFEFF'
  const headers = ['ID','Data','Mês','Descrição','Fornecedor','Plano de Contas','Tipo','Banco','Fluxo','Status','Valor']

  const rows = lancamentos
    .sort((a, b) => a.data.localeCompare(b.data))
    .map(l => [
      l.id,
      l.data.split('-').reverse().join('/'),
      l.mes,
      `"${l.descricao.replace(/"/g, '""')}"`,
      `"${(l.fornecedor || '').replace(/"/g, '""')}"`,
      `"${l.plano.replace(/"/g, '""')}"`,
      l.tipo,
      l.banco,
      l.fluxo,
      l.status,
      l.valor.toFixed(2).replace('.', ',')
    ].join(';'))

  const csv = BOM + headers.join(';') + '\n' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href     = url
  a.download = `${filename}-${date}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportSummary(lancamentos: Lancamento[]) {
  const BOM = '\uFEFF'

  // Summary by month and category
  const byMesCat: Record<string, Record<string, number>> = {}
  lancamentos.forEach(l => {
    if (!byMesCat[l.mes]) byMesCat[l.mes] = {}
    if (!byMesCat[l.mes][l.plano]) byMesCat[l.mes][l.plano] = 0
    if (l.fluxo === 'Entrada') byMesCat[l.mes][l.plano] += l.valor
    else byMesCat[l.mes][l.plano] -= l.valor
  })

  const meses = Object.keys(byMesCat).sort()
  const planos = [...new Set(lancamentos.map(l => l.plano))].sort()

  const headers = ['Plano de Contas', ...meses]
  const rows = planos.map(p => [
    `"${p}"`,
    ...meses.map(m => (byMesCat[m]?.[p] || 0).toFixed(2).replace('.', ','))
  ].join(';'))

  const csv = BOM + headers.join(';') + '\n' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `myfinance-resumo-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
