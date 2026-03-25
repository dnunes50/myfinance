import { createClient } from './supabase'
import type { Lancamento, Banco, OrcamentoCategoria } from './types'

// ── Lançamentos ──────────────────────────────────────────────────────────

export async function getLancamentos(): Promise<Lancamento[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lancamentos')
    .select('*')
    .order('data', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createLancamento(lanc: Omit<Lancamento, 'id' | 'user_id' | 'created_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lancamentos')
    .insert(lanc)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createLancamentos(lancs: Omit<Lancamento, 'id' | 'user_id' | 'created_at'>[]) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lancamentos')
    .insert(lancs)
    .select()
  if (error) throw error
  return data
}

export async function updateLancamento(id: number, updates: Partial<Lancamento>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lancamentos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteLancamento(id: number) {
  const supabase = createClient()
  const { error } = await supabase
    .from('lancamentos')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Bancos ───────────────────────────────────────────────────────────────

export async function getBancos(): Promise<Banco[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bancos')
    .select('*')
    .order('nome')
  if (error) throw error
  return data || []
}

export async function upsertBanco(banco: Banco) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bancos')
    .upsert(banco, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Orçamento ────────────────────────────────────────────────────────────

export async function getOrcamento(): Promise<OrcamentoCategoria[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orcamento_categorias')
    .select('*')
    .order('tipo')
  if (error) throw error
  return data || []
}

export async function upsertOrcamentoCategoria(cat: OrcamentoCategoria) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orcamento_categorias')
    .upsert(cat, { onConflict: 'cat,user_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Configurações ────────────────────────────────────────────────────────

export async function getConfiguracao() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('configuracoes')
    .select('*')
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function upsertConfiguracao(config: { meta_patrimonio: number }) {
  const supabase = createClient()
  const { data: existing } = await supabase.from('configuracoes').select('id').single()
  const { data, error } = await supabase
    .from('configuracoes')
    .upsert({ ...config, id: existing?.id })
    .select()
    .single()
  if (error) throw error
  return data
}
