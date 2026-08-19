alter table bancos add column if not exists classe text not null default 'Caixa';
alter table bancos add column if not exists saldo_abertura numeric not null default 0;
alter table bancos add column if not exists data_abertura date not null default '2025-12-31';
alter table bancos add column if not exists cor text not null default '#8B5CF6';
alter table bancos add column if not exists ativo boolean not null default true;
alter table bancos alter column id set default gen_random_uuid();
alter table bancos add column if not exists ordem int not null default 0;
do $$ begin
  alter table bancos add constraint bancos_nome_key unique (nome);
exception when duplicate_object or duplicate_table then null;
end $$;

insert into bancos (id, nome, saldo_abertura, data_abertura, classe, cor, ordem) values
 (gen_random_uuid(), 'Nubank',    71281.86,  '2025-12-31','Caixa',                    '#8B5CF6', 1),
 (gen_random_uuid(), 'C6 Bank',   138.74,    '2025-12-31','Caixa',                    '#F97316', 2),
 (gen_random_uuid(), 'Santander', 0.80,      '2025-12-31','Caixa',                    '#EF4444', 3),
 (gen_random_uuid(), 'Clear',     155.24,    '2025-12-31','Caixa',                    '#6EE7B7', 4),
 (gen_random_uuid(), 'Onil',      662719.79, '2025-12-31','Investimento Internacional','#60A5FA', 5),
 (gen_random_uuid(), 'XP',        0,         '2025-12-31','Renda Fixa',               '#3B82F6', 6),
 (gen_random_uuid(), 'Binance',   0,         '2025-12-31','Cripto',                   '#FCD34D', 7)
on conflict (nome) do nothing;
