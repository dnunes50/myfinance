import { sb } from './supabase'

// ── Lançamentos ──────────────────────────────────────────────
export async function getLancamentos() {
  const { data, error } = await sb.from('lancamentos').select('*').order('data', { ascending: false })
  if (error) throw error
  return data || []
}

export async function criarLancamento(l) {
  const { data, error } = await sb.from('lancamentos').insert([l]).select().single()
  if (error) throw error
  return data
}

export async function criarLancamentos(lista) {
  const { data, error } = await sb.from('lancamentos').insert(lista).select()
  if (error) throw error
  return data
}

export async function editarLancamento(id, campos) {
  const { data, error } = await sb.from('lancamentos').update(campos).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function excluirLancamento(id) {
  const { error } = await sb.from('lancamentos').delete().eq('id', id)
  if (error) throw error
}

// ── Orçamento ────────────────────────────────────────────────
export async function getOrcamento() {
  const { data, error } = await sb.from('orcamento').select('*')
  if (error) throw error
  return data || []
}

export async function salvarOrcamento(categorias) {
  // Upsert all categories at once
  const rows = categorias.map(c => ({
    cat:           c.cat,
    valor_default: parseFloat(c.valor_default) || 0,
    custom_meses:  c.custom_meses || {},
    tipo:          c.tipo,
  }))
  const { error } = await sb.from('orcamento').upsert(rows, { onConflict: 'cat' })
  if (error) throw error
}
