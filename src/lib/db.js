import { sb } from './supabase'

// ── Lançamentos ──────────────────────────────────────────────
export async function getLancamentos() {
  // PostgREST limita 1000 linhas por request — paginar para trazer tudo
  const PAGE = 1000
  let todos = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb.from('lancamentos').select('*')
      .order('data', { ascending: false }).order('id', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw error
    todos = todos.concat(data || [])
    if (!data || data.length < PAGE) break
  }
  return todos
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

export async function reclassificarPorPlano(plano, grupo) {
  const { error } = await sb.from('lancamentos').update({ grupo }).eq('plano', plano)
  if (error) throw error
}

// ── Membros (multi-usuário) ─────────────────────────────────
export async function getMembros() {
  const { data, error } = await sb.from('membros_myfinance').select('*')
  if (error) throw error
  return data || []
}

// ── Bancos ───────────────────────────────────────────────────
export async function getBancos() {
  const { data, error } = await sb.from('bancos_myfinance').select('*').eq('ativo', true).order('ordem')
  if (error) throw error
  return data || []
}
export async function criarBanco(b) {
  const { data, error } = await sb.from('bancos_myfinance').insert([b]).select().single()
  if (error) throw error
  return data
}
export async function editarBanco(id, campos) {
  const { data, error } = await sb.from('bancos_myfinance').update(campos).eq('id', id).select().single()
  if (error) throw error
  return data
}
export async function excluirBanco(id) {
  const { error } = await sb.from('bancos_myfinance').update({ativo:false}).eq('id', id)
  if (error) throw error
}

// ── Categorias (plano de contas) ────────────────────────────
export async function getCategorias() {
  const { data, error } = await sb.from('categorias_myfinance').select('*').eq('ativo', true).order('ordem')
  if (error) throw error
  return data || []
}
export async function criarCategoria(c) {
  const { data, error } = await sb.from('categorias_myfinance').insert([c]).select().single()
  if (error) throw error
  return data
}
export async function editarCategoria(id, campos) {
  const { data, error } = await sb.from('categorias_myfinance').update(campos).eq('id', id).select().single()
  if (error) throw error
  return data
}
export async function excluirCategoria(id) {
  const { error } = await sb.from('categorias_myfinance').update({ativo:false}).eq('id', id)
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
