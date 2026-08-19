create table if not exists membros_myfinance (
  id   uuid primary key references auth.users(id),
  nome text not null
);
alter table membros_myfinance enable row level security;
drop policy if exists "auth_read_membros_mf"  on membros_myfinance;
drop policy if exists "auth_write_membros_mf" on membros_myfinance;
create policy "auth_read_membros_mf"  on membros_myfinance for select using (auth.role() = 'authenticated');
create policy "auth_write_membros_mf" on membros_myfinance for all    using (auth.role() = 'authenticated');

insert into membros_myfinance (id, nome) values ('bb059b55-b4e5-4b3c-8f2b-78183f3118c2', 'Diego') on conflict (id) do update set nome=excluded.nome;
insert into membros_myfinance (id, nome) values ('c17ab0a6-39f2-487a-84f9-0668883597a4', 'Bianca Martins') on conflict (id) do update set nome=excluded.nome;
