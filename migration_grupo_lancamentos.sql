alter table lancamentos add column if not exists grupo text;
create index if not exists idx_lanc_grupo on lancamentos(grupo);

-- Novo esquema de grupos (mais consistente) para categorias_myfinance
update categorias_myfinance set grupo = 'Moradia'            where nome in ('Aluguel','Prestação Apto','Condomínio','IPTU','Água','Luz','Gás');
update categorias_myfinance set grupo = 'Transporte'         where nome in ('Combustível','IPVA/DPVAT/Licenciamento','Seguro do automóvel');
update categorias_myfinance set grupo = 'Saúde'               where nome in ('Médico','Medicamentos');
update categorias_myfinance set grupo = 'Casa/Serviços'       where nome in ('Diarista/Mensalista','Telefones (fixo e celular)');
update categorias_myfinance set grupo = 'Educação'            where nome in ('Pós-graduação/MBA','Idiomas');
update categorias_myfinance set grupo = 'Cuidados pessoais'   where nome in ('Corte de Cabelo','Manicure/Sombrancelha','Roupas/Acessórios');
update categorias_myfinance set grupo = 'Lazer'               where nome in ('Viagens/ passeios','Presentes','Futebol','Restaurantes');
update categorias_myfinance set grupo = 'Transferências/Outros' where nome in ('Repasse Bianca','Devolução DVSHOP','Outras Despesas');
update categorias_myfinance set grupo = 'Cartão de Crédito'   where nome in ('Nubank','C6','Santander','XP');
update categorias_myfinance set grupo = 'Investimentos'       where tipo='investimento';

-- Sincroniza o grupo já existente para os lançamentos históricos, casando pelo campo "plano"
update lancamentos l set grupo = c.grupo
from categorias_myfinance c
where l.plano = c.nome and c.grupo is not null;
