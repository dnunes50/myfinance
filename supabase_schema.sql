-- MyFinance — Schema Supabase (versão Next.js)
-- Cole no SQL Editor e clique Run

create extension if not exists "uuid-ossp";

-- Lançamentos: cada registro = 1 lançamento
create table if not exists lancamentos (
  id          bigserial primary key,
  data        date not null,
  mes         text not null,
  plano       text not null,
  tipo        text not null,
  banco       text not null,
  descricao   text not null,
  fornecedor  text default '',
  valor       numeric(12,2) not null,
  status      text not null check (status in ('Realizado','A Realizar')),
  fluxo       text not null check (fluxo in ('Entrada','Saída')),
  created_at  timestamptz default now()
);

-- Orçamento por categoria
create table if not exists orcamento (
  id             bigserial primary key,
  cat            text not null unique,
  valor_default  numeric(12,2) default 0,
  custom_meses   jsonb default '{}',
  tipo           text not null check (tipo in ('despesa','investimento'))
);

-- RLS
alter table lancamentos enable row level security;
alter table orcamento    enable row level security;

-- Políticas: qualquer usuário autenticado acessa
create policy "auth_read_lanc"  on lancamentos for select using (auth.role() = 'authenticated');
create policy "auth_write_lanc" on lancamentos for all    using (auth.role() = 'authenticated');
create policy "auth_read_orc"   on orcamento   for select using (auth.role() = 'authenticated');
create policy "auth_write_orc"  on orcamento   for all    using (auth.role() = 'authenticated');

-- Índices
create index if not exists idx_lanc_data   on lancamentos(data);
create index if not exists idx_lanc_mes    on lancamentos(mes);
create index if not exists idx_lanc_status on lancamentos(status);
create index if not exists idx_lanc_banco  on lancamentos(banco);
