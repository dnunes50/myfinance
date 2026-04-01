export const BANCOS_CONFIG = [
  { id:'nubank',   nome:'Nubank',    saldo_abertura:71281.86,  data_abertura:'2025-12-31', classe:'Caixa',                    cor:'#8B5CF6' },
  { id:'c6',       nome:'C6 Bank',   saldo_abertura:138.74,    data_abertura:'2025-12-31', classe:'Caixa',                    cor:'#F97316' },
  { id:'santander',nome:'Santander', saldo_abertura:0.80,      data_abertura:'2025-12-31', classe:'Caixa',                    cor:'#EF4444' },
  { id:'clear',    nome:'Clear',     saldo_abertura:155.24,    data_abertura:'2025-12-31', classe:'Caixa',                    cor:'#6EE7B7' },
  { id:'onil',     nome:'Onil',      saldo_abertura:662719.79, data_abertura:'2025-12-31', classe:'Investimento Internacional',cor:'#60A5FA' },
  { id:'xp',       nome:'XP',        saldo_abertura:0,         data_abertura:'2025-12-31', classe:'Renda Fixa',               cor:'#3B82F6' },
  { id:'binance',  nome:'Binance',   saldo_abertura:0,         data_abertura:'2025-12-31', classe:'Cripto',                   cor:'#FCD34D' },
]

export const SALDOS_REF = {
  '2025-12-31':{ c6:1347.71,   nubank:71212.53, onil:309719.79, san:0.80, clear:155.24, bin:0,    total:382436.07 },
  '2026-01-31':{ c6:18333.04,  nubank:5081.86,  onil:362285.00, san:0,    clear:155.24, bin:0,    total:385855.14 },
  '2026-02-28':{ c6:56868.37,  nubank:5126.90,  onil:651373.44, san:0,    clear:155.24, bin:4000, total:717523.95 },
  '2026-03-31':{ c6:34465.09,  nubank:5133.69,  onil:695446.24, san:0,    clear:155.24, bin:0,    total:735200.26 },
}

export const EVOLUCAO = [
  {mes:'Dez/25',nubank:71212.53,c6:1347.71,  san:0.80,clear:155.24,bin:0,   onil:309719.79,pat:382436.07},
  {mes:'Jan/26',nubank:5081.86, c6:18333.04, san:0,   clear:155.24,bin:0,   onil:362285.00,pat:385855.14},
  {mes:'Fev/26',nubank:5126.90, c6:56868.37, san:0,   clear:155.24,bin:4000,onil:651373.44,pat:717523.95},
  {mes:'Mar/26',nubank:5133.69, c6:34465.09, san:0,   clear:155.24,bin:0,   onil:695446.24,pat:735200.26},
  {mes:'Abr/26',nubank:5133.69, c6:45944.01, san:0,   clear:155.24,bin:0,   onil:713311.57,pat:764699.50},
  {mes:'Mai/26',nubank:5133.69, c6:44933.79, san:0,   clear:155.24,bin:0,   onil:731677.13,pat:782099.84},
  {mes:'Jun/26',nubank:5133.69, c6:45087.19, san:0,   clear:155.24,bin:0,   onil:750556.92,pat:801088.03},
  {mes:'Jul/26',nubank:5133.69, c6:46453.92, san:0,   clear:155.24,bin:0,   onil:769965.34,pat:821863.19},
  {mes:'Ago/26',nubank:5133.69, c6:48859.65, san:0,   clear:155.24,bin:0,   onil:789917.21,pat:844265.78},
  {mes:'Set/26',nubank:5133.69, c6:53709.77, san:0,   clear:155.24,bin:0,   onil:810427.72,pat:869626.42},
  {mes:'Out/26',nubank:5133.69, c6:60987.50, san:0,   clear:155.24,bin:0,   onil:831512.53,pat:897988.96},
  {mes:'Nov/26',nubank:5133.69, c6:68700.23, san:0,   clear:155.24,bin:0,   onil:853187.72,pat:927376.87},
  {mes:'Dez/26',nubank:5133.69, c6:76497.64, san:0,   clear:155.24,bin:0,   onil:875469.81,pat:957456.37},
]

