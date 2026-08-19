-- Migração: multi-usuário (Diego + Bianca) com visão individual/consolidada

alter table lancamentos add column if not exists user_id uuid references auth.users(id) default auth.uid();

create table if not exists membros (
  id   uuid primary key references auth.users(id),
  nome text not null
);
alter table membros enable row level security;
create policy "auth_read_membros"  on membros for select using (auth.role() = 'authenticated');
create policy "auth_write_membros" on membros for all    using (auth.role() = 'authenticated');

create index if not exists idx_lanc_user on lancamentos(user_id);

-- Depois de criar o 2º usuário no Supabase Auth, rode (troque os UUIDs pelos reais):
-- insert into membros (id, nome) values ('SEU-UUID', 'Diego') on conflict (id) do update set nome=excluded.nome;
-- insert into membros (id, nome) values ('UUID-DA-BIANCA', 'Bianca Martins') on conflict (id) do update set nome=excluded.nome;

insert into membros (id, nome) values ('bb059b55-b4e5-4b3c-8f2b-78183f3118c2', 'Diego') on conflict (id) do update set nome=excluded.nome;
insert into membros (id, nome) values ('c17ab0a6-39f2-487a-84f9-0668883597a4', 'Bianca Martins') on conflict (id) do update set nome=excluded.nome;
