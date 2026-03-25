export interface Lancamento {
  id: number
  data: string
  mes: string
  plano: string
  tipo: string
  banco: string
  descricao: string
  fornecedor: string
  valor: number
  status: 'Realizado' | 'A Realizar'
  fluxo: 'Entrada' | 'Saída'
  user_id?: string
  created_at?: string
}

export interface Banco {
  id: string
  nome: string
  valor: number
  saldo_abertura: number
  data_abertura: string
  user_id?: string
}

export interface OrcamentoCategoria {
  id?: number
  cat: string
  planos: string[]
  mensal_default: number
  mensal_custom: Record<string, number>
  tipo: 'despesa' | 'investimento'
  user_id?: string
}

export interface Configuracao {
  id?: number
  meta_patrimonio: number
  user_id?: string
}

export interface SaldoRef {
  data: string
  c6: number
  nubank: number
  santander: number
  clear: number
  binance: number
  onil: number
  total: number
}
