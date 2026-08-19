-- Tabelas de cadastro: bancos e categorias (plano de contas)

create table if not exists bancos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  saldo_abertura numeric not null default 0,
  data_abertura date not null default '2025-12-31',
  classe text not null default 'Caixa',
  cor text not null default '#8B5CF6',
  ativo boolean not null default true,
  ordem int not null default 0
);
alter table bancos enable row level security;
drop policy if exists "auth_all_bancos" on bancos;
create policy "auth_all_bancos" on bancos for all using (auth.role() = 'authenticated');

create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  tipo text not null check (tipo in ('receita','despesa','investimento')),
  grupo text,
  orcamento_default numeric not null default 0,
  ativo boolean not null default true,
  ordem int not null default 0
);
alter table categorias enable row level security;
drop policy if exists "auth_all_categorias" on categorias;
create policy "auth_all_categorias" on categorias for all using (auth.role() = 'authenticated');

-- Seed: bancos já cadastrados no sistema
insert into bancos (nome, saldo_abertura, data_abertura, classe, cor, ordem) values
 ('Nubank',    71281.86,  '2025-12-31','Caixa',                    '#8B5CF6', 1),
 ('C6 Bank',   138.74,    '2025-12-31','Caixa',                    '#F97316', 2),
 ('Santander', 0.80,      '2025-12-31','Caixa',                    '#EF4444', 3),
 ('Clear',     155.24,    '2025-12-31','Caixa',                    '#6EE7B7', 4),
 ('Onil',      662719.79, '2025-12-31','Investimento Internacional','#60A5FA', 5),
 ('XP',        0,         '2025-12-31','Renda Fixa',               '#3B82F6', 6),
 ('Binance',   0,         '2025-12-31','Cripto',                   '#FCD34D', 7)
on conflict (nome) do nothing;

-- Seed: categorias / plano de contas já cadastrado
insert into categorias (nome, tipo, grupo, orcamento_default, ordem) values
 ('Salário CLT','receita',null,0,1),
 ('13º salário / Férias','receita',null,0,2),
 ('PLR','receita',null,0,3),
 ('Pro labore DV SHOP','receita',null,0,4),
 ('Pro labore IMWT','receita',null,0,5),
 ('Outras Receitas','receita',null,0,6),
 ('Rendimento','receita',null,0,7),
 ('Renda Fixa','investimento','Renda Fixa',0,8),
 ('Nubank','despesa','Cartão de Crédito',8000,9),
 ('C6','despesa','Cartão de Crédito',0,10),
 ('Santander','despesa','Cartão de Crédito',0,11),
 ('XP','despesa','Cartão de Crédito',0,12),
 ('Aluguel','despesa','Aluguel/Moradia',6100,13),
 ('Prestação Apto','despesa','Aluguel/Moradia',0,14),
 ('Condomínio','despesa','Condomínio',800,15),
 ('IPTU','despesa','IPTU',85,16),
 ('Água','despesa','Água/Luz/Gás',300,17),
 ('Luz','despesa','Água/Luz/Gás',0,18),
 ('Gás','despesa','Água/Luz/Gás',0,19),
 ('Diarista/Mensalista','despesa','Diarista/Mensalista',600,20),
 ('Combustível','despesa','Transporte',700,21),
 ('IPVA/DPVAT/Licenciamento','despesa','Transporte',0,22),
 ('Seguro do automóvel','despesa','Transporte',0,23),
 ('Pós-graduação/MBA','despesa','Educação',0,24),
 ('Idiomas','despesa','Educação',0,25),
 ('Médico','despesa','Saúde',500,26),
 ('Medicamentos','despesa','Saúde',0,27),
 ('Outras Despesas','despesa','Pessoais',500,28),
 ('Corte de Cabelo','despesa','Pessoais',0,29),
 ('Manicure/Sombrancelha','despesa','Pessoais',0,30),
 ('Roupas/Acessórios','despesa','Pessoais',0,31),
 ('Viagens/ passeios','despesa','Lazer',500,32),
 ('Presentes','despesa','Lazer',0,33),
 ('Futebol','despesa','Lazer',0,34),
 ('Restaurantes','despesa','Lazer',0,35),
 ('Telefones (fixo e celular)','despesa','Telefones',200,36),
 ('Repasse Bianca','despesa','Repasse Bianca',0,37),
 ('Devolução DVSHOP','despesa','Devolução DVSHOP',0,38),
 ('Onil','investimento','Onil',5000,39),
 ('Investimento','investimento','Onil',0,40),
 ('Binance','investimento','Binance',0,41),
 ('Cripto','investimento','Binance',0,42)
on conflict (nome) do nothing;
