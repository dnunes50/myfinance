-- Rode isso SÓ SE já tiver executado uma versão anterior do import_itau_bianca.sql.
-- Se ainda não importou nada, ignore este arquivo e use o import_itau_bianca.sql (já vem completo).

insert into categorias_myfinance (nome, tipo, grupo, orcamento_default, ativo, ordem) values
  ('Reembolso Cartão - Ligia','receita','Cartão de Crédito',0,true,43),
  ('Reembolso Cartão - Monique','receita','Cartão de Crédito',0,true,44),
  ('Psicólogo','despesa','Saúde',0,true,45),
  ('Empréstimo Diego (recebido)','receita','Transferências/Outros',0,true,46),
  ('Pagamento Empréstimo Diego','despesa','Transferências/Outros',0,true,47)
on conflict (nome) do nothing;

update lancamentos set plano='Reembolso Cartão - Ligia', tipo='Reembolso Cartão - Ligia', grupo='Cartão de Crédito'
where banco='Itaú' and fluxo='Entrada' and fornecedor ilike 'LIGIA%';

update lancamentos set plano='Reembolso Cartão - Monique', tipo='Reembolso Cartão - Monique', grupo='Cartão de Crédito'
where banco='Itaú' and fluxo='Entrada' and fornecedor ilike 'MONIQUE%';

update lancamentos set plano='Manicure/Sombrancelha', tipo='Manicure/Sombrancelha', grupo='Cuidados pessoais'
where banco='Itaú' and fornecedor ilike 'KAREN%';

update lancamentos set plano='Psicólogo', tipo='Psicólogo', grupo='Saúde'
where banco='Itaú' and fornecedor ilike 'CAMILLY%';

update lancamentos set plano='Empréstimo Diego (recebido)', tipo='Empréstimo Diego (recebido)', grupo='Transferências/Outros'
where banco='Itaú' and fluxo='Entrada' and fornecedor ilike 'DIEGO N%';

update lancamentos set plano='Pagamento Empréstimo Diego', tipo='Pagamento Empréstimo Diego', grupo='Transferências/Outros'
where banco='Itaú' and fluxo='Saída' and fornecedor ilike 'DIEGO N%';
