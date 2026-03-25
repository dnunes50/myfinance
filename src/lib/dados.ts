import type { Banco, OrcamentoCategoria } from './types'

// Saldos diários reais da planilha (usados no fluxo histórico)
export const SALDOS_REF: Record<string, { c6: number; nubank: number; onil: number; total: number }> = {
  '2025-12-31':{ c6:1347.71,  nubank:71212.53, onil:309719.79, total:382436.07 },
  '2026-01-31':{ c6:18333.04, nubank:5081.86,  onil:362285.00, total:385855.14 },
  '2026-02-28':{ c6:56868.37, nubank:5126.90,  onil:651373.44, total:717523.95 },
  '2026-03-16':{ c6:42502.45, nubank:5133.69,  onil:675446.24, total:723237.62 },
}

// Configuração dos bancos com saldo de abertura
export const BANCOS_CONFIG: Banco[] = [
  { id: 'c6',       nome: 'C6 Bank',   valor: 0, saldo_abertura: 138.74,    data_abertura: '2025-12-31' },
  { id: 'nubank',   nome: 'Nubank',    valor: 0, saldo_abertura: 71281.86,  data_abertura: '2025-12-31' },
  { id: 'santander',nome: 'Santander', valor: 0, saldo_abertura: 0.80,      data_abertura: '2025-12-31' },
  { id: 'clear',    nome: 'Clear',     valor: 0, saldo_abertura: 155.24,    data_abertura: '2025-12-31' },
  { id: 'binance',  nome: 'Binance',   valor: 0, saldo_abertura: 0,         data_abertura: '2025-12-31' },
  { id: 'onil',     nome: 'Onil',      valor: 0, saldo_abertura: 662719.79, data_abertura: '2025-12-31' },
]

// Categorias de orçamento padrão
export const ORC_CATEGORIAS_DEFAULT: OrcamentoCategoria[] = [
  { cat:'Cartão de Crédito',  planos:['Nubank','C6','Santander','XP'],                           mensal_default:8000,  mensal_custom:{}, tipo:'despesa' },
  { cat:'Aluguel/Moradia',    planos:['Aluguel','Prestação Apto'],                               mensal_default:6100,  mensal_custom:{}, tipo:'despesa' },
  { cat:'Condomínio',         planos:['Condomínio'],                                             mensal_default:800,   mensal_custom:{}, tipo:'despesa' },
  { cat:'IPTU',               planos:['IPTU'],                                                   mensal_default:85,    mensal_custom:{}, tipo:'despesa' },
  { cat:'Água/Luz/Gás',       planos:['Água','Luz','Gás'],                                       mensal_default:300,   mensal_custom:{}, tipo:'despesa' },
  { cat:'Diarista/Mensalista',planos:['Diarista/Mensalista'],                                    mensal_default:600,   mensal_custom:{}, tipo:'despesa' },
  { cat:'Transporte',         planos:['Combustível','IPVA/DPVAT/Licenciamento','Seguro do automóvel'], mensal_default:700, mensal_custom:{}, tipo:'despesa' },
  { cat:'Saúde',              planos:['Médico','Medicamentos'],                                  mensal_default:500,   mensal_custom:{}, tipo:'despesa' },
  { cat:'Educação',           planos:['Pós-graduação/MBA','Idiomas'],                            mensal_default:0,     mensal_custom:{}, tipo:'despesa' },
  { cat:'Pessoais',           planos:['Outras Despesas','Corte de Cabelo','Manicure/Sombrancelha','Roupas/Acessórios'], mensal_default:500, mensal_custom:{}, tipo:'despesa' },
  { cat:'Lazer',              planos:['Viagens/ passeios','Presentes','Futebol'],                mensal_default:500,   mensal_custom:{}, tipo:'despesa' },
  { cat:'Telefones',          planos:['Telefones (fixo e celular)'],                             mensal_default:200,   mensal_custom:{}, tipo:'despesa' },
  { cat:'Repasse Bianca',     planos:['Repasse Bianca'],                                         mensal_default:0,     mensal_custom:{}, tipo:'despesa' },
  { cat:'Devolução DVSHOP',   planos:['Devolução DVSHOP'],                                      mensal_default:0,     mensal_custom:{}, tipo:'despesa' },
  { cat:'Onil',               planos:['Onil','Investimento'],                                    mensal_default:5000,  mensal_custom:{}, tipo:'investimento' },
  { cat:'Binance',            planos:['Binance'],                                                mensal_default:0,     mensal_custom:{}, tipo:'investimento' },
  { cat:'Renda Fixa',         planos:['Renda Fixa'],                                             mensal_default:0,     mensal_custom:{}, tipo:'investimento' },
]