export const ORC_CATEGORIAS = [
  {cat:'Cartão de Crédito',  planos:['Nubank','C6','Santander','XP'],                            default:8000,  tipo:'despesa'},
  {cat:'Aluguel/Moradia',    planos:['Aluguel','Prestação Apto'],                                default:6100,  tipo:'despesa'},
  {cat:'Condomínio',         planos:['Condomínio'],                                              default:800,   tipo:'despesa'},
  {cat:'IPTU',               planos:['IPTU'],                                                    default:85,    tipo:'despesa'},
  {cat:'Água/Luz/Gás',       planos:['Água','Luz','Gás'],                                        default:300,   tipo:'despesa'},
  {cat:'Diarista/Mensalista',planos:['Diarista/Mensalista'],                                     default:600,   tipo:'despesa'},
  {cat:'Transporte',         planos:['Combustível','IPVA/DPVAT/Licenciamento','Seguro do automóvel'],default:700,tipo:'despesa'},
  {cat:'Saúde',              planos:['Médico','Medicamentos'],                                   default:500,   tipo:'despesa'},
  {cat:'Educação',           planos:['Pós-graduação/MBA','Idiomas'],                             default:0,     tipo:'despesa'},
  {cat:'Pessoais',           planos:['Outras Despesas','Corte de Cabelo','Manicure/Sombrancelha','Roupas/Acessórios'],default:500,tipo:'despesa'},
  {cat:'Lazer',              planos:['Viagens/ passeios','Presentes','Futebol'],                 default:500,   tipo:'despesa'},
  {cat:'Telefones',          planos:['Telefones (fixo e celular)'],                              default:200,   tipo:'despesa'},
  {cat:'Repasse Bianca',     planos:['Repasse Bianca'],                                          default:0,     tipo:'despesa'},
  {cat:'Devolução DVSHOP',   planos:['Devolução DVSHOP'],                                       default:0,     tipo:'despesa'},
  {cat:'Onil',               planos:['Onil','Investimento'],                                     default:5000,  tipo:'investimento'},
  {cat:'Binance',            planos:['Binance'],                                                 default:0,     tipo:'investimento'},
  {cat:'Renda Fixa',         planos:['Renda Fixa'],                                              default:0,     tipo:'investimento'},
]

export const PLANOS = [
  'Salário CLT','13º salário / Férias','PLR','Pro labore DV SHOP','Pro labore IMWT',
  'Outras Receitas','Rendimento','Renda Fixa',
  'Nubank','C6','Santander','XP',
  'Aluguel','Prestação Apto','Condomínio','IPTU','Água','Luz','Gás','Diarista/Mensalista',
  'Combustível','IPVA/DPVAT/Licenciamento','Seguro do automóvel',
  'Pós-graduação/MBA','Idiomas','Médico','Medicamentos',
  'Outras Despesas','Corte de Cabelo','Manicure/Sombrancelha','Roupas/Acessórios',
  'Viagens/ passeios','Presentes','Futebol','Restaurantes',
  'Telefones (fixo e celular)','Repasse Bianca','Devolução DVSHOP',
  'Onil','Investimento','Binance','Cripto',
]

export const BANCOS_LISTA = ['C6 Bank','Nubank','Santander','Clear','Onil','XP','Binance']

export const FORNECEDORES = [
  'ACTA ROBOTICS','IMWT','DV SHOP','Onil Exchange','Bianca Martins','Diego Cassimiro',
  'Alex Hobi','Vintage club','IPVA Clio','IPVA Audi','Nardo','Igor','Luisa','Pix Felipe',
  'K10 TV','CASHBACK ATOMOS','CASHBACK XP','BANCO XP S A','Rendimento CDB',
]

export const fmt = (v) => {
  if(v === null || v === undefined) return '0,00'
  return Math.abs(v).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})
}

export const fmtS = (v) => {
  if(v === null || v === undefined) return 'R$ 0,00'
  return 'R$ ' + Math.abs(v).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})
}

export const dateToMes = (d) => {
  if(!d) return ''
  const [y,m] = d.split('-')
  return `${m}/${y.slice(2)}`
}

export const calcUrgencia = (data) => {
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const d = new Date(data + 'T00:00:00')
  const diff = Math.round((d - hoje) / 86400000)
  if(diff < 0)  return 'vencido'
  if(diff <= 7) return 'urgente'
  if(diff <= 30)return 'proximo'
  return 'ok'
}

export const gerarDatasRecorrencia = (dataInicio, freq, repeticoes) => {
  const datas = []
  let d = new Date(dataInicio + 'T00:00:00')
  for(let i = 0; i < repeticoes; i++) {
    datas.push(d.toISOString().slice(0,10))
    const nd = new Date(d)
    if(freq==='mensal')     nd.setMonth(nd.getMonth()+1)
    else if(freq==='quinzenal') nd.setDate(nd.getDate()+15)
    else if(freq==='semanal')   nd.setDate(nd.getDate()+7)
    else if(freq==='bimestral') nd.setMonth(nd.getMonth()+2)
    else if(freq==='trimestral')nd.setMonth(nd.getMonth()+3)
    else if(freq==='anual')     nd.setFullYear(nd.getFullYear()+1)
    d = nd
  }
  return datas
}

// Mês atual dinâmico — ex: '03/26'
export const getMesAtual = () => {
  const d = new Date()
  const mm = String(d.getMonth()+1).padStart(2,'0')
  const yy = String(d.getFullYear()).slice(2)
  return `${mm}/${yy}`
}
