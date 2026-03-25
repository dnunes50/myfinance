-- ============================================================
-- MyFinance — Schema Supabase
-- Cole este SQL no SQL Editor do Supabase e clique em Run
-- ============================================================

-- Habilita UUID
create extension if not exists "uuid-ossp";

-- ── Tabela: lancamentos ──────────────────────────────────────
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
  user_id     uuid references auth.users(id) on delete cascade,
  created_at  timestamptz default now()
);

-- ── Tabela: bancos ───────────────────────────────────────────
create table if not exists bancos (
  id              text not null,
  nome            text not null,
  valor           numeric(12,2) default 0,
  saldo_abertura  numeric(12,2) default 0,
  data_abertura   date not null,
  user_id         uuid references auth.users(id) on delete cascade,
  primary key (id, user_id)
);

-- ── Tabela: orcamento_categorias ─────────────────────────────
create table if not exists orcamento_categorias (
  id              bigserial primary key,
  cat             text not null,
  planos          text[] not null default '{}',
  mensal_default  numeric(12,2) default 0,
  mensal_custom   jsonb default '{}',
  tipo            text not null check (tipo in ('despesa','investimento')),
  user_id         uuid references auth.users(id) on delete cascade,
  unique (cat, user_id)
);

-- ── Tabela: configuracoes ────────────────────────────────────
create table if not exists configuracoes (
  id               bigserial primary key,
  meta_patrimonio  numeric(12,2) default 1000000,
  user_id          uuid references auth.users(id) on delete cascade
);

-- ── Row Level Security (RLS) ─────────────────────────────────
alter table lancamentos         enable row level security;
alter table bancos               enable row level security;
alter table orcamento_categorias enable row level security;
alter table configuracoes        enable row level security;

-- Políticas: usuário só vê e edita seus próprios dados
create policy "lancamentos_own" on lancamentos
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "bancos_own" on bancos
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "orcamento_own" on orcamento_categorias
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "config_own" on configuracoes
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Índices ──────────────────────────────────────────────────
create index if not exists idx_lanc_user    on lancamentos(user_id);
create index if not exists idx_lanc_data    on lancamentos(data);
create index if not exists idx_lanc_status  on lancamentos(status);
create index if not exists idx_lanc_mes     on lancamentos(mes);

-- ============================================================
-- CONFIGURAÇÃO DE AUTH (rodar no SQL Editor do Supabase)
-- ============================================================

-- Desabilita confirmação de email (para facilitar o primeiro acesso)
-- Vá em Authentication → Settings → Email → desmarque "Confirm email"
-- Ou rode:
-- update auth.config set confirm_email_change = false where true;

-- Criar usuário inicial (opcional — ou crie pela interface do Supabase)
-- Authentication → Users → Add user → Invite user
-- Email: diegoonunes50@gmail.com
-- Senha: sua senha escolhida
