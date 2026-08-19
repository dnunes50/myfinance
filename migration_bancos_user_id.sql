alter table bancos_myfinance add column if not exists user_id uuid references auth.users(id);

alter table bancos_myfinance drop constraint if exists bancos_myfinance_nome_key;
do $$ begin
  alter table bancos_myfinance add constraint bancos_myfinance_nome_user_key unique (nome, user_id);
exception when duplicate_object then null;
end $$;

-- Contas existentes pertencem ao Diego
update bancos_myfinance set user_id = 'bb059b55-b4e5-4b3c-8f2b-78183f3118c2' where user_id is null;
