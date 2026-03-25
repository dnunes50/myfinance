export function fmt(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtS(v: number): string {
  if (Math.abs(v) >= 1_000_000) return 'R$' + (v / 1_000_000).toFixed(2) + 'M'
  if (Math.abs(v) >= 1_000) return 'R$' + (v / 1_000).toFixed(1) + 'k'
  return 'R$' + fmt(v)
}

export function fmtCurrency(v: number): string {
  return 'R$ ' + fmt(v)
}

export function dateToMes(data: string): string {
  // '2026-03-15' → '03/26'
  return data.slice(5, 7) + '/' + data.slice(2, 4)
}

export function mesRange(mes: string): { de: string; ate: string } {
  const [mm, yy] = mes.split('/')
  const de = `20${yy}-${mm}-01`
  const fim = new Date(`20${yy}-${mm}-01`)
  fim.setMonth(fim.getMonth() + 1)
  fim.setDate(0)
  return { de, ate: fim.toISOString().slice(0, 10) }
}

export function calcUrgencia(data: string): 'vencido' | 'urgente' | 'proximo' | 'ok' {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const v = new Date(data + 'T00:00:00')
  const dias = Math.round((v.getTime() - hoje.getTime()) / 86400000)
  if (dias < 0) return 'vencido'
  if (dias <= 7) return 'urgente'
  if (dias <= 30) return 'proximo'
  return 'ok'
}

export function gerarDatasRecorrencia(
  dataInicio: string,
  freq: string,
  repeticoes: number
): string[] {
  const datas = [dataInicio]
  let atual = new Date(dataInicio + 'T00:00:00')
  for (let i = 1; i < repeticoes; i++) {
    const prox = new Date(atual)
    if (freq === 'mensal') prox.setMonth(prox.getMonth() + 1)
    else if (freq === 'quinzenal') prox.setDate(prox.getDate() + 15)
    else if (freq === 'semanal') prox.setDate(prox.getDate() + 7)
    else if (freq === 'bimestral') prox.setMonth(prox.getMonth() + 2)
    else if (freq === 'trimestral') prox.setMonth(prox.getMonth() + 3)
    else if (freq === 'anual') prox.setFullYear(prox.getFullYear() + 1)
    datas.push(prox.toISOString().slice(0, 10))
    atual = prox
  }
  return datas
}

export const NOME_MES: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
}

export const PLANOS = [
  'Salário CLT','13º salário / Férias','PLR','Pro labore DV SHOP','Pro labore IMWT',
  'Rendimento','Venda Casa R$442.893','Outras Receitas','Imposto de Renda',
  'Nubank','C6','Santander','XP','Prestação Apto','Aluguel','Condomínio',
  'Luz','Água','Gás','Diarista/Mensalista','Supermercado','Feira/Padaria',
  'IPTU','Telefones (fixo e celular)','Repasse Bianca','Seguro do automóvel',
  'IPVA/DPVAT/Licenciamento','Combustível','Outras Despesas','Pós-graduação/MBA',
  'Idiomas','Médico','Medicamentos','Academia','Roupas/Acessórios','Corte de Cabelo',
  'Manicure/Sombrancelha','Presentes','Viagens/ passeios','Futebol',
  'Onil','Investimento','Binance','Renda Fixa','Devolução DVSHOP'
]

export const BANCOS = ['C6 Bank','Nubank','Santander','Clear','XP','Binance','Onil']

export const TIPOS = [
  'Receita','Cartão de Crédito','Despesa com Moradia','Despesa com Transporte',
  'Despesa com Educação','Despesa com Saúde','Despesa com Pessoais',
  'Despesa com Lazer','Investimento'
]

export const FORNECEDORES = [
  'Acta Robotics','Ademicon','Ajuste Saldo','Alex Hobi','BANCO XP S A',
  'Bianca Martins','Binance','Borracharia Columbia','C6 Bank','CASHBACK ATOMOS',
  'CASHBACK XP','Caixa Econômica Federal','DV SHOP','Edevaldo Eletricista',
  'Estacionamento','Hadja Imobiliária','IMWT LTDA','IOF Cheque Especial',
  'IPVA Audi','IPVA Clio','Implante Capilar','K10 TV','Licenciamento Audi',
  'Licenciamento Clio','Marinete','Marmoraria','Multa Audi','Multa Clio',
  'Onil Exchange','Porto Seguro Capitalização','Rendimento CDB','Rendimento Onil',
  'Santander','Santos Materiais','Tecnico Vivo','Vintage Club','XP Investimentos',
  'Alessandra Cassimiro','Aldeci Cassimiro','Amanda Cassimiro','Bianca Martins',
  'Daniel Lorena','Diego Cassimiro','Edmilson','Felipe','Jorge Souza',
  'Jordão Cunha','Lucas Vargas','Marcia Ferreira','Michael Pereira',
  'Monique Martins','Raissa Fonseca','Reginaldo Tenis','Renato Correa',
  'Rubens Marconi','Sabrina Ramos','Silvia Nascimento','Tatiana Tsuha',
  'Tiago Cassimiro','Vinicius Fonseca',
].sort((a, b) => a.localeCompare(b, 'pt-BR'))
